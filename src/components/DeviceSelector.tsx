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
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { openDevice } from '../actions/targetActions';
import { resetDeviceInfo } from '../reducers/deviceDefinitionReducer';
import { setShowMcuBootProgrammingDialog } from '../reducers/mcubootReducer';
import { setShowModemProgrammingDialog } from '../reducers/modemReducer';
import { deselectDevice } from '../reducers/targetReducer';
import { setUsbSdfuProgrammingDialog } from '../reducers/usbSdfuReducer';

export default () => {
    const dispatch = useDispatch();
    return (
        <DeviceSelector
            deviceFilter={device => !!device.serialNumber}
            onDeviceSelected={(device: SharedDevice, _, abortController) => {
                dispatch(openDevice(device, abortController));
            }}
            onDeviceDeselected={() => {
                dispatch(setShowMcuBootProgrammingDialog(false));
                dispatch(setShowModemProgrammingDialog(false));
                dispatch(setUsbSdfuProgrammingDialog(false));
                dispatch(deselectDevice());
                dispatch(resetDeviceInfo());
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
