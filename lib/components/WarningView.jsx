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
import { Glyphicon } from 'react-bootstrap';
import { List } from 'immutable';
import MemoryMap from 'nrf-intel-hex';
import { hexpad8 } from '../util/hexpad';

const WarningIcon = <Glyphicon glyph="exclamation-sign" className="warning-sign" />;

const FileWarnings = (memMaps, targetSize) => {
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);

    // This warning is to warn about overlap in the hex files.
    let overlapWarning = '';
    const outsideFlashBlocks = [];
    overlaps.forEach((overlap, startAddress) => {
        if (overlap.length > 1) {
            overlapWarning = (
                <div className="alert alert-warning" key={`overlap-warning-${startAddress + 1}`}>
                    <center>
                        { WarningIcon }
                        <p>Some of the .hex files have overlapping data.</p>
                        <p>In regions with overlapping data, data from the file which
                        was <strong>last</strong> added will be used.</p>
                    </center>
                </div>
            );
        }

        const endAddress = startAddress + overlap[0][1].length;

        // This assumes UICR at 0x10001000, size 4KiB
        if ((startAddress < 0x10001000 && endAddress > targetSize) ||
            (startAddress >= 0x10001000 && endAddress > 0x10002000)) {
            outsideFlashBlocks.push(`${hexpad8(startAddress)}-${hexpad8(endAddress)}`);
        }
    });

    // This warning is to warn about there exists some contents
    // outside of maximum size of target device.
    let outsideFlashWarning;
    if (outsideFlashBlocks.length) {
        outsideFlashWarning = (
            <div className="alert alert-warning" key="outside-flash-warning">
                <center>
                    { WarningIcon }
                    <p>There is data outside the user-writable areas ({ outsideFlashBlocks.join(', ') }). </p>
                    <p>Check that the .hex files are appropiate for the current device.</p>
                </center>
            </div>
        );
    }

    return [
        overlapWarning,
        outsideFlashWarning,
    ];
};

const Warnings = (targetWarningStrings, userWarningStrings) => (
    targetWarningStrings.concat(userWarningStrings).map((s, index) => (
        <div className="alert alert-warning" key={`outside-flash-warning-${index + 1}`}>
            <center>
                { WarningIcon }
                <p>{s}</p>
            </center>
        </div>
    )));

const WarningView = ({
    memMaps,
    targetSize,
    targetWarningStrings,
    userWarningStrings,
}) => (
    <div className="warning-view">
        { FileWarnings(memMaps, targetSize) }
        { Warnings(targetWarningStrings, userWarningStrings) }
    </div>
);

WarningView.propTypes = {
    memMaps: PropTypes.arrayOf(
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        ),
    ).isRequired,
    targetSize: PropTypes.number.isRequired,
    targetWarningStrings: PropTypes.objectOf(List).isRequired,
    userWarningStrings: PropTypes.objectOf(List).isRequired,
};

export default WarningView;
