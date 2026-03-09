/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export interface UserInputState {
    message: string | null;
    choices: Record<string, string>;
    isRequired: boolean;
}

const initialState: UserInputState = {
    message: null,
    choices: {},
    isRequired: false,
};

interface UserInputRequiredPayload {
    message: string | null;
    choices: Record<string, string>;
}

const userInputSlice = createSlice({
    name: 'userInput',
    initialState,
    reducers: {
        userInputRequired(
            state,
            action: PayloadAction<UserInputRequiredPayload>,
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
