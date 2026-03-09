/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Popover from 'react-bootstrap/Popover';
import { useSelector } from 'react-redux';
import { selectedDevice } from '@nordicsemiconductor/pc-nrfconnect-shared';

import { getDeviceDefinition } from '../reducers/deviceDefinitionReducer';
import { type DeviceDefinition, DeviceFamily } from '../util/deviceTypes';
import DeviceInfoView from './DeviceInfoView';
import DeviceMemoryView from './DeviceMemoryView';

const getTargetTitle = (
    serialNumber: string | undefined | null,
    deviceDefinition: DeviceDefinition | undefined,
) => {
    if (serialNumber) {
        return deviceDefinition?.type !== 'UNKNOWN' &&
            deviceDefinition?.type !== DeviceFamily.UNKNOWN
            ? deviceDefinition?.type
            : deviceDefinition.family;
    }
    return undefined;
};

export default () => {
    const [showOverlay, setShowOverlay] = useState(false);
    const device = useSelector(selectedDevice);
    const deviceDefinition = useSelector(getDeviceDefinition);

    const title =
        getTargetTitle(device?.serialNumber, deviceDefinition) ||
        'Device memory layout';
    const description = 'Connect a device to display memory contents';
    const iconName = 'appicon-chip';
    const isHolder = !device?.serialNumber;
    const isTarget = !!device?.serialNumber;

    return (
        <Card className="memory-layout">
            <Card.Header
                className="panel-heading"
                onPointerEnter={() => setShowOverlay(true)}
                onPointerLeave={() => setShowOverlay(false)}
            >
                <Card.Title className="panel-title">
                    {title}
                    {isTarget && (
                        <span className="mdi mdi-information-outline target-info" />
                    )}
                    <span className={`glyphicon ${iconName}`} />
                </Card.Title>
            </Card.Header>
            {isTarget && showOverlay && (
                <Popover
                    id="deviceInfo"
                    placement="bottom"
                    onPointerEnter={() => setShowOverlay(true)}
                    onPointerLeave={() => setShowOverlay(false)}
                    content
                >
                    <DeviceInfoView />
                </Popover>
            )}
            <Card.Body className={`panel-body ${isHolder && 'empty'} stacked`}>
                {isHolder && (
                    <div className="memory-layout-container">
                        <h1>
                            <span className={`glyphicon ${iconName}`} />
                        </h1>
                        <p>{description}</p>
                    </div>
                )}
                {!isHolder && <DeviceMemoryView />}
            </Card.Body>
        </Card>
    );
};
