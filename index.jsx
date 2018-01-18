/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import ControlPanel from './lib/containers/controlPanel';
import AppMainView from './lib/containers/appMainView';
import * as fileActions from './lib/actions/fileActions';
import * as portTargetActions from './lib/actions/portTargetActions';
import USBTargetActions from './lib/actions/usbTargetActions';
import appReducer from './lib/reducers';

import './resources/css/index.less';

const usbTargetActions = new USBTargetActions();

export default {
    config: {
        selectorType: 'device',
    },
    onInit: dispatch => {
        document.ondrop = event => {
            event.preventDefault();
        };

        document.ondragover = document.ondrop;

        document.body.ondragover = event => {
            const dragOverEvent = event;
            if (!dragOverEvent.dataTransfer.files.length) {
                dragOverEvent.dataTransfer.dropEffect = 'none';
                dragOverEvent.dataTransfer.effectAllowed = 'none';
            } else {
                dragOverEvent.dataTransfer.effectAllowed = 'uninitialized';
            }
        };

        document.body.ondrop = event => {
            Array.from(event.dataTransfer.files).forEach(i => {
                dispatch(fileActions.openFile(i.path));
            });
            event.preventDefault();
        };
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
    reduceApp: appReducer,
    mapSerialPortSelectorState: (state, props) => ({
        portIndicatorStatus: (state.app.target.port !== null) ? 'on' : 'off',
        ...props,
    }),
    middleware: store => next => action => {
        const state = store.getState();
        const { dispatch } = store;
        switch (action.type) {
            case 'DEVICE_SELECTED': {
                // console.log(usbTargetActions.RECOVER_START);
                if (action.device.type === 'serialport') {
                    dispatch(portTargetActions.loadDeviceInfo(
                        parseInt(action.device.serialNumber, 10),
                    ));
                } else if (action.device.type === 'usb') {
                    dispatch(usbTargetActions.loadDeviceInfo(
                        action.device,
                    ));
                }
                break;
            }
            case 'SERIAL_PORT_SELECTED': {
                dispatch(portTargetActions.loadDeviceInfo(
                    action.port.serialNumber,
                ));
                break;
            }
            case 'SERIAL_PORT_DESELECTED': {
                logger.info('Target device closed.');
                break;
            }
            case portTargetActions.WRITE_START: {
                if (state.app.file.memMaps.length === 0) {
                    return;
                }
                dispatch(portTargetActions.write());
                break;
            }
            case portTargetActions.RECOVER_START: {
                dispatch(portTargetActions.recover());
                break;
            }
            case portTargetActions.REFRESH_ALL_FILES_START: {
                dispatch(fileActions.refreshAllFiles());
                break;
            }
            default:
        }
        next(action);
    },
};
