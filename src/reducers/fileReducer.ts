/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import MemoryMap, { MemoryMaps } from 'nrf-intel-hex';

import { Region } from '../util/regions';
import type { RootState } from './types';

type Loaded = {
    filename: string;
    loadTime: Date;
    modTime: Date;
    memMap: MemoryMap;
};

export interface FileState {
    loaded: Record<string, Loaded>;
    mcubootFilePath?: string;
    zipFilePath?: string;
    memMaps: MemoryMaps<string>;
    mruFiles: string[];
    regions: Region[];
}

const initialState: FileState = {
    loaded: {},
    mcubootFilePath: undefined,
    zipFilePath: undefined,
    memMaps: [],
    mruFiles: [],
    regions: [],
};

interface FileParsePayload {
    memMaps: MemoryMaps<string>;
    loaded: Record<string, Loaded>;
}

const fileSlice = createSlice({
    name: 'file',
    initialState,
    reducers: {
        filesEmpty(state) {
            return {
                ...initialState,
                mruFiles: state.mruFiles,
            };
        },
        fileParse(state, action: PayloadAction<FileParsePayload>) {
            state.memMaps = action.payload.memMaps;
            state.loaded = action.payload.loaded;
        },
        fileRegionsKnown(state, action: PayloadAction<Region[]>) {
            state.regions = action.payload;
        },
        mruFilesLoadSuccess(state, action: PayloadAction<string[]>) {
            state.mruFiles = action.payload || [];
        },

        mcubootFileKnown(state, action: PayloadAction<string | undefined>) {
            state.mcubootFilePath = action.payload;
        },

        zipFileKnown(state, action: PayloadAction<string | undefined>) {
            state.zipFilePath = action.payload;
        },
    },
});

export default fileSlice.reducer;

const {
    filesEmpty,
    fileParse,
    fileRegionsKnown,
    mruFilesLoadSuccess,
    mcubootFileKnown,
    zipFileKnown,
} = fileSlice.actions;

export const getFileMemMaps = (state: RootState) => state.app.file.memMaps;
export const getLoaded = (state: RootState) => state.app.file.loaded;
export const getMruFiles = (state: RootState) => state.app.file.mruFiles;
export const getMcubootFilePath = (state: RootState) =>
    state.app.file.mcubootFilePath;
export const getZipFilePath = (state: RootState) => state.app.file.zipFilePath;
export const getFileRegions = (state: RootState) => state.app.file.regions;

export {
    filesEmpty,
    fileParse,
    fileRegionsKnown,
    mruFilesLoadSuccess,
    mcubootFileKnown,
    zipFileKnown,
};
