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

import { readFile, stat } from 'fs';
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import MemoryMap from 'nrf-intel-hex';
import Store from 'electron-store';

import { hexpad8 } from '../hexpad';
import memRegions from '../memRegions';

const persistentStore = new Store({ name: 'nrf-programmer' });

export const ERROR_DIALOG_SHOW = 'ERROR_DIALOG_SHOW';
export const FILE_PARSE = 'FILE_PARSE';
export const FILE_REMOVE = 'FILE_REMOVE';
export const FILES_EMPTY = 'FILES_EMPTY';
export const MRU_FILES_LOAD_SUCCESS = 'MRU_FILES_LOAD_SUCCESS';

export function errorDialogShowAction(error) {
    return {
        type: ERROR_DIALOG_SHOW,
        message: error,
    };
}

export function fileParseAction(filePath, modTime, loadTime, memMap, regions, labels) {
    return {
        type: FILE_PARSE,
        filePath,
        modTime,
        loadTime,
        memMap,
        regions,
        labels,
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

function parseOneFile(dispatch, filename) {
    stat(filename, (err, stats) => {
        if (err) {
            logger.error(`Could not open .hex file: ${err}`);
            dispatch(errorDialogShowAction(err));
            removeMruFile(filename);
            return;
        }

        readFile(filename, {}, (err2, data) => {
            logger.info('Parsing .hex file: ', filename);
            logger.info('File was last modified at ', stats.mtime.toLocaleString());
            if (err2) {
                logger.error(`Could not open .hex file: ${err2}`);
                dispatch(errorDialogShowAction(err2));
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

            for (const [address, block] of memMap) {
                const size = block.length;
                logger.info(`Data block: ${hexpad8(address)}-${hexpad8(address + size)} (${hexpad8(size)}`, ' bytes long)');
            }

            const { regions, labels } = memRegions(memMap);

            dispatch(fileParseAction(filename, stats.mtime, new Date(), memMap, regions, labels));
        });
    });
}

export function openFileDialog() {
    return dispatch => {
        electron.remote.dialog.showOpenDialog(
            undefined, /* window */
            {
                title: 'Select a .hex file',
                filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
                properties: ['openFile', 'multiSelections'],
            },
            filenames => {
                for (const filename of filenames) {
                    parseOneFile(dispatch, filename);
                }
            });
    };
}

export function openFile(filename) {
    return dispatch => {
        parseOneFile(dispatch, filename);
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
        Object.keys(getState().app.file.loaded).map(filePath => new Promise((resolve, reject) => {
            const entry = getState().app.file.loaded[filePath];
            stat(filePath, (err, stats) => {
                if (err) {
                    logger.error(`Could not open .hex file: ${err}`);
                    dispatch(errorDialogShowAction(err));
                    return reject();
                }
                if (entry.loadTime.getTime() < stats.mtime) {
                    logger.info('Reloading: ', filePath);
                    return parseOneFile((...args) => {
                        dispatch(...args);
                        resolve();
                    }, filePath);
                }
                logger.info('Does not need to be reloaded: ', filePath);
                return resolve();
            });
        })),
    );
}

// Checks if the files have changed since they were loaded into the programmer UI.
// Will display a message box dialog.
// Expects a Map of filenames to instances of Date when the file was loaded into the UI.
// Returns a promise: it will resolve when the state of the files is known, or reject
// if the user wanted to cancel to manually check the status.
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
