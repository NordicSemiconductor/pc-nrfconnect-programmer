/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { logger } from 'pc-nrfconnect-shared';

import { TDispatch } from '../reducers/types';
import {
    userInputCancelled,
    userInputReceived,
    userInputRequired,
} from '../reducers/userInputReducer';

let userInputCallback: ((input?: string) => void) | undefined;

export function getUserInput(
    dispatch: TDispatch,
    message: string,
    choices: Record<string, string>
) {
    return new Promise((resolve, reject) => {
        userInputCallback = input => {
            if (input) {
                resolve(input);
            } else {
                reject(new Error('Cancelled by user.'));
            }
        };
        dispatch(userInputRequired({ message, choices }));
    });
}

export function receiveUserInput(input?: string) {
    return (dispatch: TDispatch) => {
        dispatch(userInputReceived());
        if (userInputCallback) {
            userInputCallback(input);
            userInputCallback = undefined;
        } else {
            logger.error('Received user input, but no callback exists.');
        }
    };
}

export function cancelUserInput() {
    return (dispatch: TDispatch) => {
        logger.info('User input has been cancelled.');
        dispatch(userInputCancelled());
    };
}
