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
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Button, FormGroup, ControlLabel } from 'react-bootstrap';

export default class ModemUpdateDialogView extends React.Component {
    constructor(props) {
        super(props);
        this.onOk = props.onOk;
        this.onWriteStart = this.onWriteStart.bind(this);
    }

    onWriteStart() {
        this.setState({ timer: 0 });
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(() => {
            this.setState({ timer: this.state.timer + 1 });
        }, 1000);
        this.onOk();
    }

    render() {
        const {
            isVisible,
            isWriting,
            isWritingSucceed,
            isWritingFail,
            modemFwName,
            progressMsg,
            onCancel,
        } = this.props;
        if (this.intervalId && (isWritingSucceed || isWritingFail)) {
            clearInterval(this.intervalId);
        }
        return (
            <Modal show={isVisible} onHide={this.onCancel} backdrop={'static'}>
                <ModalHeader>
                    <ModalTitle className="modem-dialog-title">Modem DFU</ModalTitle>
                    {isWriting &&
                        <span className="glyphicon glyphicon-refresh glyphicon-spin" />
                    }
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <ControlLabel>Modem firmware</ControlLabel>
                        <div>{ modemFwName }</div>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Process</ControlLabel>
                        <div>{ progressMsg }</div>
                    </FormGroup>
                    {isWritingSucceed &&
                        <FormGroup>
                            <div>Used {this.state.timer} seconds</div>
                            <div className="modem-success">Complete successfully!</div>
                        </FormGroup>
                    }
                    {isWritingFail &&
                        <FormGroup>
                            <div>Used {this.state.timer} seconds</div>
                            <div className="modem-fail">
                                Failed. Check the log below for more detail...
                            </div>
                        </FormGroup>
                    }
                </ModalBody>
                {/* <ModemProgressView /> */}
                <ModalFooter>
                    {!isWritingSucceed &&
                        <Button
                            bsStyle="primary"
                            className="core-btn"
                            onClick={this.onWriteStart}
                            disabled={isWriting}
                        >
                            Write
                        </Button>
                    }
                    <Button
                        className="core-btn"
                        onClick={onCancel}
                        disabled={isWriting}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }
}

ModemUpdateDialogView.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    isWriting: PropTypes.bool.isRequired,
    isWritingSucceed: PropTypes.bool.isRequired,
    isWritingFail: PropTypes.bool.isRequired,
    modemFwName: PropTypes.string.isRequired,
    progressMsg: PropTypes.string.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

ModemUpdateDialogView.defaultProps = {
};
