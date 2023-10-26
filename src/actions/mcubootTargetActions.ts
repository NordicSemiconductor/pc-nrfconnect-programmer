/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    describeError,
    Device,
    logger,
    selectedDevice,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import {
    NrfutilDeviceLib,
    Progress,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

import { targetWritableKnown } from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import EventAction from './usageDataActions';

export const first = <T>(items: T[]): T | undefined => items[0];
export const last = <T>(items: T[]): T | undefined => items.slice(-1)[0];

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        // not all devices will have serialPorts property (non-Nordic devices for example)
        if (!device.serialPorts || device.serialPorts.length === 0) return;

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
            `${device.devkit?.boardVersion}`
        );

        dispatch(canWrite());
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

export const performUpdate = async (
    device: Device,
    dfuFilePath: string,
    onProgress: (progress: Progress) => void,
    abortController: AbortController,
    netCoreUploadDelay?: number
) => {
    logger.info(`Writing ${dfuFilePath} to device ${device.serialNumber}`);

    try {
        // TODO: Fix force mcuboot trait when possible from CLI
        await NrfutilDeviceLib.program(
            device,
            dfuFilePath,
            onProgress,
            undefined,
            {
                netCoreUploadDelay,
            },
            abortController
        );
        logger.info('MCUboot DFU completed successfully!');
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = e as any;
        let errorMsg = describeError(error);
        logger.error(`MCUboot DFU failed with error: ${errorMsg}`);
        // To be fixed in nrfdl
        if (error.error_code === 0x25b) {
            errorMsg =
                'Please make sure that the device is in MCUboot mode and try again.';
        }
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
};
