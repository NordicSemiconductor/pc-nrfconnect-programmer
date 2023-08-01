/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import {
    AppThunk,
    clearWaitForDevice,
    describeError,
    Device,
    getDeviceLibContext,
    logger,
    selectedDevice,
    setWaitForDevice,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    mcubootFirmwareValid,
    mcubootProcessUpdate,
    MCUBootProcessUpdatePayload,
    mcubootWritingFail,
    mcubootWritingStart,
    mcubootWritingSucceed,
} from '../reducers/mcubootReducer';
import { loadingEnd, targetWritableKnown } from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import { DeviceFamily } from '../util/devices';
import { updateFileRegions } from './regionsActions';
import EventAction from './usageDataActions';

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        if (!device.serialPorts || device.serialPorts.length === 0) return;

        if (device.traits.modem) {
            // Only Thingy91 matches the condition
            // Update when a new Nordic USB device has both mcuboot and modem
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
        dispatch(updateFileRegions());
        dispatch(canWrite());
        dispatch(loadingEnd());
    };

export const canWrite = (): AppThunk<RootState> => (dispatch, getState) => {
    const device = selectedDevice(getState());

    if (!device) {
        dispatch(targetWritableKnown(false));
        return;
    }

    // Disable write button
    dispatch(targetWritableKnown(false));

    // Check if mcu firmware is detected.
    // Check if target is MCU target.
    const { mcubootFilePath, zipFilePath } = getState().app.file;
    const isMcuboot =
        !!device.traits.mcuBoot || getState().app.settings.forceMcuBoot;

    if ((mcubootFilePath || zipFilePath) && isMcuboot) {
        // Check if firmware is valid for Thingy91
        // So far there is no strict rule for checking it
        // Therefore set it always true
        dispatch(mcubootFirmwareValid(true));

        // Enable write button if all above items have been checked
        dispatch(targetWritableKnown(true));
    }
};

export const performUpdate =
    (
        device: Device,
        netCoreUploadDelay: number | null
    ): AppThunk<RootState, Promise<void>> =>
    (dispatch, getState) =>
        new Promise<void>(resolve => {
            const { mcubootFilePath, zipFilePath } = getState().app.file;
            const dfuFilePath = mcubootFilePath || zipFilePath;
            const firmwareFormat = mcubootFilePath
                ? 'NRFDL_FW_INTEL_HEX'
                : 'NRFDL_FW_MCUBOOT_MULTI_IMAGE';

            logger.info(
                `Writing ${dfuFilePath} to device ${device.serialNumber}`
            );

            const errorCallback = (error: nrfdl.Error) => {
                let errorMsg = describeError(error);
                logger.error(`MCUboot DFU failed with error: ${errorMsg}`);
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
                dispatch(clearWaitForDevice());
                if (error) return errorCallback(error);
                logger.info('MCUboot DFU completed successfully!');
                dispatch(mcubootWritingSucceed());
                dispatch(canWrite());
                resolve();
            };

            const progressCallback = ({
                progressJson: progress,
            }: nrfdl.Progress.CallbackParameters) => {
                let updatedProgress: MCUBootProcessUpdatePayload = progress;
                if (progress.operation === 'erase_image') {
                    updatedProgress = {
                        ...progress,
                        message: `${progress.message} This will take some time.`,
                    };
                }
                if (
                    progress.message?.match(
                        /Waiting [0-9]+ seconds to let RAM NET Core flash succeed./
                    )
                ) {
                    const timeouts = progress.message.match(/\d+/g);
                    if (timeouts?.length === 1) {
                        updatedProgress = {
                            ...progress,
                            timeoutStarted: true,
                            timeoutValue: parseInt(timeouts[0], 10),
                        };
                    }
                }
                dispatch(mcubootProcessUpdate(updatedProgress));
            };

            // Operation might reboot the device and if auto reconnect is on we will get unexpected behavior
            dispatch(
                setWaitForDevice({
                    timeout: 99999999999999, // Wait 'indefinitely' as we will cancel the wait when programming is complete
                    when: 'always',
                    once: false,
                })
            );
            dispatch(mcubootWritingStart());
            nrfdl.firmwareProgram(
                getDeviceLibContext(),
                device.id,
                'NRFDL_FW_FILE',
                firmwareFormat,
                dfuFilePath as string,
                completeCallback,
                progressCallback,
                netCoreUploadDelay !== null ? { netCoreUploadDelay } : undefined
            );
        });
