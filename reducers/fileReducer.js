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

if (!persistentStore.get('mruFiles')) {
    persistentStore.set('mruFiles', []);
}

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
    loaded: {
        blockSets: new Map(),
        filenames: [],
        fileColours: new Map(),
        fileModTimes: new Map(),
        fileLoadTimes: new Map(),
        regions: {}, // heruistically detected code region 0, and memory readback protection
        labels: {},  // heruistically detected bootloader, mbr, mbr params
    },

    mruFiles: persistentStore.get('mruFiles'),
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case 'EMPTY_FILES':
            return {
                ...state,
                loaded: {
                    blockSets: new Map(),
                    filenames: [],
                    fileColours: new Map(),
                    fileModTimes: new Map(),
                    fileLoadTimes: new Map(),
                    regions: {},
                    labels: {},
                },
            };
        case 'FILE_PARSE': {
            const { loaded } = state;
            if (loaded.filenames.indexOf(action.filename) === -1) {
                loaded.filenames.push(action.filename);
            }

            if (!loaded.fileColours.has(action.filename)) {
                loaded.fileColours.set(
                    action.filename,
                    colours[(loaded.blockSets.size) % 8],
                );
            }

            for (const [region, length] of Object.entries(action.regions)) {
                if (length !== undefined) {
                    loaded.regions[region] = length;
                }
            }

            for (const [label, address] of Object.entries(action.labels)) {
                if (address !== undefined) {
                    loaded.labels[label] = address;
                }
            }

            const mruFiles = persistentStore.get('mruFiles');
            if (mruFiles.indexOf(action.fullFilename) === -1) {
                mruFiles.unshift(action.fullFilename);
                mruFiles.splice(10);
                persistentStore.set('mruFiles', mruFiles);

                console.log('MRU files are:', persistentStore.get('mruFiles'));
            }

            return {
                ...state,
                fileError: null,
                mruFiles,
                loaded: {
                    blockSets: new Map(loaded.blockSets.set(action.filename, action.blocks)),
                    filenames: loaded.filenames,
                    fileColours: loaded.fileColours,
                    fileModTimes: loaded.fileModTimes.set(action.filename, action.fileModTime),
                    fileLoadTimes: loaded.fileLoadTimes.set(
                        action.fullFilename, action.fileLoadTime,
                    ),
                    regions: loaded.regions,
                    labels: loaded.labels,
                },

            };
        }
        default:
    }
    return state;
}
