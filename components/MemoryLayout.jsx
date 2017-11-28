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

import MemoryMap from 'nrf-intel-hex';
import unclutter1d from 'unclutter1d';

import { hexpad8 } from '../hexpad';

const labelHeight = 16; // in CSS pixels

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
        if (!this.node) { return; }

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
            targetSize,
            memMaps,
            fileColours,
            labels,
        } = this.props;

        const blocks = [];
        const inlineLabels = [];
        const min = 0x0;
        const max = targetSize;

        const addressLabels = { left: new Set(), right: new Set() };

        const overlaps = MemoryMap.overlapMemoryMaps(memMaps);

        for (const [address, overlap] of overlaps) {
            // Draw a solid block (with one solid colour or more striped colours)
            let blockSize = 0;
            const blockColours = [];
            let blockBackground = '';

            for (const [filename, bytes] of overlap) {
                blockSize = bytes.length;
                blockColours.push(fileColours.get(filename));
            }

            if (address + blockSize > min && address < max) {
                if (blockColours.length === 1) {
                    blockBackground = blockColours[0];
                } else {
                    const gradientStops = [];
                    let gradientPx = 0;
                    for (const colour of blockColours) {
                        gradientStops.push(`${colour} ${gradientPx}px`);
                        gradientPx += 20;
                        gradientStops.push(`${colour} ${gradientPx}px`);
                    }

                    blockBackground = `repeating-linear-gradient(45deg, ${
                        gradientStops.join(',')})`;
                }

                blocks.push(<div style={{
                    position: 'absolute',
                    height: `${(100 * blockSize) / max}%`,
                    bottom: `${(100 * address) / max}%`,
                    width: '100%',
                    minHeight: '2px',
                    background: blockBackground,
                }}
                />);

                addressLabels.right.add(address);
                addressLabels.right.add(address + blockSize);
            }
        }

        for (const [inlineLabelText, inlineLabelAddress] of Object.entries(labels)) {
            // Draws a horizontal line at the given address, and some text on top
            // TODO: Allow for text on the bottom
            inlineLabels.push(<div style={{
                position: 'absolute',
                textAlign: 'center',
                lineHeight: '10px',
                fontSize: '12px',
                width: '100%',
                borderBottom: '1px solid black',
                bottom: `${(100 * inlineLabelAddress) / max}%`,
            }}
            >{ inlineLabelText }</div>);

            addressLabels.right.add(inlineLabelAddress);
        }

        const labelStep = 0x10000;
        for (let i = min; i <= max; i += labelStep) {
            addressLabels.left.add(i);
        }

        for (const side of Object.keys(addressLabels)) {
            addressLabels[side] = Array.from(addressLabels[side]);
            const labelHeights = addressLabels[side].map(addr => [
                ((this.state.computedHeight * addr) / this.props.targetSize) - (labelHeight / 2),
                labelHeight,
            ]);

            const unclutteredHeights = unclutter1d(labelHeights,
                -(labelHeight / 2),
                this.state.computedHeight + (labelHeight / 2));

            const lineAttrs = side === 'left' ? { x1: 8, x2: 0 } : { x1: 0, x2: 8 };
            const labelStyle = side === 'left' ? { left: '0px' } : { right: '0px' };

            const svgTotalHeight = this.state.computedHeight - ((labelHeight / 2) - 0.5);

            addressLabels[side] = addressLabels[side].map((addr, i) => {
                const line = (<line
                    {...lineAttrs}
                    y1={svgTotalHeight - labelHeights[i][0]}
                    y2={svgTotalHeight - unclutteredHeights[i][0]}
                    stroke="black"
                    strokeWidth="1"
                />);

                const label = (<div style={{
                    ...labelStyle,
                    position: 'absolute',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(210, 210, 210, 0.75)',
                    bottom: `${unclutteredHeights[i][0]}px`,
                }}
                >{ hexpad8(addr) }</div>);

                return { line, label };
            });
        }

        this.leftSvgContainer = (<svg style={{
            position: 'absolute',
            height: (this.state.computedHeight + 1) + 'px',
            left: '96px',
            width: '8px',
        }}
        >
            { addressLabels.left.map(i => i.line) }
        </svg>);

        this.rightSvgContainer = (<svg style={{
            position: 'absolute',
            height: (this.state.computedHeight + 1) + 'px',
            right: '96px',
            width: '8px',
        }}
        >
            { addressLabels.right.map(i => i.line) }
        </svg>);


        window.requestAnimationFrame(() => this.relocateLabels());

        return (
            <div
                style={{
                    minWidth: '250px',
                    maxWidth: '750px',
                    height: 'calc( 100% - 2em )',
                    marginTop: '1em',
                    marginBottom: '1em',
                    position: 'relative',
                    zIndex: '0',
                    lineHeight: `${labelHeight}px`,
                    fontSize: `${labelHeight}px`,
                }}
                ref={node => { this.node = node; }}
            >
                <div style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                }}
                >
                    { addressLabels.left.map(i => i.label) }
                    { addressLabels.right.map(i => i.label) }
                </div>
                <div style={{
                    position: 'absolute',
                    height: '100%',
                    left: '104px',
                    right: '104px',
                    overflow: 'hidden',
                    border: '1px solid black',
                }}
                >
                    { blocks }
                    { inlineLabels }
                </div>
                { this.leftSvgContainer }
                { this.rightSvgContainer }
            </div>
        );
    }
}


MemoryLayout.defaultProps = {
    targetSize: 0x100000,  // 1MiB
//     targetSize: 0x080000,  // 0.5MiB
//     targetSize: 0x040000,  // 1/4 MiB
    memMaps: new Map(),
    fileColours: new Map(),
//         writtenAddress: 0,  // From 0 to here will be assumed written,
//                             // from here to the top pending
    labels: {},
//     regions: {},
};


MemoryLayout.propTypes = {
    targetSize: PropTypes.number,
    memMaps: PropTypes.instanceOf(Map),
    fileColours: PropTypes.instanceOf(Map),
//     writtenAddress: PropTypes.number,
    labels: PropTypes.shape({}),
//     regions: PropTypes.shape({}),
};


export default MemoryLayout;
