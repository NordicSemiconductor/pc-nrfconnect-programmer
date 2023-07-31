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
    usageData,
} from 'pc-nrfconnect-shared';

import { openDevice } from '../actions/targetActions';
import EventAction from '../actions/usageDataActions';
import { mcubootWritingClose } from '../reducers/mcubootReducer';
import { modemWritingClose } from '../reducers/modemReducer';
import { deselectDevice, selectDevice } from '../reducers/targetReducer';

export default () => {
    const dispatch = useDispatch();

    return (
        <DeviceSelector
            onDeviceSelected={(device: SharedDevice) => {
                dispatch(selectDevice(device.serialNumber));
                dispatch(openDevice(device));
            }}
            onDeviceDeselected={() => {
                usageData.sendUsageData(EventAction.CLOSE_DEVICE, '');
                dispatch(mcubootWritingClose());
                dispatch(modemWritingClose());
                dispatch(deselectDevice());
                logger.info('Target device closed');
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
