/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AppThunk, logger } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { RootState } from '../reducers/types';
import {
    userInputCancelled,
    userInputReceived,
    userInputRequired,
} from '../reducers/userInputReducer';

let userInputCallback: ((input?: string) => void) | undefined;

export const getUserInput =
    (
        message: string,
        choices: Record<string, string>,
    ): AppThunk<RootState, Promise<string>> =>
    dispatch =>
        new Promise((resolve, reject) => {
            userInputCallback = input => {
                if (input) {
                    resolve(input);
                } else {
                    reject(new Error('Cancelled by user.'));
                }
            };
            dispatch(userInputRequired({ message, choices }));
        });

export const receiveUserInput =
    (input?: string): AppThunk =>
    dispatch => {
        dispatch(userInputReceived());
        if (userInputCallback) {
            userInputCallback(input);
            userInputCallback = undefined;
        } else {
            logger.error('Received user input, but no callback exists.');
        }
    };

export const cancelUserInput = (): AppThunk => dispatch => {
    logger.info('User input has been cancelled.');
    dispatch(userInputCancelled());
};
