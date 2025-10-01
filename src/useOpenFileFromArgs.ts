/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppThunk, logger } from '@nordicsemiconductor/pc-nrfconnect-shared';
import * as fs from 'fs';

import * as fileActions from './actions/fileActions';

const openFileFromArgs = (): AppThunk => dispatch => {
    const { argv } = process;

    const fileIndex = argv.findIndex(arg => arg === '--filePath');
    const filePath = fileIndex > -1 ? argv[fileIndex + 1] : undefined;

    if (filePath) {
        if (fs.existsSync(filePath)) {
            dispatch(fileActions.openFile(filePath));
            logger.info(
                `Opening file ${filePath} (passed as argument to --filePath)`,
            );
        } else {
            logger.warn(
                `No file found at ${filePath} (passed as argument to --filePath)`,
            );
        }
    }
};

export default () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(openFileFromArgs());
    }, [dispatch]);
};
