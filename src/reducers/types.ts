/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { NrfConnectState } from 'pc-nrfconnect-shared';

import rootReducer from './index';

type AppState = ReturnType<typeof rootReducer>;

export type RootState = NrfConnectState<AppState>;

export type TDispatch = ThunkDispatch<RootState, null, AnyAction>;
