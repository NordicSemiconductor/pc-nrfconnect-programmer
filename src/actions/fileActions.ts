/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/no-cycle */

import electron from 'electron';
import Store from 'electron-store';
import { readFile, stat, Stats, statSync } from 'fs';
import MemoryMap, { MemoryMapTuple } from 'nrf-intel-hex';
import { basename } from 'path';
import { logger } from 'pc-nrfconnect-shared';

import {
    fileParse,
    fileRegionNamesKnown,
    fileRegionsKnown,
    filesEmpty,
    mcubootFileKnown,
    mruFilesLoadSuccess,
    zipFileKnown,
} from '../reducers/fileReducer';
import { targetInfoKnown } from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { fileWarningAdd, fileWarningRemove } from '../reducers/warningReducer';
import { deviceDefinition, getDeviceDefinition } from '../util/devices';
import {
    defaultRegion,
    getFileRegions,
    Region,
    RegionColor,
    RegionName,
} from '../util/regions';
import { updateTargetWritable } from './targetActions';

const persistentStore = new Store({ name: 'nrf-programmer' });

export const ERROR_DIALOG_SHOW = 'ERROR_DIALOG_SHOW';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorDialogShowAction = (error: any) => ({
    type: ERROR_DIALOG_SHOW,
    message: error.message || error,
});

// Update core info when file actions happen and not when the device is selected
const updateCoreInfo =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const { target, file } = getState().app;
        const { family, type } = { ...target.deviceInfo };

        // If device is selected, device family and device type will not be null
        // and so will not assume target cores by file regions.
        if (family || type) {
            return;
        }

        // Display multiple cores if at least one of the regions matches
        // the requirements of nRF5340
        const overlaps = MemoryMap.overlapMemoryMaps(file.memMaps);
        const startAddresses = [...overlaps.keys()];
        const { cores } = getDeviceDefinition('nRF5340');
        const networkCore = cores[1];
        const { romBaseAddr: netwrokRomBaseAddr, romSize: networkRomSize } =
            networkCore;
        if (
            startAddresses.find(
                s =>
                    s >= netwrokRomBaseAddr &&
                    s <= netwrokRomBaseAddr + networkRomSize
            )
        ) {
            dispatch(
                targetInfoKnown({
                    ...deviceDefinition,
                    cores: [
                        {
                            ...cores[0],
                            romBaseAddr: 0x0,
                            romSize: 0x100000, // 1 MB
                        },
                        {
                            ...cores[1],
                            romBaseAddr: 0x1000000,
                            romSize: 0x40000, // 256 KB
                        },
                    ],
                })
            );
        }
    };

const updateDetectedRegionNames =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const fileRegions = getState().app.file.regions;
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
    () => (dispatch: TDispatch, getState: () => RootState) => {
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
    () => (dispatch: TDispatch, getState: () => RootState) => {
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
    () => (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(fileWarningRemove());

        const { file, target } = getState().app;

        let regions: Region[] = [];
        target.deviceInfo?.cores.forEach(c => {
            logger.info(`Update files regions according to ${c.name} core`);
            regions = [...regions, ...getFileRegions(file.memMaps, c)];
        });

        // Show file warning if overlapping.
        if (regions.find(r => r.fileNames && r.fileNames.length > 1)) {
            dispatch(
                fileWarningAdd('Some of the HEX files have overlapping data.')
            );
        }

        dispatch(fileRegionsKnown(regions));
        dispatch(updateDetectedRegionNames());
    };

export const removeFile =
    (filePath: string) => (dispatch: TDispatch, getState: () => RootState) => {
        const { loaded, memMaps } = getState().app.file;
        const newLoaded = { ...loaded };
        const newMemMaps = memMaps.filter(element => element[0] !== filePath);
        delete newLoaded[filePath];

        dispatch(fileParse({ loaded: newLoaded, memMaps: newMemMaps }));
        dispatch(updateCoreInfo());
        dispatch(updateFileRegions());
        dispatch(updateTargetWritable());
    };

export const closeFiles =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(fileWarningRemove());
        dispatch(filesEmpty());
        dispatch(updateFileRegions());

        // Initialize the state of deviceInfo if no device is selected
        if (!getState().app.target.deviceInfo?.type) {
            dispatch(targetInfoKnown(deviceDefinition));
        }
        dispatch(updateTargetWritable());
    };

export const loadMruFiles = () => (dispatch: TDispatch) => {
    const files = persistentStore.get('mruFiles', []);
    dispatch(mruFilesLoadSuccess(files));
};

const removeMruFile = (filename: string) => {
    const files = persistentStore.get('mruFiles', []);
    persistentStore.set(
        'mruFiles',
        files.filter((file: string) => file !== filename)
    );
};

const addMruFile = (filename: string) => {
    const files = persistentStore.get('mruFiles', []);
    if (files.indexOf(filename) === -1) {
        files.unshift(filename);
        files.splice(10);
        persistentStore.set('mruFiles', files);
    }
};

const parseZipFile = (filePath: string) => async (dispatch: TDispatch) => {
    const stats = await new Promise<Stats>((resolve, reject) => {
        stat(filePath, (statsError, result) => {
            if (statsError) {
                logger.error(`Could not open ZIP file: ${statsError}`);
                dispatch(errorDialogShowAction(statsError));
                removeMruFile(filePath);
                return reject();
            }
            return resolve(result);
        });
    });
    logger.info('Checking ZIP file: ', filePath);
    logger.info('File was last modified at ', stats.mtime.toLocaleString());
    addMruFile(filePath);
};

const parseHexFile =
    (filePath: string) =>
    async (dispatch: TDispatch, getState: () => RootState) => {
        const { loaded, memMaps } = getState().app.file;
        if (loaded[filePath]) {
            return;
        }

        const stats: Stats = await new Promise((resolve, reject) => {
            stat(filePath, (statsError, result) => {
                if (statsError) {
                    logger.error(`Could not open HEX file: ${statsError}`);
                    dispatch(errorDialogShowAction(statsError));
                    removeMruFile(filePath);
                    return reject();
                }
                return resolve(result);
            });
        });

        const data: Buffer = await new Promise((resolve, reject) => {
            readFile(filePath, {}, (readError, result) => {
                logger.info('Parsing HEX file: ', filePath);
                logger.info(
                    'File was last modified at ',
                    stats.mtime.toLocaleString()
                );
                if (readError) {
                    logger.error(`Could not open HEX file: ${readError}`);
                    dispatch(errorDialogShowAction(readError));
                    removeMruFile(filePath);
                    return reject();
                }
                addMruFile(filePath);
                return resolve(result);
            });
        });

        let memMap;
        try {
            memMap = MemoryMap.fromHex(data.toString());
        } catch (e) {
            logger.error(`Could not open HEX file: ${e}`);
            dispatch(errorDialogShowAction(e));
            return;
        }

        // Last selected file will be set as mcuboot file
        dispatch(mcubootFileKnown(filePath));

        const newLoaded = {
            ...loaded,
            [filePath]: {
                filename: basename(filePath),
                modTime: stats.mtime,
                loadTime: new Date(),
                memMap,
            },
        };
        const newMemMaps = [...memMaps, [filePath, memMap]] as MemoryMapTuple[];
        dispatch(fileParse({ loaded: newLoaded, memMaps: newMemMaps }));
        dispatch(updateCoreInfo());
        dispatch(updateFileRegions());
        dispatch(updateTargetWritable());
    };

export const openFile =
    (...params: string[]) =>
    async (dispatch: TDispatch): Promise<unknown> => {
        const filePath = params[0];
        if (!filePath) return dispatch(loadMruFiles());

        // The last selected file has higher priority
        dispatch(mcubootFileKnown(undefined));
        dispatch(zipFileKnown(undefined));

        if (filePath.toLowerCase().endsWith('.zip')) {
            dispatch(zipFileKnown(filePath));
            await dispatch(parseZipFile(filePath));
            dispatch(updateTargetWritable());
            return dispatch(openFile(...params.slice(1)));
        }
        if (
            filePath.toLowerCase().endsWith('.hex') ||
            filePath.toLowerCase().endsWith('.ihex')
        ) {
            await dispatch(parseHexFile(filePath));
            return dispatch(openFile(...params.slice(1)));
        }
    };

export const openFileDialog = () => (dispatch: TDispatch) => {
    const dialogOptions = {
        title: 'Select a HEX / ZIP file',
        filters: [
            {
                name: 'HEX / ZIP files',
                extensions: ['hex', 'iHex', 'zip'],
            },
        ],
        properties: ['openFile', 'multiSelections'],
    };
    electron.remote.dialog
        .showOpenDialog(dialogOptions)
        .then(
            ({ filePaths }: { filePaths: string[] }) =>
                filePaths && dispatch(openFile(...filePaths))
        );
};

export const refreshAllFiles =
    () => (dispatch: TDispatch, getState: () => RootState) =>
        Promise.all(
            Object.keys(getState().app.file.loaded).map(async filePath => {
                const entry = getState().app.file.loaded[filePath];
                try {
                    const stats = statSync(filePath);
                    if (entry.loadTime < stats.mtime) {
                        dispatch(removeFile(filePath));
                        logger.info('Reloading: ', filePath);
                        await dispatch(parseHexFile(filePath));
                        return;
                    }
                    logger.info('Does not need to be reloaded: ', filePath);
                } catch (error) {
                    logger.error(
                        `Could not open HEX file: ${
                            (error as Error).message || error
                        }`
                    );
                    dispatch(errorDialogShowAction(error));
                }
            })
        );
