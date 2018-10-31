
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
import { List } from 'immutable';
import { Glyphicon, Button, ProgressBar, Popover, Panel, Alert, OverlayTrigger } from 'react-bootstrap';
import RegionView from './RegionView';


const MemoryView = ({
    targetSize: max,
    regions,
    refresh,
    reset,
}) => {
    let regionViews = [];
    regions.sortBy(r => r.startAddress).reverse().forEach(region => {
        const startAddress = region.startAddress;
        const regionSize = region.regionSize;
        const colours = region.colours;
        const regionName = region.name;

        // if (regionSize && startAddress + regionSize > 0x0 && startAddress < max) {
        //     if (colours.length === 1) {
        //         background = colours[0];
        //     } else {
        //         overlapped = true;
        //     }
        //     if (lastAddress > startAddress + regionSize) {

        //     }
        // }
        regionViews.push(
            <RegionView
                width={
                    region.regionSize / max > 0.02 ? region.regionSize : max * 0.02
                }
                color={region.colours[0]} key={region.startAddress} />);
    });
    return (
        <div className="regionContainer">
            { regionViews }
            {/* <RegionView  width={5} color={"#0080B7"} striped />
            <RegionView  width={1} color={"#ddd"} />
            <RegionView  width={5} color={"#0080B7"} striped />
            <RegionView  width={25} color={"#ddd"} />
            <RegionView  width={20} color={"#0080B7"} striped />
            <RegionView  width={25} color={"#ddd"} />
            <RegionView  width={20} color={"#0080B7"} striped /> */}
        </div>
    );
}

MemoryView.propTypes = {
    targetSize: PropTypes.number,
    regions: PropTypes.instanceOf(List).isRequired,
    title: PropTypes.string,
    refresh: PropTypes.func,
    reset: PropTypes.func,
};

MemoryView.defaultProps = {
    targetSize: 0x100000,  // 1MiB
    memMaps: [],
    loaded: {},
    title: '',
    refresh: null,
    reset: null,
};
export default MemoryView;

