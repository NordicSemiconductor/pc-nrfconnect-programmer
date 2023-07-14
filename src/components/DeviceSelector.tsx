/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Device as SharedDevice,
    DeviceSelector,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

import { openDevice } from '../actions/targetActions';
import EventAction from '../actions/usageDataActions';
import { setShowMcuBootProgrammingDialog } from '../reducers/mcubootReducer';
import { setShowModemProgrammingDialog } from '../reducers/modemReducer';
import { getAutoRead, getAutoReset } from '../reducers/settingsReducer';
import { deselectDevice } from '../reducers/targetReducer';

export default () => {
    const dispatch = useDispatch();
    const autoRead = useSelector(getAutoRead);
    const autoReset = useSelector(getAutoReset);

    return (
        <DeviceSelector
            onDeviceSelected={(device: SharedDevice) => {
                dispatch(openDevice(device, autoRead, autoReset));
            }}
            onDeviceDeselected={() => {
                usageData.sendUsageData(EventAction.CLOSE_DEVICE, '');
                dispatch(setShowMcuBootProgrammingDialog(false));
                dispatch(setShowModemProgrammingDialog(false));
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
