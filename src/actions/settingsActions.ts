/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    settingsLoad,
    toggleAutoRead as toggleAutoReadAction,
    toggleAutoReset as toggleAutoResetAction,
} from '../reducers/settingsReducer';
import { RootState, TDispatch } from '../reducers/types';
import { getSettings, setSettings } from '../store';

export function loadSettings() {
    return (dispatch: TDispatch) => {
        const settings = getSettings();

        if (!settings.autoRead) {
            settings.autoRead = false;
        }

        if (settings.autoReset == null) {
            settings.autoReset = true;
        }

        setSettings(settings);
        dispatch(settingsLoad(settings));
    };
}

export function toggleAutoRead() {
    return (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(toggleAutoReadAction());
        const settings = getSettings();

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        setSettings({
            ...settings,
            autoRead: getState().app.settings.autoRead,
        });
    };
}

export function toggleAutoReset() {
    return (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(toggleAutoResetAction());
        const settings = getSettings();

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        setSettings({
            ...settings,
            autoReset: getState().app.settings.autoReset,
        });
    };
}
