/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
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
    color: '#333F48',
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
    UICR: 'UICR',
    NONE: null,
};

// Definition of RegionColor
export const RegionColor = {
    MBR_PARAMS: '#333F48',
    MBR: '#FF9800',
    MBR_OR_APP: '#FFC107',
    BOOTLOADER: '#E91E63',
    SOFTDEVICE: '#3F51B5',
    APPLICATION: ' #4CAF50',
    UICR: '#333F48',
    NONE: '#333F48',
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
    0xAE: 'S140 v6.1.0',

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

// Check if the region is insde a range
const isRegionInRange = (region, startAddr, endAddr) => (
    region.startAddress >= startAddr
    && (region.startAddress + region.regionSize) <= endAddr
);

const isRegionInCore = (region, {
    romBaseAddr, romSize, pageSize, uicrBaseAddr,
}) => {
    const isInRange = isRegionInRange(region, romBaseAddr, romBaseAddr + romSize);
    const isUicr = isRegionInRange(region, uicrBaseAddr, uicrBaseAddr + pageSize);
    return isInRange || isUicr;
};

// Add Bootloader region
export const getBootloaderRegion = (memMap, coreInfo) => {
    const { uicrBaseAddr, blAddrOffset } = coreInfo;
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
};

// Add MBR parameters region
export const getMBRParamsRegion = (memMap, coreInfo) => {
    const { uicrBaseAddr, mbrParamsOffset } = coreInfo;
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
};

// Add MBR region
export const getMBRRegion = (memMap, coreInfo) => {
    const { romBaseAddr } = coreInfo;
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
};

// Add SoftDevice region
export const getSoftDeviceRegion = (memMap, coreInfo) => {
    const { pageSize } = coreInfo;
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
};

// Get SoftDevice ID
export const getSoftDeviceId = (memMap, coreInfo) => {
    const { pageSize } = coreInfo;
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
};

// Display SoftDevice region info in logger
export const logSoftDeviceRegion = (memMap, coreInfo) => {
    const { pageSize } = coreInfo;
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

            if (infoBlockSize >= 0x18) { // Including SoftDev ID (S000) and version
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
};

/**
 * Given an instance of MemoryMap and DeviceDefinition,
 * return the heuristically detected regions.
 *
 * @param {MemoryMap}   memMap              the memory map
 * @param {DeviceDefinition}   coreInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export const getMemoryRegions = (memMap, coreInfo) => {
    // TODO: Get some HEX files which handle clenr0/rpbConf

    let regions = new List();
    let region;
    region = getMBRParamsRegion(memMap, coreInfo);
    if (region) regions = regions.push(region);
    region = getMBRRegion(memMap, coreInfo);
    if (region) regions = regions.push(region);
    region = getBootloaderRegion(memMap, coreInfo);
    if (region) regions = regions.push(region);
    region = getSoftDeviceRegion(memMap, coreInfo);
    if (region) regions = regions.push(region);
    logSoftDeviceRegion(memMap, coreInfo);

    return regions;
};

/**
 * Given overlaps of memory content of either files or device,
 * the loaded memory content and DeviceDefinition,
 * return the heuristically detected regions for loaded memory contents.
 *
 * @param {Array}              overlaps      the overlaps
 * @param {DeviceDefinition}   coreInfo    the device infomation
 *
 * @returns {List} the list of region
 */
export const getRegionsFromOverlaps = (overlaps, coreInfo) => {
    const memMap = MemoryMap.flattenOverlaps(overlaps);
    const memRegions = getMemoryRegions(memMap, coreInfo);
    const sdRegion = memRegions.find(r => r.name === RegionName.SOFTDEVICE);
    const blRegion = memRegions.find(r => r.name === RegionName.BOOTLOADER);
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
        region = memRegions.find(r => r.startAddress === startAddress);
        region = region
            ? region
                .set('startAddress', startAddress)
                .set('fileNames', fileNames)
                .set('regionSize', regionSize)
            : new Region({
                name: RegionName.NONE,
                color: RegionColor.NONE,
                startAddress,
                regionSize,
                fileNames,
            });

        // The content read from device flash memory via JLink is padded.
        // If the gap between SoftDevice and Application is too small,
        // then the content read by nrfjprog will be regarded as a single part.
        // Split them apart if this happens.
        if (region.name === RegionName.SOFTDEVICE
            && ((regionSize - sdRegion.regionSize) > coreInfo.pageSize)) {
            region = region.set('regionSize', sdRegion.regionSize);

            const appRegion = new Region({
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
                startAddress: startAddress + region.regionSize,
                regionSize: regionSize - region.regionSize,
                fileNames,
            });
            regions = regions.push(appRegion);
        }

        // If both SoftDevice and Bootloader exist
        // the regions between SoftDevcie and Bootloader are Applications
        if (sdRegion
            && blRegion
            && (startAddress >= (sdRegion.startAddress + sdRegion.regionSize))
            && ((startAddress + regionSize) < blRegion.startAddress)) {
            region = region
                .set('name', RegionName.APPLICATION)
                .set('color', RegionColor.APPLICATION);
        }

        // If SoftDevice exists but not Bootloader
        // the regions above SoftDevcie are Applications
        if (sdRegion
            && !blRegion
            && (startAddress >= (sdRegion.startAddress + sdRegion.regionSize))) {
            region = region
                .set('name', RegionName.APPLICATION)
                .set('color', RegionColor.APPLICATION);
        }

        // If Bootloader exists but not SoftDevice
        // the regions below Bootloader and above MBR are Applications
        if (!sdRegion
            && blRegion
            && startAddress !== coreInfo.romBaseAddr
            && ((startAddress + regionSize) < blRegion.startAddress)) {
            region = region
                .set('name', RegionName.APPLICATION)
                .set('color', RegionColor.APPLICATION);
        }

        // If neither Bootloader nor SoftDevice exists
        // then we regard the region as Application
        if (!sdRegion
            && !blRegion
            && region.name === RegionName.NONE) {
            region = region
                .set('name', RegionName.APPLICATION)
                .set('color', RegionColor.APPLICATION);
        }

        regions = regions.includes(region) ? regions : regions.push(region);
    });
    regions = regions.filter(r => isRegionInCore(r, coreInfo));

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded files and DeviceDefinition,
 * return the heuristically detected regions for loaded files.
 *
 * @param {Array}              memMaps      the memory map
 * @param {DeviceDefinition}   coreInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export const getFileRegions = (memMaps, coreInfo) => {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, coreInfo);

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded device and DeviceDefinition,
 * return the heuristically detected regions for loaded device.
 *
 * @param {Array}              memMaps      the memory map
 * @param {DeviceDefinition}   coreInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export const getCoreRegions = (memMaps, coreInfo) => {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, coreInfo);

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded device and DeviceDefinition,
 * return the heuristically detected regions for loaded device.
 *
 * @param {Array}              memMaps      the memory map
 * @param {DeviceDefinition}   deviceInfo   the device infomation
 *
 * @returns {List} the list of region
 */
export const getTargetRegions = (memMaps, deviceInfo) => {
    let regions = List();
    deviceInfo.cores.forEach(c => {
        regions = regions.concat(getCoreRegions(memMaps, c));
    });
    return regions;
};
