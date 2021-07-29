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

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const MODEM_DFU_NOT_STARTED = 'Not started.';
export const MODEM_DFU_STARTING = 'Starting...';

export interface ModemState {
    isModem: boolean;
    isReady: boolean;
    isWriting: boolean;
    isWritingSucceed: boolean;
    isWritingFail: boolean;
    modemFwName: string;
    progressMsg: string,
    progressPercentage: number;
    progressDuration: number;
    progressStep: number;
    errorMsg: string;
}

const initialState : ModemState = {
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
    errorMsg: '',
};

interface ModemProcessUpdatePayload {
    message: string;
    percentage?: number;
    duration?: number;
    step?: number;
};

const modemSlice = createSlice({
    name: 'modem',
    initialState,
    reducers: {
        modemKnown(state, action: PayloadAction<boolean>) {
            state.isModem = action.payload;
        },
        modemProcessUpdate(state, action: PayloadAction<ModemProcessUpdatePayload>) {
            state.progressMsg = action.payload.message;
            state.progressPercentage = action.payload.percentage ?? 0;
            state.progressDuration = action.payload.duration ?? 0;
            state.progressStep = action.payload.step ?? 0;
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
})

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

//const getSerialNumber = (state: RootState) => state.app.device.serialNumber;

export {
    modemKnown,
    modemProcessUpdate,
    modemWritingReady,
    modemWritingClose,
    modemWritingStart,
    modemWritingEnd,
    modemWritingSucceed,
    modemWritingFail,
}
