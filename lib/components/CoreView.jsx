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

import RegionView from '../containers/regionView';

const CoreView = ({ core, active }) => {
    const { regions, romSize, romBaseAddr } = core;
    const regionViews = [];
    if (!regions || regions.size <= 0) {
        return [<RegionView key={0} core={core} width={1} active={active} />];
    }

    // Sort the regions by start address and generate a view for it, also
    // generate a gap view between regions
    let lastAddress = romBaseAddr;
    regions
        .sort((a, b) => a.startAddress - b.startAddress)
        .forEach(region => {
            const { startAddress, regionSize } = region;

            // Generate the region view only if it is inside the ROM
            if (startAddress < romBaseAddr + romSize) {
                // Start to generate views from the base address
                if (lastAddress === romBaseAddr) {
                    // Generate a region view if the region starts with the base address
                    if (startAddress === romBaseAddr) {
                        regionViews.push(
                            <RegionView
                                key={startAddress}
                                region={region}
                                hoverable
                                active={active}
                                width={regionSize}
                            />
                        );
                    }

                    // Generate a gap view if the region does not start with the base address
                    if (startAddress > romBaseAddr) {
                        regionViews.push(
                            <RegionView
                                key={lastAddress}
                                core={core}
                                width={startAddress}
                            />
                        );
                        regionViews.push(
                            <RegionView
                                key={startAddress}
                                region={region}
                                hoverable
                                active={active}
                                width={regionSize}
                            />
                        );
                    }

                    // Update lastAddress
                    lastAddress = startAddress + regionSize - 1;
                } else {
                    regionViews.push(
                        <RegionView
                            key={lastAddress}
                            core={core}
                            width={startAddress - lastAddress}
                        />
                    );
                    regionViews.push(
                        <RegionView
                            key={startAddress}
                            region={region}
                            hoverable
                            active={active}
                            width={regionSize}
                        />
                    );

                    // Update lastAddress
                    lastAddress = startAddress + regionSize - 1;
                }
            }
        });
    regionViews.push(
        <RegionView
            key={lastAddress}
            core={core}
            width={romBaseAddr + romSize - lastAddress}
        />
    );

    return regionViews;
};

CoreView.propTypes = {
    core: PropTypes.shape({}).isRequired,
    active: PropTypes.bool.isRequired,
};

CoreView.defaultProps = {};

export default CoreView;
