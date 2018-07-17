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

import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';
import MemoryMap from 'nrf-intel-hex';
import { getMemoryRegions, getTargetRegions } from '../util/regions';
import { getDeviceModel, getDeviceInfoByJprog, CommunicationType } from '../util/devices';
import * as targetActions from './targetActions';
import * as fileActions from '../actions/fileActions';
import * as warningActions from '../actions/warningActions';

// Get device infos by calling nrfjprog
function getDeviceInfo(serialNumber) {
    return new Promise((resolve, reject) => {
        nrfjprog.open(serialNumber, openError => {
            if (openError) {
                return reject(openError);
            }
            nrfjprog.getProbeInfo(serialNumber, (probeInfoError, probeInfo) => {
                if (probeInfoError) {
                    return reject(probeInfoError);
                }
                logger.info('Segger serial: ', probeInfo.serialNumber);
                logger.info('Segger speed: ', probeInfo.clockSpeedkHz, ' kHz');
                logger.info('Segger version: ', probeInfo.firmwareString);

                nrfjprog.getDeviceInfo(serialNumber, (deviceInfoError, devInfo) => {
                    if (deviceInfoError) {
                        return reject(deviceInfoError);
                    }

                    logger.info(`Probed: ${serialNumber}.`);
                    logger.info(`Model: ${getDeviceModel(devInfo)}.`);
                    logger.info(`RAM: ${devInfo.ramSize / 1024}KiB.`);
                    logger.info(`Flash: ${devInfo.codeSize / 1024}KiB in pages of ${devInfo.codePageSize / 1024}KiB.`);

                    resolve(devInfo);
                    return undefined;
                });
                return undefined;
            });
            return undefined;
        });
    })
    .then(devInfo => new Promise(resolve => {
        nrfjprog.close(serialNumber, closeError => {
            if (closeError) {
                logger.error(`Error when closing nrfjprog: ${closeError}`);
            }
            resolve(devInfo);
        });
    }))
    .catch(error => {
        logger.error(`Error when getting device info: ${error}`);
        nrfjprog.close(serialNumber, closeError => {
            if (closeError) {
                logger.error(`Error when closing nrfjprog: ${closeError}`);
            }
        });
    });
}

// Get device memory map by calling nrfjprog and reading the entire non-volatile memory
function getDeviceMemMap(serialNumber, devInfo, fullRead = true) {
    return new Promise((resolve, reject) => {
        nrfjprog.open(serialNumber, openError => {
            if (openError) {
                return reject(openError);
            }
            logger.info('Reading device non-volatile memory. This may take a few seconds.');
            nrfjprog.read(
                serialNumber,
                devInfo.uicrAddress,
                devInfo.infoPageSize,
                (readError, uicrBytes) => {
                    if (readError) {
                        return reject(readError);
                    }
                    if (!fullRead) {
                        return resolve(new MemoryMap([[
                            devInfo.uicrAddress,
                            new Uint8Array(uicrBytes),
                        ]]));
                    }
                    nrfjprog.read(
                        serialNumber,
                        devInfo.codeAddress,
                        devInfo.codeSize,
                        (err1, flashBytes) => {
                            if (err1) {
                                return reject(err1);
                            }
                            const memMap = MemoryMap.fromPaddedUint8Array(
                                new Uint8Array(flashBytes), 0xFF, 256,
                            );
                            memMap.set(devInfo.uicrAddress, new Uint8Array(uicrBytes));
                            logger.info(`Non-volatile memory has been read. ${memMap.size} non-empty memory blocks identified.`);
                            resolve(memMap);

                            return undefined;
                        });
                    return undefined;
                });
            return undefined;
        });
    })
    .then(memMap => new Promise(resolve => {
        nrfjprog.close(serialNumber, closeError => {
            if (closeError) {
                logger.error(`Error when closing nrfjprog: ${closeError}`);
            }
            resolve(memMap);
        });
    }))
    .catch(error => {
        logger.error(`Error when getting device info: ${error}`);
        nrfjprog.close(serialNumber, closeError => {
            if (closeError) {
                logger.error(`Error when closing nrfjprog: ${closeError}`);
            }
        });
    });
}

// Check if the files can be written to the target device
// The typical use case is having some .hex files that use the UICR, and a DevKit
// that doesn't allow erasing the UICR page(s). Also, the (rare) cases where the
// nRF SoC has readback protection enabled (and the loaded .hex files write the
// readback-protected region).
// In all those cases, this function will return false, and the user should not be
// able to press the "program" button.
// There are also instances where the UICR can be erased and overwritten, but
// unfortunately the casuistics are just too complex.
export function canWrite() {
    return (dispatch, getState) => {
        // TODO: get the UICR address from the target definition. This value
        // works for nRF51s and nRF52s, but other targets might use a different one!!!
        const appState = getState().app;
        const targetMemMap = appState.target.memMap;
        const fileMemMaps = appState.file.memMaps;
        const uicrAddr = appState.target.deviceInfo.uicrBaseAddr;
        const uicrSize = appState.target.deviceInfo.uicrSize;
        let isWritable = true;

        // Check if target's UICR is already erased (all 0xFFs)
        const blankUicr = new MemoryMap([[
            uicrAddr,
            (new Uint8Array(uicrSize)).fill(0xFF),
        ]]);
        if (targetMemMap.contains(blankUicr)) {
            isWritable = true;
            dispatch(targetActions.targetWritableKnownAction(isWritable));
            return;
        }
        const flattenedFiles = MemoryMap.flattenOverlaps(
            MemoryMap.overlapMemoryMaps(fileMemMaps),
        );
        const uicrUpdates = flattenedFiles.slice(uicrAddr, uicrSize);

        if (!targetMemMap.contains(uicrUpdates)) {
            // UICR is different, and must be erased first.
            // This will also fail if the target's UICR hasn't been (or cannot be) read.
            isWritable = false;
            dispatch(targetActions.targetWritableKnownAction(isWritable));
        }
    };
}

// Update infos of the target regions
export function updateTargetRegions(regionsInput, memMap, deviceInfo) {
    return dispatch => {
        const targetDevice = {
            filename: 'targetDevice',
            colour: '#C0C0C0',
            writtenAddress: 0,
        };
        const memMaps = [['targetDevice', memMap]];
        const loadedDevice = { targetDevice };
        const regions = getTargetRegions(memMaps, loadedDevice, deviceInfo);

        dispatch(targetActions.targetRegionsKnownAction(regions));
        dispatch(fileActions.updateFileAppRegions());
    };
}

// Display some information about a devkit. Called on a devkit connection.
// This also triggers reading the whole memory contents of the device.
export function loadDeviceInfo(serialNumberInput, fullRead = false, eraseAndWrite = false) {
    return async (dispatch, getState) => {
        dispatch(warningActions.warningRemoveAction());
        dispatch(targetActions.targetTypeKnownAction(CommunicationType.JLINK, true));
        logger.info('Using nrfjprog to communicate with target');

        const serialNumber = parseInt(serialNumberInput, 10);
        let info;
        try {
            info = await getDeviceInfo(serialNumber);
        } catch (error) {
            logger.error(`Could not fetch memory size of target devkit: ${error.message}`);
            return;
        }

        const deviceInfo = getDeviceInfoByJprog(info);
        dispatch(targetActions.targetInfoKnownAction(deviceInfo));

        let memMap = new MemoryMap();
        let isMemLoaded = false;

        const readAll = !eraseAndWrite && (fullRead || getState().app.settings.autoRead);
        try {
            memMap = await getDeviceMemMap(serialNumber, info, readAll);
            isMemLoaded = readAll;
        } catch (error) {
            logger.debug(`getDeviceMemMap: ${error.message}`);
            return;
        }

        const regions = getMemoryRegions(memMap, deviceInfo);
        dispatch(targetActions.targetContentsKnownAction(memMap, isMemLoaded));
        dispatch(updateTargetRegions(regions, memMap, deviceInfo));
        dispatch(targetActions.updateTargetWritable());
    };
}

// Reload device info
export function refreshTargetContents() {
    return async (dispatch, getState) => {
        const serialNumber = parseInt(getState().app.target.serialNumber, 10);
        await dispatch(loadDeviceInfo(serialNumber, true));
    };
}

// Sends a .hex string to jprog.program()
function writeHex(serialNumber, hexString) {
    return async dispatch => {
        nrfjprog.program(serialNumber, hexString, {
            inputFormat: nrfjprog.INPUT_FORMAT_HEX_STRING,
            chip_erase_mode: nrfjprog.ERASE_PAGES,
        }, progress => {
            logger.info(progress.process);
        }, err => {
            if (err) {
                err.log.split('\n').forEach(line => logger.error(line));
                return;
            }
            logger.info('Write procedure finished');
            dispatch(loadDeviceInfo(serialNumber))
                .then(() => dispatch(targetActions.writeProgressFinishedAction()));
        });
    };
}

// Calls nrfprog.recover().
export function recover(eraseAndWrite = false) {
    return (dispatch, getState) => new Promise((resolve, reject) => {
        const appState = getState().app;
        const serialNumber = parseInt(appState.target.serialNumber, 10);

        dispatch(targetActions.writeProgressStartAction());
        if (!serialNumber) {
            logger.error('Select a device before recovering');
            reject();
            return;
        }

        nrfjprog.recover(serialNumber, progress => {
            logger.info(progress.process);
        }, err => {
            if (err) {
                err.log.split('\n').forEach(logger.error);
                reject();
                return;
            }
            logger.info('Recovery procedure finished');
            dispatch(loadDeviceInfo(serialNumber, false, eraseAndWrite))
                .then(() => dispatch(targetActions.writeProgressFinishedAction()))
                .then(() => resolve());
        });
    });
}

// Does some sanity checks, joins the loaded .hex files, flattens overlaps,
// paginates the result to fit flash pages, and calls writeHex()
export function write() {
    return async (dispatch, getState) => {
        logger.info('Writing procedure starts');
        const appState = getState().app;
        const serialNumber = parseInt(appState.target.serialNumber, 10);
        const { pageSize, uicrBaseAddr, uicrSize } = appState.target.deviceInfo;

        if (!serialNumber || !pageSize) {
            logger.error('Select a device before writing');
            return undefined;
        }

        // Sanity check. Should never happen, as any write operations should be already
        // disabled in the UI.
        if (!canWrite(appState.target.memMap, appState.file.memMaps)) {
            logger.error('Can not write in the current state. Try erasing all non-volatile memory in the target.');
            return undefined;
        }

        // FIXME: Check if the target's UICR is blank. If not, slice the flattened
        // hex files so that the code doesn't try to overwrite UICR.
        // This is part of the «UICR can only be written to after an "erase all"» logic
        return fileActions.checkUpToDateFiles(dispatch, getState).then(() => {
            let pages = MemoryMap.flattenOverlaps(
                MemoryMap.overlapMemoryMaps(appState.file.memMaps),
            ).paginate(pageSize);

            // Check if target's UICR is already erased (all 0xFFs)
            const blankUicr = new MemoryMap([[
                uicrBaseAddr,
                (new Uint8Array(uicrSize)).fill(0xFF),
            ]]);
            if (!appState.target.memMap.contains(blankUicr)) {
                // Because canWrite() has been run,
                // we can be sure that the UICR in the flattened
                // hex files is the same as the non-blank UICR of the target.
                logger.info('Target\'s UICR is not blank, skipping UICR updates.');
                pages = pages.slice(0, uicrBaseAddr);
            }
            dispatch(targetActions.writeProgressStartAction());
            dispatch(writeHex(serialNumber, pages.asHexString(64)));
        }).catch(() => {});
    };
}

// Erase all on device and write file to it.
export function recoverAndWrite() {
    return dispatch => dispatch(recover(true))
        .then(() => dispatch(write()));
}
