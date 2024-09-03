/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import {
    Device as SharedDevice,
    DeviceSelector,
    logger,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { openDevice } from '../actions/targetActions';
import { resetDeviceInfo } from '../reducers/deviceDefinitionReducer';
import { setShowMcuBootProgrammingDialog } from '../reducers/mcubootReducer';
import { setShowModemProgrammingDialog } from '../reducers/modemReducer';
import { deselectDevice } from '../reducers/targetReducer';
import { setUsbSdfuProgrammingDialog } from '../reducers/usbSdfuReducer';

let abortController = new AbortController();
export const getAbortController = () => abortController;

export default () => {
    const dispatch = useDispatch();
    return (
        <DeviceSelector
            deviceFilter={device => !!device.serialNumber}
            onDeviceSelected={(device: SharedDevice) => {
                abortController?.abort();
                abortController = new AbortController();
                logger.info(`Selected device ${device.serialNumber}`);
                dispatch(openDevice(device, abortController));
            }}
            onDeviceDeselected={() => {
                logger.info(`Deselected device`);
                dispatch(setShowMcuBootProgrammingDialog(false));
                dispatch(setShowModemProgrammingDialog(false));
                dispatch(setUsbSdfuProgrammingDialog(false));
                dispatch(deselectDevice());
                dispatch(resetDeviceInfo());
                closeDevice();
            }}
            deviceListing={{
                nordicUsb: true,
                serialPorts: true,
                jlink: true,
                mcuBoot: true,
                nordicDfu: true,
            }}
        />
    );
};
