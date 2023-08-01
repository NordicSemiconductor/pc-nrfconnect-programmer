/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AppThunk, logger } from 'pc-nrfconnect-shared';

import {
    fileRegionNamesKnown,
    fileRegionsKnown,
} from '../reducers/fileReducer';
import { RootState } from '../reducers/types';
import { fileWarningAdd, fileWarningRemove } from '../reducers/warningReducer';
import { CoreDefinition, coreFriendlyName } from '../util/devices';
import {
    defaultRegion,
    getFileRegions,
    Region,
    RegionColor,
    RegionName,
} from '../util/regions';

const updateDetectedRegionNames =
    (fileRegions: Region[]): AppThunk =>
    dispatch => {
        const regionChecklist = [
            RegionName.APPLICATION,
            RegionName.SOFTDEVICE,
            RegionName.BOOTLOADER,
        ];
        let detectedRegionNames = new Set<string>();
        fileRegions.forEach(r => {
            if (r?.name && regionChecklist.includes(r.name)) {
                detectedRegionNames = detectedRegionNames.add(r.name);
            }
        });
        dispatch(fileRegionNamesKnown(detectedRegionNames));
    };

// There is an Application on top of SoftDevice in the HEX file,
// but there is no SoftDevice in the HEX file,
// In this case, if there is a SoftDevice being found in target device,
// then the Application region should be displayed.
// If there is no SoftDevice in both HEX file and target device,
// then the user should give input instead.
// (Or fix getting softdevice id from bootloader)
export const updateFileAppRegions =
    (): AppThunk<RootState> => (dispatch, getState) => {
        let fileRegions = getState().app.file.regions;
        const targetRegions = getState().app.target.regions;
        const targetBootloaderRegion = targetRegions?.find(
            r => r.name === RegionName.BOOTLOADER
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
            dispatch(fileRegionsKnown(fileRegions));
        }
    };

// Update Bootloader region in parsed files
// Regard the Bootloader as a whole when there are gaps found in the Bootloader
export const updateFileBlRegion =
    (): AppThunk<RootState> => (dispatch, getState) => {
        const fileRegions = getState().app.file.regions;
        const { cores } = { ...getState().app.target.deviceInfo };
        const blRegions = fileRegions.filter(
            region => region.name === RegionName.BOOTLOADER
        );

        if (blRegions.length <= 0) return;

        blRegions.forEach(blRegion => {
            let blEndAddress: number | undefined;
            const blStartAddress = blRegion.startAddress;
            const coreRomSize = cores?.find(
                core =>
                    blStartAddress >= core.romBaseAddr &&
                    blStartAddress < core.romBaseAddr + core.romSize
            )?.romSize;

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
                dispatch(fileRegionsKnown(fileRegions));
            }
        });
    };

export const updateFileRegions =
    (): AppThunk<RootState> => (dispatch, getState) => {
        dispatch(fileWarningRemove());

        const { file, target } = getState().app;
        const cores = target.deviceInfo?.cores as CoreDefinition[];

        let regions: Region[] = [];
        cores.forEach((core: CoreDefinition) => {
            logger.info(
                `Update files regions according to ${coreFriendlyName(
                    core.name
                )} core`
            );
            regions = [...regions, ...getFileRegions(file.memMaps, core)];
        });

        // Show file warning if file region is out of core memory.
        const validRegions = regions.filter(r =>
            cores.find(
                c =>
                    r.startAddress >= c.romBaseAddr &&
                    r.startAddress + r.regionSize <= c.romBaseAddr + c.romSize
            )
        );
        if (validRegions.length !== regions.length) {
            dispatch(
                fileWarningAdd(
                    'Part of the HEX regions are out of the device memory size, ' +
                        'but you can still proceed write operation'
                )
            );
            regions = validRegions;
        }

        // Show file warning if overlapping.
        if (regions.find(r => r.fileNames && r.fileNames.length > 1)) {
            dispatch(
                fileWarningAdd('Some of the HEX files have overlapping data.')
            );
        }

        dispatch(fileRegionsKnown(regions));
        dispatch(updateDetectedRegionNames(regions));
    };
