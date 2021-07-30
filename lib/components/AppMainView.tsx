/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { getLoaded } from '../reducers/fileReducer';
import { getDeviceInfo, getSerialNumber } from '../reducers/targetReducer';
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
        return deviceInfo?.type !== 'Unknown'
            ? deviceInfo?.type
            : deviceInfo.family;
    }
    return undefined;
}

function hasFileContent(loaded: {}) {
    return Object.keys(loaded).length > 0;
}

const AppMainView = () => {
    const loaded = useSelector(getLoaded);
    const serialNumber = useSelector(getSerialNumber);
    const deviceInfo = useSelector(getDeviceInfo);

    return (
        <div className="app-main-view">
            <WarningView />
            <div className="memory-box-container">
                <MemoryBoxView
                    title={
                        getTargetTitle(serialNumber, deviceInfo) ||
                        'Device memory layout'
                    }
                    description="Connect a device to display memory contents"
                    iconName="appicon-chip"
                    isHolder={!serialNumber}
                    isTarget={!!serialNumber}
                />
                <MemoryBoxView
                    title="File memory layout"
                    description="Drag & drop one or more HEX files here"
                    iconName="mdi mdi-folder-open"
                    isHolder={!hasFileContent(loaded)}
                    isFile={hasFileContent(loaded)}
                />
            </div>
            <UserInputDialogView />
            <ModemUpdateDialogView />
            <McuUpdateDialogView />
        </div>
    );
};

export default AppMainView;
