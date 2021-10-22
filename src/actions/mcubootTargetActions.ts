/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/no-cycle */

import nrfdl, { SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';
import { Device, getDeviceLibContext, logger } from 'pc-nrfconnect-shared';

import {
    mcubootFirmwareValid,
    mcubootKnown,
    mcubootPortKnown,
    mcubootProcessUpdate,
    mcubootWritingClose,
    mcubootWritingFail,
    mcubootWritingReady,
    mcubootWritingStart,
    mcubootWritingSucceed,
} from '../reducers/mcubootReducer';
import { modemKnown } from '../reducers/modemReducer';
import {
    loadingEnd,
    targetTypeKnown,
    targetWritableKnown,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { targetWarningRemove } from '../reducers/warningReducer';
import { CommunicationType } from '../util/devices';
import { updateTargetWritable } from './targetActions';

export const pickSerialPort = (serialports: Array<SerialPort>) =>
    serialports[0];

export const pickSerialPort2 = (serialports: Array<SerialPort>) =>
    serialports.slice(-1)[0];

export const openDevice = (selectedDevice: Device) => (dispatch: TDispatch) => {
    const { serialPorts } = selectedDevice;
    dispatch(
        targetTypeKnown({
            targetType: CommunicationType.MCUBOOT,
            isRecoverable: false,
        })
    );
    dispatch(mcubootKnown(true));
    dispatch(modemKnown(true));
    dispatch(
        mcubootPortKnown({
            port: pickSerialPort(serialPorts)?.comName ?? undefined,
            port2: pickSerialPort2(serialPorts)?.comName ?? undefined,
        })
    );
    dispatch(updateTargetWritable());
    dispatch(loadingEnd());
};

export const toggleMcuboot =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const { port } = getState().app.target;
        const { isMcuboot } = getState().app.mcuboot;

        if (isMcuboot) {
            dispatch(mcubootKnown(false));
            dispatch(mcubootPortKnown({}));
        } else {
            dispatch(mcubootKnown(true));
            dispatch(mcubootPortKnown({ port }));
        }

        dispatch(updateTargetWritable());
    };

export const prepareUpdate = () => (dispatch: TDispatch) => {
    dispatch(mcubootWritingReady());
};

export const canWrite =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        // Disable write button
        dispatch(targetWritableKnown(false));
        dispatch(targetWarningRemove());

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
            dispatch(mcubootFirmwareValid(false));
        } else {
            dispatch(mcubootFirmwareValid(true));
        }

        // Enable write button if all above items have been checked
        dispatch(targetWarningRemove());
        dispatch(targetWritableKnown(true));
    };

export const performUpdate =
    () => (dispatch: TDispatch, getState: () => RootState) =>
        new Promise((resolve, reject) => {
            const { mcubootFilePath } = getState().app.file;
            const { serialNumber } = getState().app.target;

            logger.info(
                `Writing ${mcubootFilePath} to device ${serialNumber || ''}`
            );

            let totalPercentage = 0;
            let totalDuration = 0;
            let progressMsg = '';

            const progressCallback = ({
                progressJson: progress,
            }: nrfdl.Progress.CallbackParameters) => {
                let dfuProcess;
                try {
                    dfuProcess = progress;
                } catch (error) {
                    dispatch(
                        mcubootProcessUpdate({
                            message: progress.message,
                            percentage: totalPercentage,
                            duration: totalDuration,
                        })
                    );
                    reject(error);
                }

                if (dfuProcess && dfuProcess.operation === 'upload_image') {
                    totalPercentage = dfuProcess.progressPercentage;
                    totalDuration = dfuProcess.duration ?? 0;

                    progressMsg = dfuProcess.message || progressMsg;
                    dispatch(
                        mcubootProcessUpdate({
                            message: progressMsg,
                            percentage: totalPercentage,
                            duration: totalDuration,
                        })
                    );
                }
            };

            const errorCallback = (error: Error) => {
                if (error) {
                    let errorMsg = error.message;

                    // Program without setting device in MCUboot mode will throw such an error:
                    // Errorcode: CouldNotCallFunction (0x9)
                    // Lowlevel error: Unknown value (ffffff24)
                    if (errorMsg.includes('0x9')) {
                        errorMsg =
                            'Please make sure that the device is in MCUboot mode and try again.';
                    }

                    logger.error(`MCUboot DFU failed. ${errorMsg}`);
                    dispatch(mcubootWritingFail(errorMsg));
                    reject(error);
                }

                dispatch(mcubootWritingSucceed());
            };

            const completeCallback = () => {
                dispatch(mcubootWritingSucceed());
                reject();
            };

            dispatch(mcubootWritingStart());

            try {
                const { device: inputDevice } = getState().app.target;
                const device = inputDevice as Device;
                nrfdl.firmwareProgram(
                    getDeviceLibContext(),
                    device.id,
                    'NRFDL_FW_FILE',
                    'NRFDL_FW_MCUBOOT',
                    mcubootFilePath as string,
                    completeCallback,
                    progressCallback
                );
            } catch (error) {
                errorCallback(error as Error);
            }

            dispatch(updateTargetWritable());
        });

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(mcubootWritingClose());
};
