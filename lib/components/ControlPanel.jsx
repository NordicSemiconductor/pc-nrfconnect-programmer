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
import PropTypes from 'prop-types';

const Mru = ({ onToggleFileList, openFileDialog, openFile, mruFiles }) => {
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);

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

    const containerNode = document.getElementsByClassName(
        'core-main-layout'
    )[0];

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
    openFile: PropTypes.func.isRequired,
    onToggleFileList: PropTypes.func.isRequired,
    openFileDialog: PropTypes.func.isRequired,
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ControlPanel = ({
    autoRead,
    closeFiles,
    fileRegionSize,
    isJLink,
    isMcuboot,
    isModem,
    isUsbSerial,
    isProtected,
    mruFiles,
    onToggleFileList,
    openFile,
    openFileDialog,
    performJLinkRead,
    performModemUpdate,
    performRecover,
    performRecoverAndWrite,
    performReset,
    performSaveAsFile,
    performWrite,
    refreshAllFiles,
    targetIsMemLoaded,
    targetIsReady,
    targetIsRecoverable,
    targetIsWritable,
    toggleAutoRead,
    toggleMcuboot,
}) => (
    <div className="control-panel">
        <Card>
            <Card.Header>File</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Mru
                        openFile={openFile}
                        openFileDialog={openFileDialog}
                        mruFiles={mruFiles}
                        onToggleFileList={onToggleFileList}
                    />
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

ControlPanel.propTypes = {
    autoRead: PropTypes.bool.isRequired,
    closeFiles: PropTypes.func.isRequired,
    fileRegionSize: PropTypes.number.isRequired,
    isJLink: PropTypes.bool.isRequired,
    isMcuboot: PropTypes.bool.isRequired,
    isModem: PropTypes.bool.isRequired,
    isUsbSerial: PropTypes.bool.isRequired,
    isProtected: PropTypes.bool.isRequired,
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
    onToggleFileList: PropTypes.func.isRequired,
    openFile: PropTypes.func.isRequired,
    openFileDialog: PropTypes.func.isRequired,
    performJLinkRead: PropTypes.func.isRequired,
    performModemUpdate: PropTypes.func.isRequired,
    performRecover: PropTypes.func.isRequired,
    performRecoverAndWrite: PropTypes.func.isRequired,
    performReset: PropTypes.func.isRequired,
    performSaveAsFile: PropTypes.func.isRequired,
    performWrite: PropTypes.func.isRequired,
    refreshAllFiles: PropTypes.func.isRequired,
    targetIsMemLoaded: PropTypes.bool.isRequired,
    targetIsReady: PropTypes.bool.isRequired,
    targetIsRecoverable: PropTypes.bool.isRequired,
    targetIsWritable: PropTypes.bool.isRequired,
    toggleAutoRead: PropTypes.func.isRequired,
    toggleMcuboot: PropTypes.func.isRequired,
};

export default ControlPanel;
