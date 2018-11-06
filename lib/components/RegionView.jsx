
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
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { hexpad8 } from '../util/hexpad';


const popover = ({ name, startAddress, regionSize, colors }, parent) => (
    <Popover
        id="popover-top"
        className="memory-details"
        onMouseOver={() => { parent.triggerRef.setState({ show: true }); }}
        onMouseOut={() => { parent.triggerRef.setState({ show: false }); }}
    >
        { colors.length > 1 &&
            <div className="overlap-colors">
                <h5>Overlapping region!</h5>
                {
                    colors.map((color, index) => (
                        <span
                            key={`${color}-${index + 1}`}
                            style={{ backgroundColor: color }}
                        />
                    ))
                }
                <hr />
            </div>
        }
        { name &&
            <div>
                <h5>Region name</h5>
                <p>{ name }</p>
                <hr />
            </div>
        }
        <div>
            <h5>Address range</h5>
            <p>{ hexpad8(startAddress) } &mdash; { hexpad8(startAddress + regionSize) }</p>
            <hr />
        </div>
        <div>
            <h5>Size</h5>
            <p>{ regionSize } bytes</p>
        </div>
    </Popover>
);

popover.propTypes = {
    name: PropTypes.string,
    startAddress: PropTypes.number.isRequired,
    regionSize: PropTypes.number.isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
};
popover.defaultProps = { name: null };

class RegionView extends React.Component {
    render() {
        const {
            width,
            active,
            striped,
            hoverable,
            region,
        } = this.props;
        const colors = region ? region.colors : ['#d9e1e2'];

        let className = 'region';
        className = striped ? `${className} striped` : className;
        className = active ? `${className} active` : className;
        className = hoverable ? `${className} hoverable` : className;
        className = (colors.length > 1) ? `${className} crosses` : className;

        const singleRegionView = (
            <div
                className={className}
                style={{
                    flexGrow: width,
                    backgroundColor: colors[0],
                }}
            />
        );

        const overlayRegionView = !region ? null : (
            <OverlayTrigger
                overlay={popover(region, this)}
                trigger={['focus', 'hover']}
                placement="right"
                ref={r => { this.triggerRef = r; }}
            >
                { singleRegionView }
            </OverlayTrigger>
        );

        return region ? overlayRegionView : singleRegionView;
    }
}


RegionView.propTypes = {
    width: PropTypes.number.isRequired,
    active: PropTypes.bool,
    striped: PropTypes.bool,
    hoverable: PropTypes.bool,
    region: PropTypes.instanceOf(Object),
};

RegionView.defaultProps = {
    active: false,
    striped: false,
    hoverable: false,
    region: null,
};

export default RegionView;
