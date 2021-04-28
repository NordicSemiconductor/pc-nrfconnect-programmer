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

/* eslint-disable @typescript-eslint/no-explicit-any */

import produce from 'immer';
import MemoryMap from 'nrf-intel-hex';
import SerialPort from 'serialport';

import * as fileActions from '../actions/fileActions';
import * as targetActions from '../actions/targetActions';
import {
    CommunicationType,
    DeviceDefinition,
    deviceDefinition,
} from '../util/devices';
import { Region } from '../util/regions';

export interface TargetState {
    readonly targetType: CommunicationType;
    readonly port?: SerialPort;
    readonly serialNumber?: string;
    readonly deviceInfo?: DeviceDefinition;
    readonly memMap?: MemoryMap;
    readonly regions?: Region[]; // TODO: Define region
    readonly warnings?: string[];
    readonly writtenAddress?: number;
    readonly dfuImages?: any[]; // TODO: Define image
    readonly isMemLoaded: boolean;
    readonly isWritable: boolean;
    readonly isRecoverable: boolean;
    readonly isWriting: boolean;
    readonly isErasing: boolean;
    readonly isErased: boolean;
    readonly isLoading: boolean;
    readonly isProtected: boolean;
}

const defaultState: TargetState = {
    targetType: CommunicationType.UNKNOWN,
    port: undefined,
    serialNumber: undefined,
    deviceInfo: deviceDefinition,
    memMap: undefined,
    regions: [],
    warnings: [],
    writtenAddress: 0,
    dfuImages: [],
    isMemLoaded: false,
    isWritable: false,
    isRecoverable: false,
    isWriting: false,
    isErasing: false,
    isErased: false,
    isLoading: false,
    isProtected: false,
};

export default (state = defaultState, action: any): TargetState =>
    produce<TargetState>(state, draft => {
        switch (action.type) {
            case 'DEVICE_SELECTED':
                return {
                    ...defaultState,
                    serialNumber: action.device.serialNumber,
                };

            case 'DEVICE_DESELECTED':
                return {
                    ...defaultState,
                };

            case targetActions.TARGET_TYPE_KNOWN:
                draft.targetType = action.targetType;
                draft.isRecoverable = action.isRecoverable;
                break;

            case targetActions.TARGET_INFO_KNOWN:
                draft.deviceInfo = action.deviceInfo;
                break;

            case targetActions.TARGET_PORT_CHANGED:
                draft.serialNumber = action.serialNumber;
                draft.port = action.path;
                break;

            case targetActions.TARGET_CONTENTS_KNOWN:
                draft.memMap = action.targetMemMap;
                draft.isMemLoaded = action.isMemLoaded;
                break;

            case targetActions.TARGET_REGIONS_KNOWN:
                draft.regions = action.regions;
                break;

            case targetActions.TARGET_WRITABLE_KNOWN:
                draft.isWritable = action.isWritable;
                break;

            case targetActions.DFU_IMAGES_UPDATE:
                draft.dfuImages = action.dfuImages;
                break;

            case fileActions.FILES_EMPTY:
                draft.writtenAddress = 0;
                break;

            case fileActions.FILE_PARSE:
                draft.writtenAddress = 0;
                break;

            case targetActions.WRITE_PROGRESS:
                draft.writtenAddress = action.address;
                draft.isWriting = true;
                break;

            case targetActions.WRITING_START:
                draft.isWriting = true;
                draft.isErased = false;
                break;

            case targetActions.WRITING_END:
                draft.isWriting = false;
                break;

            case targetActions.ERASING_START:
                draft.isErasing = true;
                break;

            case targetActions.ERASING_END:
                draft.isErasing = false;
                draft.isErased = true;
                break;

            case targetActions.LOADING_START:
                draft.isLoading = true;
                break;

            case targetActions.LOADING_END:
                draft.isLoading = false;
                break;

            default:
        }
    });
