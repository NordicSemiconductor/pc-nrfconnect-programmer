/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import { AnyAction } from '@reduxjs/toolkit';
import { usageData } from 'pc-nrfconnect-shared';
import configureMockStore from 'redux-mock-store';
import thunk, { ThunkDispatch } from 'redux-thunk';

import { RootState } from '../../reducers/types';
import { defaultCore } from '../../util/devices';
import { writeOneCore } from '../jlinkTargetActions';

const getMockStore = () => {
    const middlewares = [thunk];
    return configureMockStore<
        unknown,
        ThunkDispatch<RootState, unknown, AnyAction>
    >(middlewares);
};

jest.mock('nrf-intel-hex', () => ({
    __esModule: true,
    default: {
        overlapMemoryMaps: jest.fn(() => ({
            forEach: jest.fn(),
            size: jest.fn(),
        })),
        flattenOverlaps: jest.fn(() => ({
            paginate: jest.fn(() => ({
                asHexString: jest.fn(() => ''),
            })),
        })),
    },
}));

// Remove when this is in shared mock
nrfdl.firmwareProgram = jest.fn();

const mockStore = getMockStore();

const initialState = {
    app: {
        file: { memMaps: [] },
    },
};

const store = mockStore(initialState);

describe('error handling', () => {
    it('formats json object when programming', () => {
        // Arrange
        usageData.sendErrorReport = jest.fn();
        const jsonError = { error_code: 15 };

        // Act
        store.dispatch(writeOneCore(1, defaultCore));
        store.getActions();
        const errorHandler = (nrfdl.firmwareProgram as jest.Mock).mock
            .calls[0][5];
        errorHandler(jsonError);

        // Assert firmwareprogram is called, and error is formatted.
        expect((nrfdl.firmwareProgram as jest.Mock).mock.calls.length).toBe(1);
        expect(
            (usageData.sendErrorReport as jest.Mock).mock.calls[0][0]
        ).toContain(JSON.stringify(jsonError));
    });
});
