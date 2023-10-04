/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { DfuImage } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from './types';

export interface UsbSdfuState {
    isVisible: boolean;
    imagesToWrite: DfuImage[];
}

const initialState: UsbSdfuState = {
    isVisible: false,
    imagesToWrite: [],
};

const usbSdfuSlice = createSlice({
    name: 'usbsdfu',
    initialState,
    reducers: {
        setUsbSdfuProgrammingDialog(state, action: PayloadAction<boolean>) {
            state.isVisible = action.payload;
            if (!action.payload) {
                state.imagesToWrite = [];
            }
        },
        setDFUImages(state, action: PayloadAction<DfuImage[]>) {
            state.imagesToWrite = action.payload;
        },
    },
});

export default usbSdfuSlice.reducer;

const { setUsbSdfuProgrammingDialog, setDFUImages } = usbSdfuSlice.actions;

export const getUsbSdfuProgrammingDialog = (state: RootState) =>
    state.app.usbsdfu.isVisible;
export const getDFUImages = (state: RootState) =>
    state.app.usbsdfu.imagesToWrite;

export { setUsbSdfuProgrammingDialog, setDFUImages };
