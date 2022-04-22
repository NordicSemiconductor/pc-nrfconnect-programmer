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
import { mcubootWritingClose } from '../reducers/mcubootReducer';
import { modemWritingClose } from '../reducers/modemReducer';
import { TDispatch } from '../reducers/types';

const deviceListing: DeviceListing = {
    nordicUsb: true,
    serialPort: true,
    jlink: true,
    // @ts-expect-error To be fixed in shared
    mcuboot: true,
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
        dispatch(mcubootWritingClose());
        dispatch(modemWritingClose());
        logger.info('Target device closed');
    },
});

export default connect(mapState, mapDispatch)(DeviceSelector);
