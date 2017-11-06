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
import { basename } from 'path';
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import { hexToArrays, getUint32 } from 'nrf-intel-hex';
import Store from 'electron-store';

import hexpad from '../hexpad';

const persistentStore = new Store({ name: 'nrf-programmer' });


function displayFileError(err, dispatch) {
    const error = `Could not open .hex file: ${err}`;
    logger.error(error);
    dispatch({
        type: 'ERROR_DIALOG_SHOW',
        message: error,
    });
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

function parseOneFile(filename, dispatch) {
    stat(filename, (err, stats) => {
        if (err) {
            displayFileError(err, dispatch);
            removeMruFile(filename);
            return;
        }

//         const fileModTime = stats.fileModTime;

        readFile(filename, {}, (err2, data) => {
            logger.info('Parsing .hex file: ', filename);
            logger.info('File was last modified at ', stats.mtime.toLocaleString());
            if (err2) {
                displayFileError(err2, dispatch);
                removeMruFile(filename);
                return;
            }
            addMruFile(filename);

            let blocks;
            try {
                blocks = hexToArrays(data.toString());
            } catch (ex) {
                displayFileError(ex, dispatch);
                return;
            }

            // Display some info in the log.
            for (const [address, block] of blocks) {
                const size = block.length;

                logger.info(`Data block: ${hexpad(address)}-${hexpad(address + size)} (${hexpad(size)}`, ' bytes long)');
            }

            // Does this file contain updated info about bootlader and readbac prot?
            // Try querying the UICR and see if there's valid data in there
            const clenr0 = getUint32(blocks, 0x10001000, true);
            const rpbConf = getUint32(blocks, 0x10001004, true);
            const bootloaderAddress = getUint32(blocks, 0x10001014, true);
            const mbrParams = getUint32(blocks, 0x10001018, true);
            let readbackProtectAddress;

            // / TODO: Get some .hex files which handle clenr0/rpbConf

//             // Sanity checks on clenr0+rpbConf
//             if (rpbConf !== undefined) {
//                 if ((rpbConf & 0xFF0F) === 0) {
//                     // Set the address to 0.5GiB - the size of the whole code region
//                     // in the ARM 32-bit address space
//                     readbackProtectAddress = 0x2000000;
//                 } else if ((rpbConf & 0xFFF0) === 0) {
//                     readbackProtectAddress = clenr0;
//                 }
//             }

            let softDeviceStart;
            let softDeviceEnd;

            // Look for softdevice magic
            for (let address = 0x1000; address < 0x10000; address += 0x1000) {
                if (getUint32(blocks, address + 0x04, true) === 0x51B1E5DB) {
                    softDeviceStart = address;
                    const softDeviceSize = getUint32(blocks, address + 0x08, true);
//                     softDeviceEnd = address + softDeviceSize;
                    softDeviceEnd = softDeviceSize;
                    logger.info(`File matches SoftDevice signature. Start/End/ID: ${
                        hexpad(address)}`,
                        hexpad(softDeviceSize),

                        // eslint-disable-next-line
                        getUint32(blocks, address + 0x0C, true) & 0x00FF,
                    );
                    break;
                }
            }


            // Explicitly log the detected regions/labels
            if (clenr0 !== undefined) {
                logger.info(`File contains UICR info: code region 0 length ${hexpad(clenr0)}`);
            }
            if (rpbConf !== undefined) {
                logger.info(`File contains UICR info: readback config record: ${hexpad(rpbConf)}`);
            }
            if (bootloaderAddress !== undefined) {
                logger.info(`File contains UICR info: bootloader at ${hexpad(bootloaderAddress)}`);
            }
            if (mbrParams !== undefined) {
                logger.info(`File contains UICR info: MBR parameteres at ${hexpad(mbrParams)}`);
            }

            dispatch({
                type: 'FILE_PARSE',
                filename: basename(filename),
                fullFilename: filename,
                fileModTime: stats.mtime,
                fileLoadTime: new Date(),
                blocks,
                regions: {
                    region0: clenr0,
                    readback: readbackProtectAddress,
                },
                labels: {
                    bootloader: bootloaderAddress,
                    mbrParams,
                    softDeviceStart,
                    softDeviceEnd,
                },
            });
        });
    });
}

export function openFileDialog() {
    return dispatch => {
        electron.remote.dialog.showOpenDialog(/* window */undefined, {
            title: 'Select a .hex file',
            filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
            properties: ['openFile', 'multiSelections'],
        }, filenames => {
//             console.log('Files selected: ', filenames);

            for (const filename of filenames) {
                parseOneFile(filename, dispatch);
            }
        });
    };
}

export function openFile(filename) {
    return dispatch => {
        parseOneFile(filename, dispatch);
    };
}

export function loadMruFiles() {
    return dispatch => {
        const files = persistentStore.get('mruFiles', []);
        dispatch({
            type: 'LOAD_MRU_FILES_SUCCESS',
            files,
        });
    };
}

export function refreshAllFiles(fileLoadTimes) {
    return dispatch => Promise.all(
        Array.from(fileLoadTimes.entries()).map(
            ([filename, loadTime]) => new Promise((res, rej) => {
                stat(filename, (err, stats) => {
                    if (err) {
                        displayFileError(err, dispatch);
                        return rej();
                    }

                    if (loadTime.getTime() < stats.mtime) {
                        logger.info('Reloading: ', filename);
                        return parseOneFile(filename, (...args) => { dispatch(...args); res(); });
                    }
                    logger.info('Does not need to be reloaded: ', filename);
                    return res();
                });
            }),
        ),
    );
}


// Checks if the files have changed since they were loaded into the programmer UI.
// Will display a message box dialog.
// Expects a Map of filenames to instances of Date when the file was loaded into the UI.
// Returns a promise: it will resolve when the state of the files is known, or reject
// if the user wanted to cancel to manually check the status.
export function checkUpToDateFiles(fileLoadTimes, dispatch) {
    let newestFileTimestamp = -Infinity;

    // Check if files have changed since they were loaded
    return Promise.all(
        Array.from(fileLoadTimes.entries()).map(
            ([filename, loadTime]) => new Promise(res => {
                stat(filename, (err, stats) => {
                    if (loadTime.getTime() < stats.mtime) {
                        newestFileTimestamp = Math.max(newestFileTimestamp, stats.mtime);
                        res(filename);
                    } else {
                        res();
                    }
                });
            }),
        ),
    ).then(filenames => filenames.filter(i => !!i)).then(filenames => {
        if (filenames.length === 0) {
            // Resolve inmediately: no files were changed
            return Promise.resolve();
        }

        if (persistentStore.has('behaviour-when-files-not-up-to-date')) {
            // If the user has checked the "don't ask me again" checkbox before,
            // perform the saved behaviour
            const behaviour = persistentStore.get('behaviour-when-files-not-up-to-date');
            if (behaviour === 'ignore') {
                return Promise.resolve();
            } else if (behaviour === 'reload') {
                return refreshAllFiles(fileLoadTimes)(dispatch);
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
                    return refreshAllFiles(fileLoadTimes)(dispatch).then(res);
                }
                // cancel
                return rej();
            });
        });
    });
}
