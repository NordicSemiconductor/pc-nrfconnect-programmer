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

// import { overlapBlockSets } from 'nrf-intel-hex';

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
function drawFileLegend(container, fileColours) {
//     console.log('drawFileLegend', container, fileColours);

    if (!container) { return; }

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    container.style.width = '15em'; // DEBUG
    container.style.wordBreak = 'break-all';

    for (const [filename, colour] of fileColours) {
        const label = document.createElement('td');
        const legend = document.createElement('tr');
        const colourCell = document.createElement('td');
        const colourSquare = document.createElement('div');

        colourSquare.style.width = '1.5em';
        colourSquare.style.height = '1.5em';
        colourSquare.style.display = 'inline-block';
        colourSquare.style.background = colour;
        colourSquare.style.float = 'left';
        colourSquare.style.marginRight = '0.2em';

        label.innerText = filename.replace(/\.hex$/, '');

        legend.style.borderBottom = '1px #dedede solid';

        colourCell.append(colourSquare);
        legend.append(colourCell);
        legend.append(label);
        container.append(legend);
    }
}


const FileLegend = props => {
    const { fileColours } = props;
    return (
        <table
            ref={el => { drawFileLegend(el, fileColours); }}
            style={{
                marginTop: '1em',
                marginBottom: '1em',
            }}
        />
    );
};

FileLegend.propTypes = {
    fileColours: PropTypes.instanceOf(Map),
};

FileLegend.defaultProps = {
    fileColours: new Map(),
};

export default FileLegend;
