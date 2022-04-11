/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl, { SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';
import {
    Device,
    getDeviceLibContext,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    mcubootFirmwareValid,
    mcubootKnown,
    mcubootPortKnown,
    mcubootProcessUpdate,
    mcubootWritingFail,
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
import {
    CommunicationType,
    DeviceFamily,
    McubootProductIds,
    ModemProductIds,
    VendorId,
} from '../util/devices';
import { updateFileRegions } from './fileActions';
import { updateTargetWritable } from './targetActions';
import EventAction from './usageDataActions';

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

/**
 * Check whether the device is MCUboot device or not by providing vender Id and product Id
 *
 * @param {number} vid Vender Id
 * @param {number} pid Product Id
 * @returns {boolean} whether the device is MCUboot device
 */
export const isMcuboot = (vid?: number, pid?: number) =>
    vid &&
    pid &&
    vid === VendorId.NORDIC_SEMICONDUCTOR &&
    McubootProductIds.includes(pid);

/**
 * Check whether the device is MCUboot device with modem or not by providing vender Id and product Id
 *
 * @param {number} vid Vender Id
 * @param {number} pid Product Id
 * @returns {boolean} whether the device is MCUboot device with modem
 */
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
        const serialport = serialPorts[0];
        const { vendorId, productId } = serialport as SerialPort;
        const vid = vendorId ? parseInt(vendorId.toString(), 16) : undefined;
        const pid = productId ? parseInt(productId.toString(), 16) : undefined;

        dispatch(
            targetTypeKnown({
                targetType: CommunicationType.MCUBOOT,
                isRecoverable: false,
            })
        );
        dispatch(mcubootKnown(true));
        if (isMcubootModem(vid, pid)) {
            // Only Thingy91 matches the condition
            // Update when a new Nordic USB device has both mcuboot and modem
            dispatch(modemKnown(true));
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_FAMILY,
                DeviceFamily.NRF91
            );
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_VERSION,
                'Thingy91'
            );
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_BOARD_VERSION,
                'PCA20035'
            );
        } else {
            // Only Thingy53 matches the condition
            // Update when a new Nordic USB device has mcuboot without modem
            dispatch(modemKnown(false));
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_FAMILY,
                DeviceFamily.NRF53
            );
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_VERSION,
                'Thingy53'
            );
            usageData.sendUsageData(
                EventAction.OPEN_DEVICE_BOARD_VERSION,
                'PCA20053'
            );
        }
        dispatch(
            mcubootPortKnown({
                port: first(serialPorts)?.comName ?? undefined,
                port2: last(serialPorts)?.comName ?? undefined,
            })
        );
        dispatch(updateFileRegions());
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

export const canWrite =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        // Disable write button
        dispatch(targetWritableKnown(false));

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
                ? 'NRFDL_FW_INTEL_HEX'
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
                // @ts-expect-error will be fixed in nrfdl
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
