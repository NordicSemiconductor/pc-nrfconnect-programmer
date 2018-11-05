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
import PropTypes from 'prop-types';
import { Glyphicon, Button, Dropdown, MenuItem, ButtonGroup, Panel, Checkbox } from 'react-bootstrap';
import { CommunicationType } from '../util/devices';

const MruMenuItems = (mruFiles, openFile) => {
    let mruMenuItems;
    if (mruFiles.length) {
        mruMenuItems = mruFiles.map(filePath => (
            <MenuItem key={filePath} onSelect={() => openFile(filePath)}>{filePath}</MenuItem>
        ));
    } else {
        mruMenuItems = (<MenuItem disabled>No recently used files</MenuItem>);
    }
    return mruMenuItems;
};

const ButtonGroupView = ({
    openFile,
    closeFiles,
    refreshAllFiles,
    openFileDialog,
    onToggleFileList,
    performJLinkRead,
    performJLinkWrite,
    performUSBSDFUWrite,
    performRecover,
    performRecoverAndWrite,
    performSaveAsFile,
    mruFiles,
    targetType,
    targetIsReady,
    targetIsWritable,
    targetIsRecoverable,
    targetIsMemLoaded,
}) => {
    const usbJLinkButtons = (
        <Panel header="USB JLink device actions">
            <ButtonGroup vertical>
                <Button
                    key="performRecover"
                    onClick={performRecover}
                    disabled={!targetIsReady || !targetIsRecoverable}
                >
                    <Glyphicon glyph="remove-sign" />Erase all
                </Button>
                <Button
                    key="performRecoverAndWrite"
                    onClick={performRecoverAndWrite}
                    disabled={!targetIsReady || !targetIsRecoverable}
                >
                    <Glyphicon glyph="save" />Erase all & write
                </Button>
                <Button
                    key="performSaveAsFile"
                    onClick={performSaveAsFile}
                    disabled={!targetIsMemLoaded}
                >
                    <Glyphicon glyph="save" />Save as file
                </Button>
                <Button
                    key="performJLinkRead"
                    onClick={performJLinkRead}
                    disabled={!targetIsReady}
                >
                    <Glyphicon glyph="download-alt" />Read
                </Button>
                <Button
                    key="performJLinkWrite"
                    onClick={performJLinkWrite}
                    disabled={!targetIsReady || !targetIsWritable}
                >
                    <Glyphicon glyph="download-alt" />Write
                </Button>
            </ButtonGroup>
            <Checkbox>Auto read memory</Checkbox>
        </Panel>
    );

    const usbCdcAcmButtons = (
        <Panel header="USB CDC ACM device actions">
            <ButtonGroup vertical>
                <Button
                    key="performJLinkWrite"
                    onClick={performUSBSDFUWrite}
                    disabled={!targetIsReady || !targetIsWritable}
                >
                    <Glyphicon glyph="download-alt" />Write
                </Button>
            </ButtonGroup>
        </Panel>
    );


    return (<div className="button-group-view">
        <Panel header="File actions">
            <ButtonGroup vertical>
                <Dropdown pullRight id="files-dropdown">
                    <Dropdown.Toggle onClick={onToggleFileList}>
                        <Glyphicon glyph="folder-open" />Add a .hex file
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {MruMenuItems(mruFiles, openFile)}
                        <MenuItem divider />
                        <MenuItem onSelect={openFileDialog}>Browse...</MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
                <Button onClick={refreshAllFiles}>
                    <Glyphicon glyph="refresh" />Reload .hex files
                </Button>
                <Button onClick={closeFiles}>
                    <Glyphicon glyph="minus-sign" />Clear files
                </Button>
            </ButtonGroup>
        </Panel>
        {targetType === CommunicationType.JLINK &&
                usbJLinkButtons
        }
        {targetType === CommunicationType.USBSDFU &&
                usbCdcAcmButtons
        }
    </div>);
};

ButtonGroupView.propTypes = {
    openFile: PropTypes.func.isRequired,
    closeFiles: PropTypes.func.isRequired,
    refreshAllFiles: PropTypes.func.isRequired,
    onToggleFileList: PropTypes.func.isRequired,
    openFileDialog: PropTypes.func.isRequired,
    performJLinkRead: PropTypes.func.isRequired,
    performJLinkWrite: PropTypes.func.isRequired,
    performUSBSDFUWrite: PropTypes.func.isRequired,
    performRecover: PropTypes.func.isRequired,
    performRecoverAndWrite: PropTypes.func.isRequired,
    performSaveAsFile: PropTypes.func.isRequired,
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
    targetType: PropTypes.number.isRequired,
    targetIsReady: PropTypes.bool.isRequired,
    targetIsWritable: PropTypes.bool.isRequired,
    targetIsRecoverable: PropTypes.bool.isRequired,
    targetIsMemLoaded: PropTypes.bool.isRequired,
};

export default ButtonGroupView;
