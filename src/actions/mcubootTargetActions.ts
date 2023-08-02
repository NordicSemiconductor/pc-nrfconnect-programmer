/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import {
    AppThunk,
    describeError,
    Device,
    getDeviceLibContext,
    logger,
    selectedDevice,
    usageData,
} from 'pc-nrfconnect-shared';

import { loadingEnd, targetWritableKnown } from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import { updateFileRegions } from './regionsActions';
import EventAction from './usageDataActions';

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        // not all devices will have serialPorts property (non-Nordic devices for example)
        if (!device.serialPorts || device.serialPorts.length === 0) return;

        console.log(device);

        usageData.sendUsageData(
            EventAction.PRODUCT_NAME,
            `${device.usb?.product}`
        );

        usageData.sendUsageData(
            EventAction.PRODUCT_ID,
            `${device.usb?.device.descriptor.idProduct}`
        );

        usageData.sendUsageData(
            EventAction.OPEN_DEVICE_BOARD_VERSION,
            `${device.boardVersion}`
        );

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
        // Enable write button if all above items have been checked
        dispatch(targetWritableKnown(true));
    }
};

export const performUpdate = (
    device: Device,
    onProgress: (progress: nrfdl.Progress.Operation) => void,
    mcubootFilePath?: string,
    zipFilePath?: string,
    netCoreUploadDelay?: number
) =>
    new Promise<void>((resolve, reject) => {
        const dfuFilePath = mcubootFilePath || zipFilePath;
        const firmwareFormat = mcubootFilePath
            ? 'NRFDL_FW_INTEL_HEX'
            : 'NRFDL_FW_MCUBOOT_MULTI_IMAGE';
        logger.info(`Writing ${dfuFilePath} to device ${device.serialNumber}`);

        nrfdl.firmwareProgram(
            getDeviceLibContext(),
            device.id,
            'NRFDL_FW_FILE',
            firmwareFormat,
            dfuFilePath as string,
            error => {
                if (!error) {
                    logger.info('MCUboot DFU completed successfully!');
                    resolve();
                } else {
                    let errorMsg = describeError(error);
                    logger.error(`MCUboot DFU failed with error: ${errorMsg}`);
                    // To be fixed in nrfdl
                    // @ts-expect-error will be fixed in nrfdl
                    if (error.error_code === 0x25b) {
                        errorMsg =
                            'Please make sure that the device is in MCUboot mode and try again.';
                    }
                    logger.error(errorMsg);
                    reject(new Error(errorMsg));
                }
            },
            ({ progressJson: progress }: nrfdl.Progress.CallbackParameters) => {
                onProgress(progress);
            },
            netCoreUploadDelay !== undefined
                ? { netCoreUploadDelay }
                : undefined
        );
    });
