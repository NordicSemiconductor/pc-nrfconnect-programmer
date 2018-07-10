/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import { List } from 'immutable';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';
import { CommunicationType } from '../util/devices';

export const TARGET_TYPE_KNOWN = 'TARGET_TYPE_KNOWN';
export const TARGET_INFO_KNOWN = 'TARGET_INFO_KNOWN';
export const TARGET_WARNING_KNOWN = 'TARGET_WARNING_KNOWN';
export const TARGET_CONTENTS_KNOWN = 'TARGET_CONTENTS_KNOWN';
export const TARGET_REGIONS_KNOWN = 'TARGET_REGIONS_KNOWN';
export const TARGET_WRITABLE_KNOWN = 'TARGET_WRITABLE_KNOWN';
export const TARGET_PORT_CHANGED = 'TARGET_PORT_CHANGED';
export const DFU_IMAGES_UPDATE = 'DFU_IMAGES_UPDATE';
export const WRITE_PROGRESS_START = 'WRITE_PROGRESS_START';
export const WRITE_PROGRESS_FINISHED = 'WRITE_PROGRESS_FINISHED';
export const WRITE_START = 'WRITE_START';
export const USER_INPUT_ENABLED = 'USER_INPUT_ENABLED';
export const USER_INPUT_DISABLED = 'USER_INPUT_DISABLED';
export const USER_INPUT_UPDATED = 'USER_INPUT_UPDATED';

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

export function targetWarningKnownAction(...warnings) {
    return {
        type: TARGET_WARNING_KNOWN,
        warnings: new List([...warnings]),
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

export function dfuImagesUpdateAction(dfuImages) {
    return {
        type: DFU_IMAGES_UPDATE,
        dfuImages,
    };
}

export function writeProgressFinishedAction() {
    return {
        type: WRITE_PROGRESS_FINISHED,
    };
}

export function writeProgressStartAction() {
    return {
        type: WRITE_PROGRESS_START,
    };
}

export function targetPortChanged(serialNumber, comName) {
    return {
        type: TARGET_PORT_CHANGED,
        device: {
            serialNumber,
            serialport: {
                comName,
            },
        },
    };
}

export function userInputEnabled(fields) {
    return {
        type: USER_INPUT_ENABLED,
        fields,
    };
}

export function userInputDisabled(field) {
    return {
        type: USER_INPUT_DISABLED,
        field,
    };
}

export function userInputUpdated(userInput) {
    return {
        type: USER_INPUT_UPDATED,
        userInput,
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
