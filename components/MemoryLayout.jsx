import React from 'react';
import PropTypes from 'prop-types';

import { overlapBlockSets } from 'nrf-intel-hex';

// Colours from:
// https://github.com/d3/d3-scale-chromatic
// https://github.com/d3/d3-scale-chromatic/blob/master/src/categorical/Dark2.js

// const colours = [
//     "#1b9e77",
//     "#d95f02",
//     "#7570b3",
//     "#e7298a",
//     "#66a61e",
//     "#e6ab02",
//     "#a6761d",
//     "#666666"
// ];

/* eslint no-param-reassign: "off" */
function drawMemoryLayoutDiagram(container, blockSets, fileColours, writtenAddress, max) {
    const min = 0x0;
    const labelStep = 0x10000;

    if (!container) { return; }

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    function drawLabel(address, side = 'left') {
        const backgroundColor = 'rgba(210, 210, 210, 0.75)';

        const label = document.createElement('div');
        const tip = document.createElement('div');

        tip.style.position = 'absolute';
        tip.style.width = 0;
        tip.style.background = 'transparent';
        tip.style.height = '0';
        tip.style.border = '8px solid transparent';
        tip.style.marginLeft = '-8px';
        tip.style.top = 0;

        label.style.position = 'absolute';
        label.innerText = `0x${(address)
                                .toString(16)
                                .toUpperCase()
                                .padStart(8, '0')}`;

        if (side === 'left') {
//             label.style.right = 'calc(75% + 8px)';
            label.style.left = '0px';
//             label.style.paddingRight = '8px';
            tip.style.borderLeftColor = backgroundColor;
            tip.style.left = 'calc(100% +  8px)';
        } else if (side === 'right') {
//             label.style.left = 'calc(75% + 8px)';
            label.style.right = '0px';
//             label.style.paddingLeft = '10px';
            tip.style.borderRightColor = backgroundColor;
            tip.style.right = '100%';
        }

        label.style.bottom = `calc( ${(100 * address) / max}% - 8px )`;
        label.style.background = backgroundColor;

        label.append(tip);
        return label;
    }

    const blocksWrapper = document.createElement('div');
    blocksWrapper.style.position = 'absolute';
    blocksWrapper.style.height = '100%';
    blocksWrapper.style.width = '100%';
    blocksWrapper.style.overflow = 'hidden';
    container.append(blocksWrapper);

    function drawBlock(address, blockSize, colours) {
        if ((address + blockSize) > min && address < max) {
            const block = document.createElement('div');
            block.style.position = 'absolute';
            block.style.height = `${(100 * blockSize) / max}%`;
            block.style.bottom = `${(100 * address) / max}%`;
            block.style.left = '104px';
            block.style.right = '104px';
            block.style.minHeight = '2px';

            if (colours.length === 1) {
                block.style.background = colours;
            } else {
                const gradientStops = [];
                let gradientPx = 0;
                for (const colour of colours) {
                    gradientStops.push(`${colour} ${gradientPx}px`);
                    gradientPx += 20;
                    gradientStops.push(`${colour} ${gradientPx}px`);
                }

                block.style.background = `repeating-linear-gradient(45deg, ${
                    gradientStops.join(',')})`;
            }


    //         border.setAttribute('width', 50);
    //         border.setAttribute('height', 100 * blockSize / max);
    //         border.setAttribute('x', 25);
    //         border.setAttribute('y', 100 - 100 * address / max);
    //         border.setAttribute('fill', '#474d73');
    //         border.setAttribute('stroke', 'none');

            blocksWrapper.append(block);

            const startLabel = drawLabel(address, 'right');
            container.append(startLabel);

            const endLabel = drawLabel(address + blockSize, 'right');
            endLabel.style.zIndex = -1;
            container.append(endLabel);

            let eventNames = ['mouseover', 'mouseout'];
            if (window.PointerEvent) {
                eventNames = ['pointerenter', 'pointerout'];
            }
            block.addEventListener(eventNames[0], () => {
//                 console.log('over block');
                startLabel.style.zIndex = 5;
                startLabel.style.fontWeight = 'bold';
                endLabel.style.zIndex = 4;
                endLabel.style.fontWeight = 'bold';
            });
            block.addEventListener(eventNames[1], () => {
                startLabel.style.zIndex = 0;
                startLabel.style.fontWeight = 'inherit';
                endLabel.style.zIndex = -1;
                endLabel.style.fontWeight = 'inherit';
            });
        }
    }

//     let container = document.createElement('div');
//     container.style.width = '500px';
    container.style.minWidth = '250px';
    container.style.maxWidth = '750px';
//     container.style.height= '500px';
    container.style.height = 'calc( 100% - 2em )';
//     container.style.margin = '25px';
    container.style.marginTop = '1em';
    container.style.marginBottom = '1em';
    container.style.position = 'relative';
    container.style.fontFamily = 'monospace';
    container.style.zIndex = 0;
    container.style.lineHeight = '16px';
    container.style.fontSize = '16px';

    const border = document.createElement('div');
    border.style.border = '1px solid black';
    border.style.position = 'absolute';
    border.style.left = '104px';
    border.style.right = '104px';
    border.style.top = '0';
    border.style.bottom = '0';
    container.append(border);

    for (let i = min; i <= max; i += labelStep) {
        const label = drawLabel(i);
        container.append(label);
    }

    const overlaps = overlapBlockSets(blockSets);

//     console.log(overlaps);

    for (const [address, overlap] of overlaps) {
        let blockSize = 0;
        const blockColours = [];

        for (const [filename, bytes] of overlap) {
            blockSize = bytes.length;
//             if (colour) {
//                 console.log('FIXME: Should display several overlapping colours');
//             }
            blockColours.push(fileColours.get(filename));
        }
        // / TODO: fetch colours for this block or overlap


//         const blockSize = blocks.get(address).length;
        if (writtenAddress > address) {
            const size = Math.min(writtenAddress - address, blockSize);
            drawBlock(address, size, ['#cc4040']);
        }
        if (writtenAddress < (address + blockSize)) {
            const start = Math.max(writtenAddress, address);
            const size = (address + blockSize) - start;
            drawBlock(start, size, blockColours);
        }
    }

//     const addresses = Array.from(blocks.keys());
//     for (let i = 0, l = addresses.length; i < l; i += 1) {
//         const address = addresses[i];
//     }
}


const MemoryLayout = props => {
    const { targetSize, blocks, fileError, fileColours, writtenAddress } = props;

    if (fileError) {
        return (
            <div>{ fileError }</div>
        );
    }
    return (
        <div ref={
            el => {
                drawMemoryLayoutDiagram(
                el,
                blocks,
                fileColours,
                writtenAddress,
                targetSize,
            );
            }
        }
        />
    );
};

MemoryLayout.propTypes = {
    targetSize: PropTypes.number,
    blocks: PropTypes.instanceOf(Map),
    fileColours: PropTypes.instanceOf(Map),
    writtenAddress: PropTypes.number,
    fileError: PropTypes.string,
};

MemoryLayout.defaultProps = {
//     targetSize: 0x100000,  // 1MiB
    targetSize: 0x080000,  // 0.5MiB
    blocks: new Map(),
    fileColours: new Map(),
    writtenAddress: 0,  // From 0 to here will be assumed written, from here to the top pending
    fileError: null,
};

export default MemoryLayout;
