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

import { Record, List } from 'immutable';
import MemoryMap from 'nrf-intel-hex';
import * as fileActions from '../actions/fileActions';
import * as targetActions from '../actions/targetActions';
import { DeviceDefinition, CommunicationType } from '../util/devices';

const UserInput = new Record({
    blSdReq: null,  // e.g. [0x00]
    blVer: null,    // e.g. 0xFFFFFFFF
    sdSdReq: null,  // e.g. [0x00, 0x8C]
    sdVer: null,    // e.g. 0xFFFFFFFF
    appSdReq: null, // e.g. [0x8C]
    appVer: null,   // e.g. 0xFFFFFFFF
    isDebug: null,  // e.g. true
});

const InitialState = new Record({
    targetType: CommunicationType.UNKNOWN,
    port: null,
    serialNumber: null,
    deviceInfo: new DeviceDefinition(),
    memMap: new MemoryMap(),
    regions: new List(),
    isMemLoaded: false,
    isWritable: false,
    isRecoverable: false,
    warnings: new List(),
    isReady: false,
    writtenAddress: 0,
    dfuImages: new List(),
    userInput: new UserInput(),
    userInputFields: [],
});

export default function target(state = new InitialState(), action) {
    switch (action.type) {
        case 'DEVICE_SELECTED':
            return state.set('serialNumber', action.device.serialNumber);

        case targetActions.TARGET_PORT_CHANGED:
            return state
                .set('serialNumber', action.device.serialNumber)
                .set('port', action.device.serialport.comName);

        case 'DEVICE_DESELECTED':
            return new InitialState();

        case targetActions.TARGET_TYPE_KNOWN:
            return state
                .set('targetType', action.targetType)
                .set('isRecoverable', action.isRecoverable);

        case targetActions.TARGET_INFO_KNOWN:
            return state
                .set('deviceInfo', action.deviceInfo)
                .set('isReady', false);

        case targetActions.TARGET_WARNING_KNOWN:
            return state.set('warnings', action.warnings);

        case targetActions.TARGET_CONTENTS_KNOWN:
            return state
                .set('memMap', action.targetMemMap)
                .set('isMemLoaded', action.isMemLoaded)
                .set('isReady', true);

        case targetActions.TARGET_REGIONS_KNOWN:
            return state
                .set('regions', action.regions)
                .set('isReady', true);

        case targetActions.TARGET_WRITABLE_KNOWN:
            return state.set('isWritable', action.isWritable);

        case targetActions.DFU_IMAGES_UPDATE:
            return state.set('dfuImages', action.dfuImages);

        case fileActions.FILES_EMTPY:
            return state.set('writtenAddress', 0);

        case fileActions.FILE_PARSE: {
            return state.set('writtenAddress', 0);
        }

        case targetActions.WRITE_PROGRESS_START:
            return state.set('isReady', false);

        case targetActions.WRITE_PROGRESS:
            return state
                .set('writtenAddress', action.address)
                .set('isReady', false);

        case targetActions.WRITE_PROGRESS_FINISHED:
            return state
                .set('writtenAddress', 0)
                .set('isReady', true);

        case targetActions.USER_INPUT_ENABLED:
            return state.set('userInputFields', action.fields);

        case targetActions.USER_INPUT_DISABLED:
            return state.set('userInputFields', []);

        case targetActions.USER_INPUT_UPDATED:
            return state.set('userInput', action.userInput);

        default:
    }
    return state;
}
