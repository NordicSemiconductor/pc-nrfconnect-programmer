/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'pc-nrfconnect-shared';

import { getFileWarnings } from '../reducers/warningReducer';

const combineWarnings = (fileWarningStrings: string[]) =>
    fileWarningStrings.map((s, index) => (
        <Alert variant="danger" key={`warning-${index + 1}`}>
            <span className="mdi mdi-alert" />
            {s}
        </Alert>
    ));

const WarningView = () => {
    const fileWarningStrings = useSelector(getFileWarnings);

    return (
        <>
            {fileWarningStrings.length > 0 && (
                <div className="warning-view">
                    {combineWarnings(fileWarningStrings)}
                </div>
            )}
        </>
    );
};

export default WarningView;
