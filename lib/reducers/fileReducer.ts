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

import * as fileActions from '../actions/fileActions';
import { Region } from '../util/regions';

export interface FileState {
    detectedRegionNames: Set<string>;
    // eslint-disable-next-line @typescript-eslint/ban-types
    loaded: {};
    mcubootFilePath?: string;
    memMaps: [];
    mruFiles: string[];
    regions: Region[];
}

const defaultState: FileState = {
    detectedRegionNames: new Set<string>(),
    loaded: {},
    mcubootFilePath: undefined,
    memMaps: [],
    mruFiles: [],
    regions: [],
};

export default (state = defaultState, action: any): FileState =>
    produce<FileState>(state, draft => {
        switch (action.type) {
            case fileActions.FILES_EMPTY:
                return {
                    ...defaultState,
                    mruFiles: state.mruFiles,
                };

            case fileActions.FILE_PARSE:
                draft.memMaps = action.memMaps;
                draft.loaded = action.loaded;
                break;

            case fileActions.FILE_REGIONS_KNOWN:
                draft.regions = action.regions;
                break;

            case fileActions.FILE_REGION_NAMES_KNOWN:
                draft.detectedRegionNames = action.detectedRegionNames;
                break;

            case fileActions.MRU_FILES_LOAD_SUCCESS:
                draft.mruFiles = action.files || [];
                break;

            case fileActions.MCUBOOT_FILE_KNOWN:
                draft.mcubootFilePath = action.filePath;
                break;

            default:
        }
    });
