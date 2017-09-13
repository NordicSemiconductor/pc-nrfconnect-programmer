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
// import { logger } from 'nrfconnect/core';

import MemoryLayout from './components/MemoryLayout';
import ControlPanel from './components/ControlPanel';
import * as fileActions from './actions/files';
import * as jprogActions from './actions/jprog';
import appReducer from './reducers/appReducer';

import './resources/css/index.less';

/* eslint-disable react/prop-types */

export default {
    decorateMainView: MainView => (
        props => (
            <MainView>
                <MemoryLayout {...props} />
            </MainView>
        )
    ),
    mapMainViewState: (state, props) => ({
        ...props,
        fileError: state.app.fileError,
        blocks: state.app.blocks,
        targetSize: state.app.targetSize,
        filenames: state.app.filenames,
        writtenAddress: state.app.writtenAddress,
        fileColours: state.app.fileColours,
    }),
    decorateSidePanel: SidePanel => (
        props => (
            <SidePanel>
                <ControlPanel {...props} />
            </SidePanel>
        )
    ),
    mapSidePanelState: (state, props) => ({
        ...props,
        fileColours: state.app.fileColours.entries(),
    }),
    mapSidePanelDispatch: (dispatch, props) => ({
        ...props,
        openFileDialog: () => dispatch(fileActions.openFileDialog()),
        performWrite: () => {
            dispatch({ type: 'start-write' });
        },
        performRecover: () => {
            dispatch({ type: 'start-recover' });
        },
        closeFiles: () => {
            dispatch({ type: 'empty-files' });
        },
    }),
    reduceApp: appReducer,

    middleware: store => next => action => { // eslint-disable-line
        switch (action.type) {
            case 'SERIAL_PORT_SELECTED': {
                store.dispatch(jprogActions.logDeviceInfo(
                    action.port.serialNumber,
                    action.port.comName,
                ));

                next(action);
                break;
            }
            case 'start-write' : {
                const state = store.getState();
                if (state.app.blocks.size === 0) { return; }
                if (state.app.writtenAddress !== 0) { return; }

                store.dispatch(jprogActions.write(state.app));

                next(action);
                break;
            }
            case 'start-recover' : {
                store.dispatch(jprogActions.recover(store.getState().app));

                next(action);
                break;
            }
            default: {
                next(action);
            }
        }
    },
};
