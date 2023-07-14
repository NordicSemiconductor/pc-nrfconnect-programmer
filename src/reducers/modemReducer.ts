/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export interface ModemState {
    isVisible: boolean;
}

const initialState: ModemState = {
    isVisible: false,
};

const modemSlice = createSlice({
    name: 'modem',
    initialState,
    reducers: {
        setShowModemProgrammingDialog(state, action: PayloadAction<boolean>) {
            state.isVisible = action.payload;
        },
    },
});

export const getShowModemProgrammingDialog = (state: RootState) =>
    state.app.modem.isVisible;

export default modemSlice.reducer;
const { setShowModemProgrammingDialog } = modemSlice.actions;
export { setShowModemProgrammingDialog };
