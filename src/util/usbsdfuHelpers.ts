/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { convertDeviceDefinitionToCoreArray } from './devices';
import { DeviceDefinition } from './deviceTypes';
import { defaultRegion, Region, RegionColor, RegionName } from './regions';

export const generateRegionDetectedNames = (fileRegions: Region[]) => {
    const regionChecklist = [
        RegionName.APPLICATION,
        RegionName.SOFTDEVICE,
        RegionName.BOOTLOADER,
    ];
    const detectedRegionNames = new Set<string>();
    fileRegions.forEach(r => {
        if (r.name && regionChecklist.includes(r.name)) {
            detectedRegionNames.add(r.name);
        }
    });

    return detectedRegionNames;
};

// There is an Application on top of SoftDevice in the HEX file,
// but there is no SoftDevice in the HEX file,
// In this case, if there is a SoftDevice being found in target device,
// then the Application region should be displayed.
// If there is no SoftDevice in both HEX file and target device,
// then the user should give input instead.
// (Or fix getting softdevice id from bootloader)
export const generateFileAppRegions = (
    fileRegions: Region[],
    targetRegions: Region[],
) => {
    const targetBootloaderRegion = targetRegions?.find(
        r => r.name === RegionName.BOOTLOADER,
    );

    let appStartAddress: number | undefined;
    let appEndAddress: number | undefined;
    fileRegions.forEach(r => {
        // Detect the start address of all applications
        if (
            r.name === RegionName.APPLICATION &&
            (!appStartAddress || appStartAddress > r.startAddress)
        ) {
            appStartAddress = r.startAddress;
        }
        // Detect the end address of all applications
        if (
            targetBootloaderRegion &&
            r.name === RegionName.APPLICATION &&
            r.startAddress < targetBootloaderRegion.startAddress &&
            (!appEndAddress || appEndAddress < r.startAddress)
        ) {
            appEndAddress = r.startAddress + r.regionSize;
        }
    });

    // Merge Application regions if more than one application are detected.
    if (
        targetBootloaderRegion &&
        appStartAddress !== undefined &&
        appEndAddress !== undefined
    ) {
        let restFileRegions: Region[] = [];
        fileRegions.forEach(r => {
            if (
                !(
                    r.name === RegionName.APPLICATION &&
                    r.startAddress < targetBootloaderRegion.startAddress
                )
            ) {
                restFileRegions = [...restFileRegions, r];
            }
        });
        const appRegion = {
            ...defaultRegion,
            name: RegionName.APPLICATION,
            startAddress: appStartAddress,
            regionSize: appEndAddress - appStartAddress,
            color: RegionColor.APPLICATION,
        };
        fileRegions = [...restFileRegions, appRegion];
    }

    return fileRegions;
};

// Update Bootloader region in parsed files
// Regard the Bootloader as a whole when there are gaps found in the Bootloader
export const generateFileBlRegion = (
    fileRegions: Region[],
    deviceDefinition: DeviceDefinition,
) => {
    const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
    const blRegions = fileRegions.filter(
        region => region.name === RegionName.BOOTLOADER,
    );

    blRegions.forEach(blRegion => {
        let blEndAddress: number | undefined;
        const blStartAddress = blRegion.startAddress;
        const coreRomSize = coreInfos.find(
            core =>
                blStartAddress >= core.coreDefinitions.romBaseAddr &&
                blStartAddress <
                    core.coreDefinitions.romBaseAddr +
                        core.coreDefinitions.romSize,
        )?.coreDefinitions.romSize;

        fileRegions.forEach(r => {
            if (
                r.name === RegionName.NONE &&
                r.startAddress > blRegion.startAddress &&
                r.startAddress + r.regionSize < (coreRomSize as number) &&
                (!blEndAddress || blEndAddress <= r.startAddress)
            ) {
                blEndAddress = r.startAddress + r.regionSize;
            }
        });

        // Merge Bootloader regions if more than one Bootloader are detected.
        if (blStartAddress !== undefined && blEndAddress !== undefined) {
            const blRegionIndex = fileRegions.indexOf(blRegion);
            blRegion = {
                ...blRegion,
                regionSize: blEndAddress - blStartAddress,
            };
            fileRegions[blRegionIndex] = blRegion;
            return fileRegions;
        }
    });

    return fileRegions;
};
