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
import TargetActions from '../actions/targetActions';

const targetActions = new TargetActions();

// This will be merged with initialState
const InitialState = new Record({
    port: null,
    serialNumber: null,
    part: null,
    variant: null,
    protocolVersion: null,
    romSize: 0x00100000,
    ramSize: null,
    pageSize: 0,
    memMap: new MemoryMap(),
    regions: new List(), // heuristically detected code region 0, and memory readback protection
    labels: {},  // heuristically detected bootloader, mbr, mbr params
    isWritable: false,
    writtenAddress: 0,
    isReady: false,
});

export default function target(state = new InitialState(), action) {
    let newState = state;
    switch (action.type) {
        case 'DEVICE_SELECTED':
            newState = newState.set('port', '/dev/cu.usbmodem1421');
            newState = newState.set('serialNumber', action.device.serialNumber);
            break;

        case 'SERIAL_PORT_SELECTED':
            newState = newState.set('port', action.port.comName);
            newState = newState.set('serialNumber', action.port.serialNumber);
            newState = newState.set('writtenAddress', 0);
            newState = newState.set('isReady', false);
            break;

        case 'SERIAL_PORT_DESELECTED':
            newState = new InitialState();
            break;

        case targetActions.TARGET_SIZE_KNOWN:
            newState = newState.set('romSize', action.targetSize);
            newState = newState.set('pageSize', action.targetPageSize);
            newState = newState.set('isReady', false);
            break;

        case targetActions.TARGET_CONTENTS_KNOWN:
            newState = newState.set('memMap', action.targetMemMap);
            newState = newState.set('regions', action.targetRegions);
            newState = newState.set('labels', action.targetLabels);
            newState = newState.set('isReady', true);
            break;

        case targetActions.TARGET_REGIONS_KNOWN: {
            newState = newState.set('regions', action.regions);
            newState = newState.set('isReady', true);
            break;
        }

        case targetActions.TARGET_WRITABLE_KNOWN:
            newState = newState.set('isWritable', action.isWritable);
            break;

        case fileActions.FILES_EMTPY:
            newState = newState.set('writtenAddress', 0);
            break;

        case fileActions.FILE_PARSE: {
            newState = newState.set('writtenAddress', 0);
            break;
        }

        case targetActions.WRITE_PROGRESS_START:
            newState = newState.set('isReady', false);
            break;

        case targetActions.WRITE_PROGRESS:
            newState = newState.set('writtenAddress', action.address);
            newState = newState.set('isReady', false);
            break;

        case targetActions.WRITE_PROGRESS_FINISHED:
            newState = newState.set('writtenAddress', 0);
            newState = newState.set('isReady', true);
            break;

        default:
    }
    return newState;
}
