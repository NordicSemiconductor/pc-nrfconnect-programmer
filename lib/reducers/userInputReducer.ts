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

import { RootState } from './types';

export interface UserInputState {
    message: string | null;
    // eslint-disable-next-line @typescript-eslint/ban-types
    choices: {};
    isRequired: boolean;
}

const initialState: UserInputState = {
    message: null,
    choices: {},
    isRequired: false,
};

interface UserInputRequiredPayload {
    message: string | null;
    choices: {};
}

const userInputSlice = createSlice({
    name: 'userInput',
    initialState,
    reducers: {
        userInputRequired(
            state,
            action: PayloadAction<UserInputRequiredPayload>
        ) {
            state.isRequired = true;
            state.message = action.payload.message;
            state.choices = action.payload.choices;
        },
        userInputReceived() {
            return { ...initialState };
        },
        userInputCancelled() {
            return { ...initialState };
        },
    },
});

export default userInputSlice.reducer;

const { userInputRequired, userInputReceived, userInputCancelled } =
    userInputSlice.actions;

export const getIsRequired = (state: RootState) =>
    state.app.userInput.isRequired;
export const getMessage = (state: RootState) => state.app.userInput.message;
export const getChoices = (state: RootState) => state.app.userInput.choices;

export { userInputRequired, userInputReceived, userInputCancelled };