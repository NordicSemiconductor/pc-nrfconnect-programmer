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
    program,
    Progress,
    selectedDevice,
    usageData,
} from 'pc-nrfconnect-shared';

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
        // not all devices will have serialPorts property (non-Nordic devices for example)
        if (!device.serialPorts || device.serialPorts.length === 0) return;

        if (device.traits.modem) {
            // Only Thingy91 matches the condition
            // When a new Nordic USB device has both mcuboot and modem
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
            // When a new Nordic USB device has mcuboot without modem
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
        // Enable write button if all above items have been checked
        dispatch(targetWritableKnown(true));
    }
};

export const performUpdate = (
    device: Device,
    dfuFilePath: string,
    onProgress: (progress: Progress) => void,
    netCoreUploadDelay?: number
) =>
    new Promise<void>((resolve, reject) => {
        logger.info(`Writing ${dfuFilePath} to device ${device.serialNumber}`);

        // TODO: Fix force mcuboot trait when possible from CLI
        program(device, dfuFilePath, onProgress, undefined, {
            netCoreUploadDelay,
        })
            .then(() => {
                logger.info('MCUboot DFU completed successfully!');
                resolve();
            })
            .catch(error => {
                let errorMsg = describeError(error);
                logger.error(`MCUboot DFU failed with error: ${errorMsg}`);
                // To be fixed in nrfdl
                if (error.error_code === 0x25b) {
                    errorMsg =
                        'Please make sure that the device is in MCUboot mode and try again.';
                }
                logger.error(errorMsg);
                reject(new Error(errorMsg));
            });
    });
