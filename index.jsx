/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { App } from 'pc-nrfconnect-shared';

import AppMainView from './src/components/AppMainView';
import ControlPanel from './src/components/ControlPanel';
import DeviceSelector from './src/components/DeviceSelector';
import appReducer from './src/reducers';

import './resources/css/index.scss';

export default () => (
    <App
        reportUsageData
        appReducer={appReducer}
        deviceSelect={<DeviceSelector />}
        sidePanel={<ControlPanel />}
        panes={[{ name: 'Programmer', Main: AppMainView }]}
    />
);
