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

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import { hexpad2 } from '../util/hexpad';

export default class UserInputDialogView extends React.Component {
    constructor(props) {
        super(props);
        this.onSelectChoice = this.onSelectChoice.bind(this);
        this.onInputChanged = this.onInputChanged.bind(this);
        this.state = {
            selectedValue: null,
            customChecked: false,
            customValue: '',
            isValidInput: false,
        };
    }

    onSelectChoice(choice) {
        if (choice === 'Custom') {
            this.setState({
                customChecked: true,
            });
        } else {
            this.setState({
                selectedValue: choice,
                customChecked: false,
                isValidInput: true,
            });
        }
    }

    onInputChanged(event) {
        let value = event.target.value || '';
        value = value !== '0' ? value : '';
        value = value.includes('0x')
            ? `0x${value.slice(2).toUpperCase()}`
            : `0x${value.toUpperCase()}`;
        this.setState({
            selectedValue: value,
            customValue: value,
            isValidInput: !Number.isNaN(parseInt(value, 16)),
        });
    }

    render() {
        const { isVisible, message, choices, onOk, onCancel } = this.props;
        const {
            selectedValue,
            isValidInput,
            customChecked,
            customValue,
        } = this.state;

        return (
            <Modal show={isVisible} onHide={this.onCancel} backdrop="static">
                <Modal.Header>
                    <Modal.Title>Need user input</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {message}
                    <Form.Group>
                        {Object.keys(choices).map(choice => (
                            <Form.Check
                                type="radio"
                                key={choice}
                                name="radioGroup"
                                onClick={() => this.onSelectChoice(choice)}
                                label={`${hexpad2(parseInt(choice, 16))} (${
                                    choices[choice]
                                })`}
                            />
                        ))}
                        <Form.Check
                            type="radio"
                            key="Custom"
                            name="radioGroup"
                            onClick={() => this.onSelectChoice('Custom')}
                            checked={customChecked}
                        >
                            <Form.Control
                                id="sdControlsText"
                                type="text"
                                value={customValue}
                                onFocus={() => this.onSelectChoice('Custom')}
                                onChange={this.onInputChanged}
                                placeholder="Custom SoftDevice ID"
                            />
                        </Form.Check>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="primary"
                        className="core-btn"
                        disabled={!isValidInput}
                        onClick={() => onOk(selectedValue)}
                    >
                        OK
                    </Button>
                    <Button className="core-btn" onClick={() => onCancel()}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

UserInputDialogView.propTypes = {
    isVisible: PropTypes.bool,
    message: PropTypes.string,
    choices: PropTypes.shape({}),
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

UserInputDialogView.defaultProps = {
    isVisible: false,
    message: '',
    choices: {},
};
