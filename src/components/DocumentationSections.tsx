/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable react/jsx-key */

import React from 'react';
import { DocumentationSection } from 'pc-nrfconnect-shared';

const DocumentationSections = [
    <DocumentationSection
        key="infocenter"
        linkLabel="Go to Infocenter"
        link="https://infocenter.nordicsemi.com/topic/ug_nc_programmer/UG/nrf_connect_programmer/ncp_introduction.html"
    >
        Visit our Infocenter for more documentation about using the app.
    </DocumentationSection>,
];

export default DocumentationSections;
