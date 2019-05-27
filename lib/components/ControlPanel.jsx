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
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';

const MruMenuItems = (mruFiles, openFile) => {
    let mruMenuItems;
    if (mruFiles.length) {
        mruMenuItems = mruFiles.map(filePath => (
            <Dropdown.Item key={filePath} onSelect={() => openFile(filePath)}>
                {filePath}
            </Dropdown.Item>
        ));
    } else {
        mruMenuItems = (<Dropdown.Item disabled>No recently used files</Dropdown.Item>);
    }
    return mruMenuItems;
};

const ControlPanel = ({
    openFile,
    closeFiles,
    refreshAllFiles,
    openFileDialog,
    onToggleFileList,
    mruFiles,
    fileRegionSize,
    refreshEnabled,
    autoRead,
    toggleAutoRead,
    performJLinkRead,
    performRecover,
    performRecoverAndWrite,
    performSaveAsFile,
    performReset,
    targetIsReady,
    targetIsWritable,
    targetIsRecoverable,
    targetIsMemLoaded,
    isJLink,
    isUsbSerial,
    performWrite,
}) => (
    <div className="control-panel">
        <Card>
            <Card.Header>File</Card.Header>
            <ButtonGroup vertical>
                <Dropdown id="files-dropdown">
                    <Dropdown.Toggle>
                        <span className="mdi mdi-folder-open" />Add HEX file
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {MruMenuItems(mruFiles, openFile)}
                        <Dropdown.Divider />
                        <Dropdown.Item onSelect={openFileDialog}>Browse...</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button onClick={refreshAllFiles}>
                    <span className="mdi mdi-refresh" />Reload files
                </Button>
                <Button onClick={closeFiles}>
                    <span className="mdi mdi-minus-circle" />Clear files
                </Button>
            </ButtonGroup>
        </Card>
        <Card>
            <Card.Header>Device</Card.Header>
            <ButtonGroup vertical>
                <Button
                    key="performRecover"
                    onClick={performRecover}
                    disabled={!isJLink || !targetIsReady || !targetIsRecoverable}
                >
                    <span className="mdi mdi-erase" />Erase all
                </Button>
                <Button
                    key="performRecoverAndWrite"
                    onClick={performRecoverAndWrite}
                    disabled={
                        !isJLink
                        || !targetIsReady
                        || !fileRegionSize
                        || !(targetIsRecoverable && mruFiles.length)
                    }
                >
                    <span className="mdi mdi-pencil" />Erase & write
                </Button>
                <Button
                    key="performSaveAsFile"
                    onClick={performSaveAsFile}
                    disabled={!isJLink || !targetIsMemLoaded}
                >
                    <span className="mdi mdi-floppy" />Save as file
                </Button>
                <Button
                    key="performReset"
                    onClick={performReset}
                    disabled={!isUsbSerial || !targetIsReady}
                >
                    <span className="mdi mdi-record" />Reset
                </Button>
                <Button
                    key="performWrite"
                    onClick={performWrite}
                    disabled={!targetIsReady || !targetIsWritable}
                >
                    <span className="mdi mdi-pencil" />Write
                </Button>
                <Button
                    key="performJLinkRead"
                    onClick={performJLinkRead}
                    disabled={!targetIsReady || !refreshEnabled}
                >
                    <span className="mdi mdi-refresh" />Read
                </Button>
            </ButtonGroup>
            <Form.Check
                type="checkbox"
                className="last-checkbox"
                onChange={e => toggleAutoRead(e.target.checked)}
                checked={autoRead}
                label="Auto read memory"
            />
        </Card>
    </div>
);

ControlPanel.propTypes = {
    openFile: PropTypes.func.isRequired,
    closeFiles: PropTypes.func.isRequired,
    refreshAllFiles: PropTypes.func.isRequired,
    onToggleFileList: PropTypes.func.isRequired,
    openFileDialog: PropTypes.func.isRequired,
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
    fileRegionSize: PropTypes.number.isRequired,
    refreshEnabled: PropTypes.bool.isRequired,
    autoRead: PropTypes.bool.isRequired,
    toggleAutoRead: PropTypes.func.isRequired,
    performJLinkRead: PropTypes.func.isRequired,
    performRecover: PropTypes.func.isRequired,
    performRecoverAndWrite: PropTypes.func.isRequired,
    performSaveAsFile: PropTypes.func.isRequired,
    performReset: PropTypes.func.isRequired,
    targetIsReady: PropTypes.bool.isRequired,
    targetIsWritable: PropTypes.bool.isRequired,
    targetIsRecoverable: PropTypes.bool.isRequired,
    targetIsMemLoaded: PropTypes.bool.isRequired,
    isJLink: PropTypes.bool.isRequired,
    isUsbSerial: PropTypes.bool.isRequired,
    performWrite: PropTypes.func.isRequired,
};

export default ControlPanel;
