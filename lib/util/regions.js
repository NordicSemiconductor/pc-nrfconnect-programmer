/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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
    colours: ['#C0C0C0'],
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

// List taken from py-nrfutil
const knownSoftDevices = {
    0x64: 'S110 v8.0.0',
    0x67: 'S130 v1.0.0',
    0x80: 'S130 v2.0.0',
    0x81: 'S132 v2.0.0',
    0x87: 'S130 v2.0.1',
    0x88: 'S132 v2.0.1',
    0x8C: 'S132 v3.0.0',
    0x91: 'S132 v3.1.0',
    0x95: 'S132 v4.0.0',
    0x98: 'S132 v4.0.2',
    0x99: 'S132 v4.0.3',
    0x9E: 'S132 v4.0.4',
    0x9D: 'S132 v5.0.0',
    0xA5: 'S132 v5.1.0',
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
    const softDeviceFwIdOffset = 0xC;
    const softDeviceIdOffset = 0x10;
    const softDeviceVersionOffset = 0x14;
    for (let address = softDeviceMagicStart; address < softDeviceMagicEnd; address += pageSize) {
        if (memMap.getUint32(address + softDeviceMagicOffset, true) === softDeviceMagicNumber) {
            const regionSize = memMap.getUint32(address + softDeviceSizeOffset, true);
            const region = new Region({
                name: RegionName.SOFTDEVICE,
                startAddress: address,
                regionSize,
                permission: RegionPermission.READ_WRITE,
            });

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

            return region;
        }
    }

    return undefined;
}

/**
 * Given an instance of MemoryMap, return the heuristically detected
 * regions and labels for nRF SoCs.
 *
 * @param {MemoryMap}   memMap              the memory map
 * @param {DeviceDefinition}   deviceInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export function getMemoryRegions(memMap, deviceInfo) {
    // TODO: Get some .hex files which handle clenr0/rpbConf

    let regions = new List();
    let region;
    region = getMBRParamsRegion(memMap, deviceInfo);
    regions = region ? regions.push(region) : regions;
    region = getMBRRegion(memMap, deviceInfo);
    regions = region ? regions.push(region) : regions;
    region = getBootloaderRegion(memMap, deviceInfo);
    regions = region ? regions.push(region) : regions;
    region = getSoftDeviceRegion(memMap, deviceInfo);
    regions = region ? regions.push(region) : regions;

    return regions;
}

export function getFileRegions(memMaps, loadedFiles, deviceInfo) {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const memMap = MemoryMap.flattenOverlaps(overlaps);
    const memRegions = getMemoryRegions(memMap, deviceInfo);

    let regions = new List();
    let region;
    overlaps.forEach((overlap, startAddress) => {
        const colours = [];
        const fileNames = [];
        let regionSize = 0;

        overlap.forEach(([fileName, bytes]) => {
            regionSize = bytes.length;
            fileNames.push(fileName);
            colours.push(loadedFiles[fileName].colour);
        });


        region = memRegions.find(r =>
            r.startAddress >= startAddress &&
            r.startAddress <= startAddress + regionSize);
        // Assume application never comes on top of bootloader
        const bootloaderRegion = memRegions.find(r => r.name === RegionName.BOOTLOADER);
        let regionName = overlap.length === 1 ? RegionName.APPLICATION : RegionName.NONE;
        regionName = bootloaderRegion &&
            startAddress > bootloaderRegion.startAddress ?
            RegionName.NONE : regionName;
        region = region ? region
            .set('startAddress', startAddress)
            .set('regionSize', regionSize)
            .set('colours', colours) :
            new Region({
                name: regionName,
                startAddress,
                regionSize,
                colours,
                permission: RegionPermission.READ_ONLY,
            });

        regions = regions.push(region);
    });

    return regions;
}

export function getRegionSizeByFwType(regions, fwType) {
    let startAddress;
    let endAddress;
    regions.sortBy(r => r.startAddress).forEach(r => {
        if (r.name === fwType) {
            startAddress = !startAddress ? r.startAddress : startAddress;
            endAddress = r.startAddress + r.regionSize;
        }
    });
    return startAddress && endAddress ? endAddress - startAddress : null;
}
