/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as fs from 'fs';
import { logger } from 'pc-nrfconnect-shared';

import * as fileActions from './actions/fileActions';
import { TDispatch } from './reducers/types';

const openFileFromArgs = (dispatch: TDispatch) => {
    const { argv } = process;

    const fileIndex = argv.findIndex(arg => arg === '--filePath');
    const filePath = fileIndex > -1 ? argv[fileIndex + 1] : undefined;

    if (filePath) {
        if (fs.existsSync(filePath)) {
            dispatch(fileActions.openFile(filePath));
            logger.info(
                `Opening file ${filePath} (passed as argument to --filePath)`
            );
        } else {
            logger.warn(
                `No file found at ${filePath} (passed as argument to --filePath)`
            );
        }
    }
};

export default () => {
    const dispatch = useDispatch();

    useEffect(() => {
        openFileFromArgs(dispatch);
    }, [dispatch]);
};
