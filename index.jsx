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
import ControlPanel from './lib/components/ControlPanel';
import AppMainView from './lib/containers/appMainView';
import * as fileActions from './lib/actions/fileActions';
import * as jlinkTargetActions from './lib/actions/jlinkTargetActions';
import * as usbsdfuTargetActions from './lib/actions/usbsdfuTargetActions';
import appReducer from './lib/reducers';
import './resources/css/index.less';
import { VendorId, USBProductIds } from './lib/util/devices';
import logJprogVersion from './lib/util/logJprogVersion';

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

        logJprogVersion();
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
        ...props,
        portIndicatorStatus: (state.app.target.port !== null) ? 'on' : 'off',
    }),
    middleware: store => next => action => {
        const { dispatch } = store;
        switch (action.type) {
            case 'DEVICE_SELECTED': {
                const device = action.device;
                const serialNumber = device.serialNumber;
                if (action.device.traits.includes('jlink')) {
                    dispatch(jlinkTargetActions.loadDeviceInfo(serialNumber));
                    break;
                }
                if (action.device.traits.includes('nordicUsb')) {
                    dispatch(usbsdfuTargetActions.openDevice(action.device));
                    break;
                }
                if (action.device.traits.includes('serialport')) {
                    const { vendorId, productId } = device.serialport;
                    const vid = parseInt(vendorId.toString(16), 16);
                    const pid = parseInt(productId.toString(16), 16);
                    if (vid === VendorId.NORDIC_SEMICONDUCTOR && USBProductIds.includes(pid)) {
                        dispatch(usbsdfuTargetActions.openDevice(action.device));
                        break;
                    }
                }
                logger.error('Unsupported device. The detected device is neither JLink device nor Nordic USB device.');
                break;
            }
            case 'DEVICE_DESELECTED': {
                logger.info('Target device closed.');
                break;
            }
            default:
        }
        next(action);
    },
};
