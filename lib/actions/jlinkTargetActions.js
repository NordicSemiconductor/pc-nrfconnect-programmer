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

import fs from 'fs';

import { remote } from 'electron';
import MemoryMap from 'nrf-intel-hex';
import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';

import {
    CommunicationType,
    addCoreToDeviceInfo,
    getDeviceInfoByJprog,
    getDeviceModel,
} from '../util/devices';
import { sequence } from '../util/promise';
import { getTargetRegions } from '../util/regions';
import * as fileActions from './fileActions';
import { modemKnownAction } from './modemTargetActions';
import * as targetActions from './targetActions';
import * as warningActions from './warningActions';

const getJLinkVersion = serialNumber => new Promise((resolve, reject) => {
    nrfjprog.getLibraryInfo(serialNumber, (err, info) => (
        err ? reject(new Error(err)) : resolve(info.version)
    ));
});

// Get device infos by calling nrfjprog
const getDeviceInfo = serialNumber => new Promise((resolve, reject) => {
    nrfjprog.open(serialNumber, openError => {
        if (openError) {
            return reject(new Error(openError));
        }

        nrfjprog.getProbeInfo(serialNumber, (probeInfoError, probeInfo) => {
            if (probeInfoError) {
                return reject(new Error(probeInfoError));
            }
            logger.info('Segger serial: ', probeInfo.serialNumber);
            logger.info('Segger speed: ', probeInfo.clockSpeedkHz, ' kHz');
            logger.info('Segger version: ', probeInfo.firmwareString);

            nrfjprog.getDeviceInfo(serialNumber, (deviceInfoError, devInfo) => {
                if (deviceInfoError) {
                    return reject(new Error(deviceInfoError));
                }

                logger.info(`Core probed: ${serialNumber}.`);
                logger.info(`Core RAM: ${devInfo.ramSize / 1024}KiB.`);
                logger.info(`Core ROM: ${devInfo.codeSize / 1024}KiB in pages of ${devInfo.codePageSize / 1024}KiB.`);

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

// Get device memory map by calling nrfjprog and reading the entire non-volatile memory
const getDeviceMemMap = (
    serialNumber, coreInfo, fullRead = true,
) => new Promise((resolve, reject) => {
    nrfjprog.open(serialNumber, openError => {
        if (openError) {
            return reject(new Error(openError));
        }
        logger.info(`Core${coreInfo.coreNumber}: Reading device non-volatile memory. `
            + 'This may take a few seconds.');
        nrfjprog.read(
            serialNumber,
            coreInfo.uicrBaseAddr,
            coreInfo.uicrSize,
            (readError, uicrBytes) => {
                if (readError) {
                    logger.error(`Core${coreInfo.coreNumber}: `
                        + `Error while reading non-volatile memory: ${readError}`);
                    return reject(new Error(readError));
                }
                if (!fullRead) {
                    logger.info(`Core${coreInfo.coreNumber}: UICR has been read. `
                        + 'Click read button to read full non-volatile memory.');
                    return resolve(new MemoryMap([[
                        coreInfo.uicrBaseAddr,
                        new Uint8Array(uicrBytes),
                    ]]));
                }
                nrfjprog.read(
                    serialNumber,
                    coreInfo.romBaseAddr,
                    coreInfo.romSize,
                    (err1, flashBytes) => {
                        if (err1) {
                            return reject(new Error(err1));
                        }
                        const entireArray = new Uint8Array(
                            coreInfo.romBaseAddr + flashBytes.length,
                        ).fill(0xFF);
                        entireArray.set(flashBytes, coreInfo.romBaseAddr);
                        const memMap = MemoryMap.fromPaddedUint8Array(
                            entireArray, 0xFF, 256,
                        );
                        memMap.set(coreInfo.uicrBaseAddr, new Uint8Array(uicrBytes));
                        logger.info(`Core${coreInfo.coreNumber}: `
                            + 'Non-volatile memory has been read. '
                            + `${memMap.size} non-empty memory blocks identified `);
                        resolve(memMap);

                        return undefined;
                    },
                );
                return undefined;
            },
        );
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

// Check if the files can be written to the target device
// The typical use case is having some HEX files that use the UICR, and a DevKit
// that doesn't allow erasing the UICR page(s). Also, the (rare) cases where the
// nRF SoC has readback protection enabled (and the loaded HEX files write the
// readback-protected region).
// In all those cases, this function will return false, and the user should not be
// able to press the "program" button.
// There are also instances where the UICR can be erased and overwritten, but
// unfortunately the casuistics are just too complex.
export const canWrite = () => (dispatch, getState) => {
    // TODO: get the UICR address from the target definition. This value
    // works for nRF51s and nRF52s, but other targets might use a different one!!!
    const appState = getState().app;
    const {
        memMap: targetMemMap,
        deviceInfo,
        isMemLoaded,
    } = appState.target;
    const { isMcuboot } = appState.mcuboot;
    const {
        memMaps: fileMemMaps,
        mcubootFilePath,
    } = appState.file;

    // If MCU is enabled and MCF firmware is detected.
    if (isMcuboot && mcubootFilePath) {
        dispatch(targetActions.targetWritableKnownAction(true));
        return;
    }

    // If it is not a full read, then it need to be earsed first.
    if (!isMemLoaded || !fileMemMaps.length) {
        dispatch(targetActions.targetWritableKnownAction(false));
        return;
    }
    dispatch(targetActions.targetWritableKnownAction(true));

    // Check if target's UICR is already erased (all 0xFFs)
    deviceInfo.cores.forEach(core => {
        const {
            uicrBaseAddr: uicrAddr,
            uicrSize,
        } = core;
        const blankUicr = new MemoryMap([[
            uicrAddr,
            (new Uint8Array(uicrSize)).fill(0xFF),
        ]]);
        if (targetMemMap.contains(blankUicr)) {
            dispatch(targetActions.targetWritableKnownAction(true));
            return;
        }
        const flattenedFiles = MemoryMap.flattenOverlaps(
            MemoryMap.overlapMemoryMaps(fileMemMaps),
        );
        const uicrUpdates = flattenedFiles.slice(uicrAddr, uicrSize);
        if (!targetMemMap.contains(uicrUpdates)) {
            // UICR is different, and must be erased first.
            // This will also fail if the target's UICR hasn't been (or cannot be) read.
            dispatch(targetActions.targetWritableKnownAction(false));
        }
    });
};

// Update infos of the target regions
const updateTargetRegions = (memMap, deviceInfo) => dispatch => {
    const memMaps = [['', memMap]];
    const regions = getTargetRegions(memMaps, deviceInfo);

    dispatch(targetActions.targetRegionsKnownAction(regions));
    dispatch(fileActions.updateFileRegions());
};

// Display some information about a devkit. Called on a devkit connection.
// This also triggers reading the whole memory contents of the device.
export const loadDeviceInfo = (
    serialNumberInput,
    fullRead = false,
    eraseAndWrite = false,
) => async (dispatch, getState) => {
    dispatch(targetActions.loadingStartAction());
    dispatch(warningActions.targetWarningRemoveAction());
    dispatch(targetActions.targetTypeKnownAction(CommunicationType.JLINK, true));
    logger.info('Using nrfjprog to communicate with target');

    // Load lib info and device info
    const serialNumber = parseInt(serialNumberInput, 10);
    let info;
    try {
        const { major, minor } = await getJLinkVersion(serialNumber);
        logger.info(`Using J-Link Software version ${major}.${minor}`);
        info = await getDeviceInfo(serialNumber);
        logger.info(`Model: ${getDeviceModel(info.family, info.deviceType)}.`);
    } catch (error) {
        logger.error(`Could not fetch memory size of target devkit: ${error.message}`);
        dispatch(warningActions.addTargetWarning('For nRF9160 DK v0.8.8 there has been discovered '
            + 'an error that makes communication towards nrfjprog fail. '
            + 'As a temporary workaround please install the older nRF Connect for Desktop v3.3.0. '
            + 'It is not necessary to downgrade the Programmer app.'));
        return;
    }

    // Update target info according to detected device info
    dispatch(modemKnownAction(info.family === 91));

    let deviceInfo = getDeviceInfoByJprog(info);

    let coreName = 'Application';
    deviceInfo = addCoreToDeviceInfo(deviceInfo, info, coreName);
    if (info.family === 53) {
        const coreNumber = 1;
        coreName = 'Network';
        info = await getDeviceInfo(`${serialNumber}:${coreNumber}`);
        deviceInfo = addCoreToDeviceInfo(deviceInfo, info, coreName);
    }
    dispatch(targetActions.targetInfoKnownAction(deviceInfo));

    // Read from the device
    let memMap;
    let mergedMemMap = new MemoryMap();
    let isMemLoaded = false;
    const readAll = !eraseAndWrite && (fullRead || getState().app.settings.autoRead);
    try {
        memMap = await sequence(
            getDeviceMemMap,
            [],
            ...deviceInfo.cores.map((c, index) => (
                [`${serialNumber}:${index}`, c, readAll]
            )),
        );
        mergedMemMap = MemoryMap.flattenOverlaps(MemoryMap.overlapMemoryMaps(
            memMap.map(m => ['', m]),
        ));
        isMemLoaded = readAll;
    } catch (error) {
        logger.debug(`getDeviceMemMap: ${error.message}`);
        return;
    }

    dispatch(targetActions.targetContentsKnownAction(mergedMemMap, isMemLoaded));
    dispatch(updateTargetRegions(mergedMemMap, deviceInfo));
    dispatch(targetActions.updateTargetWritable());
    dispatch(targetActions.loadingEndAction());
};

// Read device flash memory
export const read = () => async (dispatch, getState) => {
    dispatch(targetActions.loadingStartAction());
    const serialNumber = parseInt(getState().app.target.serialNumber, 10);
    await dispatch(loadDeviceInfo(serialNumber, true));
};

// Call nrfprog.recover() to recover one core
export const recoverOneCore = (
    serialNumberWithCore,
    willEraseAndWrite,
) => dispatch => new Promise((resolve, reject) => {
    dispatch(targetActions.erasingStartAction());

    if (!serialNumberWithCore) {
        logger.error('Select a device before recovering');
        reject();
        return;
    }

    nrfjprog.recover(serialNumberWithCore, progress => {
        logger.info(progress.process);
    }, err => {
        if (err) {
            err.log.split('\n').forEach(logger.error);
            reject(new Error(err));
            return;
        }
        logger.info('Recovery procedure finished');
        dispatch(targetActions.erasingEndAction());
        dispatch(loadDeviceInfo(serialNumberWithCore, false, willEraseAndWrite))
            .then(resolve);
    });
});

// Recover all cores one by one
export const recover = willEraseAndWrite => async (dispatch, getState) => {
    const { serialNumber, deviceInfo: { cores } } = getState().app.target;
    const results = [];
    const argsArray = cores.map(c => ([
        `${parseInt(serialNumber, 10)}:${c.coreNumber}`,
        willEraseAndWrite,
    ]));
    return sequence(
        args => dispatch(recoverOneCore(args)),
        results,
        ...argsArray,
    );
};


// Sends a HEX string to jprog.program()
const writeHex = (serialNumber, hexString, opts) => new Promise((resolve, reject) => {
    nrfjprog.program(serialNumber, hexString, {
        inputFormat: nrfjprog.INPUT_FORMAT_HEX_STRING,
        chip_erase_mode: nrfjprog.ERASE_PAGES,
        ...opts,
    }, progress => {
        logger.info(`Writing progress: ${progress.process}`);
    }, err => {
        if (err) {
            err.log.split('\n').forEach(line => logger.error(line));
            return reject(err);
        }
        logger.info('Write procedure finished');
        return resolve();
    });
});

export const writeOneCore = core => async (dispatch, getState) => {
    logger.info(`Writing procedure starts for core${core.coreNumber}`);
    dispatch(targetActions.writingStartAction());
    const {
        target: { serialNumber, deviceInfo: { family } },
        file: { memMaps },
    } = getState().app;
    const { pageSize, uicrBaseAddr } = core;
    const serialNumberWithCore = `${parseInt(serialNumber, 10)}:${core.coreNumber}`;

    if (!serialNumberWithCore || !pageSize) {
        logger.error('Select a device before writing');
        return undefined;
    }

    // Parse input files and filter program regions with core start address and size
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    overlaps.forEach((overlap, key) => {
        const overlapStartAddr = key;
        const overlapSize = overlap[0][1].length;

        const isInCore = overlapStartAddr >= core.romBaseAddr
            && (overlapStartAddr + overlapSize) <= (core.romBaseAddr + core.romSize);
        const isUicr = overlapStartAddr >= core.uicrBaseAddr
            && (overlapStartAddr + overlapSize) <= (core.uicrBaseAddr + core.pageSize);
        if (!isInCore && !isUicr) {
            overlaps.delete(key);
        }
    });
    if (overlaps.size <= 0) {
        return undefined;
    }
    const programRegions = MemoryMap.flattenOverlaps(overlaps).paginate(pageSize);

    // In case the hex files include UICR, we need to erase that from the
    // device and avoid resetting, that will be done by pc-nrfjprog-js
    if ([...programRegions.keys()].find(addr => addr >= uicrBaseAddr) !== undefined) {
        const chipEraseMode = family === 'nRF51'
            ? nrfjprog.ERASE_PAGES
            : nrfjprog.ERASE_PAGES_INCLUDING_UICR;
        await writeHex(serialNumberWithCore, programRegions.asHexString(64), {
            chip_erase_mode: chipEraseMode,
            reset: false,
        });
    } else {
        await writeHex(serialNumberWithCore, programRegions.asHexString(64));
    }

    return undefined;
};

// Does some sanity checks, joins the loaded HEX files, flattens overlaps,
// paginates the result to fit flash pages, and calls writeHex()
export const write = () => async (dispatch, getState) => {
    const { serialNumber, deviceInfo: { cores } } = getState().app.target;
    const results = [];
    const argsArray = cores.map(c => ([c]));
    return sequence(
        args => dispatch(writeOneCore(args)),
        results,
        ...argsArray,
    ).then(async () => {
        await dispatch(loadDeviceInfo(serialNumber));
        dispatch(targetActions.writingEndAction());
        dispatch(targetActions.updateTargetWritable());
    });
};

// Erase all on device and write file to it.
export const recoverAndWrite = () => dispatch => dispatch(recover(true))
    .then(() => dispatch(write()));

// Save the content from the device momery as hex file.
export const saveAsFile = () => (dispatch, getState) => {
    const { memMap, deviceInfo } = getState().app.target;
    const maxAddress = Math.max(
        ...deviceInfo.cores.map(c => c.romBaseAddr + c.romSize),
    );

    const options = {
        title: 'Save memory as file',
        defaultPath: `nRF_Connect_Programmer_${Date.now()}.hex`,
    };

    const save = filePath => {
        if (filePath) {
            fs.writeFile(filePath, memMap.slice(0, maxAddress).asHexString(), err => {
                if (err) {
                    logger.error(`Error when saving file: ${err.message || err}`);
                }
                logger.info(`File is successfully saved at ${filePath}`);
            });
        }
    };
    remote.dialog.showSaveDialog(options, save);
};
