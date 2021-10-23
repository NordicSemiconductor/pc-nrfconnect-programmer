/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/no-cycle */

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
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

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

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
            port: first(serialPorts)?.comName ?? undefined,
            port2: last(serialPorts)?.comName ?? undefined,
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
        new Promise<void>(resolve => {
            const { device: inputDevice } = getState().app.target;
            const device = inputDevice as Device;
            const { mcubootFilePath } = getState().app.file;

            logger.info(
                `Writing ${mcubootFilePath} to device ${device.serialNumber}`
            );

            const errorCallback = (error: nrfdl.Error) => {
                logger.error(
                    `MCUboot DFU failed with error: ${error.message || error}`
                );
                let errorMsg = error.message;
                // To be fixed in nrfdl
                /* @ts-ignore */
                if (error.error_code === 0x25b) {
                    errorMsg =
                        'Please make sure that the device is in MCUboot mode and try again.';
                }
                logger.error(errorMsg);
                dispatch(mcubootWritingFail(errorMsg));
            };

            const completeCallback = (error: nrfdl.Error | undefined) => {
                if (error) return errorCallback(error);
                logger.info('MCUboot DFU completed successfully!');
                dispatch(mcubootWritingSucceed());
                dispatch(updateTargetWritable());
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
                dispatch(mcubootProcessUpdate(updatedProgress));
            };

            dispatch(mcubootWritingStart());
            nrfdl.firmwareProgram(
                getDeviceLibContext(),
                device.id,
                'NRFDL_FW_FILE',
                'NRFDL_FW_MCUBOOT',
                mcubootFilePath as string,
                completeCallback,
                progressCallback
            );
        });

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(mcubootWritingClose());
};
