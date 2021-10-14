/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './types';

export interface SettingsState {
    autoRead: boolean;
}

const initialState: SettingsState = {
    autoRead: false,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        settingsLoad(state, action: PayloadAction<SettingsState>) {
            state.autoRead = action.payload.autoRead;
        },
        toggleAutoRead(state) {
            state.autoRead = !state.autoRead;
        },
    },
});

export default settingsSlice.reducer;

const { settingsLoad, toggleAutoRead } = settingsSlice.actions;

export const getAutoRead = (state: RootState) => state.app.settings.autoRead;

export { settingsLoad, toggleAutoRead };
