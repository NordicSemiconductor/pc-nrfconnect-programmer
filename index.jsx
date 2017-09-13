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
// import electron from 'electron';
import { logger } from 'nrfconnect/core';
// import nrfjprog from 'pc-nrfjprog-js';

import MemoryLayout from './components/MemoryLayout';
import FileLegend from './components/FileLegend';
import * as fileActions from './actions/files';
import * as jprogActions from './actions/jprog';

import './resources/css/index.less';

/* eslint-disable react/prop-types */

/**
 * In this boilerplate app, we show a "dummy" implementation of all available
 * functions. By implementing one or more of the functions below, you can
 * add your own behavior.
 *
 * All of these functions are optional. You could just export an empty object
 * here if you want to start from scratch with the default behavior.
 */
export default {
    onInit: () => {
        logger.info('App initializing');
    },
    onReady: () => {
        logger.info('App initialized');
    },
    decorateFirmwareDialog: FirmwareDialog => (
        props => (
            <FirmwareDialog {...props} />
        )
    ),
    mapFirmwareDialogState: (state, props) => ({
        ...props,
    }),
    mapFirmwareDialogDispatch: (dispatch, props) => ({
        ...props,
    }),
    decorateLogEntry: LogEntry => (
        props => (
            <LogEntry {...props} />
        )
    ),
    decorateLogHeader: LogHeader => (
        props => (
            <LogHeader {...props} />
        )
    ),
    mapLogHeaderState: (state, props) => ({
        ...props,
    }),
    mapLogHeaderDispatch: (dispatch, props) => ({
        ...props,
    }),
    decorateLogHeaderButton: LogHeaderButton => (
        props => (
            <LogHeaderButton {...props} />
        )
    ),
    decorateLogViewer: LogViewer => (
        props => (
            <LogViewer {...props} />
        )
    ),
    mapLogViewerState: (state, props) => ({
        ...props,
    }),
    mapLogViewerDispatch: (dispatch, props) => ({
        ...props,
    }),
    decorateMainView: MainView => (
        props =>
//             const { title } = props;
//             let buttonText = 'Select another .hex file';
//             let filenames = props.filenames;
//
//             if (!filenames || !(filenames.length)) {
// //                 filenames = ['No .hex file selected'];
//                 buttonText = 'Select a .hex file';
//             }

//             let filenameLabels = filenames.map(f => (<div>{f}</div>));

//                     <div>{filenameLabels}</div>
//                     <FileLegend {...props} />
//                     <button onClick={props.performWrite}>Write</button>
             (
                 <MainView {...props}>
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
    mapMainViewDispatch: (dispatch, props) => ({
        ...props,
//         openFileDialog: fileActions.openFileDialog(dispatch),
//         performWrite: () => {
//             dispatch({
//                 type: 'start-write',
//             });
//         },
    }),
    decorateNavBar: NavBar => (
        props => (
            <NavBar {...props} />
        )
    ),
    decorateNavMenu: NavMenu => (
        props => (
            <NavMenu
                {...props}
                menuItems={[
//                     { id: 'about', text: 'About', iconClass: 'icon-star' },
                ]}
            />
        )
    ),
    mapNavMenuState: (state, props) => ({
        ...props,
    }),
    mapNavMenuDispatch: (dispatch, props) => ({
        ...props,
        onItemSelected: item => logger.info(`Selected ${item}`),
    }),
    decorateNavMenuItem: NavMenuItem => (
        props => (
            <NavMenuItem {...props} />
        )
    ),
    decorateSerialPortSelector: SerialPortSelector => (
        props => (
            <SerialPortSelector {...props} />
        )
    ),


    mapSerialPortSelectorState: (state, props) => ({
        ...props,
    }),
    mapSerialPortSelectorDispatch: (dispatch, props) => ({
        ...props,
    }),


    decorateSidePanel: SidePanel => (
        props => {
            console.log('decorateSidePanel', props);
            return (
                <SidePanel {...props}>
                    <button onClick={props.closeFiles}>Clear loaded files</button>
                    <button onClick={props.openFileDialog}>Add a .hex file...</button>
                    <button disabled="disabled" style={{ color: 'graytext' }}>Add a recent .hex file...</button>
                    <button disabled="disabled" style={{ color: 'graytext' }}>Add last files written to this device</button>
                    <button disabled="disabled" style={{ color: 'graytext' }}>Reload .hex files</button>

                    <FileLegend fileColours={props.fileColours} />

                    <button onClick={props.performWrite}>Write all to devkit</button>
                </SidePanel>
            );
        }
    ),
    mapSidePanelState: (state, props) =>
//         console.log('mapSidePanelState', state.app.fileColours);
         ({
             ...props,
             fileColours: state.app.fileColours.entries(),
         }),
    mapSidePanelDispatch: (dispatch, props) => ({
        ...props,
        openFileDialog: fileActions.openFileDialog(dispatch),
        performWrite: () => {
            dispatch({
                type: 'start-write',
            });
        },
        closeFiles: () => {
            dispatch({ type: 'empty-files' });
        },
    }),


    // Note: initial state of the application needs to be provided
    reduceApp: (state = {
        blocks: new Map(),
        fileError: null,
        targetSize: 0x00100000,  // 1MiB. TODO: Set a saner default?
        targetPort: null,
        writtenAddress: 0,
        filenames: [],
        fileColours: new Map(),
    }, action) => {

        // Colours from:
        // https://github.com/d3/d3-scale-chromatic
        // https://github.com/d3/d3-scale-chromatic/blob/master/src/categorical/Dark2.js
//                 const colours = [
//                     "#1b9e77",
//                     "#d95f02",
//                     "#7570b3",
//                     "#e7298a",
//                     "#66a61e",
//                     "#e6ab02",
//                     "#a6761d",
//                     "#666666"
//                 ];

//                 https://github.com/d3/d3-scale-chromatic/blob/master/src/categorical/Pastel2.js

        const colours = [
            '#b3e2cd',
            '#fdcdac',
            '#cbd5e8',
            '#f4cae4',
            '#e6f5c9',
            '#fff2ae',
            '#f1e2cc',
            '#cccccc',
        ];

        switch (action.type) {
            case 'SERIAL_PORT_SELECTED':
                return {
                    ...state,
                    targetPort: action.port.comName,
                    targetSerialNumber: action.port.serialNumber,
                    writtenAddress: 0,
                };
            case 'target-size-known':
                // Fetching target's flash size is async, armor against race conditions
                if (action.targetPort !== state.targetPort) {
                    return state;
                }
                return {
                    ...state,
                    targetSize: action.targetSize,
                    targetPageSize: action.targetPageSize,
                };
            case 'empty-files':
                return {
                    ...state,
//                     fileError: action.fileError,
//                     blocks: new Map(),
                    filenames: [],
                    fileColours: new Map(),
                    blocks: new Map(),
                };
            case 'file-error':
                return {
                    ...state,
                    fileError: action.fileError,
//                     blocks: new Map(),
//                     filenames: [],
                };
            case 'file-parse':
                return {
                    ...state,
                    fileError: null,
                    blocks: state.blocks.set(action.filename, action.blocks),
                    filenames: [...state.filenames, action.filename],
                    fileColours: state.fileColours.set(
                        action.filename,
                        colours[(state.blocks.size - 1) % 8],
                    ),
                    writtenAddress: 0,
                };
            case 'write-progress':
                return {
                    ...state,
                    writtenAddress: action.address,
                };
            default:
                return state;
        }
    },
    middleware: store => next => action => { // eslint-disable-line
        switch (action.type) {
            case 'SERIAL_PORT_SELECTED': {
                jprogActions.logDeviceInfo(
                    action.port.serialNumber,
                    action.port.comName,
                    store.dispatch,
                );

                next(action);
                break;
            }
            case 'start-write' : {
                const state = store.getState();
                if (state.app.blocks.size === 0) { return; }
                if (state.app.writtenAddress !== 0) { return; }

                jprogActions.write(state.app, store.dispatch);

                next(action);
                break;
            }
            default: {
                next(action);
            }
        }
    },
};
