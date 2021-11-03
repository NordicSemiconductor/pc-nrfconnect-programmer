/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './types';

export interface WarningState {
    fileWarnings: string[];
    targetWarnings: string[];
    userWarnings: string[];
}

const initialState: WarningState = {
    fileWarnings: [],
    targetWarnings: [],
    userWarnings: [],
};

const warningSlice = createSlice({
    name: 'warning',
    initialState,
    reducers: {
        fileWarningAdd(state, action: PayloadAction<string>) {
            state.fileWarnings = [...state.fileWarnings, action.payload];
        },
        fileWarningRemove(state) {
            state.fileWarnings = [];
        },
        targetWarningAdd(state, action: PayloadAction<string>) {
            state.targetWarnings = [...state.targetWarnings, action.payload];
        },
        targetWarningRemove(state) {
            state.targetWarnings = [];
        },
        userWarningAdd(state, action: PayloadAction<string>) {
            state.userWarnings = [...state.userWarnings, action.payload];
        },
        userWarningRemove(state) {
            state.userWarnings = [];
        },
        allWarningRemove() {
            return { ...initialState };
        },
    },
    extraReducers: {
        'device/selectDevice': state => {
            state.targetWarnings = [];
            state.userWarnings = [];
        },
    },
});

export default warningSlice.reducer;

const {
    fileWarningAdd,
    fileWarningRemove,
    targetWarningAdd,
    targetWarningRemove,
    userWarningAdd,
    userWarningRemove,
    allWarningRemove,
} = warningSlice.actions;

export const getUserWarnings = (state: RootState) =>
    state.app.warning.userWarnings;
export const getFileWarnings = (state: RootState) =>
    state.app.warning.fileWarnings;
export const getTargetWarnings = (state: RootState) =>
    state.app.warning.targetWarnings;

export {
    fileWarningAdd,
    fileWarningRemove,
    targetWarningAdd,
    targetWarningRemove,
    userWarningAdd,
    userWarningRemove,
    allWarningRemove,
};
