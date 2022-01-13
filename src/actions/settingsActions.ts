/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import Store from 'electron-store';

import {
    settingsLoad,
    toggleAutoRead as toggleAutoReadAction,
    toggleAutoReset as toggleAutoResetAction,
} from '../reducers/settingsReducer';
import { RootState, TDispatch } from '../reducers/types';

const persistentStore = new Store({ name: 'pc-nrfconnect-programmer' });

export function loadSettings() {
    return (dispatch: TDispatch) => {
        const settings = persistentStore.get('settings') || {};
        if (settings.autoRead == null) {
            settings.autoRead = false;
        }
        if (settings.autoReset == null) {
            settings.autoReset = true;
        }
        persistentStore.set('settings', settings);
        dispatch(settingsLoad(settings));
    };
}

export function toggleAutoRead() {
    return (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(toggleAutoReadAction());
        const settings = persistentStore.get('settings') || {};

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        persistentStore.set('settings', {
            ...settings,
            autoRead: getState().app.settings.autoRead,
        });
    };
}

export function toggleAutoReset() {
    return (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(toggleAutoResetAction());
        const settings = persistentStore.get('settings') || {};

        // Do not use async functions above，
        // otherwise the state would be the same as before toggling
        persistentStore.set('settings', {
            ...settings,
            autoReset: getState().app.settings.autoReset,
        });
    };
}
