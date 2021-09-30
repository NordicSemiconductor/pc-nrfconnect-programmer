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

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import { remote } from 'electron';
import { getDeviceLibContext, logger } from 'pc-nrfconnect-shared';

import {
    MODEM_DFU_STARTING,
    modemProcessUpdate,
    modemWritingClose,
    modemWritingFail,
    modemWritingReady,
    modemWritingStart,
    modemWritingSucceed,
} from '../reducers/modemReducer';
import { RootState, TDispatch } from '../reducers/types';

export const selectModemFirmware = () => (dispatch: TDispatch) => {
    const dialogOptions: Electron.OpenDialogOptions = {
        title: 'Select a modem firmware zip file',
        filters: [{ name: 'Modem firmware zip file', extensions: ['zip'] }],
        properties: ['openFile'],
    };
    remote.dialog.showOpenDialog(dialogOptions).then(({ filePaths }) => {
        if (filePaths && filePaths.length > 0) {
            dispatch(modemWritingReady(filePaths[0]));
        }
    });
};

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(modemWritingClose());
};

export function programDfuModem(fileName: string) {
    return async (dispatch: TDispatch, getState: () => RootState) => {
        const { device } = getState().app.target;
        if (!device) throw new Error('Device not found when updating modem');

        const successCallback = () => {
            logger.info('Modem DFU completed successfully!');
            dispatch(modemWritingSucceed());
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorCallback = (err: any) => {
            if (err) {
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
                dispatch(modemWritingFail(errorMsg));
            }
        };

        const progressCallback = ({
            progressJson: progress,
        }: nrfdl.Progress.CallbackParameters) => {
            // TODO: Fix type in nrfdl
            const message = `${progress.operation} ${progress.progressPercentage}%`;
            dispatch(modemProcessUpdate({ message }));
        };

        try {
            nrfdl.firmwareProgram(
                getDeviceLibContext(),
                device.id,
                'NRFDL_FW_FILE',
                'NRFDL_FW_NRF91_MODEM',
                fileName,
                successCallback,
                progressCallback
            );
        } catch (e) {
            errorCallback(e);
        }
    };
}

export const performMcuUpdate = (fileName: string) => (dispatch: TDispatch) => {
    dispatch(programDfuModem(fileName));
};

export const performUpdate =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(modemWritingStart());
        dispatch(modemProcessUpdate({ message: MODEM_DFU_STARTING }));

        const { modemFwName: fileName } = getState().app.modem;
        const { serialNumber } = getState().app.target;

        if (!serialNumber) {
            logger.error(
                'Modem DFU does not start due to missing serialNumber'
            );
            return;
        }
        logger.info('Modem DFU starts to write...');
        logger.info(`Writing ${fileName} to device ${serialNumber || ''}`);

        if (getState().app.mcuboot.isMcuboot) {
            dispatch(performMcuUpdate(fileName));
        } else {
            dispatch(programDfuModem(fileName));
        }
    };
