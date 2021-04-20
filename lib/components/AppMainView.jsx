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
import PropTypes from 'prop-types';

import McuUpdateDialogView from '../containers/mcuUpdateDialogView';
import MemoryBoxView from '../containers/memoryBoxView';
import ModemUpdateDialogView from '../containers/modemUpdateDialogView';
import UserInputDialogView from '../containers/userInputDialogView';
import WarningView from '../containers/warningView';

function getTargetTitle(serialNumber, deviceInfo) {
    if (serialNumber) {
        return deviceInfo.type !== 'Unknown'
            ? deviceInfo.type
            : deviceInfo.family;
    }
    return undefined;
}

function hasFileContent(file) {
    return Object.keys(file.loaded).length > 0;
}

const AppMainView = ({
    file,
    target: { serialNumber, deviceInfo, regions },
}) => (
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
                regions={regions}
                isHolder={!serialNumber}
                isTarget={!!serialNumber}
            />
            <MemoryBoxView
                title="File memory layout"
                description="Drag & drop one or more HEX files here"
                iconName="mdi mdi-folder-open"
                isHolder={!hasFileContent(file)}
                isFile={hasFileContent(file)}
            />
        </div>
        <UserInputDialogView />
        <ModemUpdateDialogView />
        <McuUpdateDialogView />
    </div>
);

AppMainView.propTypes = {
    file: PropTypes.shape({}).isRequired,
    target: PropTypes.shape({
        serialNumber: PropTypes.string,
        deviceInfo: PropTypes.object,
        regions: PropTypes.array,
    }).isRequired,
};

export default AppMainView;
