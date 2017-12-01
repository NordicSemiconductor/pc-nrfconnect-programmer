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

// Colours from:
// https://github.com/d3/d3-scale-chromatic
const colours = [
    '#e78ac3',
    '#ffd92f',
    '#8da0cb',
    '#a6d854',
    '#e5c494',
    '#66c2a5',
    '#b3b3b3',
];

const initialState = {
    loaded: {
        memMaps: new Map(),
        filenames: [],
        fileColours: new Map(),
        fileModTimes: new Map(),
        fileLoadTimes: new Map(),
        fileLabels: new Map(), // heuristically detected bootloader, mbr, mbr params
        regions: {}, // heuristically detected code region 0, and memory readback protection
    },

    mruFiles: [],
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case 'EMPTY_FILES':
            return {
                ...state,
                loaded: {
                    memMaps: new Map(),
                    filenames: [],
                    fileColours: new Map(),
                    fileModTimes: new Map(),
                    fileLoadTimes: new Map(),
                    fileLabels: new Map(),
                    regions: {},
                    labels: {},
                },
            };
        case 'FILE_PARSE': {
            const { loaded } = state;

            // Find the first slot in the 'loaded.filenames' which is undefined,
            // because deleting items will turn this into a sparse array.
            if (loaded.filenames.indexOf(action.fullFilename) === -1) {
                for (let i = 0, l = loaded.filenames.length + 1; i < l; i += 1) {
                    if (loaded.filenames[i] === undefined) {
                        loaded.filenames[i] = action.fullFilename;
                        break;
                    }
                }
            }

            if (!loaded.fileColours.has(action.fullFilename)) {
                loaded.fileColours.set(
                    action.fullFilename,
                    colours[(loaded.filenames.indexOf(action.fullFilename)) % colours.length],
                );
            }

            for (const [region, length] of Object.entries(action.regions)) {
                if (length !== undefined) {
                    loaded.regions[region] = length;
                }
            }

            if (!loaded.fileLabels.has(action.fullFilename)) {
                loaded.fileLabels.set(
                    action.fullFilename,
                    action.labels,
                );
            }

            return {
                ...state,
                fileError: null,
                loaded: {
                    memMaps: new Map(loaded.memMaps.set(action.fullFilename, action.memMap)),
                    filenames: loaded.filenames,
                    fileColours: loaded.fileColours,
                    fileModTimes: loaded.fileModTimes.set(action.fullFilename, action.fileModTime),
                    fileLoadTimes: loaded.fileLoadTimes.set(
                        action.fullFilename, action.fileLoadTime,
                    ),
                    fileLabels: loaded.fileLabels,
                    regions: loaded.regions,
                },

            };
        }

        case 'REMOVE_FILE': {
            const { loaded } = state;
            const { filePath } = action;

            const newLoaded = { ...loaded };

//             const newMemMaps = memMaps.filter(element => element[0] !== filePath);

            newLoaded.memMaps.delete(filePath);
            newLoaded.fileColours.delete(filePath);
            newLoaded.fileModTimes.delete(filePath);
            newLoaded.fileLoadTimes.delete(filePath);
            newLoaded.fileLabels.delete(filePath);

            const i = loaded.filenames.indexOf(filePath);
            delete (loaded.filenames[i]);

            return {
                ...state,
                loaded: newLoaded,
            };
        }
        case 'LOAD_MRU_FILES_SUCCESS':
            return {
                ...state,
                mruFiles: action.files || [],
            };
        default:
    }
    return state;
}
