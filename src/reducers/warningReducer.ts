/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

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
    },
    extraReducers: {
        'device/selectDevice': state => {
            state.targetWarnings = [];
            state.userWarnings = [];
        },
    },
});

export default warningSlice.reducer;

const { fileWarningAdd, fileWarningRemove } = warningSlice.actions;

export const getFileWarnings = (state: RootState) =>
    state.app.warning.fileWarnings;
export { fileWarningAdd, fileWarningRemove };
