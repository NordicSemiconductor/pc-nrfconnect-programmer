/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectedDevice } from 'pc-nrfconnect-shared';

import {
    getDeviceInfo,
    getIsMemLoaded,
    getPort,
} from '../reducers/targetReducer';

const DeviceInfoView = () => {
    const device = useSelector(selectedDevice);
    const port = useSelector(getPort);
    const deviceInfo = useSelector(getDeviceInfo);
    const isMemLoaded = useSelector(getIsMemLoaded);

    let targetType = 'UNKNOWN';
    if (device?.traits?.mcuBoot) {
        targetType = 'MCUBOOT';
    } else if (device?.traits?.nordicDfu) {
        targetType = 'USBSDFU';
    } else if (device?.traits?.jlink) {
        targetType = 'JLINK';
    }

    return (
        <div className="memory-details">
            {device?.serialNumber && (
                <div>
                    <h5>Serial Number</h5>
                    <p>{device.serialNumber}</p>
                </div>
            )}
            {port && (
                <div>
                    <h5>Port</h5>
                    <p>{port}</p>
                </div>
            )}
            <div>
                <h5>Communication Type</h5>
                <p>{targetType}</p>
            </div>
            {deviceInfo && deviceInfo.cores && (
                <div>
                    <h5>Core Number</h5>
                    <p>{deviceInfo.cores.length}</p>
                </div>
            )}
            {device?.traits.jlink && (
                <div>
                    <h5>Device memory is loaded?</h5>
                    <p>{isMemLoaded ? 'Yes' : 'No'}</p>
                </div>
            )}
        </div>
    );
};

export default DeviceInfoView;
