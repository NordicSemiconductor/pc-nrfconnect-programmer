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
    autoUpdateOBFirmware: boolean;
}

const initialState: SettingsState = {
    forceMcuBoot: false,
    autoRead: false,
    autoReset: false,
    autoUpdateOBFirmware: true,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
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
        toggleAutoUpdateOBFirmware(state) {
            state.autoUpdateOBFirmware = !state.autoUpdateOBFirmware;
        },
    },
});

export default settingsSlice.reducer;

const {
    settingsLoad,
    toggleAutoRead,
    toggleAutoReset,
    toggleAutoUpdateOBFirmware,
} = settingsSlice.actions;

export {
    settingsLoad,
    toggleAutoRead,
    toggleAutoReset,
    toggleAutoUpdateOBFirmware,
};

export const getAutoRead = (state: RootState) => state.app.settings.autoRead;
export const getAutoReset = (state: RootState) => state.app.settings.autoReset;
export const getAutoUpdateOBFirmware = (state: RootState) =>
    state.app.settings.autoUpdateOBFirmware;
