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

import { logger } from 'nrfconnect/core';

import {
    CommunicationType,
    McubootProductIds,
    USBProductIds,
    VendorId,
} from '../util/devices';
import { refreshAllFiles } from './fileActions';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as mcubootTargetActions from './mcubootTargetActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';
import portPath from '../util/portPath';

export const DFU_IMAGES_UPDATE = 'DFU_IMAGES_UPDATE';
export const ERASING_END = 'ERASING_END';
export const ERASING_START = 'ERASING_START';
export const LOADING_END = 'LOADING_END';
export const LOADING_START = 'LOADING_START';
export const TARGET_CONTENTS_KNOWN = 'TARGET_CONTENTS_KNOWN';
export const TARGET_INFO_KNOWN = 'TARGET_INFO_KNOWN';
export const TARGET_PORT_CHANGED = 'TARGET_PORT_CHANGED';
export const TARGET_REGIONS_KNOWN = 'TARGET_REGIONS_KNOWN';
export const TARGET_TYPE_KNOWN = 'TARGET_TYPE_KNOWN';
export const TARGET_WRITABLE_KNOWN = 'TARGET_WRITABLE_KNOWN';
export const WRITING_END = 'WRITING_END';
export const WRITING_START = 'WRITING_START';

export const targetTypeKnownAction = (targetType, isRecoverable) => ({
    type: TARGET_TYPE_KNOWN,
    targetType,
    isRecoverable,
});

export const targetInfoKnownAction = deviceInfo => ({
    type: TARGET_INFO_KNOWN,
    deviceInfo,
});

export const targetContentsKnownAction = (targetMemMap, isMemLoaded) => ({
    type: TARGET_CONTENTS_KNOWN,
    targetMemMap,
    isMemLoaded,
});

export const targetRegionsKnownAction = regions => ({
    type: TARGET_REGIONS_KNOWN,
    regions,
});

export const targetWritableKnownAction = isWritable => ({
    type: TARGET_WRITABLE_KNOWN,
    isWritable,
});

export const targetPortChangedAction = (serialNumber, path) => ({
    type: TARGET_PORT_CHANGED,
    serialNumber,
    path,
});

export const dfuImagesUpdateAction = dfuImages => ({
    type: DFU_IMAGES_UPDATE,
    dfuImages,
});

export const writingStartAction = () => ({
    type: WRITING_START,
});

export const writingEndAction = () => ({
    type: WRITING_END,
});

export const erasingStartAction = () => ({
    type: ERASING_START,
});

export const erasingEndAction = () => ({
    type: ERASING_END,
});

export const loadingStartAction = () => ({
    type: LOADING_START,
});

export const loadingEndAction = () => ({
    type: LOADING_END,
});

export const openDevice = device => dispatch => {
    dispatch(loadingStartAction());

    const { serialNumber, serialport } = device;

    dispatch(targetPortChangedAction(serialNumber, serialport ? portPath(serialport) : null));

    if (device.traits.includes('jlink')) {
        dispatch(jlinkTargetActions.loadDeviceInfo(serialNumber));
        return;
    }
    if (device.traits.includes('nordicUsb')) {
        dispatch(usbsdfuTargetActions.openDevice(device));
        return;
    }

    const { vendorId, productId } = serialport;
    const vid = parseInt(vendorId.toString(16), 16);
    const pid = parseInt(productId.toString(16), 16);
    if (vid === VendorId.NORDIC_SEMICONDUCTOR) {
        if (USBProductIds.includes(pid)) {
            dispatch(usbsdfuTargetActions.openDevice(device));
            return;
        }
        if (McubootProductIds.includes(pid)) {
            dispatch(mcubootTargetActions.openDevice(device));
            return;
        }
    }

    logger.error('Unsupported device. '
        + 'The detected device could not be recognized as '
        + 'neither JLink device nor Nordic USB device.');
};

export const updateTargetWritable = () => (dispatch, getState) => {
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
            dispatch(targetWritableKnownAction(false));
    }
};

export const write = () => (dispatch, getState) => {
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
