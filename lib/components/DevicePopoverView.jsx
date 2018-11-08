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
import { Popover } from 'react-bootstrap';
import { hexToKiB } from '../util/hexpad';
import { getCommunicationType, CommunicationType } from '../util/devices';

const DeviceInfoView = ({ serialNumber, port, targetType, deviceInfo, isMemLoaded }, parent) => (
    <Popover
        id="popover-top"
        className="memory-details"
        onMouseOver={() => { parent.triggerRef.setState({ show: true }); }}
        onMouseOut={() => { parent.triggerRef.setState({ show: false }); }}
    >
        {serialNumber &&
            <div>
                <h5>Serial Number</h5>
                <p>{serialNumber}</p>
                <hr />
            </div>
        }
        {port &&
            <div>
                <h5>Port</h5>
                <p>{port}</p>
                <hr />
            </div>
        }
        <div>
            <h5>Communication Type</h5>
            <p>{getCommunicationType(targetType)}</p>
            <hr />
        </div>
        {deviceInfo && deviceInfo.romSize &&
            <div>
                <h5>ROM Size</h5>
                <p>{hexToKiB(deviceInfo.romSize)}</p>
                <hr />
            </div>
        }
        {deviceInfo && deviceInfo.ramSize &&
            <div>
                <h5>RAM Size</h5>
                <p>{hexToKiB(deviceInfo.ramSize)}</p>
                <hr />
            </div>
        }
        {deviceInfo && deviceInfo.pageSize &&
            <div>
                <h5>Page Size</h5>
                <p>{hexToKiB(deviceInfo.pageSize)}</p>
                <hr />
            </div>
        }
        {targetType === CommunicationType.JLINK &&
            <div>
                <h5>Device memory is loaded?</h5>
                <p>{isMemLoaded ? 'Yes' : 'No'}</p>
                <hr />
            </div>
        }
    </Popover>
);

DeviceInfoView.propTypes = {
    serialNumber: PropTypes.string.isRequired,
    port: PropTypes.string.isRequired,
    targetType: PropTypes.number.isRequired,
    deviceInfo: PropTypes.instanceOf(Object).isRequired,
    isMemLoaded: PropTypes.bool.isRequired,
};

export default DeviceInfoView;
