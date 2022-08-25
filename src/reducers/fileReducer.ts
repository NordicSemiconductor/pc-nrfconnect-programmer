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
    detectedRegionNames: Set<string>;
    loaded: Record<string, Loaded>;
    mcubootFilePath?: string;
    zipFilePath?: string;
    memMaps: MemoryMaps;
    mruFiles: string[];
    regions: Region[];
    elf?: object;
}

const initialState: FileState = {
    detectedRegionNames: new Set(),
    loaded: {},
    mcubootFilePath: undefined,
    zipFilePath: undefined,
    memMaps: [],
    mruFiles: [],
    regions: [],
    elf: undefined,
};

interface FileParsePayload {
    memMaps: MemoryMaps;
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
        elfParse(state, action: PayloadAction<object>) {
            state.elf = action.payload;
        },
        fileParse(state, action: PayloadAction<FileParsePayload>) {
            state.memMaps = action.payload.memMaps;
            state.loaded = action.payload.loaded;
        },
        fileRegionsKnown(state, action: PayloadAction<Region[]>) {
            state.regions = action.payload;
        },
        fileRegionNamesKnown(state, action: PayloadAction<Set<string>>) {
            state.detectedRegionNames = action.payload;
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
    elfParse,
    fileRegionsKnown,
    fileRegionNamesKnown,
    mruFilesLoadSuccess,
    mcubootFileKnown,
    zipFileKnown,
} = fileSlice.actions;

export const getElf = (state: RootState) => state.app.file.elf;
export const getLoaded = (state: RootState) => state.app.file.loaded;
export const getMruFiles = (state: RootState) => state.app.file.mruFiles;
export const getMcubootFilePath = (state: RootState) =>
    state.app.file.mcubootFilePath;
export const getZipFilePath = (state: RootState) => state.app.file.zipFilePath;
export const getFileRegions = (state: RootState) => state.app.file.regions;

export {
    filesEmpty,
    fileParse,
    elfParse,
    fileRegionsKnown,
    fileRegionNamesKnown,
    mruFilesLoadSuccess,
    mcubootFileKnown,
    zipFileKnown,
};
