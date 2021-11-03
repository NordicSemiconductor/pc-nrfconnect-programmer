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
import {
    loadingEnd,
    targetTypeKnown,
    targetWritableKnown,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { targetWarningRemove } from '../reducers/warningReducer';
import {
    CommunicationType,
    McubootProductIds,
    ModemProductIds,
    VendorId,
} from '../util/devices';
import { updateTargetWritable } from './targetActions';

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

export const isMcuboot = (vid?: number, pid?: number) =>
    vid &&
    pid &&
    vid === VendorId.NORDIC_SEMICONDUCTOR &&
    McubootProductIds.includes(pid);

export const isMcubootModem = (vid?: number, pid?: number) =>
    vid &&
    pid &&
    vid === VendorId.NORDIC_SEMICONDUCTOR &&
    ModemProductIds.includes(pid);

export const openDevice =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const { device: inputDevice } = getState().app.target;
        const device = inputDevice as Device;
        const { serialPorts } = device;
        dispatch(
            targetTypeKnown({
                targetType: CommunicationType.MCUBOOT,
                isRecoverable: false,
            })
        );
        dispatch(mcubootKnown(true));
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
        const { isMcuboot: isMcubootTarget } = getState().app.mcuboot;

        if (isMcubootTarget) {
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
        const { mcubootFilePath, zipFilePath } = getState().app.file;
        if (!mcubootFilePath && !zipFilePath) {
            return;
        }

        // Check if target is MCU target.
        // If not, then return.
        const { isMcuboot: isMcubootTarget } = getState().app.mcuboot;
        if (!isMcubootTarget) {
            return;
        }

        // Check if firmware is valid for Thingy91
        // So far there is no strict rule for checking it
        // Therefore set it always true
        dispatch(mcubootFirmwareValid(true));

        // Enable write button if all above items have been checked
        dispatch(targetWarningRemove());
        dispatch(targetWritableKnown(true));
    };

export const performUpdate =
    () => (dispatch: TDispatch, getState: () => RootState) =>
        new Promise<void>(resolve => {
            const { device: inputDevice } = getState().app.target;
            const device = inputDevice as Device;
            const { mcubootFilePath, zipFilePath } = getState().app.file;
            const dfuFilePath = mcubootFilePath || zipFilePath;
            const firmwareFormat = mcubootFilePath
                ? 'NRFDL_FW_MCUBOOT'
                : 'NRFDL_FW_MCUBOOT_MULTI_IMAGE';

            logger.info(
                `Writing ${dfuFilePath} to device ${device.serialNumber}`
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
                firmwareFormat,
                dfuFilePath as string,
                completeCallback,
                progressCallback
            );
        });

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(mcubootWritingClose());
};
