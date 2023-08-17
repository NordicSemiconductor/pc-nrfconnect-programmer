/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Region } from '../util/regions';
import { fileParse, filesEmpty } from './fileReducer';
import type { RootState } from './types';

export interface TargetState {
    readonly regions: Region[];
    readonly warnings?: string[];
    readonly writtenAddress?: number;
    readonly isWritable: boolean;
}

const initialState: TargetState = {
    regions: [],
    warnings: [],
    writtenAddress: 0,
    isWritable: false,
};

const targetSlice = createSlice({
    name: 'target',
    initialState,
    reducers: {
        targetRegionsKnown(state, action: PayloadAction<Region[]>) {
            state.regions = action.payload;
        },
        targetWritableKnown(state, action: PayloadAction<boolean>) {
            state.isWritable = action.payload;
        },
        selectDevice(_, action: PayloadAction<string>) {
            return {
                ...initialState,
                serialNumber: action.payload,
            };
        },
        deselectDevice() {
            return { ...initialState };
        },
    },
    extraReducers: {
        // @ts-expect-error in TypeScript, this would need to be [counter.actions.increment.type]
        [filesEmpty]: state => {
            state.writtenAddress = 0;
        },
        // @ts-expect-error in TypeScript, this would need to be [counter.actions.increment.type]
        [fileParse]: state => {
            state.writtenAddress = 0;
        },
    },
});

export default targetSlice.reducer;

const { targetRegionsKnown, targetWritableKnown, deselectDevice } =
    targetSlice.actions;

export const getIsWritable = (state: RootState) => state.app.target.isWritable;
export const getTargetRegions = (state: RootState) => state.app.target.regions;

export { targetRegionsKnown, targetWritableKnown, deselectDevice };
