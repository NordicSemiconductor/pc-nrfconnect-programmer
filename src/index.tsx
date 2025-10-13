/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    App,
    render,
    telemetry,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import AppMainView from './components/AppMainView';
import ControlPanel from './components/ControlPanel';
import DeviceSelector from './components/DeviceSelector';
import DocumentationSections from './components/DocumentationSections';
import appReducer from './reducers';

import '../resources/css/index.scss';

telemetry.enableTelemetry();

render(
    <App
        appReducer={appReducer}
        deviceSelect={<DeviceSelector />}
        sidePanel={<ControlPanel />}
        panes={[{ name: 'Programmer', Main: AppMainView }]}
        documentation={DocumentationSections}
    />,
);
