/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AppThunk } from 'pc-nrfconnect-shared';

import {
    settingsLoad,
    toggleAutoRead as toggleAutoReadAction,
    toggleAutoReset as toggleAutoResetAction,
} from '../reducers/settingsReducer';
import { RootState } from '../reducers/types';
import { getSettings, setSettings } from '../store';

export const loadSettings = (): AppThunk => dispatch => {
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

export const toggleAutoRead =
    (): AppThunk<RootState> => (dispatch, getState) => {
        dispatch(toggleAutoReadAction());
        const settings = getSettings();

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        setSettings({
            ...settings,
            autoRead: getState().app.settings.autoRead,
        });
    };

export const toggleAutoReset =
    (): AppThunk<RootState> => (dispatch, getState) => {
        dispatch(toggleAutoResetAction());
        const settings = getSettings();

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        setSettings({
            ...settings,
            autoReset: getState().app.settings.autoReset,
        });
    };
