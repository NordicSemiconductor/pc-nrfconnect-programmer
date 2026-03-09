/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { type NrfConnectState } from '@nordicsemiconductor/pc-nrfconnect-shared';

import type rootReducer from './index';

type AppState = ReturnType<typeof rootReducer>;

export type RootState = NrfConnectState<AppState>;
