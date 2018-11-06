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
import { Record, List, Set } from 'immutable';

import * as fileActions from '../actions/fileActions';

const InitialState = new Record({
    loaded: {},
    memMaps: [],
    regions: new List(),
    fileError: null,
    mruFiles: [],
    detectedRegionNames: new Set(),
});

export default function reducer(state = new InitialState(), action) {
    switch (action.type) {
        case fileActions.FILES_EMPTY: {
            const { mruFiles } = state;
            return new InitialState().set('mruFiles', mruFiles);
        }

        case fileActions.FILE_PARSE: {
            const { loaded } = state;
            const { filePath, memMap, modTime, loadTime } = action;

            if (loaded[action.filePath]) {
                break;
            }

            const memMaps = [
                ...state.memMaps,
                [filePath, memMap],
            ];

            return state
                .set('fileError', null)
                .set('memMaps', memMaps)
                .set('loaded', {
                    ...loaded,
                    [filePath]: {
                        filename: basename(filePath),
                        modTime,
                        loadTime,
                        memMap,
                    },
                });
        }

        case fileActions.FILE_REGIONS_KNOWN:
            return state.set('regions', action.regions);

        case fileActions.FILE_REGION_NAMES_KNOWN:
            return state.set('detectedRegionNames', action.detectedRegionNames);

        case fileActions.FILE_REMOVE: {
            const { loaded, memMaps } = state;
            const { filePath } = action;
            const newMemMaps = memMaps.filter(element => element[0] !== filePath);
            const newLoaded = { ...loaded };
            delete newLoaded[filePath];

            return state
                .set('loaded', newLoaded)
                .set('memMaps', newMemMaps);
        }

        case fileActions.MRU_FILES_LOAD_SUCCESS: {
            return state.set('mruFiles', action.files || []);
        }

        default:
    }
    return state;
}
