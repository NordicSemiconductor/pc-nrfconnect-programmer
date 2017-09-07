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
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import { hexToArrays } from 'nrf-intel-hex';
import { readFile } from 'fs';
import { basename } from 'path';
import nrfjprog from 'pc-nrfjprog-js';

import hexpad from './hexpad';
import MemoryLayout from './components/MemoryLayout';

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
        props => {
//             const { title } = props;
            let buttonText = 'Select a different .hex file';
            let filename = props.filename;

            if (!filename) {
                filename = 'No .hex file selected';
                buttonText = 'Select a .hex file';
            }

            return (
                <MainView {...props}>
                    <div>{filename}</div>
                    <button onClick={props.openFileDialog}>{buttonText}</button>
                    <button onClick={props.performWrite}>Write</button>
                    <MemoryLayout {...props} />
                </MainView>
            );
        }
    ),
    mapMainViewState: (state, props) => ({
        ...props,
        fileError: state.app.fileError,
        blocks: state.app.blocks,
        targetSize: state.app.targetSize,
        filename: state.app.filename,
        writtenAddress: state.app.writtenAddress,
    }),
    mapMainViewDispatch: (dispatch, props) => ({
        ...props,
        openFileDialog: () => {
            electron.remote.dialog.showOpenDialog(/* window */undefined, {
                title: 'Select a .hex file',
                filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
                properties: ['openFile'],
            }, filenames => {
                console.log('Files selected: ', filenames);

                if (filenames && filenames.length) {
                    const filename = filenames[0];
                    logger.info('Parsing .hex file: ', filename);
                    readFile(filename, {}, (err, data) => {
                        if (err) {
                            const error = `Could not open .hex file: ${err}`;
                            logger.error(error);
                            dispatch({
                                type: 'file-error',
                                fileError: error,
                            });
                            return;
                        }

                        let blocks;
                        try {
                            blocks = hexToArrays(data.toString());
                        } catch (ex) {
                            const error = `Could not parse .hex file: ${ex}`;
                            logger.error(error);
                            dispatch({
                                type: 'file-error',
                                fileError: error,
                            });
                            return;
                        }

                        const addresses = Array.from(blocks.keys());
                        for (let i = 0, l = addresses.length; i < l; i += 1) {
                            const address = addresses[i];
                            const size = blocks.get(address).length;
                            const addressFormatted = `0x${address.toString(16)
                                                                   .toUpperCase()
                                                                   .padStart(8, '0')}`;
                            const endAddressFormatted = `0x${(address + size)
                                                                .toString(16)
                                                                .toUpperCase()
                                                                .padStart(8, '0')}`;
                            const sizeFormatted = `0x${size.toString(16)
                                                             .toUpperCase()
                                                             .padStart(8, '0')}`;

                            logger.info(`Data block: ${addressFormatted}-${endAddressFormatted} (${sizeFormatted}`, ' bytes long)');
                        }

                        dispatch({
                            type: 'file-parse',
                            filename: basename(filename),
                            blocks,
                        });
                    });
                }

            });
        },
        performWrite: () => {

            dispatch({
                type: 'start-write'
            });

        },
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
                    { id: 'about', text: 'About', iconClass: 'icon-star' },
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
        props => (
            <SidePanel {...props}>
                SidePanel content
            </SidePanel>
        )
    ),
    mapSidePanelState: (state, props) => ({
        ...props,
    }),
    mapSidePanelDispatch: (dispatch, props) => ({
        ...props,
    }),
    // Note: initial state of the application needs to be provided
    reduceApp: (state = {
        blocks: new Map(),
        fileError: null,
        targetSize: 0x00100000,  // 1MiB. FIXME: Should load from connected devkit
        targetPort: null,
        writtenAddress: 0,
    }, action) => {
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
                    targetPageSize: action.targetPageSize
                };
            case 'file-error':
                return {
                    ...state,
                    fileError: action.fileError,
                    blocks: new Map(),
                    filename: null,
                };
            case 'file-parse':
                return {
                    ...state,
                    fileError: null,
                    blocks: action.blocks,
                    filename: action.filename,
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
            case 'SERIAL_PORT_SELECTED':
                nrfjprog.getDeviceInfo(action.port.serialNumber, (err, info) => {
                    if (err) {
                        logger.error(err);
                        logger.error('Could not fetch memory size of target devkit');
                        return;
                    }
                    const { codeSize, codePageSize, ramSize } = info;

                    const deviceModels = {
                        [nrfjprog.NRF51_FAMILY]: {
                            [nrfjprog.NRF51xxx_xxAA_REV1]: 'NRF51xxx_xxAA_REV1',
                            [nrfjprog.NRF51xxx_xxAA_REV2]: 'NRF51xxx_xxAA_REV2',
                            [nrfjprog.NRF51xxx_xxAA_REV3]: 'NRF51xxx_xxAA_REV3',
                            [nrfjprog.NRF51801_xxAB_REV3]: 'NRF51801_xxAB_REV3',
                            [nrfjprog.NRF51802_xxAA_REV3]: 'NRF51802_xxAA_REV3',
                            [nrfjprog.NRF51xxx_xxAB_REV3]: 'NRF51xxx_xxAB_REV3',
                            [nrfjprog.NRF51xxx_xxAC_REV3]: 'NRF51xxx_xxAC_REV3',
                        },
                        [nrfjprog.NRF52_FAMILY]: {
                            [nrfjprog.NRF52810_xxAA_FUTURE]: 'NRF52810_xxAA_FUTURE',
                            [nrfjprog.NRF52832_xxAA_ENGA]: 'NRF52832_xxAA_ENGA',
                            [nrfjprog.NRF52832_xxAA_ENGB]: 'NRF52832_xxAA_ENGB',
                            [nrfjprog.NRF52832_xxAA_REV1]: 'NRF52832_xxAA_REV1',
                            [nrfjprog.NRF52832_xxAB_REV1]: 'NRF52832_xxAB_REV1',
                            [nrfjprog.NRF52832_xxAA_FUTURE]: 'NRF52832_xxAA_FUTURE',
                            [nrfjprog.NRF52832_xxAB_FUTURE]: 'NRF52832_xxAB_FUTURE',
                            [nrfjprog.NRF52840_xxAA_ENGA]: 'NRF52840_xxAA_ENGA',
                            [nrfjprog.NRF52810_xxAA_REV1]: 'NRF52810_xxAA_REV1',
                            [nrfjprog.NRF52840_xxAA_FUTURE]: 'NRF52840_xxAA_FUTURE',
                        },
                    };

                    let deviceModel = 'Unknown model';
                    if (info.family in deviceModels &&
                        info.deviceType in deviceModels[info.family]) {
                        deviceModel = deviceModels[info.family][info.deviceType];
                    }

                    logger.info(`${deviceModel}. RAM: ${ramSize / 1024}KiB. Flash: ${codeSize / 1024}KiB in pages of ${codePageSize / 1024}KiB.`);
                    store.dispatch({
                        type: 'target-size-known',
                        targetPort: action.port.comName,
                        targetSize: codeSize,
                        targetPageSize: codePageSize
                    });
                });
                next(action);
                break;
            case 'start-write' :
                const state = store.getState();
                if (state.app.blocks.size === 0) { return; }
                if (state.app.writtenAddress !== 0) { return; }

                /// FIXME: Store a copy of the currently connected s/n, to prevent race conditions
                /// Alternatively, disable the devkit drop-down while a write is in progress.

                let written = 0;
                let erased = 0;
//                 const writeSize = 64 * 1024;
                const pageSize = state.app.targetPageSize;
                function writeBlock() {
                    const addresses = Array.from(state.app.blocks.keys());
                    for (let i = 0, l = addresses.length; i < l; i += 1) {
                        const blockStart = addresses[i];
                        const block = state.app.blocks.get(blockStart);
                        const blockSize = block.length;
                        const blockEnd = blockStart + blockSize;

                        if (written < blockEnd) {
                            const increment = Math.min(pageSize, blockEnd - written);
                            const writeStart = Math.max(blockStart, written);
                            written = writeStart + increment;

                            const formattedStart = hexpad(writeStart);
//                             const formattedEnd = written.toString(16).toUpperCase().padStart(8, '0');
//                             const formattedIncrement = increment.toString(16).toUpperCase().padStart(8, '0');

                            const subBlock = Array.from(block.subarray(
                                writeStart - blockStart,
                                (writeStart - blockStart) + increment
                            ));

                            const formattedSubblockSize = hexpad(subBlock.length);
                            const formattedEnd = hexpad((writeStart + subBlock.length) - 1);

                            function writeRaw() {
                                console.log(`Writing at 0x${formattedStart}-0x${formattedEnd}, 0x${formattedSubblockSize}bytes`);
                                logger.info(`Writing at 0x${formattedStart}-0x${formattedEnd}, 0x${formattedSubblockSize}bytes`);

                                nrfjprog.write(serialNumber, writeStart, subBlock, (err)=>{
                                    if (err) {
                                        console.error(err);
                                        console.error(err.log);
                                        logger.error(err);
                                    } else {
                                        store.dispatch({
                                            type: 'write-progress',
                                            address: written,
                                        });

                                        requestAnimationFrame(()=>{ writeBlock(); });
//                                         setTimeout(()=>{ writeBlock(); }, 3000);
                                    }
                                });
                            }

//                             setTimeout(fake4KiB, 250);
                            const serialNumber = state.app.targetSerialNumber;

                            if (erased > written) {
                                writeRaw();
                            } else {
                                const eraseStart = writeStart - (writeStart % pageSize);
                                erased = blockEnd - (blockEnd % pageSize) + (pageSize - 1);

                                const formattedEraseStart = eraseStart.toString(16).toUpperCase().padStart(8, '0');
                                const formattedEraseEnd = erased.toString(16).toUpperCase().padStart(8, '0');
                                console.log(`Erasing 0x${formattedEraseStart}-0x${formattedEraseEnd}`);
                                logger.info(`Erasing 0x${formattedEraseStart}-0x${formattedEraseEnd}`);

                                nrfjprog.erase(serialNumber, {
                                    erase_mode: nrfjprog.ERASE_PAGES,
//                                     start_address: eraseStart,
                                    start_adress: eraseStart,   /// Legacy (bugged) property name, see https://github.com/NordicSemiconductor/pc-nrfjprog-js/pull/7
                                    end_address: erased
                                }, (err)=>{
                                    if (err) {
                                        console.error(err);
                                        console.error(err.log);
                                        logger.error(err);
                                    } else {
                                        writeRaw();
                                    }
                                });
                            }


                            return;
                        }

                    }

                    store.dispatch({
                        type: 'write-progress-finished'
                    });
                }
                writeBlock();

                next(action);
                break;
            default:
                next(action);
        }
    },
};
