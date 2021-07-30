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

import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import PropTypes from 'prop-types';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as mcubootTargetActions from '../actions/mcubootTargetActions';
import * as modemTargetActions from '../actions/modemTargetActions';
import * as settingsActions from '../actions/settingsActions';
import * as targetActions from '../actions/targetActions';
import * as usbsdfuTargetActions from '../actions/usbsdfuTargetActions';
import { getMruFiles } from '../reducers/fileReducer';
import { getIsMcuboot } from '../reducers/mcubootReducer';
import { getIsModem } from '../reducers/modemReducer';
import { getAutoRead } from '../reducers/settingsReducer';
import {
    getDeviceInfo,
    getIsMemLoaded,
    getIsReady,
    getIsRecoverable,
    getIsWritable,
    getRegions,
    getTargetType,
} from '../reducers/targetReducer';
import { CommunicationType } from '../util/devices';

const Mru = ({ mruFiles }) => {
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);

    const dispatch = useDispatch();
    const openFile = filename => dispatch(fileActions.openFile(filename));
    const openFileDialog = () => dispatch(fileActions.openFileDialog());
    const onToggleFileList = () => dispatch(fileActions.loadMruFiles());

    const onClick = event => {
        onToggleFileList();
        setShow(!show);
        setTarget(event.target);
    };

    const onSelect = filePath => {
        if (filePath) {
            openFile(filePath);
        } else {
            openFileDialog();
        }
        setShow(false);
    };

    const containerNode =
        document.getElementsByClassName('core-main-layout')[0];

    return (
        <>
            <Overlay
                show={show}
                target={target}
                placement="bottom-end"
                container={containerNode}
                trigger="click"
                rootClose
                onHide={() => setShow(false)}
                transition={false}
            >
                <Popover
                    id="mru-popover"
                    className="mru-popover"
                    placement="bottom-end"
                    content
                >
                    {mruFiles.length ? (
                        mruFiles.map(filePath => (
                            <Dropdown.Item
                                key={filePath}
                                onSelect={() => onSelect(filePath)}
                            >
                                {filePath}
                            </Dropdown.Item>
                        ))
                    ) : (
                        <Dropdown.Item disabled>
                            No recently used files
                        </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onSelect={onSelect}>Browse...</Dropdown.Item>
                </Popover>
            </Overlay>
            <Button variant="danger" onClick={onClick}>
                <span className="mdi mdi-folder-open" />
                Add HEX file
            </Button>
        </>
    );
};

Mru.propTypes = {
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ControlPanel = () => {
    const fileRegionSize = useSelector(getRegions).length;
    const mruFiles = useSelector(getMruFiles);
    const autoRead = useSelector(getAutoRead);
    const targetIsWritable = useSelector(getIsWritable);
    const targetIsRecoverable = useSelector(getIsRecoverable);
    const targetIsMemLoaded = useSelector(getIsMemLoaded);
    const isProtected = !!useSelector(getDeviceInfo).cores.find(
        c => c.protectionStatus !== nrfdl.NRFDL_PROTECTION_STATUS_NONE
    );
    const targetIsReady = useSelector(getIsReady);
    const isJLink = useSelector(getTargetType) === CommunicationType.JLINK;
    const isUsbSerial =
        useSelector(getTargetType) === CommunicationType.USBSDFU;
    const isModem = useSelector(getIsModem);
    const isMcuboot = useSelector(getIsMcuboot);

    const dispatch = useDispatch();
    const closeFiles = () => dispatch(fileActions.closeFiles());
    const refreshAllFiles = () => dispatch(fileActions.refreshAllFiles());
    const toggleAutoRead = () => dispatch(settingsActions.toggleAutoRead());
    const toggleMcuboot = () => dispatch(mcubootTargetActions.toggleMcuboot());
    const performRecover = () => dispatch(jlinkTargetActions.recover());
    const performRecoverAndWrite = () =>
        dispatch(jlinkTargetActions.recoverAndWrite());
    const performSaveAsFile = () => dispatch(jlinkTargetActions.saveAsFile());
    const performJLinkRead = () => dispatch(jlinkTargetActions.read());
    const performReset = () => dispatch(usbsdfuTargetActions.resetDevice());
    const performWrite = () => dispatch(targetActions.write());
    const performModemUpdate = () =>
        dispatch(modemTargetActions.selectModemFirmware());

    return (
        <div className="control-panel">
            <Card>
                <Card.Header>File</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Mru mruFiles={mruFiles} />
                        <Button onClick={refreshAllFiles}>
                            <span className="mdi mdi-refresh" />
                            Reload files
                        </Button>
                        <Button onClick={closeFiles}>
                            <span className="mdi mdi-minus-circle" />
                            Clear files
                        </Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Device</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Button
                            key="performRecover"
                            onClick={performRecover}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                !targetIsRecoverable
                            }
                        >
                            <span className="mdi mdi-eraser" />
                            Erase all
                        </Button>
                        <Button
                            key="performRecoverAndWrite"
                            onClick={performRecoverAndWrite}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                !fileRegionSize ||
                                !(targetIsRecoverable && mruFiles.length)
                            }
                        >
                            <span className="mdi mdi-pencil" />
                            Erase & write
                        </Button>
                        <Button
                            key="performSaveAsFile"
                            onClick={performSaveAsFile}
                            disabled={!isJLink || !targetIsMemLoaded}
                        >
                            <span className="mdi mdi-floppy" />
                            Save as file
                        </Button>
                        <Button
                            key="performReset"
                            onClick={performReset}
                            disabled={!isUsbSerial || !targetIsReady}
                        >
                            <span className="mdi mdi-record" />
                            Reset
                        </Button>
                        <Button
                            key="performWrite"
                            onClick={performWrite}
                            disabled={!targetIsReady || !targetIsWritable}
                        >
                            <span className="mdi mdi-pencil" />
                            Write
                        </Button>
                        <Button
                            key="performJLinkRead"
                            onClick={performJLinkRead}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                isProtected
                            }
                        >
                            <span className="mdi mdi-refresh" />
                            Read
                        </Button>
                    </ButtonGroup>
                    <Form.Group controlId="formBasicChecbox">
                        <Form.Check
                            type="checkbox"
                            id="auto-read-memory-checkbox"
                            className="last-checkbox"
                            onChange={e => toggleAutoRead(e.target.checked)}
                            checked={autoRead}
                            label="Auto read memory"
                        />
                        <Form.Check
                            type="checkbox"
                            id="toggle-mcuboot-checkbox"
                            className="last-checkbox"
                            onChange={e => toggleMcuboot(e.target.checked)}
                            checked={isMcuboot}
                            label="Enable MCUboot"
                        />
                    </Form.Group>
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Cellular Modem</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Button
                            key="performModemUpdate"
                            onClick={performModemUpdate}
                            disabled={!isModem || !targetIsReady}
                        >
                            <span className="mdi mdi-pencil" />
                            Update modem
                        </Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ControlPanel;
