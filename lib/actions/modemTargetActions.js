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

import { remote } from 'electron';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import { logger } from 'nrfconnect/core';

import { context, getDeviceFromNrfdl } from '../util/devices';

export const MODEM_KNOWN = 'MODEM_KNOWN';
export const MODEM_PROCESS_UPDATE = 'MODEM_PROCESS_UPDATE';
export const MODEM_WRITING_CLOSE = 'MODEM_WRITING_CLOSE';
export const MODEM_WRITING_END = 'MODEM_WRITING_END';
export const MODEM_WRITING_FAIL = 'MODEM_WRITING_FAIL';
export const MODEM_WRITING_READY = 'MODEM_WRITING_READY';
export const MODEM_WRITING_START = 'MODEM_WRITING_START';
export const MODEM_WRITING_SUCCEED = 'MODEM_WRITING_SUCCEED';

export const MODEM_DFU_NOT_STARTED = 'Not started.';
export const MODEM_DFU_STARTING = 'Starting...';

export const modemKnownAction = isModem => ({
    type: MODEM_KNOWN,
    isModem,
});

export const processUpdateAction = (
    message,
    percentage = 0,
    duration = 0,
    step = 0
) => ({
    type: MODEM_PROCESS_UPDATE,
    message,
    percentage,
    duration,
    step,
});

export const writingReadyAction = fileName => ({
    type: MODEM_WRITING_READY,
    fileName,
});

export const writingCloseAction = () => ({
    type: MODEM_WRITING_CLOSE,
});

export const writingStartAction = () => ({
    type: MODEM_WRITING_START,
});

export const writingSucceedAction = () => ({
    type: MODEM_WRITING_SUCCEED,
});

export const writingFailAction = errorMsg => ({
    type: MODEM_WRITING_FAIL,
    errorMsg,
});

export const selectModemFirmware = () => dispatch => {
    const dialogOptions = {
        title: 'Select a modem firmware zip file',
        filters: [{ name: 'Modem firmware zip file', extensions: ['zip'] }],
        properties: ['openFile'],
    };
    remote.dialog.showOpenDialog(dialogOptions).then(({ filePaths }) => {
        if (filePaths && filePaths.length > 0) {
            dispatch(writingReadyAction(filePaths[0]));
        }
    });
};

export const cancelUpdate = () => dispatch => {
    dispatch(writingCloseAction());
};

export function programDfuModem(serialNumber, fileName) {
    return async dispatch => {
        const successCallback = () => {
            logger.info('Modem DFU completed successfully!');
            dispatch(writingSucceedAction());
        };

        const errorCallback = err => {
            if (err) {
                console.error(err);
                logger.error(`Modem DFU failed with error: ${err}`);
                let errorMsg = err.message || err;
                if (err.message.includes('0x4')) {
                    errorMsg =
                        'Failed with internal error. ' +
                        'Please click Erase all button and try updating modem again.';
                }
                // Program without setting device in MCUboot mode will throw such an error:
                // Errorcode: CouldNotCallFunction (0x9)
                // Lowlevel error: Unknown value (ffffff24)
                if (errorMsg.includes('0x9')) {
                    errorMsg =
                        'Please make sure that the device is in MCUboot mode and try again.';
                }
                dispatch(writingFailAction(errorMsg));
            }
        };

        const progressCallback = ({ progressJson: progress }) => {
            console.log(progress);
            const message = `${progress.operation} (${progress.progress_percentage})`;
            dispatch(processUpdateAction(message));
        };

        try {
            const device = await getDeviceFromNrfdl(serialNumber);
            console.log(device);
            nrfdl.firmwareProgram(
                context,
                device.id,
                'NRFDL_FW_FILE',
                'NRFDL_FW_NRF91_MODEM',
                fileName,
                successCallback,
                console.log
            );
        } catch (e) {
            errorCallback(e);
        }
    };
}

export const performMcuUpdate = fileName => (dispatch, getState) => {
    const { serialNumber } = getState().app.target;
    dispatch(programDfuModem(serialNumber, fileName));
};

export const performUpdate = () => (dispatch, getState) => {
    dispatch(writingStartAction());
    dispatch(processUpdateAction(MODEM_DFU_STARTING));
    logger.info('Modem DFU starts to write...');

    const { modemFwName: fileName } = getState().app.modem;
    const serialNumber = Number(getState().app.target.serialNumber);
    logger.info(`Writing ${fileName} to device ${serialNumber || ''}`);

    if (getState().app.mcuboot.isMcuboot) {
        dispatch(performMcuUpdate(fileName));
    } else {
        dispatch(programDfuModem(`000${serialNumber}`, fileName));
    }
};
