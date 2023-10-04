/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { getFileWarnings } from '../reducers/warningReducer';

const combineWarnings = (fileWarningStrings: string[]) =>
    fileWarningStrings.map((s, index) => (
        <Alert variant="warning" key={`warning-${index + 1}`}>
            <span className="mdi mdi-alert" />
            {s}
        </Alert>
    ));

const WarningView = () => {
    const fileWarningStrings = useSelector(getFileWarnings);

    if (fileWarningStrings.length <= 0) return null;

    return (
        <div className="tw-w-full tw-max-w-5xl tw-self-center">
            {combineWarnings(fileWarningStrings)}
        </div>
    );
};

export default WarningView;
