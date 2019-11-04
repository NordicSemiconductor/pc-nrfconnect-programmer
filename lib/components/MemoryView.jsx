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
import { List } from 'immutable';
import RegionView from '../containers/regionView';
import { getCoreName } from '../util/devices';

const CORE_MEMORY_OFFSET = 0x1000000;

const convertRegionsToViews = (regions, targetSize, active, targetFicrBaseAddr) => {
    const regionViews = [[]];
    if (regions.size === 0) {
        return regionViews;
    }
    let lastAddress = 0;
    const sortedRegions = regions.sortBy(r => r.startAddress);
    const lastStartAddress = sortedRegions.last().startAddress;
    const coreCount = Math.trunc(lastStartAddress / CORE_MEMORY_OFFSET) + 1;
    const memPerCore = targetSize / coreCount;

    sortedRegions.forEach(region => {
        const { startAddress, regionSize } = region;
        if (startAddress > targetFicrBaseAddr) {
            return;
        }
        const startAddr = startAddress % targetSize;
        const core = Math.trunc(startAddress / CORE_MEMORY_OFFSET);
        if (!regionViews[core]) {
            regionViews[core] = [];
        }
        if (lastAddress === 0) {
            if (startAddr > 0) {
                regionViews[core].push(
                    <RegionView
                        key={`${core}-${lastAddress}`}
                        width={startAddr}
                    />,
                );
            }
            regionViews[core].push(
                <RegionView
                    key={`${core}-${startAddr}`}
                    region={region}
                    hoverable
                    active={active}
                    width={regionSize}
                />,
            );
            lastAddress = (startAddr + regionSize) - 1;
        } else {
            regionViews[core].push(
                <RegionView
                    key={`${core}-${lastAddress}`}
                    width={startAddr - lastAddress}
                />,
            );
            regionViews[core].push(
                <RegionView
                    key={`${core}-${startAddr}`}
                    region={region}
                    hoverable
                    active={active}
                    width={regionSize}
                />,
            );
            lastAddress = (startAddr + regionSize) - 1;
        }
    });
    regionViews.forEach((core, index) => {
        const sum = core.reduce((acc, { props }) => (acc + props.width), 0);
        core.push(<RegionView key={`${index.toString()}-${sum}`} width={memPerCore - sum} />);
    });

    return regionViews;
};

const MemoryView = ({
    targetSize,
    regions,
    isTarget,
    isFile,
    isMcuboot,
    isWriting,
    isErasing,
    isLoading,
    refreshEnabled,
    targetFamily,
    targetFicrBaseAddr,
}) => {
    const placeHolder = (isTarget && isLoading)
        // When it is target and during loading, show something.
        ? [<RegionView width={1} striped active />]
        // When it is target and during writing, show file regions active.
        : convertRegionsToViews(regions, targetSize, isTarget && isWriting, targetFicrBaseAddr);

    return (
        placeHolder.map((coreRegionViews, index) => (
            <React.Fragment key={index.toString()}>
                <span className="core-number">{getCoreName(targetFamily, index)}</span>
                <div className="region-container">
                    { coreRegionViews }
                    { isTarget && isErasing && (
                        <div className="erase-indicator striped active" />
                    )}
                    { isTarget && refreshEnabled && (
                        <div className="centering-container">
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>Press <strong>READ</strong> button to read the memory</p>
                            </div>
                        </div>
                    )}
                    { isTarget && isMcuboot && (
                        <div className="centering-container">
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>Memory layout is not available via MCUboot</p>
                            </div>
                        </div>
                    )}
                </div>
            </React.Fragment>
        ))
    );
};

MemoryView.propTypes = {
    targetSize: PropTypes.number.isRequired,
    regions: PropTypes.instanceOf(List).isRequired,
    isTarget: PropTypes.bool.isRequired,
    isFile: PropTypes.bool.isRequired,
    isMcuboot: PropTypes.bool.isRequired,
    isWriting: PropTypes.bool.isRequired,
    isErasing: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    refreshEnabled: PropTypes.bool.isRequired,
    targetFamily: PropTypes.string.isRequired,
    targetFicrBaseAddr: PropTypes.number.isRequired,
};

export default MemoryView;
