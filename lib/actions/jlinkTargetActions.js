/* Copyright (c) 2015 - 2021, Nordic Semiconductor ASA
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

import { remote } from 'electron';
import fs from 'fs';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import MemoryMap from 'nrf-intel-hex';
import { logger } from 'pc-nrfconnect-shared';

import {
    addCoreToDeviceInfo,
    CommunicationType,
    context,
    getDeviceFromNrfdl,
    getDeviceInfoByJlink,
} from '../util/devices';
import sequence from '../util/promise';
import { getTargetRegions } from '../util/regions';
import * as fileActions from './fileActions';
import { modemKnownAction } from './modemTargetActions';
import * as targetActions from './targetActions';
import * as warningActions from './warningActions';

// const ERROR_CODE_NOT_AVAILABLE_BECAUSE_PROTECTION = -90; // 0xFFFFFFA6
// const ERROR_CODE_COULD_NOT_RESET_DEVICE = 0x5;

// nrf-device-lib returns serial numbers padded with zeros
// and without a colon at the end, so we need to change ours
// to that format (at least until the device lister is replaced).
export const formatSerialNumber = serialNumber => {
    serialNumber =
        typeof serialNumber === 'number'
            ? serialNumber.toString()
            : serialNumber;

    return `000${serialNumber.substring(0, 9)}`;
};

// Display some information about a DevKit. Called on a DevKit connection.
// This also triggers reading the whole memory contents of the device.
export const loadDeviceInfo = (
    serialNumber,
    fullRead = false,
    eraseAndWrite = false
) => async (dispatch, getState) => {
    dispatch(targetActions.loadingStartAction());
    dispatch(warningActions.targetWarningRemoveAction());
    dispatch(
        targetActions.targetTypeKnownAction(CommunicationType.JLINK, true)
    );
    logger.info(
        'Using @nordicsemiconductor/nrf-device-lib-js to communicate with target throught JLink'
    );

    const device = await getDeviceFromNrfdl(serialNumber);
    logDeviceInfo(device);
    let deviceInfo = getDeviceInfoByJlink(device);

    // Update modem target info according to detected device info
    dispatch(modemKnownAction(device.jlink.device_family.includes('NRF91')));

    // By default readback protection is none
    let protectionStatus = nrfdl.NRFDL_PROTECTION_STATUS_NONE;

    try {
        protectionStatus = (
            await nrfdl.deviceControlGetProtectionStatus(context, device.id)
        ).protection_status;
    } catch (error) {
        logger.error('Error while getting readback protection');
        dispatch(targetActions.loadingEndAction());
        return;
    }

    let coreName = 'Application';

    let deviceCoreInfo = await nrfdl.getDeviceCoreInfo(context, device.id);
    deviceCoreInfo = { ...deviceCoreInfo, protectionStatus };
    deviceInfo = addCoreToDeviceInfo(deviceInfo, deviceCoreInfo, coreName);
    const isFamilyNrf53 = device.jlink.device_family.includes('NRF53');

    // Since nRF53 family is dual core devices
    // It needs an additional check for readback protection on network core
    if (isFamilyNrf53) {
        coreName = 'Network';
        const coreNameConstant = 'NRFDL_DEVICE_CORE_NETWORK';
        deviceCoreInfo = await nrfdl.getDeviceCoreInfo(
            context,
            device.id,
            'NRFDL_DEVICE_CORE_NETWORK'
        );
        try {
            protectionStatus = (
                await nrfdl.deviceControlGetProtectionStatus(
                    context,
                    device.id,
                    coreNameConstant
                )
            ).protection_status;
        } catch (error) {
            logger.error(
                'Failed to get readback protection status on network core'
            );
            dispatch(targetActions.loadingEndAction());
            return;
        }
        deviceCoreInfo = { ...deviceCoreInfo, protectionStatus };
        deviceInfo = addCoreToDeviceInfo(deviceInfo, deviceCoreInfo, coreName);
    }
    dispatch(targetActions.targetInfoKnownAction(deviceInfo));

    // Read from the device
    if (
        deviceInfo.cores.find(
            c => c.protectionStatus !== nrfdl.NRFDL_PROTECTION_STATUS_NONE
        )
    ) {
        logger.info(
            'Skipped reading, since at least one core has app readback protection'
        );
    } else {
        let memMap;
        let mergedMemMap = new MemoryMap();
        let isMemLoaded = false;
        const readAll =
            !eraseAndWrite && (fullRead || getState().app.settings.autoRead);
        try {
            memMap = await sequence(
                getDeviceMemMap,
                [],
                deviceInfo.cores.map(c => [device.id, c, readAll])
            );
            mergedMemMap = MemoryMap.flattenOverlaps(
                MemoryMap.overlapMemoryMaps(
                    memMap.filter(m => m).map(m => ['', m])
                )
            );
            isMemLoaded = readAll;
        } catch (error) {
            logger.error(`getDeviceMemMap: ${error.message}`);
            return;
        }
        dispatch(
            targetActions.targetContentsKnownAction(mergedMemMap, isMemLoaded)
        );
        dispatch(updateTargetRegions(mergedMemMap, deviceInfo));
    }

    dispatch(targetActions.updateTargetWritable());
    dispatch(targetActions.loadingEndAction());
};

const logDeviceInfo = device => {
    const {
        jlink_ob_firmware_version: jlinkOBFwVersion,
        device_family: deviceFamily,
        device_version: deviceVersion,
        board_version: boardVersion,
    } = device.jlink;
    logger.info('JLink OB firmware version', jlinkOBFwVersion);
    logger.info('Device family', deviceFamily);
    logger.info('Device version', deviceVersion);
    logger.info('Board version', boardVersion);
};

// Get device memory map by calling nrf-device-lib and reading the entire non-volatile memory
// const getDeviceMemMap = async (serialNumber, coreInfo, fullRead = true) => {
const getDeviceMemMap = async (deviceId, coreInfo, readAll = true) => {
    if (!readAll) return undefined;
    const result = await new Promise(resolve => {
        nrfdl.firmwareRead(
            context,
            deviceId,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_INTEL_HEX',
            data => {
                let memMap = MemoryMap.fromHex(data.data);
                const paddedArray = memMap.slicePad(
                    0,
                    coreInfo.romBaseAddr + coreInfo.romSize
                );
                memMap = MemoryMap.fromPaddedUint8Array(paddedArray);
                resolve(memMap);
            },
            () => {},
            null,
            null,
            coreInfo.name === 'Network'
                ? 'NRFDL_DEVICE_CORE_NETWORK'
                : 'NRFDL_DEVICE_CORE_APPLICATION'
        );
    });
    return result;
};

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
    const { isErased, isMemLoaded } = appState.target;
    const { isMcuboot } = appState.mcuboot;
    const { memMaps: fileMemMaps, mcubootFilePath } = appState.file;

    // If MCU is enabled and MCU firmware is detected
    if (isMcuboot && mcubootFilePath) {
        dispatch(targetActions.targetWritableKnownAction(true));
        return;
    }

    // If the device has been erased or the memory has been loaded and firmware is selected
    if ((!isErased && !isMemLoaded) || !fileMemMaps.length) {
        dispatch(targetActions.targetWritableKnownAction(false));
        return;
    }
    dispatch(targetActions.targetWritableKnownAction(true));
};

// Update infos of the target regions
const updateTargetRegions = (memMap, deviceInfo) => dispatch => {
    const memMaps = [['', memMap]];
    const regions = getTargetRegions(memMaps, deviceInfo);

    dispatch(targetActions.targetRegionsKnownAction(regions));
    dispatch(fileActions.updateFileRegions());
};

// Read device flash memory
export const read = () => async (dispatch, getState) => {
    dispatch(targetActions.loadingStartAction());
    const { serialNumber } = getState().app.target;
    await dispatch(loadDeviceInfo(serialNumber, true));
};

// Call nrfprog.recover() to recover one core
export const recoverOneCore = (deviceId, coreInfo) => async dispatch => {
    dispatch(targetActions.erasingStartAction());

    if (!deviceId) {
        logger.error('Select a device before recovering');
        return;
    }

    logger.info('Recovering device using @nordicsemiconductor/nrf-device-lib-js');

    try {
        await nrfdl.firmwareErase(
            context,
            deviceId,
            coreInfo.name === 'Network'
                ? 'NRFDL_DEVICE_CORE_NETWORK'
                : 'NRFDL_DEVICE_CORE_APPLICATION'
        );
        return;
    } catch (e) {
        logger.error(e);
    }
};

// Recover all cores one by one
export const recover = willEraseAndWrite => async (dispatch, getState) => {
    const {
        serialNumber,
        deviceInfo: { cores },
    } = getState().app.target;
    const { id: deviceId } = await getDeviceFromNrfdl(
        formatSerialNumber(parseInt(serialNumber, 10))
    );
    const results = [];
    const argsArray = cores.map(c => [deviceId, c]);
    await sequence(
        (...args) => {
            return dispatch(recoverOneCore(...args));
        },
        results,
        argsArray
    );
    dispatch(loadDeviceInfo(serialNumber, false, willEraseAndWrite));
    dispatch(targetActions.erasingEndAction());
    logger.info('Device recovery completed.');
};

// Sends a HEX string to jprog.program()
const writeHex = async (serialNumber, coreInfo, hexFileString) => {
    logger.info('Writing hex file with @nordicsemiconductor/nrf-device-lib-js.');

    const { id: deviceId } = await getDeviceFromNrfdl(
        formatSerialNumber(serialNumber)
    );

    nrfdl.firmwareProgram(
        context,
        deviceId,
        'NRFDL_FW_BUFFER',
        'NRFDL_FW_INTEL_HEX',
        Buffer.from(hexFileString, 'utf8'),
        err => {
            if (err)
                logger.error(`Device programming failed with error: ${err}`);
            logger.info('Device programming completed.');
        },
        ({ progressJson: progress }) => {
            const status = `${progress.message.replace('.', ':')} ${
                progress.progress_percentage
            }%`;
            logger.info(status);
        },
        null,
        coreInfo.name === 'Network'
            ? 'NRFDL_DEVICE_CORE_NETWORK'
            : 'NRFDL_DEVICE_CORE_APPLICATION'
    );
};

export const writeOneCore = core => async (dispatch, getState) => {
    logger.info(`Writing procedure starts for core${core.coreNumber}`);
    dispatch(targetActions.writingStartAction());
    const {
        target: { serialNumber },
        file: { memMaps },
    } = getState().app;
    const { pageSize, uicrBaseAddr } = core;
    const serialNumberWithCore = `${parseInt(serialNumber, 10)}:${
        core.coreNumber
    }`;

    if (!serialNumberWithCore || !pageSize) {
        logger.error('Select a device before writing');
        return undefined;
    }

    // Parse input files and filter program regions with core start address and size
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    overlaps.forEach((overlap, key) => {
        const overlapStartAddr = key;
        const overlapSize = overlap[0][1].length;

        const isInCore =
            overlapStartAddr >= core.romBaseAddr &&
            overlapStartAddr + overlapSize <= core.romBaseAddr + core.romSize;
        const isUicr =
            overlapStartAddr >= core.uicrBaseAddr &&
            overlapStartAddr + overlapSize <= core.uicrBaseAddr + core.pageSize;
        if (!isInCore && !isUicr) {
            overlaps.delete(key);
        }
    });
    if (overlaps.size <= 0) {
        return undefined;
    }
    const programRegions = MemoryMap.flattenOverlaps(overlaps).paginate(
        pageSize
    );

    await writeHex(serialNumberWithCore, core, programRegions.asHexString());

    return undefined;
};

// Does some sanity checks, joins the loaded HEX files, flattens overlaps,
// paginates the result to fit flash pages, and calls writeHex()
export const write = () => async (dispatch, getState) => {
    const {
        serialNumber,
        deviceInfo: { cores },
    } = getState().app.target;
    const results = [];
    const argsArray = cores.map(c => [c]);
    return sequence(
        (...args) => dispatch(writeOneCore(...args)),
        results,
        argsArray
    ).then(async () => {
        await dispatch(loadDeviceInfo(serialNumber));
        dispatch(targetActions.writingEndAction());
        dispatch(targetActions.updateTargetWritable());
    });
};

// Erase all on device and write file to it.
export const recoverAndWrite = () => dispatch =>
    dispatch(recover(true)).then(() => dispatch(write()));

// Save the content from the device memory as hex file.
export const saveAsFile = () => getState => {
    const { memMap, deviceInfo } = getState().app.target;
    const maxAddress = Math.max(
        ...deviceInfo.cores.map(c => c.romBaseAddr + c.romSize)
    );

    const options = {
        title: 'Save memory as file',
        defaultPath: `nRF_Connect_Programmer_${Date.now()}.hex`,
    };

    const save = ({ filePath }) => {
        if (filePath) {
            fs.writeFile(
                filePath,
                memMap.slice(0, maxAddress).asHexString(),
                err => {
                    if (err) {
                        logger.error(
                            `Error when saving file: ${err.message || err}`
                        );
                    }
                    logger.info(`File is successfully saved at ${filePath}`);
                }
            );
        }
    };
    remote.dialog.showSaveDialog(options).then(save);
};
