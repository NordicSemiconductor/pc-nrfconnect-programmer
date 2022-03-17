/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice } from '@reduxjs/toolkit';

import { RootState } from './types';

export interface ArgsState {
    argsParsed: boolean;
}

const initialState: ArgsState = {
    argsParsed: false,
};

const argsSlice = createSlice({
    name: 'args',
    initialState,
    reducers: {
        argsParsed(state) {
            state.argsParsed = true;
        },
    },
    extraReducers: builder => {
        builder.addDefaultCase((state, action) => {
            console.log('DEILIG', action);
            return state;
        });
    },
});

export default argsSlice.reducer;

export const getAreArgsParsed = (state: RootState) => state.app.args.argsParsed;

const { argsParsed } = argsSlice.actions;
export { argsParsed };
