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

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import { logger } from 'nrfconnect/core';

import {
    CommunicationType,
    context,
    getDeviceFromNrfdl,
} from '../util/devices';
import portPath from '../util/portPath';
import { modemKnownAction } from './modemTargetActions';
import * as targetActions from './targetActions';
import * as warningActions from './warningActions';

export const MCUBOOT_KNOWN = 'MCUBOOT_KNOWN';
export const MCUBOOT_PORT_KNOWN = 'MCUBOOT_PORT_KNOWN';
export const MCUBOOT_PROCESS_UPDATE = 'MCUBOOT_PROCESS_UPDATE';
export const MCUBOOT_WRITING_CLOSE = 'MCUBOOT_WRITING_CLOSE';
export const MCUBOOT_WRITING_END = 'MCUBOOT_WRITING_END';
export const MCUBOOT_WRITING_FAIL = 'MCUBOOT_WRITING_FAIL';
export const MCUBOOT_WRITING_READY = 'MCUBOOT_WRITING_READY';
export const MCUBOOT_WRITING_START = 'MCUBOOT_WRITING_START';
export const MCUBOOT_WRITING_SUCCEED = 'MCUBOOT_WRITING_SUCCEED';
export const MCUBOOT_FIRMWARE_VALID = 'MCUBOOT_FIRMWARE_VALID';

export const MCUBOOT_DFU_NOT_STARTED = 'Not started.';
export const MCUBOOT_DFU_STARTING = 'Starting...';

export const mcubootKnownAction = isMcuboot => ({
    type: MCUBOOT_KNOWN,
    isMcuboot,
});

export const portKnownAction = (port, port2 = null) => ({
    type: MCUBOOT_PORT_KNOWN,
    port,
    port2,
});

export const processUpdateAction = (message, percentage, duration) => ({
    type: MCUBOOT_PROCESS_UPDATE,
    message,
    percentage,
    duration,
});

export const writingReadyAction = fileName => ({
    type: MCUBOOT_WRITING_READY,
    fileName,
});

export const writingCloseAction = () => ({
    type: MCUBOOT_WRITING_CLOSE,
});

export const writingStartAction = () => ({
    type: MCUBOOT_WRITING_START,
});

export const writingEndAction = () => ({
    type: MCUBOOT_WRITING_END,
});

export const writingSucceedAction = () => ({
    type: MCUBOOT_WRITING_SUCCEED,
});

export const writingFailAction = errorMsg => ({
    type: MCUBOOT_WRITING_FAIL,
    errorMsg,
});

export const isFirmwareValid = isValid => ({
    type: MCUBOOT_FIRMWARE_VALID,
    isValid,
});

export const pickSerialPort = serialports => {
    if (!serialports) {
        return undefined;
    }

    const platform = process.platform.slice(0, 3);
    switch (platform) {
        case 'win':
            return serialports.find(s => /MI_00/.test(s.pnpId));
        case 'lin':
            return serialports.find(s => /-if00$/.test(s.pnpId));
        case 'dar':
            return serialports.find(s => /1$/.test(portPath(s)));
        default:
    }

    return undefined;
};

export const pickSerialPort2 = serialports => {
    const platform = process.platform.slice(0, 3);

    switch (platform) {
        case 'win':
            return serialports.find(s => /MI_0[23]/.test(s.pnpId));
        case 'lin':
            return serialports.find(s => /-if0[23]$/.test(s.pnpId));
        case 'dar':
            return serialports.find(s => /[34]$/.test(portPath(s)));
        default:
    }

    return {};
};

export const openDevice = selectedDevice => dispatch => {
    const serialports = Object.keys(selectedDevice)
        .filter(s => s.startsWith('serialport'))
        .map(s => selectedDevice[s]);
    dispatch(
        targetActions.targetTypeKnownAction(CommunicationType.MCUBOOT, false)
    );
    dispatch(mcubootKnownAction(true));
    dispatch(modemKnownAction(true));
    dispatch(
        portKnownAction(
            portPath(pickSerialPort(serialports)),
            portPath(pickSerialPort2(serialports))
        )
    );
    dispatch(targetActions.updateTargetWritable());
    dispatch(targetActions.loadingEndAction());
};

export const toggleMcuboot = () => (dispatch, getState) => {
    const { port } = getState().app.target;
    const { isMcuboot } = getState().app.mcuboot;

    if (isMcuboot) {
        dispatch(mcubootKnownAction(false));
        dispatch(portKnownAction(null));
    } else {
        dispatch(mcubootKnownAction(true));
        dispatch(portKnownAction(port));
    }

    dispatch(targetActions.updateTargetWritable());
};

export const prepareUpdate = () => (dispatch, getState) => {
    const filesLoaded = getState().app.file.loaded;
    const fileName = Object.keys(filesLoaded)[0];
    dispatch(writingReadyAction(fileName));
};

export const canWrite = () => (dispatch, getState) => {
    // Disable write button
    dispatch(targetActions.targetWritableKnownAction(false));
    dispatch(warningActions.targetWarningRemoveAction());

    // Check if mcu firmware is detected.
    // If not, then return.
    const { mcubootFilePath, regions } = getState().app.file;
    if (!mcubootFilePath) {
        return;
    }

    // Check if target is MCU target.
    // If not, then return.
    const { isMcuboot } = getState().app.mcuboot;
    if (!isMcuboot) {
        return;
    }

    // Check if region starting at 0x0 is detected for Thingy91
    if (regions.find(r => r.startAddress === 0)) {
        dispatch(isFirmwareValid(false));
    } else {
        dispatch(isFirmwareValid(true));
    }

    // Enable write button if all above items have been checked
    dispatch(warningActions.targetWarningRemoveAction());
    dispatch(targetActions.targetWritableKnownAction(true));
};

export const performUpdate = () => async (dispatch, getState) => {
    const { mcubootFilePath } = getState().app.file;
    const { serialNumber } = getState().app.target;

    logger.info(`Writing ${mcubootFilePath} to device ${serialNumber || ''}`);

    const progressCallback = ({ progressJson: progress }) => {
        let dfuProcess;
        try {
            dfuProcess = JSON.parse(progress.process);
        } catch (e) {
            dispatch(
                processUpdateAction(
                    progress.process,
                    totalPercentage,
                    totalDuration
                )
            );
            return;
        }

        if (dfuProcess && dfuProcess.operation === 'upload_image') {
            totalPercentage = dfuProcess.progress_percentage;
            totalDuration = dfuProcess.duration;

            progressMsg = dfuProcess.message || progressMsg;
            dispatch(
                processUpdateAction(progressMsg, totalPercentage, totalDuration)
            );
        }
    };

    const errorCallback = error => {
        if (error) {
            let errorMsg = error.message || error;

            // Program without setting device in MCUboot mode will throw such an error:
            // Errorcode: CouldNotCallFunction (0x9)
            // Lowlevel error: Unknown value (ffffff24)
            if (errorMsg.includes('0x9')) {
                errorMsg =
                    'Please make sure that the device is in MCUboot mode and try again.';
            }

            logger.error(`MCUboot DFU failed. ${errorMsg}`);
            dispatch(writingFailAction(errorMsg));
            return;
        }

        dispatch(writingSucceedAction());
    };

    const completeCallback = () => {
        dispatch(writingSucceedAction());
    };

    dispatch(writingStartAction());

    try {
        const device = await getDeviceFromNrfdl(serialNumber);
        console.log(device);
        nrfdl.firmwareProgram(
            context,
            device.id,
            'NRFDL_FW_FILE',
            'NRFDL_FW_MCUBOOT',
            mcubootFilePath,
            completeCallback,
            progressCallback
        );
    } catch (e) {
        errorCallback(e);
    }

    dispatch(targetActions.updateTargetWritable());
};

export const cancelUpdate = () => dispatch => {
    dispatch(writingCloseAction());
};
