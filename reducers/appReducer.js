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

import Store from 'electron-store';

const persistentStore = new Store({ name: 'nrf-programmer' });


// Colours from:
// https://github.com/d3/d3-scale-chromatic
const colours = [
    '#b3e2cd',
    '#fdcdac',
    '#cbd5e8',
    '#f4cae4',
    '#e6f5c9',
    '#fff2ae',
    '#f1e2cc',
    '#cccccc',
];

const initialState = {
    blocks: new Map(),
    fileError: null,
    targetSize: 0x00100000,  // 1MiB. TODO: Set a saner default?
    targetPort: null,
    targetIsReady: false,   // Flag to denote that a devkit is busy (or unconnected)
    writtenAddress: 0,
    filenames: [],
    fileColours: new Map(),
    fileModTimes: new Map(),
    fileLoadTimes: new Map(),
    mruFiles: persistentStore.get('mruFiles') || []
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case 'SERIAL_PORT_SELECTED':
            return {
                ...state,
                targetPort: action.port.comName,
                targetSerialNumber: action.port.serialNumber,
                writtenAddress: 0,
                targetIsReady: false,
            };
        case 'target-size-known':
            // Fetching target's flash size is async, armor against race conditions
            if (action.targetPort !== state.targetPort) {
                return state;
            }
            return {
                ...state,
                targetSize: action.targetSize,
                targetPageSize: action.targetPageSize,
                targetIsReady: true,
            };
        case 'empty-files':
            return {
                ...state,
//                     fileError: action.fileError,
//                     blocks: new Map(),
                blocks: new Map(),
                filenames: [],
                fileColours: new Map(),
                fileModTimes: new Map(),
                fileLoadTimes: new Map(),
            };
        case 'file-error':
            return {
                ...state,
                fileError: action.fileError,
//                     blocks: new Map(),
//                     filenames: [],
            };
        case 'file-parse':
//             let filenames = state.filenames;
            if (state.filenames.indexOf(action.filename) === -1) {
                state.filenames.push(action.filename)
            }

            if (!state.fileColours.has(action.filename)) {
                state.fileColours.set(
                    action.filename,
                    colours[(state.blocks.size) % 8]
                );
            }

            return {
                ...state,
                fileError: null,
                blocks: new Map(state.blocks.set(action.filename, action.blocks)),
                filenames: state.filenames,
                fileColours: state.fileColours,
                fileModTimes: state.fileModTimes.set(action.filename, action.fileModTime),
                fileLoadTimes: state.fileLoadTimes.set(action.fullFilename, action.fileLoadTime),
                writtenAddress: 0,
            };
        case 'write-progress-start':
            return {
                ...state,
                targetIsReady: false,
            };
        case 'write-progress':
            return {
                ...state,
                writtenAddress: action.address,
                targetIsReady: false,
            };
        case 'write-progress-finished':
            return {
                ...state,
//                 writtenAddress: action.address,
                writtenAddress: 0,
                targetIsReady: true,
            };
        default:
            return state;
    }
}
