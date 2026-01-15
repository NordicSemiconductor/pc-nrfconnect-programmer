/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { type DeviceCore } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { defaultDeviceDefinition } from '../util/devices';
import {
    type CoreDefinitions,
    type CoreMemMap,
    type CoreOperations,
    type CoreProtection,
    type CoreState,
    type DeviceDefinition,
    type DeviceFamily,
} from '../util/deviceTypes';
import { fileParse, filesEmpty } from './fileReducer';
import type { RootState } from './types';

const initialState: DeviceDefinition = {
    ...defaultDeviceDefinition,
    deviceBusy: false,
};

const targetSlice = createSlice({
    name: 'target',
    initialState,
    reducers: {
        setDeviceDefinition(state, action: PayloadAction<DeviceDefinition>) {
            state.family = action.payload.family;
            state.type = action.payload.type;
            state.coreDefinitions = action.payload.coreDefinitions;
            state.coreProtection = action.payload.coreProtection;
            state.coreMemMap = action.payload.coreMemMap;
        },
        setDeviceFamily(state, action: PayloadAction<DeviceFamily>) {
            state.family = action.payload;
        },
        setDeviceType(state, action: PayloadAction<string>) {
            state.type = action.payload;
        },
        setCoreInfos(state, action: PayloadAction<CoreDefinitions>) {
            state.coreDefinitions = action.payload;
        },
        updateCoreInfos(
            state,
            action: PayloadAction<Partial<CoreDefinitions>>,
        ) {
            state.coreDefinitions = {
                ...state.coreDefinitions,
                ...action.payload,
            };
        },
        setCoreOperations(state, action: PayloadAction<CoreOperations>) {
            state.coreOperation = action.payload;
        },
        updateCoreOperations(
            state,
            action: PayloadAction<{ core: DeviceCore; state: CoreState }>,
        ) {
            state.coreOperation = {
                ...state.coreOperation,
                [action.payload.core]: action.payload.state,
            };
        },
        setCoreProtection(state, action: PayloadAction<CoreProtection>) {
            state.coreProtection = action.payload;
        },
        updateCoreProtection(
            state,
            action: PayloadAction<Partial<CoreProtection>>,
        ) {
            state.coreProtection = {
                ...state.coreProtection,
                ...action.payload,
            };
        },
        setCoreMemMap(state, action: PayloadAction<CoreMemMap>) {
            state.coreMemMap = action.payload;
        },
        updateCoreMemMap(state, action: PayloadAction<Partial<CoreMemMap>>) {
            state.coreMemMap = {
                ...state.coreMemMap,
                ...action.payload,
            };
        },
        setDeviceBusy(state, action: PayloadAction<boolean>) {
            state.deviceBusy = action.payload;
        },
        resetDeviceInfo() {
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

export const getDeviceDefinition = (state: RootState) =>
    state.app.deviceDefinition;
export const getDeviceIsBusy = (state: RootState) =>
    state.app.deviceDefinition.deviceBusy;
export const getDeviceFamily = (state: RootState) =>
    state.app.deviceDefinition.family;

export const getDeviceFamilyType = (state: RootState) =>
    state.app.deviceDefinition.type;

export const getCoreDefinitions = (state: RootState) =>
    state.app.deviceDefinition.coreDefinitions;

export const getCoreMemMap = (state: RootState) =>
    state.app.deviceDefinition.coreMemMap;

export default targetSlice.reducer;

const {
    setDeviceDefinition,
    setDeviceFamily,
    setDeviceType,
    setCoreInfos,
    updateCoreInfos,
    setCoreProtection,
    updateCoreProtection,
    setCoreOperations,
    updateCoreOperations,
    setCoreMemMap,
    updateCoreMemMap,
    setDeviceBusy,
    resetDeviceInfo,
} = targetSlice.actions;

export {
    setDeviceDefinition,
    setDeviceFamily,
    setDeviceType,
    setCoreInfos,
    updateCoreInfos,
    setCoreProtection,
    updateCoreProtection,
    setCoreOperations,
    updateCoreOperations,
    setCoreMemMap,
    updateCoreMemMap,
    setDeviceBusy,
    resetDeviceInfo,
};
