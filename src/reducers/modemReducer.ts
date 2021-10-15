/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { RootState } from './types';

export const MODEM_DFU_NOT_STARTED = 'Not started.';
export const MODEM_DFU_STARTING = 'Starting...';

export interface ModemState {
    isModem: boolean;
    isReady: boolean;
    isWriting: boolean;
    isWritingSucceed: boolean;
    isWritingFail: boolean;
    modemFwName: string;
    progressMsg: string;
    progressPercentage: number;
    progressDuration: number;
    progressStep: number;
    progressOperation: string;
    errorMsg: string;
}

const initialState: ModemState = {
    isModem: false,
    isReady: false,
    isWriting: false,
    isWritingSucceed: false,
    isWritingFail: false,
    modemFwName: '',
    progressMsg: MODEM_DFU_NOT_STARTED,
    progressPercentage: 0,
    progressDuration: 0,
    progressStep: 0,
    progressOperation: MODEM_DFU_NOT_STARTED,
    errorMsg: '',
};

interface ModemProcessUpdatePayload {
    message: string;
    progressPercentage?: number;
    duration?: number;
    step?: number;
    operation?: string;
}

const modemSlice = createSlice({
    name: 'modem',
    initialState,
    reducers: {
        modemKnown(state, action: PayloadAction<boolean>) {
            state.isModem = action.payload;
        },
        modemProcessUpdate(
            state,
            action: PayloadAction<ModemProcessUpdatePayload>
        ) {
            console.log(action.payload);
            state.progressMsg = action.payload.message;
            state.progressPercentage = action.payload.progressPercentage ?? 0;
            state.progressDuration = action.payload.duration ?? 0;
            state.progressOperation = action.payload.operation ?? '';
        },
        modemWritingReady(state, action: PayloadAction<string>) {
            state.modemFwName = action.payload;
            state.progressMsg = MODEM_DFU_NOT_STARTED;
            state.isWriting = false;
            state.isWritingSucceed = false;
            state.isWritingFail = false;
            state.isReady = true;
            state.errorMsg = '';
        },
        modemWritingClose(state) {
            state.isReady = false;
        },
        modemWritingStart(state) {
            state.isWriting = true;
        },
        modemWritingEnd(state) {
            state.isWriting = false;
        },
        modemWritingSucceed(state) {
            state.isWritingSucceed = true;
            state.isWriting = false;
        },
        modemWritingFail(state, action: PayloadAction<string>) {
            state.isWritingFail = true;
            state.isWriting = false;
            state.errorMsg = action.payload;
        },
    },
});

export default modemSlice.reducer;

const {
    modemKnown,
    modemProcessUpdate,
    modemWritingReady,
    modemWritingClose,
    modemWritingStart,
    modemWritingEnd,
    modemWritingSucceed,
    modemWritingFail,
} = modemSlice.actions;

export const getIsModem = (state: RootState) => state.app.modem.isModem;
export const getIsWriting = (state: RootState) => state.app.modem.isWriting;
export const getIsReady = (state: RootState) => state.app.modem.isReady;
export const getProgressPercentage = (state: RootState) =>
    state.app.modem.progressPercentage;
export const getProgressMsg = (state: RootState) => state.app.modem.progressMsg;
export const getProgressStep = (state: RootState) =>
    state.app.modem.progressStep;
export const getErrorMsg = (state: RootState) => state.app.modem.errorMsg;
export const getIsWritingFail = (state: RootState) =>
    state.app.modem.isWritingFail;
export const getIsWritingSucceed = (state: RootState) =>
    state.app.modem.isWritingSucceed;
export const getModemFwName = (state: RootState) => state.app.modem.modemFwName;

export {
    modemKnown,
    modemProcessUpdate,
    modemWritingReady,
    modemWritingClose,
    modemWritingStart,
    modemWritingEnd,
    modemWritingSucceed,
    modemWritingFail,
};
