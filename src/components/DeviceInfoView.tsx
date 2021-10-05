/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';

import {
    getDeviceInfo,
    getIsMemLoaded,
    getPort,
    getSerialNumber,
    getTargetType,
} from '../reducers/targetReducer';
import { CommunicationType } from '../util/devices';

const DeviceInfoView = () => {
    const serialNumber = useSelector(getSerialNumber);
    const port = useSelector(getPort);
    const targetType = useSelector(getTargetType);
    const deviceInfo = useSelector(getDeviceInfo);
    const isMemLoaded = useSelector(getIsMemLoaded);

    return (
        <div className="memory-details">
            {serialNumber && (
                <div>
                    <h5>Serial Number</h5>
                    <p>{serialNumber}</p>
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
            {targetType === CommunicationType.JLINK && (
                <div>
                    <h5>Device memory is loaded?</h5>
                    <p>{isMemLoaded ? 'Yes' : 'No'}</p>
                </div>
            )}
        </div>
    );
};

export default DeviceInfoView;
