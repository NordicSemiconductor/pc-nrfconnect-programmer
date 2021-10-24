/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/no-cycle */

import { SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';
import { Device, logger, usageData } from 'pc-nrfconnect-shared';

import { modemWritingReady } from '../reducers/modemReducer';
import {
    loadingStart,
    targetDeviceKnown,
    targetPortChanged,
    targetWritableKnown,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import {
    CommunicationType,
    McubootProductIds,
    USBProductIds,
    VendorId,
} from '../util/devices';
import portPath from '../util/portPath';
import { refreshAllFiles } from './fileActions';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as mcubootTargetActions from './mcubootTargetActions';
import EventAction from './usageDataActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';

export const openDevice = (device: Device) => (dispatch: TDispatch) => {
    dispatch(loadingStart());
    dispatch(targetDeviceKnown(device));

    const { serialNumber, serialPorts } = device;
    const serialport = serialPorts[0];

    dispatch(
        targetPortChanged({
            serialNumber,
            path: serialport ? portPath(serialport) : undefined,
        })
    );

    if (device.traits.jlink) {
        dispatch(jlinkTargetActions.openDevice());
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'jlink');
        return;
    }
    if (device.traits.mcuboot) {
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'mcuboot');
        dispatch(mcubootTargetActions.openDevice(device));
        return;
    }
    if (device.traits.nordicUsb) {
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'nordicUsb');
        dispatch(usbsdfuTargetActions.openDevice());
        return;
    }

    const { vendorId, productId } = serialport as SerialPort;
    const vid = vendorId ? parseInt(vendorId.toString(), 16) : null;
    const pid = productId ? parseInt(productId.toString(), 16) : null;

    if (vid === VendorId.NORDIC_SEMICONDUCTOR) {
        if (pid && USBProductIds.includes(pid)) {
            dispatch(usbsdfuTargetActions.openDevice());
            return;
        }
        if (pid && McubootProductIds.includes(pid)) {
            dispatch(mcubootTargetActions.openDevice(device));
            return;
        }
    }
    if (vid === VendorId.SEGGER) {
        dispatch(jlinkTargetActions.openDevice());
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

export const updateTargetWritable =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const {
            target: { targetType },
            mcuboot: { isMcuboot },
            modem: { isModem },
            file: { zipFilePath },
        } = getState().app;

        switch (targetType) {
            case CommunicationType.JLINK:
                dispatch(jlinkTargetActions.canWrite());
                break;
            case CommunicationType.USBSDFU:
                dispatch(usbsdfuTargetActions.canWrite());
                break;
            case CommunicationType.MCUBOOT:
                dispatch(mcubootTargetActions.canWrite());
                break;
            default:
                dispatch(targetWritableKnown(false));
        }
        if (zipFilePath && (isMcuboot || isModem))
            dispatch(targetWritableKnown(true));
    };

export const write = () => (dispatch: TDispatch, getState: () => RootState) => {
    // Refresh all files in case that some files have been updated right before write action.
    dispatch(refreshAllFiles());
    const {
        target,
        file: { zipFilePath },
        mcuboot: { isMcuboot },
        modem: { isModem },
    } = getState().app;

    if (zipFilePath && isModem) {
        dispatch(modemWritingReady(zipFilePath));
    }

    if (isMcuboot) {
        dispatch(mcubootTargetActions.prepareUpdate());
        return;
    }
    if (target.targetType === CommunicationType.JLINK) {
        dispatch(jlinkTargetActions.write());
        return;
    }
    if (target.targetType === CommunicationType.USBSDFU) {
        dispatch(usbsdfuTargetActions.write());
        return;
    }
    logger.error('Invalid write action');
};
