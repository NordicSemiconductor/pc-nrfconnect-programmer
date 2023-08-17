/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import {
    Alert,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { getLoaded, getZipFilePath } from '../reducers/fileReducer';
import { getForceMcuBoot } from '../reducers/settingsReducer';
import { getDeviceInfo } from '../reducers/targetReducer';
import useOpenFileFromArgs from '../useOpenFileFromArgs';
import { DeviceDefinition } from '../util/devices';
import McuUpdateDialogView from './McuUpdateDialogView';
import MemoryBoxView from './MemoryBoxView';
import ModemUpdateDialogView from './ModemUpdateDialogView';
import UserInputDialogView from './UserInputDialogView';
import WarningView from './WarningView';

function getTargetTitle(
    serialNumber: string | undefined,
    deviceInfo: DeviceDefinition | undefined
) {
    if (serialNumber) {
        return deviceInfo?.type !== 'UNKNOWN'
            ? deviceInfo?.type
            : deviceInfo.family;
    }
    return undefined;
}

function hasFileContent(loaded: Record<string, unknown>) {
    return Object.keys(loaded).length > 0;
}

const AppMainView = () => {
    const loaded = useSelector(getLoaded);
    const zipFilePath = useSelector(getZipFilePath);
    const device = useSelector(selectedDevice);
    const deviceInfo = useSelector(getDeviceInfo);
    const forcedMCUBoot = useSelector(getForceMcuBoot);

    useOpenFileFromArgs();

    return (
        <div className="app-main-view">
            <WarningView />
            {device &&
                !device.traits.jlink &&
                !device.traits.mcuBoot &&
                !forcedMCUBoot &&
                !device.traits.nordicDfu && (
                    <div className="warning-view tw-flex tw-flex-col tw-gap-2">
                        <Alert variant="warning" label="Caution: ">
                            No operation possible. <br /> If the device is a
                            MCUboot device make sure it is in the bootloader
                            mode or enable MCUboot.
                            {process.platform === 'linux' && (
                                <>
                                    <br />
                                    If the device is a JLink device, please make
                                    sure J-Link Software and nrf-udev are
                                    installed.
                                </>
                            )}
                            {process.platform === 'darwin' && (
                                <>
                                    <br />
                                    If the device is a JLink device, please make
                                    sure J-Link Software is installed.
                                </>
                            )}
                        </Alert>
                    </div>
                )}
            <div className="memory-box-container">
                <MemoryBoxView
                    title="File memory layout"
                    description="Drag & drop HEX/ZIP files here"
                    iconName="mdi mdi-folder-open"
                    isHolder={!hasFileContent(loaded) && !zipFilePath}
                />
                <MemoryBoxView
                    title={
                        getTargetTitle(device?.serialNumber, deviceInfo) ||
                        'Device memory layout'
                    }
                    description="Connect a device to display memory contents"
                    iconName="appicon-chip"
                    isHolder={!device?.serialNumber}
                    isTarget={!!device?.serialNumber}
                />
            </div>
            <UserInputDialogView />
            <ModemUpdateDialogView />
            <McuUpdateDialogView />
        </div>
    );
};

export default AppMainView;
