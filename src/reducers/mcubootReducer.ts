/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export const MCUBOOT_DFU_NOT_STARTED = 'Not started.';
export const MCUBOOT_DFU_STARTING = 'Starting...';

export interface McubootState {
    isFirmwareValid: boolean;
    isMcuboot: boolean;
    isReady: boolean;
    isWriting: boolean;
    isWritingSucceed: boolean;
    isWritingFail: boolean;
    port?: string;
    port2?: string;
    progressMsg: string;
    progressPercentage: number;
    progressDuration: number;
    progressStep: number;
    progressOperation: string;
    errorMsg: string;
}

const initialState: McubootState = {
    isFirmwareValid: false,
    isMcuboot: false,
    isReady: false,
    isWriting: false,
    isWritingSucceed: false,
    isWritingFail: false,
    port: undefined,
    port2: undefined,
    progressMsg: MCUBOOT_DFU_NOT_STARTED,
    progressPercentage: 0,
    progressDuration: 0,
    progressStep: 0,
    progressOperation: MCUBOOT_DFU_NOT_STARTED,
    errorMsg: '',
};

interface MCUBootPortKnownPayload {
    port?: string;
    port2?: string;
}

interface MCUBootProcessUpdatePayload {
    message?: string;
    progressPercentage?: number;
    duration?: number;
    step?: number;
    operation?: string;
}

const mcubootSlice = createSlice({
    name: 'mcuboot',
    initialState,
    reducers: {
        mcubootKnown(state, action: PayloadAction<boolean>) {
            state.isMcuboot = action.payload;
        },
        mcubootPortKnown(
            state,
            action: PayloadAction<MCUBootPortKnownPayload>
        ) {
            state.port = action.payload.port;
            state.port2 = action.payload.port2;
        },
        mcubootProcessUpdate(
            state,
            action: PayloadAction<MCUBootProcessUpdatePayload>
        ) {
            state.progressMsg = action.payload.message ?? '';
            state.progressPercentage = action.payload.progressPercentage ?? 0;
            state.progressDuration = action.payload.duration ?? 0;
            state.progressOperation = action.payload.operation ?? '';
        },
        mcubootWritingReady(state) {
            state.progressMsg = MCUBOOT_DFU_NOT_STARTED;
            state.isWriting = false;
            state.isWritingSucceed = false;
            state.isWritingFail = false;
            state.isReady = true;
            state.errorMsg = '';
        },
        mcubootWritingClose(state) {
            state.isReady = false;
        },
        mcubootWritingStart(state) {
            state.isWritingSucceed = false;
            state.isWritingFail = false;
            state.isWriting = true;
        },
        mcubootWritingEnd(state) {
            state.isWriting = false;
        },
        mcubootWritingSucceed(state) {
            state.isWritingSucceed = true;
            state.isWriting = false;
        },
        mcubootWritingFail(state, action: PayloadAction<string>) {
            state.isWritingFail = true;
            state.isWriting = false;
            state.errorMsg = action.payload;
        },
        mcubootFirmwareValid(state, action: PayloadAction<boolean>) {
            state.isFirmwareValid = action.payload;
        },
    },
    extraReducers: {
        'device/selectDevice': () => ({ ...initialState }),
    },
});

export default mcubootSlice.reducer;

const {
    mcubootKnown,
    mcubootPortKnown,
    mcubootProcessUpdate,
    mcubootWritingReady,
    mcubootWritingClose,
    mcubootWritingStart,
    mcubootWritingEnd,
    mcubootWritingSucceed,
    mcubootWritingFail,
    mcubootFirmwareValid,
} = mcubootSlice.actions;

export const getIsFirmwareValid = (state: RootState) =>
    state.app.mcuboot.isFirmwareValid;
export const getProgressDuration = (state: RootState) =>
    state.app.mcuboot.progressDuration;
export const getProgressMsg = (state: RootState) =>
    state.app.mcuboot.progressMsg;
export const getProgressPercentage = (state: RootState) =>
    state.app.mcuboot.progressPercentage;
export const getErrorMsg = (state: RootState) => state.app.mcuboot.errorMsg;
export const getIsWriting = (state: RootState) => state.app.mcuboot.isWriting;
export const getIsWritingFail = (state: RootState) =>
    state.app.mcuboot.isWritingFail;
export const getIsWritingSucceed = (state: RootState) =>
    state.app.mcuboot.isWritingSucceed;
export const getIsReady = (state: RootState) => state.app.mcuboot.isReady;
export const getIsMcuboot = (state: RootState) => state.app.mcuboot.isMcuboot;

export {
    mcubootKnown,
    mcubootPortKnown,
    mcubootProcessUpdate,
    mcubootWritingReady,
    mcubootWritingClose,
    mcubootWritingStart,
    mcubootWritingEnd,
    mcubootWritingSucceed,
    mcubootWritingFail,
    mcubootFirmwareValid,
};
