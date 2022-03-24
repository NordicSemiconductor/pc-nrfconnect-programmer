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

interface Args {
    filePath?: string;
}

/**
 * When used, parses command line arguments passed to the Programmer
 * and performs any effects related to those.
 *
 * Current effects are:
 *
 * `--filePath` - Adds the file at the given path.
 *
 * @returns {void}
 */
export default function useArgs(): void {
    const dispatch = useDispatch();

    useEffect(() => {
        const args = parseArgs(process.argv);
        dispatch(actOnArgs(args));
    }, [dispatch]);
}

function parseArgs(argv: string[]): Args {
    const fileIndex = argv.findIndex(arg => arg === '--filePath');
    const filePath = fileIndex > -1 ? argv[fileIndex + 1] : undefined;

    return { filePath };
}

function actOnArgs({ filePath }: Args) {
    return (dispatch: TDispatch) => {
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
}
