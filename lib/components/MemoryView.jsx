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
import { Button, Glyphicon } from 'react-bootstrap';
import { List } from 'immutable';
import RegionView from '../containers/regionView';

const convertRegionsToViews = (regions, targetSize, active) => {
    const regionViews = [];
    let lastAddress = 0;
    regions.sortBy(r => r.startAddress).forEach(region => {
        const { startAddress, regionSize } = region;

        if (startAddress < targetSize) {
            if (lastAddress === 0) {
                if (startAddress > 0) {
                    regionViews.push(
                        <RegionView
                            key={lastAddress}
                            width={startAddress}
                        />,
                    );
                }
                regionViews.push(
                    <RegionView
                        key={startAddress}
                        region={region}
                        hoverable
                        active={active}
                        width={regionSize}
                    />,
                );
                lastAddress = (startAddress + regionSize) - 1;
            } else {
                regionViews.push(
                    <RegionView
                        key={lastAddress}
                        width={startAddress - lastAddress}
                    />,
                );
                regionViews.push(
                    <RegionView
                        key={startAddress}
                        region={region}
                        hoverable
                        active={active}
                        width={regionSize}
                    />,
                );
                lastAddress = (startAddress + regionSize) - 1;
            }
        }
    });
    regionViews.push(
        <RegionView
            key={lastAddress}
            width={targetSize - lastAddress}
        />,
    );

    return regionViews;
};

const MemoryView = ({
    targetSize,
    targetRegions,
    fileRegions,
    isTarget,
    isFile,
    isWriting,
    isErasing,
    isLoading,
    refreshEnabled,
    performJLinkRead,
}) => {
    let placeHolder;
    if (isTarget) {
        if (isLoading) {
            // When it is target and during loading, show something.
            placeHolder = <RegionView width={1} striped active />;
        } else if (isWriting) {
            // When it is target and during writing, show file regions active.
            placeHolder = convertRegionsToViews(fileRegions, targetSize, true);
        } else {
            // When it is target and regions are known, show target regions without animation.
            placeHolder = convertRegionsToViews(targetRegions, targetSize);
        }
    } else if (isFile) {
        // When it is file, show file regions without animation.
        placeHolder = convertRegionsToViews(fileRegions, targetSize);
    }
    return (
        <div className="region-container">
            { placeHolder }
            { isTarget && isErasing &&
                <div className="erase-indicator striped active" />
            }
            { isTarget && refreshEnabled &&
                <div className="centering-container">
                    <Button
                        key="performJLinkRead"
                        onClick={performJLinkRead}
                    >
                        <Glyphicon glyph="refresh" />Read
                    </Button>
                </div>
            }
        </div>
    );
};

MemoryView.propTypes = {
    targetSize: PropTypes.number.isRequired,
    targetRegions: PropTypes.instanceOf(List).isRequired,
    fileRegions: PropTypes.instanceOf(List).isRequired,
    isTarget: PropTypes.bool.isRequired,
    isFile: PropTypes.bool.isRequired,
    isWriting: PropTypes.bool.isRequired,
    isErasing: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    refreshEnabled: PropTypes.bool.isRequired,
    performJLinkRead: PropTypes.func.isRequired,
};

export default MemoryView;
