/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';
import { Device, logger, usageData } from 'pc-nrfconnect-shared';

import { mcubootWritingReady } from '../reducers/mcubootReducer';
import { modemWritingReady } from '../reducers/modemReducer';
import {
    loadingStart,
    targetDeviceKnown,
    targetPortChanged,
    targetWritableKnown,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { CommunicationType } from '../util/devices';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as mcubootTargetActions from './mcubootTargetActions';
import EventAction from './usageDataActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';

export const openDevice = (device: Device) => (dispatch: TDispatch) => {
    dispatch(loadingStart());
    dispatch(targetDeviceKnown(device));

    const { serialNumber, serialPorts } = device;
    const serialport =
        serialPorts && serialPorts.length > 1 ? serialPorts[0] : undefined;

    let vendorId;
    let productId;
    if (serialport) {
        ({ vendorId, productId } = serialport as SerialPort);
    }
    const vid = vendorId ? parseInt(vendorId.toString(), 16) : undefined;
    const pid = productId ? parseInt(productId.toString(), 16) : undefined;

    dispatch(
        targetPortChanged({
            serialNumber,
            path: serialport?.comName ?? undefined,
        })
    );

    if (device.traits.jlink || jlinkTargetActions.isJlink()) {
        dispatch(jlinkTargetActions.openDevice());
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'jlink');
        return;
    }
    if (device.traits.mcuboot || mcubootTargetActions.isMcuboot(vid, pid)) {
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'mcuboot');
        dispatch(mcubootTargetActions.openDevice());
        return;
    }
    if (device.traits.nordicUsb || usbsdfuTargetActions.isNordicUsb(vid, pid)) {
        usageData.sendUsageData(EventAction.OPEN_DEVICE, 'nordicUsb');
        dispatch(usbsdfuTargetActions.openDevice());
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
    const {
        target,
        file: { zipFilePath },
        mcuboot: { isMcuboot },
        modem: { isModem },
    } = getState().app;

    if (isModem && zipFilePath) {
        dispatch(modemWritingReady(zipFilePath));
        return;
    }
    if (isMcuboot) {
        dispatch(mcubootWritingReady());
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
