/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import nrfdl, { Device } from '@nordicsemiconductor/nrf-device-lib-js';
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
    const dialogOptions = {
        title: 'Select a modem firmware zip file',
        filters: [{ name: 'Modem firmware zip file', extensions: ['zip'] }],
        properties: ['openFile'],
    };
    remote.dialog
        .showOpenDialog(dialogOptions)
        .then(({ filePaths }: { filePaths: string[] }) => {
            if (filePaths && filePaths.length > 0) {
                dispatch(modemWritingReady(filePaths[0]));
            }
        });
};

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(modemWritingClose());
};

export const programDfuModem =
    (fileName: string) => (dispatch: TDispatch, getState: () => RootState) =>
        new Promise<void>((resolve, reject) => {
            const { device: inputDevice } = getState().app.target;
            const { id: deviceId } = inputDevice as Device;

            const successCallback = () => {
                logger.info('Modem DFU completed successfully!');
                dispatch(modemWritingSucceed());
                resolve();
            };

            const errorCallback = (error: Error) => {
                if (error) {
                    logger.error(
                        `Modem DFU failed with error: ${
                            (error as Error).message || error
                        }`
                    );
                    let errorMsg = error.message;
                    if (error.message.includes('0x4')) {
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
                    reject(error);
                }
            };

            const progressCallback = ({
                progressJson: progress,
            }: nrfdl.Progress.CallbackParameters) => {
                let updatedProgress = progress;
                if (progress.operation === 'erase_image') {
                    updatedProgress = {
                        ...progress,
                        message: `${progress.message} This will take some time.`,
                    };
                }
                dispatch(modemProcessUpdate(updatedProgress));
            };

            try {
                nrfdl.firmwareProgram(
                    getDeviceLibContext(),
                    deviceId,
                    'NRFDL_FW_FILE',
                    'NRFDL_FW_NRF91_MODEM',
                    fileName,
                    successCallback,
                    progressCallback
                );
            } catch (error) {
                errorCallback(error as Error);
            }
        });

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
