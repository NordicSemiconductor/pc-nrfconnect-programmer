/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable import/no-cycle */

import { Device, SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';
import { logger } from 'pc-nrfconnect-shared';

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
        dispatch(jlinkTargetActions.openDevice(device));
        return;
    }
    if (device.traits.mcuboot) {
        dispatch(mcubootTargetActions.openDevice(device));
        return;
    }
    if (device.traits.nordicUsb) {
        dispatch(usbsdfuTargetActions.openDevice(device));
        return;
    }

    const { vendorId, productId } = serialport as SerialPort;
    const vid = vendorId ? parseInt(vendorId.toString(), 16) : null;
    const pid = productId ? parseInt(productId.toString(), 16) : null;

    if (vid === VendorId.NORDIC_SEMICONDUCTOR) {
        if (pid && USBProductIds.includes(pid)) {
            dispatch(usbsdfuTargetActions.openDevice(device));
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
        'Unsupported device. ' +
            'The detected device could not be recognized as ' +
            'neither JLink device nor Nordic USB device.'
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
        switch (getState().app.target.targetType) {
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
    };

export const write = () => (dispatch: TDispatch, getState: () => RootState) => {
    // Refresh all files in case that some files have been updated right before write action.
    dispatch(refreshAllFiles());

    if (getState().app.mcuboot.isMcuboot) {
        dispatch(mcubootTargetActions.prepareUpdate());
        return;
    }
    if (getState().app.target.targetType === CommunicationType.JLINK) {
        dispatch(jlinkTargetActions.write());
        return;
    }
    if (getState().app.target.targetType === CommunicationType.USBSDFU) {
        dispatch(usbsdfuTargetActions.write());
        return;
    }
    logger.error('Invalid write action');
};
