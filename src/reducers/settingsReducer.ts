/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export interface SettingsState {
    forceMcuBoot: boolean;
    autoRead: boolean;
    autoReset: boolean;
}

const initialState: SettingsState = {
    forceMcuBoot: false,
    autoRead: false,
    autoReset: false,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setForceMcuBoot(state, action: PayloadAction<boolean>) {
            state.forceMcuBoot = action.payload;
        },
        settingsLoad(state, action: PayloadAction<SettingsState>) {
            state.autoRead = action.payload.autoRead;
            state.autoReset = action.payload.autoReset;
        },
        toggleAutoRead(state) {
            state.autoRead = !state.autoRead;
        },
        toggleAutoReset(state) {
            state.autoReset = !state.autoReset;
        },
    },
});

export default settingsSlice.reducer;

const { setForceMcuBoot, settingsLoad, toggleAutoRead, toggleAutoReset } =
    settingsSlice.actions;

export { setForceMcuBoot, settingsLoad, toggleAutoRead, toggleAutoReset };

export const getAutoRead = (state: RootState) => state.app.settings.autoRead;
export const getAutoReset = (state: RootState) => state.app.settings.autoReset;
export const getForceMcuBoot = (state: RootState) =>
    state.app.settings.forceMcuBoot;
