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

import { readFile, stat, statSync } from 'fs';
import electron from 'electron';
import Store from 'electron-store';
import { List, Set } from 'immutable';
import { logger } from 'nrfconnect/core';
import MemoryMap from 'nrf-intel-hex';
import * as targetActions from './targetActions';
import { hexpad8 } from '../util/hexpad';
import { getFileRegions, RegionName } from '../util/regions';

const persistentStore = new Store({ name: 'nrf-programmer' });

export const ERROR_DIALOG_SHOW = 'ERROR_DIALOG_SHOW';
export const FILE_PARSE = 'FILE_PARSE';
export const FILE_REMOVE = 'FILE_REMOVE';
export const FILES_EMPTY = 'FILES_EMPTY';
export const FILE_REGIONS_KNOWN = 'FILE_REGIONS_KNOWN';
export const FILE_REGION_NAMES_KNOWN = 'FILE_REGION_NAMES_KNOWN';
export const MRU_FILES_LOAD_SUCCESS = 'MRU_FILES_LOAD_SUCCESS';

export function errorDialogShowAction(error) {
    return {
        type: ERROR_DIALOG_SHOW,
        message: error.message || error,
    };
}

export function fileParseAction(filePath, modTime, loadTime, memMap) {
    return {
        type: FILE_PARSE,
        filePath,
        modTime,
        loadTime,
        memMap,
    };
}

export function fileRegionsKnownAction(regions) {
    return {
        type: FILE_REGIONS_KNOWN,
        regions,
    };
}

export function fileRegionNamesKnownAction(detectedRegionNames) {
    return {
        type: FILE_REGION_NAMES_KNOWN,
        detectedRegionNames,
    };
}

export function fileRemoveAction(filePath) {
    return {
        type: FILE_REMOVE,
        filePath,
    };
}

export function filesEmptyAction() {
    return {
        type: FILES_EMPTY,
    };
}

export function mruFilesLoadSuccessAction(files) {
    return {
        type: MRU_FILES_LOAD_SUCCESS,
        files,
    };
}

function updateFileRegions() {
    return (dispatch, getState) => {
        const { file, target } = getState().app;
        const regions = getFileRegions(
            file.memMaps,
            file.loaded,
            target.deviceInfo,
            target.deviceType,
        );
        dispatch(fileRegionsKnownAction(regions));
    };
}

// There is an Application on top of SoftDevice in the .hex file,
// but there is no SoftDevice in the .hex file,
// In this case, if there is a SoftDevice being found in target device,
// then the Application region should be displayed.
// If there is no SoftDevice in both .hex file and target device,
// then the user should give input instead.
// (Or fix getting softdevice id from bootloader)
export function updateFileAppRegions() {
    return (dispatch, getState) => {
        let fileRegions = getState().app.file.regions;
        const targetRegions = getState().app.target.regions;
        const deviceInfo = getState().app.target.deviceInfo;

        // Assume that the region on top of the SoftDevice is application.
        // Assume also that the region on top of the MBR which is not SoftDevice is application.
        const fileSoftDeviceRegion = fileRegions.find(r => r.name === RegionName.SOFTDEVICE);
        const targetSoftDeviceRegion = targetRegions.find(r => r.name === RegionName.SOFTDEVICE);
        const pageSize = deviceInfo.pageSize;
        if (!fileSoftDeviceRegion && targetSoftDeviceRegion) {
            const softDeviceEnd = targetSoftDeviceRegion.startAddress
                + targetSoftDeviceRegion.regionSize;
            let appRegion = fileRegions.find(r =>
                r.startAddress === Math.ceil((softDeviceEnd) / pageSize) * pageSize);
            if (appRegion) {
                const appRegionIndex = fileRegions.indexOf(appRegion);
                appRegion = appRegion.set('name', RegionName.APPLICATION);
                fileRegions = fileRegions.set(appRegionIndex, appRegion);
                dispatch(fileRegionsKnownAction(fileRegions));
            }
        }

        // Remove Application label if there is no SoftDevice region existing.
        // TODO: fix after dfu
        if (!fileSoftDeviceRegion && !targetSoftDeviceRegion) {
            let appRegion = fileRegions.find(r => r.name === RegionName.APPLICATION);
            if (appRegion) {
                const appRegionIndex = fileRegions.indexOf(appRegion);
                appRegion = appRegion.set('name', RegionName.NONE);
                fileRegions = fileRegions.set(appRegionIndex, appRegion);
                dispatch(fileRegionsKnownAction(fileRegions));
            }
        }

        const regionChecklist = new List([
            RegionName.APPLICATION,
            RegionName.SOFTDEVICE,
            RegionName.BOOTLOADER,
        ]);
        let detectedRegionNames = new Set();
        fileRegions.forEach(r => {
            if (r.name && regionChecklist.includes(r.name)) {
                detectedRegionNames = detectedRegionNames.add(r.name);
            }
        });
        dispatch(fileRegionNamesKnownAction(detectedRegionNames));
    };
}

export function removeFile(filePath) {
    return dispatch => {
        dispatch(fileRemoveAction(filePath));
        dispatch(updateFileRegions());
        dispatch(targetActions.updateTargetWritable());
    };
}

function removeMruFile(filename) {
    const files = persistentStore.get('mruFiles', []);
    persistentStore.set('mruFiles', files.filter(file => file !== filename));
}

function addMruFile(filename) {
    const files = persistentStore.get('mruFiles', []);
    if (files.indexOf(filename) === -1) {
        files.unshift(filename);
        files.splice(10);
        persistentStore.set('mruFiles', files);
    }
}

function parseOneFile(filename) {
    return async dispatch => {
        stat(filename, (statsError, stats) => {
            if (statsError) {
                logger.error(`Could not open .hex file: ${statsError}`);
                dispatch(errorDialogShowAction(statsError));
                removeMruFile(filename);
                return;
            }

            readFile(filename, {}, (readError, data) => {
                logger.info('Parsing .hex file: ', filename);
                logger.info('File was last modified at ', stats.mtime.toLocaleString());
                if (readError) {
                    logger.error(`Could not open .hex file: ${readError}`);
                    dispatch(errorDialogShowAction(readError));
                    removeMruFile(filename);
                    return;
                }
                addMruFile(filename);

                let memMap;
                try {
                    memMap = MemoryMap.fromHex(data.toString());
                } catch (e) {
                    logger.error(`Could not open .hex file: ${e}`);
                    dispatch(errorDialogShowAction(e));
                    return;
                }

                memMap.forEach((block, address) => {
                    const size = block.length;
                    logger.info('Data block: ' +
                        `${hexpad8(address)}-${hexpad8(address + size)} (${hexpad8(size)}`,
                        ' bytes long)');
                });

                dispatch(fileParseAction(
                    filename,
                    stats.mtime,
                    new Date(),
                    memMap,
                ));

                dispatch(updateFileRegions());
                dispatch(updateFileAppRegions());
                dispatch(targetActions.updateTargetWritable());
            });
        });
    };
}

export function openFileDialog() {
    return dispatch => {
        electron.remote.dialog.showOpenDialog(
            {
                title: 'Select a .hex file',
                filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
                properties: ['openFile', 'multiSelections'],
            },
            filenames => {
                filenames.forEach(filename => {
                    dispatch(parseOneFile(filename));
                });
            });
    };
}

export function openFile(filename) {
    return dispatch => {
        dispatch(parseOneFile(filename));
    };
}

export function loadMruFiles() {
    return dispatch => {
        const files = persistentStore.get('mruFiles', []);
        dispatch(mruFilesLoadSuccessAction(files));
    };
}

export function refreshAllFiles() {
    return (dispatch, getState) => Promise.all(
        Object.keys(getState().app.file.loaded).map(async filePath => {
            const entry = getState().app.file.loaded[filePath];
            try {
                const stats = statSync(filePath);
                if (entry.loadTime.getTime() < stats.mtime) {
                    logger.info('Reloading: ', filePath);
                    await dispatch(parseOneFile(filePath));
                    return;
                }
                logger.info('Does not need to be reloaded: ', filePath);
            } catch (error) {
                logger.error(`Could not open .hex file: ${error}`);
                dispatch(errorDialogShowAction(error));
            }
        }));
}

// Checks if the files have changed since they were loaded into the programmer UI.
// Will display a message box dialog.
// Expects a Map of filenames to instances of Date when the file was loaded into the UI.
// Returns a promise: it will resolve when the state of the files is known, or
// reject if the user wanted to cancel to manually check the status.
export function checkUpToDateFiles(dispatch, getState) {
    const { loaded } = getState().app.file;
    let newestFileTimestamp = -Infinity;

    // Check if files have changed since they were loaded
    return Promise.all(
        Object.keys(loaded).map(filePath => new Promise(resolve => {
            stat(filePath, (err, stats) => {
                if (loaded[filePath].loadTime.getTime() < stats.mtime) {
                    newestFileTimestamp = Math.max(newestFileTimestamp, stats.mtime);
                    resolve(filePath);
                } else {
                    resolve();
                }
            });
        })),
    ).then(filenames => filenames.filter(i => !!i)).then(filenames => {
        if (filenames.length === 0) {
            // Resolve immediately: no files were changed
            return Promise.resolve();
        }

        if (persistentStore.has('behaviour-when-files-not-up-to-date')) {
            // If the user has checked the "don't ask me again" checkbox before,
            // perform the saved behaviour
            const behaviour = persistentStore.get('behaviour-when-files-not-up-to-date');
            if (behaviour === 'ignore') {
                return Promise.resolve();
            } else if (behaviour === 'reload') {
                return dispatch(refreshAllFiles());
            }
        }

        return new Promise((res, rej) => {
            const lastLoaded = (new Date(newestFileTimestamp)).toLocaleString();

            electron.remote.dialog.showMessageBox({
                type: 'warning',
                buttons: [
                    `Use old version (prior to ${lastLoaded})`,
                    'Reload all files and proceed',
                    'Cancel',
                ],
                message: `The following files have changed on disk since they were last loaded:\n${
                    filenames.join('\n')}`,
                checkboxLabel: 'Don\'t ask again',
            }, (button, doNotAskAgain) => {
                if (doNotAskAgain) {
                    persistentStore.set('behaviour-when-files-not-up-to-date',
                        button === 0 ? 'ignore' : 'reload',
                    );
                }

                if (button === 0) { // Use old version
                    return res();
                } else if (button === 1) { // Reload
                    return dispatch(refreshAllFiles()).then(res);
                } else if (button === 2) { // Cancel
                    return rej();
                }

                // Should never be reached
                return rej();
            });
        });
    });
}
