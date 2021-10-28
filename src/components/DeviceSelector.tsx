/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { connect } from 'react-redux';
import { Device } from '@nordicsemiconductor/nrf-device-lib-js';
import {
    Device as SharedDevice,
    DeviceListing,
    DeviceSelector,
    DeviceSetup,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import { openDevice } from '../actions/targetActions';
import EventAction from '../actions/usageDataActions';
import { TDispatch } from '../reducers/types';

const deviceListing: DeviceListing = {
    nordicUsb: true,
    serialport: true,
    jlink: true,
};

const deviceSetup: DeviceSetup = {
    needSerialport: true,
};

const mapState = () => ({
    deviceListing,
    deviceSetup,
});

const mapDispatch = (dispatch: TDispatch) => ({
    onDeviceIsReady: (device: SharedDevice) => {
        dispatch(openDevice(device as unknown as Device));
    },
    onDeviceDeselected: () => {
        usageData.sendUsageData(EventAction.CLOSE_DEVICE, '');
        logger.info('Target device closed');
    },
});

export default connect(mapState, mapDispatch)(DeviceSelector);
