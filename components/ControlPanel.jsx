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
import { Button, Dropdown, MenuItem, Glyphicon } from 'react-bootstrap';
import PropTypes from 'prop-types';
import MemoryMap from 'nrf-intel-hex';

import FileLegend from './FileLegend';
import { hexpad8 } from '../hexpad';

const ControlPanel = props => {
    const overlaps = MemoryMap.overlapMemoryMaps(props.memMaps);

    let overlapWarning = '';
    const outsideFlashBlocks = [];
    overlaps.forEach((overlap, startAddress) => {
        if (overlap.length > 1) {
            overlapWarning = (<div className="alert alert-warning">
                <center><Glyphicon glyph="warning-sign" style={{ fontSize: '3em' }} /></center>
                <p><strong>Caution!</strong> Some of the .hex files have overlapping data.</p>
                <p>In regions with overlapping data, data from the file which
                    was <strong>last</strong> added will be used.</p>
            </div>);
        }

        const endAddress = startAddress + overlap[0][1].length;

        // This assumes UICR at 0x10001000, size 4KiB
        if ((startAddress < 0x10001000 && endAddress > props.targetSize) ||
            (startAddress >= 0x10001000 && endAddress > 0x10002000)) {
            outsideFlashBlocks.push(`${hexpad8(startAddress)}-${hexpad8(endAddress)}`);
        }
    });
    let outsideFlashWarning;
    if (outsideFlashBlocks.length) {
        outsideFlashWarning = (<div className="alert alert-warning">
            <center><Glyphicon glyph="warning-sign" style={{ fontSize: '3em' }} /></center>
            <p><strong>Caution!</strong> There is data outside the
                user-writable areas ({ outsideFlashBlocks.join(', ') }).</p>
            <p> Check that the .hex files are appropiate for the current device.</p>
        </div>);
    }


    let mruMenuItems;

    if (props.mruFiles.length) {
        mruMenuItems = props.mruFiles.map((filename, i) => (
            <MenuItem key={`${i + 1}`} onSelect={() => props.openFile(filename)}>{filename}</MenuItem>
        ));
    } else {
        mruMenuItems = (<MenuItem disabled>No recently used files</MenuItem>);
    }

    return (
        <div>
            <Dropdown pullRight id="files-dropdown">
                <Dropdown.Toggle onClick={props.onToggleFileList}>
                    <Glyphicon glyph="folder-open" />Add a .hex file
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    { mruMenuItems }
                    <MenuItem divider />
                    <MenuItem onSelect={props.openFileDialog}>Browse...</MenuItem>
                </Dropdown.Menu>
            </Dropdown>
            <Button onClick={props.refreshAllFiles}>
                <Glyphicon glyph="refresh" />Reload .hex files
            </Button>
            <Button onClick={props.closeFiles}>
                <Glyphicon glyph="minus-sign" />Clear files
            </Button>

            <Button
                onClick={props.performWrite}
                disabled={!props.targetIsReady || !props.targetIsWritable}
            >
                <Glyphicon glyph="save" />Write all to devkit
            </Button>

            <Button onClick={props.performRecover} disabled={!props.targetIsReady}>
                <Glyphicon glyph="remove-sign" />Recover (full erase)
            </Button>

            <FileLegend files={props.loaded} remove={props.removeFile} />

            { overlapWarning }
            { outsideFlashWarning }
        </div>
    );
};

ControlPanel.propTypes = {
    closeFiles: PropTypes.func.isRequired,
    onToggleFileList: PropTypes.func.isRequired,
    openFileDialog: PropTypes.func.isRequired,
    performWrite: PropTypes.func.isRequired,
    performRecover: PropTypes.func.isRequired,
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
    loaded: PropTypes.shape({}).isRequired,
    memMaps: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        ),
    ).isRequired,
    refreshAllFiles: PropTypes.func.isRequired,
    targetIsReady: PropTypes.bool.isRequired,
    targetIsWritable: PropTypes.bool.isRequired,
    removeFile: PropTypes.func.isRequired,
};

export default ControlPanel;
