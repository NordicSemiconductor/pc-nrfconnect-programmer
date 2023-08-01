/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    AppThunk,
    Device,
    logger,
    selectedDevice,
    usageData,
} from 'pc-nrfconnect-shared';

import { setShowMcuBootProgrammingDialog } from '../reducers/mcubootReducer';
import { modemWritingReady } from '../reducers/modemReducer';
import { loadingStart, targetWritableKnown } from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as mcubootTargetActions from './mcubootTargetActions';
import EventAction from './usageDataActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        dispatch(loadingStart());

        if (device.traits.jlink) {
            dispatch(jlinkTargetActions.openDevice(device));
            usageData.sendUsageData(EventAction.OPEN_DEVICE, 'jlink');
            return;
        }

        if (device.traits.mcuBoot) {
            usageData.sendUsageData(EventAction.OPEN_DEVICE, 'mcuboot');
            dispatch(mcubootTargetActions.openDevice(device));
            return;
        }
        if (device.traits.nordicDfu) {
            usageData.sendUsageData(EventAction.OPEN_DEVICE, 'nordicUsb');
            dispatch(usbsdfuTargetActions.openDevice(device));
            return;
        }

        logger.error(
            `Unsupported device.
            The detected device could not be recognized as
            neither JLink device nor Nordic USB device.`
        );
        if (process.platform === 'linux') {
            logger.error(
                'Please make sure J-Link Software and nrf-udev are installed. ' +
                    'See https://github.com/NordicSemiconductor/pc-nrfconnect-launcher/#macos-and-linux'
            );
        }
        if (process.platform === 'darwin') {
            logger.error(
                'Please make sure J-Link Software is installed. ' +
                    'See https://github.com/NordicSemiconductor/pc-nrfconnect-launcher/#macos-and-linux'
            );
        }
    };

export const updateTargetWritable = (): AppThunk => (dispatch, getState) => {
    const device = selectedDevice(getState());

    const {
        file: { zipFilePath },
    } = getState().app;

    if (device?.traits.jlink) {
        dispatch(jlinkTargetActions.canWrite());
    } else if (device?.traits.nordicDfu) {
        dispatch(usbsdfuTargetActions.canWrite());
    } else if (device?.traits.mcuBoot || getState().app.settings.forceMcuBoot) {
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
            dispatch(modemWritingReady(zipFilePath));
            return;
        }
        if (device.traits.mcuBoot || getState().app.settings.forceMcuBoot) {
            dispatch(setShowMcuBootProgrammingDialog(true));
            return;
        }
        if (device.traits.jlink) {
            dispatch(jlinkTargetActions.write(device));
            return;
        }
        if (device.traits.nordicDfu) {
            dispatch(usbsdfuTargetActions.write(device));
            return;
        }
        logger.error('Invalid write action');
    };
