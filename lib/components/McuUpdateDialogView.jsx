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
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import PropTypes from 'prop-types';

const McuUpdateDialogView = ({
    isVisible,
    isWriting,
    isWritingSucceed,
    isWritingFail,
    isFirmwareValid,
    errorMsg,
    mcubootFwPath,
    progressMsg,
    progressPercentage,
    progressDuration,
    onOk,
    onCancel,
}) => (
    <Modal show={isVisible} onHide={onCancel} backdrop="static">
        <Modal.Header>
            <Modal.Title className="modem-dialog-title">
                MCUboot DFU
            </Modal.Title>
            {isWriting && <span className="mdi mdi-refresh icon-spin" />}
        </Modal.Header>
        <Modal.Body>
            <Form.Group>
                <Form.Label>Firmware</Form.Label>
                <div>{mcubootFwPath}</div>
            </Form.Group>
            <Form.Group>
                <Form.Label>Status</Form.Label>
                <div>{progressMsg}</div>
                <ProgressBar
                    hidden={!isWriting}
                    animated
                    now={progressPercentage}
                    label={`${progressPercentage}%`}
                />
            </Form.Group>
            <Form.Group>
                {!isWriting && !isWritingSucceed && !isWritingFail && (
                    <Alert variant="warning">
                        <p>You are now programming via MCUboot.</p>
                        <p>
                            The device will be recovered if you proceed to
                            write.
                        </p>
                        <p>
                            Make sure the device is in{' '}
                            <strong>MCUboot mode</strong>.
                        </p>
                    </Alert>
                )}
                {!isFirmwareValid && (
                    <Alert variant="warning">
                        The selected HEX file appears to be invalid for
                        Thingy:91 MCUboot DFU.
                    </Alert>
                )}
                {!isFirmwareValid && (
                    <Alert variant="warning">
                        The selected HEX file appears to be invalid for
                        Thingy:91 MCUboot DFU.
                    </Alert>
                )}
                {isWritingSucceed && (
                    <Alert variant="success">
                        Completed successfully in {progressDuration / 1000}{' '}
                        seconds.
                    </Alert>
                )}
                {isWritingFail && (
                    <Alert variant="danger">
                        {errorMsg ||
                            'Failed. Check the log below for more details...'}
                    </Alert>
                )}
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
            {!isWritingSucceed && (
                <Button
                    variant="primary"
                    className="core-btn"
                    onClick={onOk}
                    disabled={isWriting}
                >
                    Write
                </Button>
            )}
            <Button
                className="core-btn"
                onClick={onCancel}
                disabled={isWriting}
            >
                Close
            </Button>
        </Modal.Footer>
    </Modal>
);

McuUpdateDialogView.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    isWriting: PropTypes.bool.isRequired,
    isWritingSucceed: PropTypes.bool.isRequired,
    isWritingFail: PropTypes.bool.isRequired,
    isFirmwareValid: PropTypes.bool.isRequired,
    errorMsg: PropTypes.string.isRequired,
    mcubootFwPath: PropTypes.string,
    progressMsg: PropTypes.string.isRequired,
    progressPercentage: PropTypes.number.isRequired,
    progressDuration: PropTypes.number.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

McuUpdateDialogView.defaultProps = {
    mcubootFwPath: '',
};

export default McuUpdateDialogView;
