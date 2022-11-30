/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { getElf, getLoaded, getZipFilePath } from '../reducers/fileReducer';
import { getDeviceInfo, getSerialNumber } from '../reducers/targetReducer';
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
    const serialNumber = useSelector(getSerialNumber);
    const deviceInfo = useSelector(getDeviceInfo);
    const elf = useSelector(getElf);

    useOpenFileFromArgs();

    return (
        <div className="app-main-view">
            <WarningView />
            <div className="memory-box-container">
                <MemoryBoxView
                    title="File memory layout"
                    description="Drag & drop HEX/ZIP/ELF files here"
                    iconName="mdi mdi-file-outline"
                    isHolder={!hasFileContent(loaded) && !zipFilePath}
                    containsVisualization={elf !== undefined}
                />
                <MemoryBoxView
                    title={
                        getTargetTitle(serialNumber, deviceInfo) ||
                        'Device memory layout'
                    }
                    description="Connect a device to display memory contents"
                    iconName="mdi appicon-chip"
                    isHolder={!serialNumber}
                    isTarget={!!serialNumber}
                />
            </div>
            <UserInputDialogView />
            <ModemUpdateDialogView />
            <McuUpdateDialogView />
        </div>
    );
};

export default AppMainView;
