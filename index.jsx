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
import { logger } from 'nrfconnect/core';

import { openFile } from './lib/actions/fileActions';
import { loadSettings } from './lib/actions/settingsActions';
import { getLibVersions, openDevice } from './lib/actions/targetActions';
import AppMainView from './lib/containers/appMainView';
import ControlPanel from './lib/containers/controlPanel';
import appReducer from './lib/reducers';
import { hexpad2, hexToKiB } from './lib/util/hexpad';
import portPath from './lib/util/portPath';

import './resources/css/index.scss';

let detectedDevices = [];
let currentDeviceInfo;

export default {
    config: {
        selectorTraits: {
            nordicUsb: true,
            serialport: true,
            jlink: true,
        },

        deviceSetup: {
            needSerialport: true,
        },
    },

    onInit: dispatch => {
        dispatch(loadSettings());
        document.body.ondragover = event => {
            const ev = event;
            ev.dataTransfer.dropEffect = 'copy';
            ev.preventDefault();
        };

        document.body.ondrop = event => {
            Array.from(event.dataTransfer.files).forEach(i => {
                dispatch(openFile(i.path));
            });
            event.preventDefault();
        };

        getLibVersions();
    },

    decorateMainView: MainView => () => (
        <MainView cssClass="main-view">
            <AppMainView />
        </MainView>
    ),

    decorateSidePanel: SidePanel => () => (
        <SidePanel cssClass="side-panel">
            <ControlPanel />
        </SidePanel>
    ),

    mapDeviceSelectorState: (state, props) => ({
        portIndicatorStatus: state.app.target.port !== null ? 'on' : 'off',
        ...props,
    }),

    reduceApp: appReducer,

    middleware: store => next => action => {
        const { dispatch } = store;

        switch (action.type) {
            case 'DEVICE_SETUP_COMPLETE': {
                dispatch(openDevice(action.device));
                break;
            }

            case 'DEVICE_DESELECTED': {
                logger.info('Target device closed');
                break;
            }

            case 'DEVICES_DETECTED': {
                detectedDevices = [...action.devices];
                break;
            }

            case 'TARGET_INFO_KNOWN': {
                currentDeviceInfo = { ...action.deviceInfo };
                break;
            }

            default:
        }

        next(action);
    },

    decorateSystemReport: coreReport => {
        const report = [
            '- Connected devices:',
            ...detectedDevices.map(
                d =>
                    `    - ${portPath(d.serialport)}: ${d.serialNumber} ${
                        d.boardVersion || ''
                    }`
            ),
            '',
        ];
        if (currentDeviceInfo) {
            const c = currentDeviceInfo;
            report.push(
                '- Current device:',
                `    - family:          ${c.family}`,
                `    - type:            ${c.type}`,
                `    - romBaseAddr:     ${hexpad2(c.romBaseAddr)}`,
                `    - romSize:         ${hexToKiB(c.romSize)}`,
                `    - ramSize:         ${hexToKiB(c.ramSize)}`,
                `    - pageSize:        ${hexToKiB(c.pageSize)}`,
                `    - blAddrOffset:    ${hexpad2(c.blAddrOffset)}`,
                `    - blockSize:       ${c.blockSize}`,
                `    - ficrBaseAddr:    ${hexpad2(c.ficrBaseAddr)}`,
                `    - ficrSize:        ${c.ficrSize}`,
                `    - uicrBaseAddr:    ${hexpad2(c.uicrBaseAddr)}`,
                `    - uicrSize:        ${c.uicrSize}`,
                `    - mbrBaseAddr:     ${hexpad2(c.mbrBaseAddr)}`,
                `    - mbrParamsOffset: ${c.mbrParamsOffset}`,
                `    - mbrSize:         ${c.mbrSize}`,
                ''
            );
        }
        return coreReport.concat(report.join('\n'));
    },
};
