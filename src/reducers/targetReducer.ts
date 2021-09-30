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

import { Device } from '@nordicsemiconductor/nrf-device-lib-js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import MemoryMap from 'nrf-intel-hex';

import {
    CommunicationType,
    DeviceDefinition,
    deviceDefinition,
} from '../util/devices';
import { DfuImage } from '../util/initPacket';
import { Region } from '../util/regions';
import { fileParse, filesEmpty } from './fileReducer';
import { RootState } from './types';

export interface TargetState {
    readonly targetType: CommunicationType;
    readonly port?: string;
    readonly serialNumber?: string;
    readonly deviceInfo?: DeviceDefinition;
    readonly device?: Device;
    readonly memMap?: MemoryMap;
    readonly regions?: Region[]; // TODO: Define region
    readonly warnings?: string[];
    readonly writtenAddress?: number;
    readonly dfuImages?: DfuImage[]; // TODO: Define image
    readonly isMemLoaded: boolean;
    readonly isWritable: boolean;
    readonly isRecoverable: boolean;
    readonly isWriting: boolean;
    readonly isErasing: boolean;
    readonly isErased: boolean;
    readonly isLoading: boolean;
    readonly isProtected: boolean;
}

const initialState: TargetState = {
    targetType: CommunicationType.UNKNOWN,
    port: undefined,
    serialNumber: undefined,
    deviceInfo: deviceDefinition,
    memMap: undefined,
    regions: [],
    warnings: [],
    writtenAddress: 0,
    dfuImages: [],
    isMemLoaded: false,
    isWritable: false,
    isRecoverable: false,
    isWriting: false,
    isErasing: false,
    isErased: false,
    isLoading: false,
    isProtected: false,
};

interface TargetTypeKnownPayload {
    targetType: CommunicationType;
    isRecoverable: boolean;
}

interface TargetPortChangedPayload {
    serialNumber: string;
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
        targetTypeKnown(state, action: PayloadAction<TargetTypeKnownPayload>) {
            state.targetType = action.payload.targetType;
            state.isRecoverable = action.payload.isRecoverable;
        },
        targetInfoKnown(state, action: PayloadAction<DeviceDefinition>) {
            state.deviceInfo = action.payload;
        },
        targetDeviceKnown(state, action: PayloadAction<Device>) {
            state.device = action.payload;
        },
        targetPortChanged(
            state,
            action: PayloadAction<TargetPortChangedPayload>
        ) {
            state.serialNumber = action.payload.serialNumber;
            state.port = action.payload.path;
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
        dfuImagesUpdate(state, action: PayloadAction<any[]>) {
            state.dfuImages = action.payload;
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
    },
    extraReducers: {
        DEVICE_SELECTED: (_, action) => {
            return {
                ...initialState,
                serialNumber: action.device.serialNumber,
            };
        },
        DEVICE_DESELECTED: () => ({ ...initialState }),
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
    targetDeviceKnown,
    targetPortChanged,
    targetContentsKnown,
    targetRegionsKnown,
    targetWritableKnown,
    dfuImagesUpdate,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
} = targetSlice.actions;

export const getPort = (state: RootState) => state.app.target.port;
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
export const getSerialNumber = (state: RootState) =>
    state.app.target.serialNumber;
export const getIsWriting = (state: RootState) => state.app.target.isWriting;
export const getIsErasing = (state: RootState) => state.app.target.isErasing;
export const getIsLoading = (state: RootState) => state.app.target.isLoading;
export const getIsProtected = (state: RootState) =>
    state.app.target.isProtected;
export const getRefreshEnabled = (state: RootState) =>
    state.app.target.targetType === CommunicationType.JLINK &&
    !state.app.target.isMemLoaded &&
    !state.app.target.isLoading &&
    !state.app.target.isWriting &&
    !state.app.target.isErasing;

export {
    targetTypeKnown,
    targetInfoKnown,
    targetDeviceKnown,
    targetPortChanged,
    targetContentsKnown,
    targetRegionsKnown,
    targetWritableKnown,
    dfuImagesUpdate,
    writeProgress,
    writingStart,
    writingEnd,
    erasingStart,
    erasingEnd,
    loadingStart,
    loadingEnd,
};
