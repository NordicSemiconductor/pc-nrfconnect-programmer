/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export interface McubootState {
    isVisible: boolean;
}

const initialState: McubootState = {
    isVisible: false,
};

const mcubootSlice = createSlice({
    name: 'mcuboot',
    initialState,
    reducers: {
        setShowMcuBootProgrammingDialog(state, action: PayloadAction<boolean>) {
            state.isVisible = action.payload;
        },
    },
    extraReducers: {
        'device/selectDevice': () => ({ ...initialState }),
    },
});

export default mcubootSlice.reducer;

const { setShowMcuBootProgrammingDialog } = mcubootSlice.actions;

export const getShowMcuBootProgrammingDialog = (state: RootState) =>
    state.app.mcuboot.isVisible;

export { setShowMcuBootProgrammingDialog };
