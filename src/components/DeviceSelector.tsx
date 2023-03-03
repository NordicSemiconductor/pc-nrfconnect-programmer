/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { connect } from 'react-redux';
import { DeviceTraits } from '@nordicsemiconductor/nrf-device-lib-js';
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
import { TDispatch } from '../reducers/types';

const deviceListing: DeviceTraits = {
    nordicUsb: true,
    serialPorts: true,
    jlink: true,
    mcuBoot: true,
    nordicDfu: true,
};

const mapState = () => ({
    deviceListing,
});

const mapDispatch = (dispatch: TDispatch) => ({
    onDeviceSelected: (device: SharedDevice) => {
        dispatch(selectDevice(device.serialNumber));
        dispatch(openDevice(device));
    },
    onDeviceDeselected: () => {
        usageData.sendUsageData(EventAction.CLOSE_DEVICE, '');
        dispatch(mcubootWritingClose());
        dispatch(modemWritingClose());
        dispatch(deselectDevice());
        logger.info('Target device closed');
    },
});

export default connect(mapState, mapDispatch)(DeviceSelector);
