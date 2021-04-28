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

/* eslint-disable no-bitwise */

import MemoryMap, { MemoryBlocks, Overlaps } from 'nrf-intel-hex';
import { logger } from 'nrfconnect/core';

import { CoreDefinition, DeviceDefinition } from './devices';
import { hexpad2 } from './hexpad';

const SOFTDEVICE_MAGIC_START = 0x1000;
const SOFTDEVICE_MAGIC_END = 0x10000;
const SOFTDEVICE_MAGIC_NUMBER = 0x51b1e5db;
const SOFTDEVICE_MAGIC_OFFSET = 0x4;
const SOFTDEVICE_FW_ID_OFFSET = 0xc;
const SOFTDEVICE_ID_OFFSET = 0x10;
const SOFTDEVICE_VERSION_OFFSET = 0x14;

/**
 * Definition of RegionPermission
 */
export enum RegionPermission {
    NONE = 0,
    READ_ONLY = 1,
    READ_WRITE = 2,
}

/**
 * Definition of RegionName
 */
export enum RegionName {
    MBR_PARAMS = 'MBR Parameters',
    MBR = 'MBR',
    MBR_OR_APP = 'MBR or Application',
    BOOTLOADER = 'Bootloader',
    SOFTDEVICE = 'SoftDevice',
    APPLICATION = 'Application',
    UICR = 'UICR',
    NONE = 'N/A',
}

/**
 * Definition of RegionColor
 */
export enum RegionColor {
    MBR_PARAMS = '#333F48',
    MBR = '#FF9800',
    MBR_OR_APP = '#FFC107',
    BOOTLOADER = '#E91E63',
    SOFTDEVICE = '#3F51B5',
    APPLICATION = ' #4CAF50',
    UICR = '#333F48',
    NONE = '#333F48',
}

/**
 * Definition of Region
 */
export interface Region {
    name: RegionName;
    startAddress: number;
    regionSize: number;
    color: RegionColor;
    fileNames: string[];
    permission: RegionPermission;
}

/**
 * Default definition of region
 */
export const defaultRegion: Region = {
    name: RegionName.NONE,
    startAddress: 0,
    regionSize: 0,
    color: RegionColor.NONE,
    fileNames: [],
    permission: RegionPermission.READ_ONLY,
};

/**
 * List of known SoftDevices taken from py-nrfutil and
 * https://devzone.nordicsemi.com/f/nordic-q-a/1171/how-do-i-access-softdevice-version-string#post-id-3693
 */
const knownSoftDevices: { [key: number]: string } = {
    0x43: 'S110 v5.2.1',
    0x49: 'S110 v6.0.0',
    0x35: 'S110 v6.2.1',
    0x4f: 'S110 v7.0.0',
    0x5a: 'S110 v7.1.0',
    0x63: 'S110 v7.3.0',
    0x64: 'S110 v8.0.0',

    0xa7: 'S112 v6.0.0',

    0x55: 'S120 v1.0.0',
    0x58: 'S120 v1.0.1',
    0x5b: 'S120 v2.0.0-1.alpha',
    0x60: 'S120 v2.0.0',
    0x6b: 'S120 v2.1.0',

    0x5e: 'S130 v0.9.0-1.alpha',
    0x66: 'S130 v1.0.0-3.alpha',
    0x67: 'S130 v1.0.0',
    0x80: 'S130 v2.0.0',
    0x87: 'S130 v2.0.1',

    0x4b: 'S210 v3.0.0',
    0x57: 'S210 v4.0.0',

    0x4d: 'S310 v1.0.0',
    0x5d: 'S310 v2.0.0 / v2.0.1',
    0x65: 'S310 v3.0.0',

    0x6d: 'S132 v1.0.0-3.alpha',
    0x74: 'S132 v2.0.0-4.alpha',
    0x79: 'S132 v2.0.0-7.alpha',
    0x81: 'S132 v2.0.0',
    0x88: 'S132 v2.0.1',
    0x8c: 'S132 v3.0.0',
    0x91: 'S132 v3.1.0',
    0x95: 'S132 v4.0.0',
    0x98: 'S132 v4.0.2',
    0x99: 'S132 v4.0.3',
    0x9e: 'S132 v4.0.4',
    0x9d: 'S132 v5.0.0',
    0xa5: 'S132 v5.1.0',
    0xa8: 'S132 v6.0.0',

    0x96: 'S140 v5.0.0-2.alpha',
    0xa9: 'S140 v6.0.0',
    0xae: 'S140 v6.1.0',

    0x7f: 'S212 v0.6.0.alpha',
    0x83: 'S212 v0.9.1.alpha',
    0x8d: 'S212 v2.0.1',
    0x93: 'S212 v4.0.5',
    0x9c: 'S212 v5.0.0',

    0x7e: 'S332 v0.6.0.alpha',
    0x82: 'S332 v0.9.1.alpha',
    0x8e: 'S332 v2.0.1',
    0x94: 'S332 v4.0.5',
    0x9b: 'S332 v5.0.0',
};

/**
 * Check if the region is inside a range
 *
 * @param {Region} region the region to be checked
 * @param {number} startAddr the start address of the range
 * @param {number} endAddr the end address of the range
 *
 * @returns {boolean} whether the region is inside the specific range
 */
const isRegionInRange = (
    region: Region,
    startAddr: number,
    endAddr: number
): boolean =>
    region.startAddress >= startAddr &&
    region.startAddress + region.regionSize <= endAddr;

/**
 * Check if the region is inside a specific core
 *
 * @param {Region} region the region to be checked
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {boolean} whether the region is inside the specific core
 */
const isRegionInCore = (region: Region, coreInfo: CoreDefinition): boolean => {
    const { romBaseAddr, romSize, pageSize, uicrBaseAddr } = coreInfo;
    const isInRange = isRegionInRange(
        region,
        romBaseAddr,
        romBaseAddr + romSize
    );
    const isUicr = isRegionInRange(
        region,
        uicrBaseAddr,
        uicrBaseAddr + pageSize
    );
    return isInRange || isUicr;
};

/**
 * Get Bootloader region from a memory content according to a specific core
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 * @returns {Region} the Bootloader region if exist
 */
export const getBootloaderRegion = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): Region | undefined => {
    const { uicrBaseAddr, blAddrOffset } = coreInfo;
    const bootloaderAddress = memMap.getUint32(
        uicrBaseAddr + blAddrOffset,
        true
    );
    if (
        bootloaderAddress &&
        bootloaderAddress !== 0xffffffff &&
        memMap.get(bootloaderAddress)
    ) {
        const region: Region = {
            ...defaultRegion,
            name: RegionName.BOOTLOADER,
            startAddress: bootloaderAddress,
            regionSize: memMap.get(bootloaderAddress)?.length || 0,
            color: RegionColor.BOOTLOADER,
            permission: RegionPermission.READ_WRITE,
        };
        return region;
    }
    return undefined;
};

/**
 * Get MBR parameters region from a memory content according to a specific core
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Region} the MBR parameters region if exist
 */
export const getMBRParamsRegion = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): Region | undefined => {
    const { uicrBaseAddr, mbrParamsOffset } = coreInfo;
    const mbrParamsAddr = uicrBaseAddr + mbrParamsOffset;
    const mbrParams = memMap.getUint32(mbrParamsAddr, true);
    if (mbrParams && mbrParams !== 0xffffffff) {
        const region: Region = {
            ...defaultRegion,
            name: RegionName.MBR_PARAMS,
            startAddress: mbrParamsAddr,
            regionSize: memMap.get(mbrParamsAddr)?.length || 0,
            color: RegionColor.MBR_PARAMS,
            permission: RegionPermission.READ_ONLY,
        };
        return region;
    }
    return undefined;
};

/**
 * Get MBR region from a memory content according to a specific core
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Region} the MBR region if exist
 */
export const getMBRRegion = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): Region | undefined => {
    const { romBaseAddr } = coreInfo;
    const mbr = memMap.getUint32(romBaseAddr, true);
    if (mbr && mbr !== 0xffffffff && memMap.get(romBaseAddr)) {
        const region: Region = {
            ...defaultRegion,
            name: RegionName.MBR_OR_APP,
            startAddress: romBaseAddr,
            regionSize: memMap.get(romBaseAddr)?.length || 0,
            color: RegionColor.MBR,
            permission: RegionPermission.READ_ONLY,
        };
        return region;
    }
    return undefined;
};

/**
 * Get SoftDevice region from a memory content according to a specific core
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Region} the SoftDevice region if exist
 */
export const getSoftDeviceRegion = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): Region | undefined => {
    const { pageSize } = coreInfo;
    for (
        let address = SOFTDEVICE_MAGIC_START;
        address < SOFTDEVICE_MAGIC_END;
        address += pageSize
    ) {
        const softdeviceMagicNumber =
            memMap.getUint32(address + SOFTDEVICE_MAGIC_OFFSET, true) ||
            undefined;
        if (softdeviceMagicNumber === SOFTDEVICE_MAGIC_NUMBER) {
            let regionSize = 0;
            memMap.forEach((bytes, addr) => {
                if (address >= addr && address < addr + bytes.length) {
                    regionSize = bytes.length;
                }
            });
            const region: Region = {
                ...defaultRegion,
                name: RegionName.SOFTDEVICE,
                startAddress: SOFTDEVICE_MAGIC_START,
                regionSize,
                color: RegionColor.SOFTDEVICE,
                permission: RegionPermission.READ_WRITE,
            };
            return region;
        }
    }
    return undefined;
};

/**
 * Get SoftDevice ID from a memory content according to a specific core
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Region} the SoftDevice ID if exist
 */
export const getSoftDeviceId = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): number | undefined => {
    const { pageSize } = coreInfo;
    let fwId;
    for (
        let address = SOFTDEVICE_MAGIC_START;
        address < SOFTDEVICE_MAGIC_END;
        address += pageSize
    ) {
        const softdeviceMagicNumber =
            memMap.getUint32(address + SOFTDEVICE_MAGIC_OFFSET, true) ||
            undefined;
        const softdeviceFwIdBit = memMap.getUint32(
            address + SOFTDEVICE_FW_ID_OFFSET,
            true
        );
        if (
            softdeviceMagicNumber === SOFTDEVICE_MAGIC_NUMBER &&
            softdeviceFwIdBit
        ) {
            fwId = softdeviceFwIdBit & 0x0000ffff;
        }
    }

    return fwId;
};

/**
 * Display SoftDevice information in the log
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {void}
 */
export const logSoftDeviceRegion = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
) => {
    const { pageSize } = coreInfo;
    for (
        let address = SOFTDEVICE_MAGIC_START;
        address < SOFTDEVICE_MAGIC_END;
        address += pageSize
    ) {
        const softdeviceMagicNumber = memMap.getUint32(
            address + SOFTDEVICE_MAGIC_OFFSET,
            true
        );
        if (softdeviceMagicNumber === SOFTDEVICE_MAGIC_NUMBER) {
            const infoBlockSizeBit = memMap.getUint32(address, true);
            const infoBlockSize = infoBlockSizeBit
                ? infoBlockSizeBit & 0x000000ff
                : undefined;

            const fwIdBit = memMap.getUint32(
                address + SOFTDEVICE_FW_ID_OFFSET,
                true
            );
            const fwId: number = fwIdBit ? fwIdBit & 0x0000ffff : 0;
            if (fwId === 0) {
                logger.info('SoftDevice Id not found');
                return;
            }

            if (infoBlockSize && infoBlockSize >= 0x18) {
                const softDeviceId = memMap.getUint32(
                    address + SOFTDEVICE_ID_OFFSET,
                    true
                );
                const softDeviceVersion = memMap.getUint32(
                    address + SOFTDEVICE_VERSION_OFFSET,
                    true
                );
                if (softDeviceVersion === 0) {
                    logger.info(
                        `SoftDevice detected, id ${hexpad2(
                            fwId
                        )} (S${softDeviceId} prerelease)`
                    );
                    return;
                }
                if (softDeviceVersion) {
                    const softDeviceVersionMajor = Math.floor(
                        (softDeviceVersion / 1000000) % 1000
                    );
                    const softDeviceVersionMinor = Math.floor(
                        (softDeviceVersion / 1000) % 1000
                    );
                    const softDeviceVersionPatch = softDeviceVersion % 1000;
                    logger.info(
                        `SoftDevice detected, id ${hexpad2(
                            fwId
                        )} (S${softDeviceId} v${softDeviceVersionMajor}.${softDeviceVersionMinor}.${softDeviceVersionPatch})`
                    );
                    return;
                }
            }
            if (knownSoftDevices[fwId]) {
                logger.info(
                    `SoftDevice detected, id ${hexpad2(fwId)} (${
                        knownSoftDevices[fwId]
                    })`
                );
                return;
            }

            logger.info(`SoftDevice detected, id ${hexpad2(fwId)}`);
        }
    }
};

/**
 * Given an instance of MemoryMap and deviceDefinition,
 * return the heuristically detected regions.
 *
 * @param {MemoryMap} memMap the memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Array} the list of region
 */
export const getMemoryRegions = (
    memMap: MemoryMap,
    coreInfo: CoreDefinition
): Region[] => {
    let regions: Region[] = [];
    let region;
    region = getMBRParamsRegion(memMap, coreInfo);
    if (region) regions = [...regions, region];
    region = getMBRRegion(memMap, coreInfo);
    if (region) regions = [...regions, region];
    region = getBootloaderRegion(memMap, coreInfo);
    if (region) regions = [...regions, region];
    region = getSoftDeviceRegion(memMap, coreInfo);
    if (region) regions = [...regions, region];
    logSoftDeviceRegion(memMap, coreInfo);

    return regions;
};

/**
 * Given overlaps of memory content of either files or device,
 * the loaded memory content and deviceDefinition,
 * return the heuristically detected regions for loaded memory contents.
 *
 * @param {Overlaps} overlaps the overlaps
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {array} the list of region
 */
export const getRegionsFromOverlaps = (
    overlaps: Overlaps,
    coreInfo: CoreDefinition
): Region[] => {
    const memMap = MemoryMap.flattenOverlaps(overlaps);
    const memRegions = getMemoryRegions(memMap, coreInfo);
    const blRegion = memRegions.find(r => r.name === RegionName.BOOTLOADER);
    const sdRegion = memRegions.find(r => r.name === RegionName.SOFTDEVICE);
    let regions: Region[] = [];
    let region;
    overlaps.forEach((overlap, startAddress) => {
        const fileNames: string[] = [];
        let regionSize = 0;

        overlap.forEach(([fileName, bytes]) => {
            regionSize = bytes ? bytes?.length : 0;
            if (fileName) {
                fileNames.push(fileName);
            }
        });
        region = memRegions.find(r => r.startAddress === startAddress);
        region = region
            ? {
                  ...region,
                  fileNames,
                  startAddress,
                  regionSize,
              }
            : {
                  ...defaultRegion,
                  name: RegionName.NONE,
                  color: RegionColor.NONE,
                  startAddress,
                  regionSize,
                  fileNames,
              };

        // The content read from device flash memory via JLink is padded.
        // If the gap between SoftDevice and Application is too small,
        // then the content read by nrfjprog will be regarded as a single part.
        // Split them apart if this happens.
        if (sdRegion && regionSize - sdRegion.regionSize > coreInfo.pageSize) {
            region = { ...region, regionSize: sdRegion?.regionSize };

            const appRegion = {
                ...defaultRegion,
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
                startAddress: startAddress + region.regionSize,
                regionSize: regionSize - region.regionSize,
                fileNames,
            };
            regions = [...regions, appRegion];
        }

        // If both SoftDevice and Bootloader exist
        // the regions between SoftDevice and Bootloader are Applications
        if (
            sdRegion &&
            blRegion &&
            startAddress >= sdRegion.startAddress + sdRegion.regionSize &&
            startAddress + regionSize < blRegion.startAddress
        ) {
            region = {
                ...region,
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
            };
        }

        // If SoftDevice exists but not Bootloader
        // the regions above SoftDevice are Applications

        if (
            sdRegion &&
            !blRegion &&
            startAddress >= sdRegion.startAddress + sdRegion.regionSize
        ) {
            region = {
                ...region,
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
            };
        }

        // If Bootloader exists but not SoftDevice
        // the regions below Bootloader and above MBR are Applications
        if (
            !sdRegion &&
            blRegion &&
            startAddress !== coreInfo.romBaseAddr &&
            startAddress + regionSize < blRegion.startAddress
        ) {
            region = {
                ...region,
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
            };
        }

        // If neither Bootloader nor SoftDevice exists
        // then we regard the region as Application
        if (!sdRegion && !blRegion && region.name === RegionName.NONE) {
            region = {
                ...region,
                name: RegionName.APPLICATION,
                color: RegionColor.APPLICATION,
            };
        }

        regions = regions.includes(region) ? regions : [...regions, region];
    });
    regions = regions.filter(r => isRegionInCore(r, coreInfo));

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded files and deviceDefinition,
 * return the heuristically detected regions for loaded files.
 *
 * @param {MemoryBlocks} memMaps the array of memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Array} the list of region
 */
export const getFileRegions = (
    memMaps: MemoryBlocks,
    coreInfo: CoreDefinition
): Region[] => {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, coreInfo);

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded device and deviceDefinition,
 * return the heuristically detected regions for loaded device.
 *
 * @param {MemoryBlocks} memMaps the array of memory content
 * @param {CorDefinition} coreInfo the specific core
 *
 * @returns {Array} the list of region
 */
export const getCoreRegions = (
    memMaps: MemoryBlocks,
    coreInfo: CoreDefinition
): Region[] => {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    const regions = getRegionsFromOverlaps(overlaps, coreInfo);

    return regions;
};

/**
 * Given an instance of MemoryMap, content of loaded device and deviceDefinition,
 * return the heuristically detected regions for loaded device.
 *
 * @param {MemoryBlocks} memMaps the array of memory content
 * @param {deviceDefinition}   deviceInfo   the specific  device
 *
 * @returns {Array} the list of region
 */
export const getTargetRegions = (
    memMaps: MemoryBlocks,
    deviceInfo: DeviceDefinition
): Region[] => {
    let regions: Region[] = [];
    deviceInfo.cores.forEach(c => {
        regions = [...regions, ...getCoreRegions(memMaps, c)];
    });
    return regions;
};
