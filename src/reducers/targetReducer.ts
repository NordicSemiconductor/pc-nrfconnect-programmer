/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import MemoryMap from 'nrf-intel-hex';

import {
    CommunicationType,
    defaultDeviceDefinition,
    DeviceDefinition,
} from '../util/devices';
import { Region } from '../util/regions';
import { fileParse, filesEmpty } from './fileReducer';
import type { RootState } from './types';

export interface TargetState {
    readonly targetType: CommunicationType;
    readonly deviceInfo?: DeviceDefinition;
    readonly memMap?: MemoryMap;
    readonly regions?: Region[]; // TODO: Define region
    readonly warnings?: string[];
    readonly writtenAddress?: number;
    readonly isMemLoaded: boolean;
    readonly isWritable: boolean;
    readonly isRecoverable: boolean;
    readonly isWriting: boolean;
    readonly isErasing: boolean;
    readonly isErased: boolean;
    readonly isLoading: boolean;
}

const initialState: TargetState = {
    targetType: CommunicationType.UNKNOWN,
    deviceInfo: defaultDeviceDefinition,
    memMap: undefined,
    regions: [],
    warnings: [],
    writtenAddress: 0,
    isMemLoaded: false,
    isWritable: false,
    isRecoverable: false,
    isWriting: false,
    isErasing: false,
    isErased: false,
    isLoading: false,
};

interface TargetTypeKnownPayload {
    targetType: CommunicationType;
    isRecoverable: boolean;
}

interface TargetContentsKnownPayload {
    targetMemMap: MemoryMap;
    isMemLoaded: boolean;
}

const targetSlice = createSlice({
    name: 'target',
    initialState,
    reducers: {
        targetTypeKnown(state, action: PayloadAction<TargetTypeKnownPayload>) {
            state.targetType = action.payload.targetType;
            state.isRecoverable = action.payload.isRecoverable;
        },
        targetInfoKnown(state, action: PayloadAction<DeviceDefinition>) {
            state.deviceInfo = action.payload;
        },
        targetContentsKnown(
            state,
            action: PayloadAction<TargetContentsKnownPayload>
        ) {
            state.memMap = action.payload.targetMemMap;
            state.isMemLoaded = action.payload.isMemLoaded;
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
        selectDevice(_, action: PayloadAction<string>) {
            return {
                ...initialState,
                serialNumber: action.payload,
            };
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
    targetTypeKnown,
    targetInfoKnown,
    targetContentsKnown,
    targetRegionsKnown,
    targetWritableKnown,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
    selectDevice,
    deselectDevice,
} = targetSlice.actions;

export const getTargetType = (state: RootState) => state.app.target.targetType;
export const getIsReady = (state: RootState) =>
    !state.app.target.isLoading &&
    !state.app.target.isWriting &&
    !state.app.target.isErasing;
export const getIsMemLoaded = (state: RootState) =>
    state.app.target.isMemLoaded;
export const getIsRecoverable = (state: RootState) =>
    state.app.target.isRecoverable;
export const getIsWritable = (state: RootState) => state.app.target.isWritable;
export const getDeviceInfo = (state: RootState) => state.app.target.deviceInfo;
export const getRegions = (state: RootState) => state.app.target.regions;
export const getIsWriting = (state: RootState) => state.app.target.isWriting;
export const getIsErasing = (state: RootState) => state.app.target.isErasing;
export const getIsLoading = (state: RootState) => state.app.target.isLoading;

export const getRefreshEnabled = (state: RootState) =>
    state.app.target.targetType === CommunicationType.JLINK &&
    !state.app.target.isMemLoaded &&
    !state.app.target.isLoading &&
    !state.app.target.isWriting &&
    !state.app.target.isErasing &&
    !state.app.mcuboot.isMcuboot;

export {
    targetTypeKnown,
    targetInfoKnown,
    targetContentsKnown,
    targetRegionsKnown,
    targetWritableKnown,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
    selectDevice,
    deselectDevice,
};
