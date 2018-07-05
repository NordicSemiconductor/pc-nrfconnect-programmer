
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
import { Button, ProgressBar } from 'react-bootstrap';
import { List } from 'immutable';
import unclutter1d from 'unclutter1d';

import { hexpad8 } from '../util/hexpad';
import { CommunicationType } from '../util/devices';

const labelHeight = 12; // in CSS pixels, also defined in memoryLayout.less
const gradientLength = 20;

class MemoryLayout extends React.Component {

    constructor(props) {
        super(props);

        this.boundRelocateLabels = this.relocateLabels.bind(this);
        this.state = { computedHeight: 400 };
    }

    componentDidMount() {
        window.addEventListener('resize', this.boundRelocateLabels);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.boundRelocateLabels);
    }

    relocateLabels() {
        if (!this.node) {
            return;
        }

        // Assume the height is a specific number of *integer* pixels, as to
        // avoid sub-pixel artifacts.
        const totalHeight = Math.floor(parseFloat(
            window.getComputedStyle(this.node).height,   // This is always in pixels as per spec
        )) - 1;

        if (this.state.computedHeight !== totalHeight) {
            this.setState({ computedHeight: totalHeight });
        }
    }

    render() {
        const {
            targetSize: max,
            regions,
            refresh,
        } = this.props;

        const blocks = [];
        const inlineLabels = [];
        const addressSet = new Set();

        let lastAddress = max;
        // Regions have to be sorted desc
        regions.sortBy(r => r.startAddress).reverse().forEach(region => {
            // Draw a solid block (with one solid colour or more striped colours)
            const startAddress = region.startAddress;
            const regionSize = region.regionSize;
            const colours = region.colours;
            const regionName = region.name;

            let background = '';
            let overlapped = false;
            if (regionSize && startAddress + regionSize > 0x0 && startAddress < max) {
                if (colours.length === 1) {
                    background = colours[0];
                } else {
                    const gradientStops = colours.map((colour, i) =>
                        `${colour} ${i * gradientLength}px, ${colour} ${(i + 1) * gradientLength}px`,
                    );
                    background = `repeating-linear-gradient(45deg, ${
                        gradientStops.join(',')})`;
                    overlapped = true;
                }
                if (lastAddress > startAddress + regionSize) {
                    blocks.push(
                        <ProgressBar
                            className="progress-bar"
                            key={`block-${startAddress + regionSize + 1}`}
                            style={{
                                height: `${(100 * (lastAddress - (startAddress + regionSize + 1))) / max}%`,
                                backgroundColor: 'transparent',
                            }}
                        />,
                        );
                }

                blocks.push(
                    <ProgressBar
                        className="progress-bar"
                        key={`block-${startAddress}`}
                        striped={overlapped}
                        active={overlapped}
                        label={regionName}
                        style={{
                            height: `${(100 * regionSize) / max}%`,
                            backgroundColor: background,
                            lineHeight: `${(25 * regionSize) / max}`,
                            color: 'blueviolet',
                        }}
                    />,
                );

                addressSet.add(startAddress);
                addressSet.add(startAddress + regionSize);

                // Draws a horizontal line at the given address, and some text on top
                // TODO: Allow for text on the bottom
                inlineLabels.push(
                    <div
                        className="inline-label"
                        key={`inline-label-${inlineLabels.length}`}
                        style={{
                            bottom: `${(100 * startAddress) / max}%`,
                            paddingBottom: `${(regionSize * 100) / 2 / max}%`,
                        }}
                    >
                        { region.name }
                    </div>,
                );

                lastAddress = startAddress;
            }
        });

        if (lastAddress > 0) {
            blocks.push(
                <ProgressBar
                    className="progress-bar"
                    key={`block-${0}`}
                    style={{
                        height: `${(100 * (lastAddress - 1)) / max}%`,
                        backgroundColor: 'transparent',
                    }}
                />,
                );
        }

        addressSet.add(max);
        const addresses = Array.from(addressSet);

        const labelHeights = addresses.map(addr => [
            ((this.state.computedHeight * addr) / max) - (labelHeight / 2),
            labelHeight,
        ]);

        const unclutteredHeights = unclutter1d(labelHeights,
            -(labelHeight / 2),
            this.state.computedHeight + (labelHeight / 2));

        const svgTotalHeight = this.state.computedHeight - ((labelHeight / 2) - 0.5);

        const addresslines = addresses.map((addr, i) => (
            <line
                x1={0}
                x2="100%"
                y1={svgTotalHeight - labelHeights[i][0]}
                y2={svgTotalHeight - unclutteredHeights[i][0]}
                key={addr}
                stroke="red"
            />
        ));

        const addressLabels = addresses.map((addr, i) => (
            <div
                className="address-label"
                style={{ bottom: `${unclutteredHeights[i][0]}px` }}
                key={addr}
            >
                { hexpad8(addr) }
            </div>
        ));

        window.requestAnimationFrame(this.boundRelocateLabels);

        return (
            <div className="memory-layout">
                <h1>
                    { this.props.title }
                    { refresh && <Button onClick={refresh}>Read Memory</Button> }
                </h1>
                <div
                    className="memory-layout-inner"
                    ref={node => { this.node = node; }}
                >
                    <ProgressBar className="memory-bar-vertical">
                        { blocks }
                    </ProgressBar>
                    <svg className="address-lines">
                        { addresslines }
                    </svg>
                    <div className="address-labels">
                        { addressLabels }
                    </div>
                </div>
            </div>
        );
    }
}

MemoryLayout.propTypes = {
    targetSize: PropTypes.number,
    regions: PropTypes.instanceOf(List),
    title: PropTypes.string,
    refresh: PropTypes.func,
};

MemoryLayout.defaultProps = {
    targetSize: 0x100000,  // 1MiB
    regions: new List(),
    memMaps: [],
    loaded: {},
    title: '',
    refresh: null,
};

export default MemoryLayout;

