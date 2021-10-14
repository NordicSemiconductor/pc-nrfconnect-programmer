/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { NrfConnectState } from 'pc-nrfconnect-shared';

import { FileState } from './fileReducer';
import { McubootState } from './mcubootReducer';
import { ModemState } from './modemReducer';
import { SettingsState } from './settingsReducer';
import { TargetState } from './targetReducer';
import { UserInputState } from './userInputReducer';
import { WarningState } from './warningReducer';

interface AppState {
    // AppState {
    file: FileState;
    mcuboot: McubootState;
    modem: ModemState;
    settings: SettingsState;
    target: TargetState;
    userInput: UserInputState;
    warning: WarningState;
}

export type RootState = NrfConnectState<AppState>;

export type TDispatch = ThunkDispatch<RootState, null, AnyAction>;
