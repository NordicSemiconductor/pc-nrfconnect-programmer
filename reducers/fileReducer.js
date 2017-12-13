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

import { basename } from 'path';

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
    loaded: {},
    memMaps: [],
    fileError: null,
    mruFiles: [],
    availableColours: Array.from(colours),
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case 'EMPTY_FILES': {
            const { mruFiles } = state;
            return {
                ...initialState,
                mruFiles,
                availableColours: Array.from(colours),
            };
        }
        case 'FILE_PARSE': {
            const { loaded, availableColours } = state;
            const { filePath, memMap, modTime, loadTime, regions, labels } = action;

            if (loaded[action.filePath]) {
                break;
            }

            const memMaps = [
                ...state.memMaps,
                [filePath, memMap],
            ];

            let colour;
            console.log('Picking colour. Pool is ', availableColours);
            if (availableColours.length) {
                colour = availableColours.shift();
            } else {
                const hue = Math.random() * 360;
                const saturation = 35 + (Math.random() * 65);
                const lightness = 50 + (Math.random() * 35);
                colour = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            }

            const newState = {
                ...state,
                fileError: null,
                loaded: {
                    ...loaded,
                    [filePath]: {
                        filename: basename(filePath),
                        colour,
                        modTime,
                        loadTime,
                        memMap,
                        regions,
                        labels,
                    },
                },
                memMaps,
            };

            return newState;
        }

        case 'REMOVE_FILE': {
            const { loaded, memMaps, availableColours } = state;
            const { filePath } = action;

            const newLoaded = { ...loaded };
            const oldColour = newLoaded[filePath].colour;
            delete newLoaded[filePath];

            const newMemMaps = memMaps.filter(element => element[0] !== filePath);

            // Return this colour to the pool, but only if it was in the pool in the first place
            if (colours.indexOf(oldColour) !== -1) {
                availableColours.push(oldColour);
                console.log('Colour returned to pool, now ', availableColours);
            }

            return {
                ...state,
                loaded: newLoaded,
                memMaps: newMemMaps,
                availableColours,
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
