/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Serialport } from 'pc-nrfconnect-shared';
import { RootState } from './types';

export const MCUBOOT_DFU_NOT_STARTED = 'Not started.';
export const MCUBOOT_DFU_STARTING = 'Starting...';

export interface McubootState {
    isFirmwareValid: boolean;
    isMcuboot: boolean;
    isReady: boolean;
    isWriting: boolean;
    isWritingSucceed: boolean;
    isWritingFail: boolean;
    port: Serialport | null;
    port2: Serialport | null;
    progressMsg: string;
    progressPercentage: number;
    progressDuration: number;
    errorMsg: string;
}

const initialState: McubootState = {
    isFirmwareValid: false,
    isMcuboot: false,
    isReady: false,
    isWriting: false,
    isWritingSucceed: false,
    isWritingFail: false,
    port: null,
    port2: null,
    progressMsg: MCUBOOT_DFU_NOT_STARTED,
    progressPercentage: 0,
    progressDuration: 0,
    errorMsg: '',
};

interface MCUBootPortKnownPayload {
    port: Serialport | null;
    port2: Serialport | null;
}

interface MCUBootProcessUpdatePayload {
    message: string;
    percentage: number;
    duration: number;
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
            state.progressMsg = action.payload.message;
            state.progressPercentage = action.payload.percentage;
            state.progressDuration = action.payload.duration;
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
        DEVICE_SELECTED: () => ({ ...initialState }),
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
