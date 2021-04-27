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

/* eslint-disable import/no-cycle */

import electron from 'electron';
import Store from 'electron-store';
import { readFile, stat, statSync } from 'fs';
import MemoryMap from 'nrf-intel-hex';
import { logger } from 'nrfconnect/core';
import { basename } from 'path';

import { deviceDefinition, getDeviceDefinition } from '../util/devices';
import { hexpad8 } from '../util/hexpad';
import {
    defaultRegion,
    getFileRegions,
    RegionColor,
    RegionName,
} from '../util/regions';
import * as targetActions from './targetActions';
import { addFileWarning, fileWarningRemoveAction } from './warningActions';

const persistentStore = new Store({ name: 'nrf-programmer' });

export const ERROR_DIALOG_SHOW = 'ERROR_DIALOG_SHOW';
export const FILE_PARSE = 'FILE_PARSE';
export const FILE_REGION_NAMES_KNOWN = 'FILE_REGION_NAMES_KNOWN';
export const FILE_REGIONS_KNOWN = 'FILE_REGIONS_KNOWN';
export const FILE_REMOVE = 'FILE_REMOVE';
export const FILES_EMPTY = 'FILES_EMPTY';
export const MCUBOOT_FILE_KNOWN = 'MCUBOOT_FILE_KNOWN';
export const MRU_FILES_LOAD_SUCCESS = 'MRU_FILES_LOAD_SUCCESS';

export const errorDialogShowAction = error => ({
    type: ERROR_DIALOG_SHOW,
    message: error.message || error,
});

export const fileParseAction = (loaded, memMaps) => ({
    type: FILE_PARSE,
    loaded,
    memMaps,
});

export const fileRegionsKnownAction = regions => ({
    type: FILE_REGIONS_KNOWN,
    regions,
});

export const fileRegionNamesKnownAction = detectedRegionNames => ({
    type: FILE_REGION_NAMES_KNOWN,
    detectedRegionNames,
});

export const filesEmptyAction = () => ({
    type: FILES_EMPTY,
});

export const mruFilesLoadSuccessAction = files => ({
    type: MRU_FILES_LOAD_SUCCESS,
    files,
});

export const mcubootFileKnownAction = filePath => ({
    type: MCUBOOT_FILE_KNOWN,
    filePath,
});

// Update core info when file actions happen and not when the device is selected
const updateCoreInfo = () => (dispatch, getState) => {
    const { target, file } = getState().app;
    const { family, type } = target.deviceInfo;

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
    const {
        romBaseAddr: netwrokRomBaseAddr,
        romSize: networkRomSize,
    } = networkCore;
    if (
        startAddresses.find(
            s =>
                s >= netwrokRomBaseAddr &&
                s <= netwrokRomBaseAddr + networkRomSize
        )
    ) {
        dispatch(
            targetActions.targetInfoKnownAction({
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

const updateDetectedRegionNames = () => (dispatch, getState) => {
    const fileRegions = getState().app.file.regions;
    const regionChecklist = [
        RegionName.APPLICATION,
        RegionName.SOFTDEVICE,
        RegionName.BOOTLOADER,
    ];
    let detectedRegionNames = new Set();
    fileRegions.forEach(r => {
        if (r.name && regionChecklist.includes(r.name)) {
            detectedRegionNames = detectedRegionNames.add(r.name);
        }
    });
    dispatch(fileRegionNamesKnownAction(detectedRegionNames));
};

// There is an Application on top of SoftDevice in the HEX file,
// but there is no SoftDevice in the HEX file,
// In this case, if there is a SoftDevice being found in target device,
// then the Application region should be displayed.
// If there is no SoftDevice in both HEX file and target device,
// then the user should give input instead.
// (Or fix getting softdevice id from bootloader)
export const updateFileAppRegions = () => (dispatch, getState) => {
    let fileRegions = getState().app.file.regions;
    const targetRegions = getState().app.target.regions;
    const targetBootloaderRegion = targetRegions.find(
        r => r.name === RegionName.BOOTLOADER
    );

    let appStartAddress;
    let appEndAddress;
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
        let restFileRegions = [];
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
        dispatch(fileRegionsKnownAction(fileRegions));
    }
};

// Update Bootloader region in parsed files
// Regard the Bootloader as a whole when there are gaps found in the Bootloader
export const updateFileBlRegion = () => (dispatch, getState) => {
    let fileRegions = getState().app.file.regions;
    const { cores } = getState().app.target.deviceInfo;
    const blRegions = fileRegions.filter(r => r.name === RegionName.BOOTLOADER);
    if (blRegions.length <= 0) {
        return;
    }

    blRegions.forEach(b => {
        let blRegion = b;
        let blEndAddress;
        const blStartAddress = blRegion.startAddress;
        const core = cores.find(
            c =>
                blStartAddress >= c.romBaseAddr &&
                blStartAddress < c.romBaseAddr + c.romSize
        );
        fileRegions.forEach(r => {
            if (
                r.name === RegionName.NONE &&
                r.startAddress > blRegion.startAddress &&
                r.startAddress + r.regionSize < core.romSize &&
                (!blEndAddress || blEndAddress <= r.startAddress)
            ) {
                blEndAddress = r.startAddress + r.regionSize;
            }
        });

        // Merge Bootloader regions if more than one Bootloader are detected.
        if (blStartAddress !== undefined && blEndAddress !== undefined) {
            fileRegions.forEach(r => {
                if (r.name === RegionName.NONE) {
                    fileRegions = fileRegions.remove(fileRegions.indexOf(r));
                }
            });
            const blRegionIndex = fileRegions.indexOf(blRegion);
            blRegion = {
                ...blRegion,
                regionSize: blEndAddress - blStartAddress,
            };
            fileRegions = fileRegions.set(blRegionIndex, blRegion);
            dispatch(fileRegionsKnownAction(fileRegions));
        }
    });
};

export const updateFileRegions = () => (dispatch, getState) => {
    dispatch(fileWarningRemoveAction());

    const { file, target } = getState().app;
    const overlaps = MemoryMap.overlapMemoryMaps(file.memMaps);

    let regions = [];
    getState().app.target.deviceInfo.cores.forEach(c => {
        regions = [...regions, ...getFileRegions(file.memMaps, c)];
    });

    // Show file warning if overlapping.
    if (regions.find(r => r.fileNames && r.fileNames.length > 1)) {
        dispatch(
            addFileWarning('Some of the HEX files have overlapping data.')
        );
    }

    // Show file warning if out of displaying area.
    const outsideFlashBlocks = [];
    overlaps.forEach((overlap, startAddress) => {
        const endAddress = startAddress + overlap[0][1].length;
        const { uicrBaseAddr, romSize, pageSize } = target.deviceInfo;
        if (
            (startAddress < uicrBaseAddr && endAddress > romSize) ||
            (startAddress >= uicrBaseAddr &&
                endAddress > uicrBaseAddr + pageSize)
        ) {
            outsideFlashBlocks.push(
                `${hexpad8(startAddress)}-${hexpad8(endAddress)}`
            );
        }
    });
    if (outsideFlashBlocks.length) {
        dispatch(
            addFileWarning(
                `There is data outside the user-writable areas (${outsideFlashBlocks.join(
                    ', '
                )}).`
            )
        );
    }

    dispatch(fileRegionsKnownAction(regions));
    dispatch(updateDetectedRegionNames());
};

export const removeFile = filePath => (dispatch, getState) => {
    const { loaded, memMaps } = getState().app.file;
    const newLoaded = { ...loaded };
    const newMemMaps = memMaps.filter(element => element[0] !== filePath);
    delete newLoaded[filePath];

    dispatch(fileParseAction(newLoaded, newMemMaps));
    dispatch(updateCoreInfo());
    dispatch(updateFileRegions());
    dispatch(targetActions.updateTargetWritable());
};

export const closeFiles = () => (dispatch, getState) => {
    dispatch(fileWarningRemoveAction());
    dispatch(filesEmptyAction());
    dispatch(updateFileRegions());

    // Initialize the state of deviceInfo if no device is selected
    if (!getState().app.target.deviceInfo.type) {
        dispatch(targetActions.targetInfoKnownAction(deviceDefinition));
    }
    dispatch(targetActions.updateTargetWritable());
};

export const loadMruFiles = () => dispatch => {
    const files = persistentStore.get('mruFiles', []);
    dispatch(mruFilesLoadSuccessAction(files));
};

const removeMruFile = filename => {
    const files = persistentStore.get('mruFiles', []);
    persistentStore.set(
        'mruFiles',
        files.filter(file => file !== filename)
    );
};

const addMruFile = filename => {
    const files = persistentStore.get('mruFiles', []);
    if (files.indexOf(filename) === -1) {
        files.unshift(filename);
        files.splice(10);
        persistentStore.set('mruFiles', files);
    }
};

const parseOneFile = filePath => async (dispatch, getState) => {
    const { loaded, memMaps } = getState().app.file;
    if (loaded[filePath]) {
        return;
    }

    const stats = await new Promise((resolve, reject) => {
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

    const data = await new Promise((resolve, reject) => {
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
    dispatch(mcubootFileKnownAction(filePath));

    const newLoaded = {
        ...loaded,
        [filePath]: {
            filename: basename(filePath),
            modTime: stats.mtime,
            loadTime: new Date(),
            memMap,
        },
    };
    const newMemMaps = [...memMaps, [filePath, memMap]];
    dispatch(fileParseAction(newLoaded, newMemMaps));
    dispatch(updateCoreInfo());
    dispatch(updateFileRegions());
    dispatch(targetActions.updateTargetWritable());
};

export const openFile = (filename, ...rest) => async dispatch => {
    if (filename) {
        dispatch(mcubootFileKnownAction(null));
        await dispatch(parseOneFile(filename));
        return dispatch(openFile(...rest));
    }
    return dispatch(loadMruFiles());
};

export const openFileDialog = () => dispatch => {
    const dialogOptions = {
        title: 'Select a HEX file',
        filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
        properties: ['openFile', 'multiSelections'],
    };
    electron.remote.dialog
        .showOpenDialog(dialogOptions)
        .then(({ filePaths }) => filePaths && dispatch(openFile(...filePaths)));
};

export const refreshAllFiles = () => (dispatch, getState) =>
    Promise.all(
        Object.keys(getState().app.file.loaded).map(async filePath => {
            const entry = getState().app.file.loaded[filePath];
            try {
                const stats = statSync(filePath);
                if (entry.loadTime.getTime() < stats.mtime) {
                    dispatch(removeFile(filePath));
                    logger.info('Reloading: ', filePath);
                    await dispatch(parseOneFile(filePath));
                    return;
                }
                logger.info('Does not need to be reloaded: ', filePath);
            } catch (error) {
                logger.error(`Could not open HEX file: ${error}`);
                dispatch(errorDialogShowAction(error));
            }
        })
    );
