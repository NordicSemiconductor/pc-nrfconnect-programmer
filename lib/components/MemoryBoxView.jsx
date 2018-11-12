/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
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
import { OverlayTrigger, Popover } from 'react-bootstrap';
import MemoryView from '../containers/memoryView';
import DeviceInfoView from '../containers/deviceInfoView';

let triggerRef;

const popover = (
    <Popover
        id="deviceInfo"
        onMouseOver={() => { triggerRef.setState({ show: true }); }}
        onMouseOut={() => { triggerRef.setState({ show: false }); }}
    >
        <DeviceInfoView />
    </Popover>
);

const MemoryBoxView = ({
    title,
    description,
    iconName,
    isHolder,
    isTarget,
    isFile,
}) => {
    let placeHolder;
    if (isHolder) {
        placeHolder = (
            <div className="memory-layout-container">
                <h1>
                    <span className={`glyphicon ${iconName}`} />
                </h1>
                <p>
                    { description }
                </p>
            </div>
        );
    } else {
        placeHolder = (<MemoryView
            isTarget={isTarget}
            isFile={isFile}
        />);
    }

    const content = (
        <div className="panel-heading">
            <h3 className="panel-title">
                { title }<span className={`pull-right glyphicon ${iconName}`} />
            </h3>
        </div>
    );

    return (
        <div className="memory-layout">
            <div className="panel panel-default">
                { isTarget ?
                    <OverlayTrigger
                        overlay={popover}
                        trigger={['hover', 'focus']}
                        placement="bottom"
                        ref={r => { triggerRef = r; }}
                    >
                        { content }
                    </OverlayTrigger>
                :
                    content
                }
                <div className="panel-body">
                    { placeHolder }
                </div>
            </div>
        </div>
    );
};

MemoryBoxView.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    iconName: PropTypes.string,
    isHolder: PropTypes.bool,
    isTarget: PropTypes.bool,
    isFile: PropTypes.bool,
};

MemoryBoxView.defaultProps = {
    description: null,
    iconName: null,
    isHolder: false,
    isTarget: false,
    isFile: false,
};

export default MemoryBoxView;
