/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import MemoryMap from 'nrf-intel-hex';

import { defaultDeviceDefinition, DeviceDefinition } from '../util/devices';
import { Region } from '../util/regions';
import { fileParse, filesEmpty } from './fileReducer';
import type { RootState } from './types';

export interface TargetState {
    readonly port?: string;
    readonly deviceInfo?: DeviceDefinition;
    readonly memMap?: MemoryMap;
    readonly regions?: Region[]; // TODO: Define region
    readonly warnings?: string[];
    readonly writtenAddress?: number;
    readonly isMemLoaded: boolean;
    readonly isWritable: boolean;
    readonly isWriting: boolean;
    readonly isErasing: boolean;
    readonly isErased: boolean;
    readonly isLoading: boolean;
}

const initialState: TargetState = {
    port: undefined,
    deviceInfo: defaultDeviceDefinition,
    memMap: undefined,
    regions: [],
    warnings: [],
    writtenAddress: 0,
    isMemLoaded: false,
    isWritable: false,
    isWriting: false,
    isErasing: false,
    isErased: false,
    isLoading: false,
};

interface TargetPortChangedPayload {
    path?: string;
}

interface TargetContentsKnownPayload {
    targetMemMap: MemoryMap;
    isMemLoaded: boolean;
}

const targetSlice = createSlice({
    name: 'target',
    initialState,
    reducers: {
        targetInfoKnown(state, action: PayloadAction<DeviceDefinition>) {
            state.deviceInfo = action.payload;
        },

        targetPortChanged(
            state,
            action: PayloadAction<TargetPortChangedPayload>
        ) {
            state.port = action.payload.path;
        },
        targetContentsKnown(
            state,
            action: PayloadAction<TargetContentsKnownPayload>
        ) {
            state.memMap = action.payload.targetMemMap;
            state.isMemLoaded = action.payload.isMemLoaded;
        },
        targetContentsUnknown(state) {
            state.memMap = undefined;
            state.isMemLoaded = false;
        },
        targetRegionsKnown(state, action: PayloadAction<Region[]>) {
            state.regions = action.payload;
        },
        targetWritableKnown(state, action: PayloadAction<boolean>) {
            state.isWritable = action.payload;
        },

        writeProgress(state, action: PayloadAction<number>) {
            state.writtenAddress = action.payload;
            state.isWriting = true;
        },
        writingStart(state) {
            state.isWriting = true;
            state.isErased = false;
        },
        writingEnd(state) {
            state.isWriting = false;
        },
        erasingStart(state) {
            state.isErasing = true;
        },
        erasingEnd(state) {
            state.isErasing = false;
            state.isErased = true;
        },
        loadingStart(state) {
            state.isLoading = true;
        },
        loadingEnd(state) {
            state.isLoading = false;
        },

        deselectDevice() {
            return { ...initialState };
        },
    },
    extraReducers: {
        // @ts-expect-error in TypeScript, this would need to be [counter.actions.increment.type]
        [filesEmpty]: state => {
            state.writtenAddress = 0;
        },
        // @ts-expect-error in TypeScript, this would need to be [counter.actions.increment.type]
        [fileParse]: state => {
            state.writtenAddress = 0;
        },
    },
});

export default targetSlice.reducer;

const {
    targetInfoKnown,
    targetPortChanged,
    targetContentsKnown,
    targetContentsUnknown,
    targetRegionsKnown,
    targetWritableKnown,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
    deselectDevice,
} = targetSlice.actions;

export const getPort = (state: RootState) => state.app.target.port;
export const getIsReady = (state: RootState) =>
    !state.app.target.isLoading &&
    !state.app.target.isWriting &&
    !state.app.target.isErasing;
export const getIsMemLoaded = (state: RootState) =>
    state.app.target.isMemLoaded;
export const getIsWritable = (state: RootState) => state.app.target.isWritable;
export const getDeviceInfo = (state: RootState) => state.app.target.deviceInfo;
export const getRegions = (state: RootState) => state.app.target.regions;
export const getIsWriting = (state: RootState) => state.app.target.isWriting;
export const getIsErasing = (state: RootState) => state.app.target.isErasing;
export const getIsLoading = (state: RootState) => state.app.target.isLoading;

export const getRefreshEnabled = (state: RootState) =>
    !state.app.target.isMemLoaded &&
    !state.app.target.isLoading &&
    !state.app.target.isWriting &&
    !state.app.target.isErasing;

export {
    targetInfoKnown,
    targetPortChanged,
    targetContentsKnown,
    targetContentsUnknown,
    targetRegionsKnown,
    targetWritableKnown,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
    deselectDevice,
};
