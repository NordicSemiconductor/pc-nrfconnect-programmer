/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { useSelector } from 'react-redux';

import {
    getFileWarnings,
    getTargetWarnings,
    getUserWarnings,
} from '../reducers/warningReducer';

const combineWarnings = (
    targetWarningStrings: string[],
    fileWarningStrings: string[],
    userWarningStrings: string[]
) =>
    targetWarningStrings
        .concat(fileWarningStrings)
        .concat(userWarningStrings)
        .map((s, index) => (
            <Alert variant="danger" key={`warning-${index + 1}`}>
                <span className="mdi mdi-alert" />
                {s}
            </Alert>
        ));

const WarningView = () => {
    const targetWarningStrings = useSelector(getTargetWarnings);
    const fileWarningStrings = useSelector(getFileWarnings);
    const userWarningStrings = useSelector(getUserWarnings);

    return (
        <div className="warning-view">
            {combineWarnings(
                targetWarningStrings,
                fileWarningStrings,
                userWarningStrings
            )}
        </div>
    );
};

export default WarningView;
