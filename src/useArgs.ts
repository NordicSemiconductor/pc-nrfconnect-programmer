/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as fs from 'fs';
import { logger } from 'pc-nrfconnect-shared';

import * as fileActions from './actions/fileActions';
import * as targetActions from './actions/targetActions';
import { argsParsed, getAreArgsParsed } from './reducers/argsReducer';
import { getConnectedDevices } from './reducers/targetReducer';
import { RootState, TDispatch } from './reducers/types';

interface Args {
    deviceSerial?: string;
    filePath?: string;
}

/**
 * When used, parses command line arguments passed to the Programmer
 * and performs any effects related to those.
 *
 * Current effects are:
 *
 * `--deviceSerial` - Opens the device with the given serial number.
 *
 * `--filePath` - Adds the file at the given path.
 *
 * @returns {void}
 */
export default function useArgs(): void {
    const dispatch = useDispatch();

    const connectedDevices = useSelector(getConnectedDevices);
    const areArgsParsed = useSelector(getAreArgsParsed);

    useEffect(() => {
        if (!areArgsParsed && Object.keys(connectedDevices).length) {
            const args = parseArgs(process.argv);
            dispatch(actOnArgs(args));
        }
    }, [connectedDevices, areArgsParsed, dispatch]);
}

function parseArgs(argv: string[]): Args {
    const serialIndex = argv.findIndex(arg => arg === '--deviceSerial');
    const deviceSerial = serialIndex > -1 ? argv[serialIndex + 1] : undefined;

    const fileIndex = argv.findIndex(arg => arg === '--filePath');
    const filePath = fileIndex > -1 ? argv[fileIndex + 1] : undefined;

    return { deviceSerial, filePath };
}

function actOnArgs({ filePath, deviceSerial }: Args) {
    return (dispatch: TDispatch, getState: () => RootState) => {
        if (filePath) {
            if (fs.existsSync(filePath)) {
                dispatch(fileActions.openFile(filePath));
                logger.info(
                    `Opening device ${deviceSerial} (passed as argument to --filePath)`
                );
            } else {
                logger.warn(
                    `No file found at ${filePath} (passed as argument to --filePath)`
                );
            }
        }

        if (deviceSerial) {
            const device = getState().device.devices[deviceSerial];
            if (device) {
                // Select it in the DeviceSelector component.
                dispatch({ type: 'device/selectDevice', payload: device });
                dispatch(targetActions.openDevice(device));
                logger.info(
                    `Opening device ${deviceSerial} (passed as argument to --deviceSerial)`
                );
            } else {
                logger.warn(
                    `No device with serial number ${deviceSerial} found (passed as argument to --deviceSerial)`
                );
            }
        }

        dispatch(argsParsed());
    };
}
