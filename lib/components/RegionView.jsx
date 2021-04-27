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

import React, { useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import CoreInfoView from './CoreInfoView';
import RegionInfoView from './RegionInfoView';

const RegionView = ({
    width,
    active,
    striped,
    hoverable,
    region,
    core,
    removeFile,
}) => {
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState(null);
    const ref = useRef(null);

    const toggleShow = event => {
        setShow(!show);
        setTarget(event.target);
    };

    const color = region ? region.color : '#d9e1e2';
    const fileNames = region ? region.fileNames : [];

    let className = 'region centering-container';
    className = striped ? `${className} striped` : className;
    className = active ? `${className} active striped` : className;
    className = hoverable ? `${className} hoverable` : className;
    className = fileNames.length > 1 ? `${className} crosses` : className;

    const containerNode = document.getElementsByClassName(
        'core-main-layout'
    )[0];

    return (
        <div
            ref={ref}
            onPointerEnter={toggleShow}
            onPointerLeave={toggleShow}
            className={className}
            style={{
                flexGrow: width,
                backgroundColor: color,
            }}
        >
            <Overlay
                trigger={['focus', 'hover']}
                placement="right"
                target={target}
                container={containerNode}
                show={show}
                rootClose
                onHide={() => setShow(false)}
                transition={false}
            >
                <Popover id="popover-region" className="memory-details" content>
                    {region && (
                        <RegionInfoView
                            name={region.name}
                            startAddress={region.startAddress}
                            regionSize={region.regionSize}
                            fileNames={region.fileNames}
                        />
                    )}
                    {core && (
                        <CoreInfoView
                            name={core.name}
                            romBaseAddr={core.romBaseAddr}
                            romSize={core.romSize}
                        />
                    )}
                </Popover>
            </Overlay>
            {region && region.fileNames.length > 0 && !active && (
                <Button
                    className="transparent"
                    onClick={() => removeFile(region.fileNames[0])}
                >
                    <span className="mdi mdi-minus-circle" />
                </Button>
            )}
        </div>
    );
};

RegionView.propTypes = {
    removeFile: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    active: PropTypes.bool,
    striped: PropTypes.bool,
    hoverable: PropTypes.bool,
    region: PropTypes.instanceOf(Object),
    core: PropTypes.instanceOf(Object),
};

RegionView.defaultProps = {
    active: false,
    striped: false,
    hoverable: false,
    region: null,
    core: null,
};

export default RegionView;
