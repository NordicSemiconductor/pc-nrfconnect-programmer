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
    VendorId,
    USBProductIds,
    MCUProductIds,
} from '../util/devices';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';
import * as mcuTargetActions from './mcuTargetActions';

export const DFU_IMAGES_UPDATE = 'DFU_IMAGES_UPDATE';
export const ERASING_END = 'ERASING_END';
export const ERASING_START = 'ERASING_START';
export const LOADING_END = 'LOADING_END';
export const LOADING_START = 'LOADING_START';
export const MCU_KNOWN = 'MCU_KNOWN';
export const MCU_PROCESS_UPDATE = 'MCU_PROCESS_UPDATE';
export const MCU_WRITING_CLOSE = 'MCU_WRITING_CLOSE';
export const MCU_WRITING_END = 'MCU_WRITING_END';
export const MCU_WRITING_FAIL = 'MCU_WRITING_FAIL';
export const MCU_WRITING_READY = 'MCU_WRITING_READY';
export const MCU_WRITING_START = 'MCU_WRITING_START';
export const MCU_WRITING_SUCCEED = 'MCU_WRITING_SUCCEED';
export const MODEM_KNOWN = 'MODEM_KNOWN';
export const MODEM_PROCESS_UPDATE = 'MODEM_PROCESS_UPDATE';
export const MODEM_WRITING_CLOSE = 'MODEM_WRITING_CLOSE';
export const MODEM_WRITING_END = 'MODEM_WRITING_END';
export const MODEM_WRITING_FAIL = 'MODEM_WRITING_FAIL';
export const MODEM_WRITING_READY = 'MODEM_WRITING_READY';
export const MODEM_WRITING_START = 'MODEM_WRITING_START';
export const MODEM_WRITING_SUCCEED = 'MODEM_WRITING_SUCCEED';
export const TARGET_CONTENTS_KNOWN = 'TARGET_CONTENTS_KNOWN';
export const TARGET_INFO_KNOWN = 'TARGET_INFO_KNOWN';
export const TARGET_PORT_CHANGED = 'TARGET_PORT_CHANGED';
export const TARGET_REGIONS_KNOWN = 'TARGET_REGIONS_KNOWN';
export const TARGET_TYPE_KNOWN = 'TARGET_TYPE_KNOWN';
export const TARGET_WRITABLE_KNOWN = 'TARGET_WRITABLE_KNOWN';
export const WRITING_END = 'WRITING_END';
export const WRITING_START = 'WRITING_START';

export function targetTypeKnownAction(targetType, isRecoverable) {
    return {
        type: TARGET_TYPE_KNOWN,
        targetType,
        isRecoverable,
    };
}

export function targetInfoKnownAction(deviceInfo) {
    return {
        type: TARGET_INFO_KNOWN,
        deviceInfo,
    };
}

export function targetContentsKnownAction(targetMemMap, isMemLoaded) {
    return {
        type: TARGET_CONTENTS_KNOWN,
        targetMemMap,
        isMemLoaded,
    };
}

export function targetRegionsKnownAction(regions) {
    return {
        type: TARGET_REGIONS_KNOWN,
        regions,
    };
}

export function targetWritableKnownAction(isWritable) {
    return {
        type: TARGET_WRITABLE_KNOWN,
        isWritable,
    };
}

export function targetPortChangedAction(serialNumber, comName) {
    return {
        type: TARGET_PORT_CHANGED,
        serialNumber,
        comName,
    };
}

export function dfuImagesUpdateAction(dfuImages) {
    return {
        type: DFU_IMAGES_UPDATE,
        dfuImages,
    };
}

export function writingStartAction() {
    return {
        type: WRITING_START,
    };
}

export function writingEndAction() {
    return {
        type: WRITING_END,
    };
}

export function erasingStartAction() {
    return {
        type: ERASING_START,
    };
}

export function erasingEndAction() {
    return {
        type: ERASING_END,
    };
}

export function loadingStartAction() {
    return {
        type: LOADING_START,
    };
}

export function loadingEndAction() {
    return {
        type: LOADING_END,
    };
}

export function mcuKnownAction(isMcu) {
    return {
        type: MCU_KNOWN,
        isMcu,
    };
}

export function mcuWritingReadyAction(fileName) {
    return {
        type: MCU_WRITING_READY,
        fileName,
    };
}

export function modemKnownAction(isModem) {
    return {
        type: MODEM_KNOWN,
        isModem,
    };
}

export function modemProcessUpdateAction(message) {
    return {
        type: MODEM_PROCESS_UPDATE,
        message,
    };
}

export function modemWritingReadyAction(fileName) {
    return {
        type: MODEM_WRITING_READY,
        fileName,
    };
}

export function modemWritingCloseAction() {
    return {
        type: MODEM_WRITING_CLOSE,
    };
}

export function modemWritingStartAction() {
    return {
        type: MODEM_WRITING_START,
    };
}

export function modemWritingEndAction() {
    return {
        type: MODEM_WRITING_END,
    };
}

export function modemWritingSucceedAction() {
    return {
        type: MODEM_WRITING_SUCCEED,
    };
}

export function modemWritingFailAction(errorMsg) {
    return {
        type: MODEM_WRITING_FAIL,
        errorMsg,
    };
}

export function openDevice(device) {
    return dispatch => {
        dispatch(loadingStartAction());

        const { serialNumber, serialport } = device;

        dispatch(targetPortChangedAction(serialNumber, serialport ? serialport.comName : null));

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
            if (MCUProductIds.includes(pid)) {
                dispatch(mcuTargetActions.openDevice(device));
                return;
            }
        }

        logger.error('Unsupported device. The detected device could not be recognized as neither JLink device nor Nordic USB device.');
    };
}

// Update the states of target whether it is writable or not
export function updateTargetWritable() {
    return (dispatch, getState) => {
        switch (getState().app.target.targetType) {
            case CommunicationType.JLINK:
                dispatch(jlinkTargetActions.canWrite());
                break;
            case CommunicationType.USBSDFU:
                dispatch(usbsdfuTargetActions.canWrite());
                break;
            default:
                dispatch(targetWritableKnownAction(false));
        }
    };
}

export function write() {
    return (dispatch, getState) => {
        if (getState().app.target.targetType === CommunicationType.JLINK) {
            dispatch(jlinkTargetActions.write());
        }
        if (getState().app.target.targetType === CommunicationType.USBSDFU) {
            dispatch(usbsdfuTargetActions.write());
        }
    };
}
