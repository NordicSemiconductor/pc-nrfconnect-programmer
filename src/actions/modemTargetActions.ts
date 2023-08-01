/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl, { Device } from '@nordicsemiconductor/nrf-device-lib-js';
import {
    AppThunk,
    describeError,
    getDeviceLibContext,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    MODEM_DFU_STARTING,
    modemProcessUpdate,
    modemWritingFail,
    modemWritingStart,
    modemWritingSucceed,
} from '../reducers/modemReducer';
import { RootState } from '../reducers/types';

export const programDfuModem =
    (fileName: string): AppThunk<RootState, Promise<void>> =>
    (dispatch, getState) =>
        new Promise<void>(resolve => {
            const { device: inputDevice } = getState().app.target;
            const { id: deviceId } = inputDevice as Device;

            const errorCallback = (error: nrfdl.Error) => {
                let errorMsg = describeError(error);
                logger.error(`Modem DFU failed with error: ${errorMsg}`);
                // @ts-expect-error To be fixed in nrfdl
                if (error.error_code === 0x25b) {
                    errorMsg =
                        'Please make sure that the device is in MCUboot mode and try again.';
                }
                dispatch(modemWritingFail(errorMsg));
                usageData.sendErrorReport(errorMsg);
            };

            const completeCallback = (error?: nrfdl.Error) => {
                if (error) return errorCallback(error);
                logger.info('Modem DFU completed successfully!');
                dispatch(modemWritingSucceed());
                resolve();
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
                if (!progress.result && progress.operation === 'upload_image') {
                    updatedProgress = {
                        ...progress,
                        message: `Uploading image. This will take some time.`,
                    };
                }
                dispatch(modemProcessUpdate(updatedProgress));
            };

            nrfdl.firmwareProgram(
                getDeviceLibContext(),
                deviceId,
                'NRFDL_FW_FILE',
                'NRFDL_FW_NRF91_MODEM',
                fileName,
                completeCallback,
                progressCallback
            );
        });

export const performUpdate =
    (): AppThunk<RootState> => (dispatch, getState) => {
        dispatch(modemWritingStart());
        dispatch(modemProcessUpdate({ message: MODEM_DFU_STARTING }));

        const { modemFwName: fileName } = getState().app.modem;
        const { device } = getState().app.target;

        if (!device?.serialNumber) {
            logger.error(
                'Modem DFU does not start due to missing serialNumber'
            );
            return;
        }
        logger.info('Modem DFU starts to write...');
        logger.info(
            `Writing ${fileName} to device ${device?.serialNumber || ''}`
        );

        dispatch(programDfuModem(fileName));
    };
