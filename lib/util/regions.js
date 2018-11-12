/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { Record, List } from 'immutable';
import MemoryMap from 'nrf-intel-hex';
import { logger } from 'nrfconnect/core';
import { hexpad2 } from './hexpad';

// Definition of RegionPermission
export const RegionPermission = {
    NONE: 0,
    READ_ONLY: 1,
    READ_WRITE: 2,
};

// Definition of Region
export const Region = new Record({
    name: null,
    startAddress: null,
    regionSize: null,
    color: '#C0C0C0',
    fileNames: [],
    permission: RegionPermission.READ_ONLY,
});

// Definition of RegionName
export const RegionName = {
    MBR_PARAMS: 'MBR Paramters',
    MBR: 'MBR',
    MBR_OR_APP: 'MBR or Application',
    BOOTLOADER: 'Bootloader',
    SOFTDEVICE: 'SoftDevice',
    APPLICATION: 'Application',
    NONE: null,
};

// Definition of RegionColor
export const RegionColor = {
    MBR_PARAMS: '#C0C0C0',
    MBR: '#F58220',
    MBR_OR_APP: '#FFCD00',
    BOOTLOADER: '#EE2F4E',
    SOFTDEVICE: '#00A9CE',
    APPLICATION: '#D0DF00',
    NONE: '#C0C0C0',
};

// List taken from py-nrfutil and
// https://devzone.nordicsemi.com/f/nordic-q-a/1171/how-do-i-access-softdevice-version-string#post-id-3693
const knownSoftDevices = {
    0x43: 'S110 v5.2.1',
    0x49: 'S110 v6.0.0',
    0x35: 'S110 v6.2.1',
    0x4F: 'S110 v7.0.0',
    0x5A: 'S110 v7.1.0',
    0x63: 'S110 v7.3.0',
    0x64: 'S110 v8.0.0',

    0xA7: 'S112 v6.0.0',

    0x55: 'S120 v1.0.0',
    0x58: 'S120 v1.0.1',
    0x5B: 'S120 v2.0.0-1.alpha',
    0x60: 'S120 v2.0.0',
    0x6B: 'S120 v2.1.0',

    0x5E: 'S130 v0.9.0-1.alpha',
    0x66: 'S130 v1.0.0-3.alpha',
    0x67: 'S130 v1.0.0',
    0x80: 'S130 v2.0.0',
    0x87: 'S130 v2.0.1',

    0x4B: 'S210 v3.0.0',
    0x57: 'S210 v4.0.0',

    0x4D: 'S310 v1.0.0',
    0x5D: 'S310 v2.0.0 / v2.0.1',
    0x65: 'S310 v3.0.0',

    0x6D: 'S132 v1.0.0-3.alpha',
    0x74: 'S132 v2.0.0-4.alpha',
    0x79: 'S132 v2.0.0-7.alpha',
    0x81: 'S132 v2.0.0',
    0x88: 'S132 v2.0.1',
    0x8C: 'S132 v3.0.0',
    0x91: 'S132 v3.1.0',
    0x95: 'S132 v4.0.0',
    0x98: 'S132 v4.0.2',
    0x99: 'S132 v4.0.3',
    0x9E: 'S132 v4.0.4',
    0x9D: 'S132 v5.0.0',
    0xA5: 'S132 v5.1.0',
    0xA8: 'S132 v6.0.0',

    0x96: 'S140 v5.0.0-2.alpha',
    0xA9: 'S140 v6.0.0',

    0x7F: 'S212 v0.6.0.alpha',
    0x83: 'S212 v0.9.1.alpha',
    0x8D: 'S212 v2.0.1',
    0x93: 'S212 v4.0.5',
    0x9C: 'S212 v5.0.0',

    0x7E: 'S332 v0.6.0.alpha',
    0x82: 'S332 v0.9.1.alpha',
    0x8E: 'S332 v2.0.1',
    0x94: 'S332 v4.0.5',
    0x9B: 'S332 v5.0.0',
};

// Add Bootloader region
export function getBootloaderRegion(memMap, deviceInfo) {
    const uicrBaseAddr = deviceInfo.uicrBaseAddr;
    const blAddrOffset = deviceInfo.blAddrOffset;
    const bootloaderAddress = memMap.getUint32(uicrBaseAddr + blAddrOffset, true);
    if (bootloaderAddress && bootloaderAddress !== 0xFFFFFFFF && memMap.get(bootloaderAddress)) {
        const region = new Region({
            name: RegionName.BOOTLOADER,
            startAddress: bootloaderAddress,
            regionSize: memMap.get(bootloaderAddress).length,
            color: RegionColor.BOOTLOADER,
            permission: RegionPermission.READ_WRITE,
        });
        return region;
    }
    return undefined;
}

// Add MBR parameters region
export function getMBRParamsRegion(memMap, deviceInfo) {
    const uicrBaseAddr = deviceInfo.uicrBaseAddr;
    const mbrParamsOffset = deviceInfo.mbrParamsOffset;
    const mbrParams = memMap.getUint32(uicrBaseAddr + mbrParamsOffset, true);
    if (mbrParams && mbrParams !== 0xFFFFFFFF) {
        const region = new Region({
            type: RegionName.MBR_PARAMS,
            name: RegionName.MBR_PARAMS,
            startAddress: mbrParams,
            color: RegionColor.MBR_PARAMS,
            permission: RegionPermission.READ,
        });
        return region;
    }
    return undefined;
}

// Add MBR region
export function getMBRRegion(memMap, deviceInfo) {
    const romBaseAddr = deviceInfo.romBaseAddr;
    const mbr = memMap.getUint32(romBaseAddr, true);
    if (mbr && mbr !== 0xFFFFFFFF && memMap.get(romBaseAddr)) {
        const region = new Region({
            name: RegionName.MBR_OR_APP,
            startAddress: romBaseAddr,
            regionSize: memMap.get(romBaseAddr).length,
            color: RegionColor.MBR,
            permission: RegionPermission.READ,
        });
        return region;
    }
    return undefined;
}

// Add SoftDevice region
export function getSoftDeviceRegion(memMap, deviceInfo) {
    const pageSize = deviceInfo.pageSize;
    const softDeviceMagicStart = 0x1000;
    const softDeviceMagicEnd = 0x10000;
    const softDeviceMagicNumber = 0x51B1E5DB;
    const softDeviceMagicOffset = 0x4;
    const softDeviceSizeOffset = 0x8;
    for (let address = softDeviceMagicStart; address < softDeviceMagicEnd; address += pageSize) {
        if (memMap.getUint32(address + softDeviceMagicOffset, true) === softDeviceMagicNumber) {
            const regionSize = memMap.getUint32(address + softDeviceSizeOffset, true)
                - softDeviceMagicStart;
            const region = new Region({
                name: RegionName.SOFTDEVICE,
                startAddress: softDeviceMagicStart,
                regionSize,
                color: RegionColor.SOFTDEVICE,
                permission: RegionPermission.READ_WRITE,
            });
            return region;
        }
    }
    return undefined;
}

// Get SoftDevice ID
export function getSoftDeviceId(memMap, deviceInfo) {
    const pageSize = deviceInfo.pageSize;
    const softDeviceMagicStart = 0x1000;
    const softDeviceMagicEnd = 0x10000;
    const softDeviceMagicNumber = 0x51B1E5DB;
    const softDeviceMagicOffset = 0x4;
    const softDeviceFwIdOffset = 0xC;
    let fwId;
    for (let address = softDeviceMagicStart; address < softDeviceMagicEnd; address += pageSize) {
        if (memMap.getUint32(address + softDeviceMagicOffset, true) === softDeviceMagicNumber) {
            /* eslint-disable no-bitwise */
            fwId = memMap.getUint32(address + softDeviceFwIdOffset, true) & 0x0000FFFF;
        }
    }
    return fwId;
}

// Display SoftDevice region info in logger
export function logSoftDeviceRegion(memMap, deviceInfo) {
    const pageSize = deviceInfo.pageSize;
    const softDeviceMagicStart = 0x1000;
    const softDeviceMagicEnd = 0x10000;
    const softDeviceMagicNumber = 0x51B1E5DB;
    const softDeviceMagicOffset = 0x4;
    const softDeviceFwIdOffset = 0xC;
    const softDeviceIdOffset = 0x10;
    const softDeviceVersionOffset = 0x14;
    for (let address = softDeviceMagicStart; address < softDeviceMagicEnd; address += pageSize) {
        if (memMap.getUint32(address + softDeviceMagicOffset, true) === softDeviceMagicNumber) {
            // const softDeviceSize = memMap.getUint32(address + softDeviceSizeOffset, true);
            /* eslint-disable no-bitwise */
            const infoBlockSize = memMap.getUint32(address, true) & 0x000000FF;
            const fwId = memMap.getUint32(address + softDeviceFwIdOffset, true) & 0x0000FFFF;

            if (infoBlockSize >= 0x18) {    // Including SoftDev ID (S000) and version
                // if (infoBlockSize >= 0x2C) {    // Including 20-byte rev hash
                //     // rev hash is only logged, not explicitly shown in the GUI.
                //     let hash = [
                //         memMap.getUint32(address + 0x18, false),
                //         memMap.getUint32(address + 0x1C, false),
                //         memMap.getUint32(address + 0x20, false),
                //         memMap.getUint32(address + 0x24, false),
                //         memMap.getUint32(address + 0x28, false)];
                //     hash = hash.map(n => n.toString(16).padStart(8, '0')).join('');
                // }

                const softDeviceId = memMap.getUint32(address + softDeviceIdOffset, true);
                const softDeviceVersion = memMap.getUint32(address + softDeviceVersionOffset, true);
                if (softDeviceVersion === 0) {
                    logger.info(`SoftDevice detected, id ${hexpad2(fwId)} (S${softDeviceId} prerelease)`);
                } else {
                    const softDeviceVersionMajor = Math.floor((softDeviceVersion / 1000000) % 1000);
                    const softDeviceVersionMinor = Math.floor((softDeviceVersion / 1000) % 1000);
                    const softDeviceVersionPatch = softDeviceVersion % 1000;
                    logger.info(`SoftDevice detected, id ${hexpad2(fwId)} (S${softDeviceId} v${
                        softDeviceVersionMajor}.${softDeviceVersionMinor}.${softDeviceVersionPatch})`);
                }
            } else if (knownSoftDevices[fwId]) {
                logger.info(`SoftDevice detected, id ${hexpad2(fwId)} (${knownSoftDevices[fwId]})`);
            } else {
                logger.info(`SoftDevice detected, id ${hexpad2(fwId)}`);
            }
        }
    }
}

/**
 * Given an instance of MemoryMap and DeviceDefinition,
 * return the heuristically detected regions.
 *
 * @param {MemoryMap}   memMap              the memory map
 * @param {DeviceDefinition}   deviceInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export function getMemoryRegions(memMap, deviceInfo) {
    // TODO: Get some HEX files which handle clenr0/rpbConf

    let regions = new List();
    let region;
    region = getMBRParamsRegion(memMap, deviceInfo);
    if (region) regions = regions.push(region);
    region = getMBRRegion(memMap, deviceInfo);
    if (region) regions = regions.push(region);
    region = getBootloaderRegion(memMap, deviceInfo);
    if (region) regions = regions.push(region);
    region = getSoftDeviceRegion(memMap, deviceInfo);
    if (region) regions = regions.push(region);
    logSoftDeviceRegion(memMap, deviceInfo);

    return regions;
}

/**
 * Given overlaps of memory content of either files or device,
 * the loaded memory content and DeviceDefinition,
 * return the heuristically detected regions for loaded memory contents.
 *
 * @param {Array}              overlaps      the overlaps
 * @param {DeviceDefinition}   deviceInfo    the device infomation
 *
 * @returns {List} the list of region
 */
export function getRegionsFromOverlaps(overlaps, deviceInfo) {
    const memMap = MemoryMap.flattenOverlaps(overlaps);
    const memRegions = getMemoryRegions(memMap, deviceInfo);
    const sdRegion = memRegions.find(r => r.name === RegionName.SOFTDEVICE);
    let regions = new List();
    let region;
    overlaps.forEach((overlap, startAddress) => {
        const fileNames = [];
        let regionSize = 0;

        overlap.forEach(([fileName, bytes]) => {
            regionSize = bytes.length;
            if (fileName) {
                fileNames.push(fileName);
            }
        });

        region = memRegions.find(r =>
            r.startAddress >= startAddress &&
            r.startAddress <= startAddress + regionSize);

        if (sdRegion &&
            startAddress >= sdRegion.startAddress &&
            startAddress < sdRegion.startAddress + sdRegion.regionSize) {
            region = sdRegion;
        }

        region = region ? region
            .set('startAddress', startAddress)
            .set('fileNames', fileNames)
            .set('regionSize', regionSize) :
            new Region({
                name: RegionName.NONE,
                startAddress,
                regionSize,
                fileNames,
                color: RegionColor.NONE,
                permission: RegionPermission.READ_ONLY,
            });

        regions = regions.includes(region) ? regions : regions.push(region);
    });

    // Assume that the region on top of the SoftDevice is application.
    // Assume also that the region on top of the MBR which is not SoftDevice is application.
    // Application can be 1 page size above or 2 page sizes above SoftDevice,
    // e.g. a HRS app with SoftDevice s140 (see version below)
    // (nRF5_SDK_15.0.0_a53641a\examples\ble_peripheral\ble_app_hrs\hex\
    // ble_app_hrs_pca10059_s140.hex)
    // SoftDevice ends with 0x253C8 while HRS app starts with 0x26000
    // e.g. a HRS app with SoftDevice s132 (see version below)
    // (nRF5_SDK_15.0.0_a53641a\examples\ble_peripheral\ble_app_hrs\hex\
    // ble_app_hrs_pca10040_s132.hex)
    // SoftDevice ends with 0x24A24 while HRS app starts with 0x26000
    const softDeviceRegion = regions.find(r => r.name === RegionName.SOFTDEVICE);
    const pageSize = deviceInfo.pageSize;
    if (softDeviceRegion) {
        const softDeviceEnd = softDeviceRegion.startAddress + softDeviceRegion.regionSize;
        let appRegion = regions.find(r =>
            r.startAddress === Math.ceil((softDeviceEnd + 1) / pageSize) * pageSize);
        appRegion = appRegion || regions.find(r =>
            r.startAddress === (Math.ceil((softDeviceEnd + 1) / pageSize) + 1) * pageSize);
        if (appRegion) {
            const appRegionIndex = regions.indexOf(appRegion);
            appRegion = appRegion.set('name', RegionName.APPLICATION);
            appRegion = appRegion.set('color', RegionColor.APPLICATION);
            regions = regions.set(appRegionIndex, appRegion);
        }
    } else {
        let appRegion = regions.find(r => r.startAddress === pageSize);
        if (appRegion) {
            const appRegionIndex = regions.indexOf(appRegion);
            appRegion = appRegion.set('name', RegionName.APPLICATION);
            appRegion = appRegion.set('color', RegionColor.APPLICATION);
            regions = regions.set(appRegionIndex, appRegion);
        }
    }

    return regions;
}

/**
 * Given an instance of MemoryMap, content of loaded files and DeviceDefinition,
 * return the heuristically detected regions for loaded files.
 *
 * @param {Array}              memMaps      the memory map
 * @param {DeviceDefinition}   deviceInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export function getFileRegions(memMaps, deviceInfo) {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, deviceInfo);

    return regions;
}

/**
 * Given an instance of MemoryMap, content of loaded device and DeviceDefinition,
 * return the heuristically detected regions for loaded device.
 *
 * @param {Array}              memMaps      the memory map
 * @param {DeviceDefinition}   deviceInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export function getTargetRegions(memMaps, deviceInfo) {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, deviceInfo);

    return regions;
}
