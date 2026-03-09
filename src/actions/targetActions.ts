/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    type AppThunk,
    type Device,
    logger,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import describeError from '@nordicsemiconductor/pc-nrfconnect-shared/src/logging/describeError';

import { setDeviceBusy } from '../reducers/deviceDefinitionReducer';
import { setShowMcuBootProgrammingDialog } from '../reducers/mcubootReducer';
import { setShowModemProgrammingDialog } from '../reducers/modemReducer';
import { targetWritableKnown } from '../reducers/targetReducer';
import { type RootState } from '../reducers/types';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as mcubootTargetActions from './mcubootTargetActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';

export const openDevice =
    (device: Device, abortController: AbortController): AppThunk =>
    async dispatch => {
        dispatch(setDeviceBusy(true));
        try {
            if (device.traits.jlink) {
                await dispatch(
                    jlinkTargetActions.openDevice(device, abortController),
                );
            } else if (device.traits.mcuBoot) {
                dispatch(mcubootTargetActions.openDevice(device));
            } else if (device.traits.nordicDfu) {
                dispatch(
                    usbsdfuTargetActions.openDevice(device, abortController),
                );
            } else {
                logger.warn('No operations possible for device.');
                logger.warn(
                    `If the device is a MCUboot device make sure it is in the bootloader mode`,
                );
                if (process.platform === 'linux') {
                    logger.warn(
                        'If the device is a JLink device, please make sure J-Link Software and nrf-udev are installed. ' +
                            'See https://github.com/NordicSemiconductor/pc-nrfconnect-launcher/#macos-and-linux',
                    );
                }
                if (process.platform === 'darwin') {
                    logger.warn(
                        'If the device is a JLink device, please make sure J-Link Software is installed. ' +
                            'See https://github.com/NordicSemiconductor/pc-nrfconnect-launcher/#macos-and-linux',
                    );
                }
            }
        } catch (error) {
            logger.error(describeError(error));
        }
        dispatch(setDeviceBusy(false));
    };

export const updateTargetWritable =
    (): AppThunk<RootState> => (dispatch, getState) => {
        const device = selectedDevice(getState());
        const {
            file: { zipFilePath },
        } = getState().app;

        // jLink we only use Erase and write that is not dependent on the canWrite()
        if (device?.traits.nordicDfu) {
            dispatch(usbsdfuTargetActions.canWrite());
        } else if (
            device?.traits.mcuBoot ||
            getState().app.settings.forceMcuBoot
        ) {
            dispatch(mcubootTargetActions.canWrite());
        } else if (
            zipFilePath &&
            (device?.traits.mcuBoot || device?.traits.modem)
        ) {
            dispatch(targetWritableKnown(true));
        } else {
            dispatch(targetWritableKnown(false));
        }
    };

export const write =
    (device: Device): AppThunk<RootState> =>
    (dispatch, getState) => {
        const zipFilePath = getState().app.file.zipFilePath;

        if (device.traits.modem && zipFilePath) {
            dispatch(setShowModemProgrammingDialog(true));
            return;
        }
        if (device.traits.mcuBoot || getState().app.settings.forceMcuBoot) {
            dispatch(setShowMcuBootProgrammingDialog(true));
            return;
        }
        if (device.traits.jlink) {
            throw new Error('Only Erase and write are allowed with jlink');
        }
        if (device.traits.nordicDfu) {
            dispatch(usbsdfuTargetActions.write());
            return;
        }
        logger.error('Invalid write action');
    };
