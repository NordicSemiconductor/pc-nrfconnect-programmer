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
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Button, FormControl, FormGroup, Radio } from 'react-bootstrap';

export default class ModemUpdateDialogView extends React.Component {
    constructor(props) {
        super(props);
        this.onSelectChoice = this.onSelectChoice.bind(this);
        this.onInputChanged = this.onInputChanged.bind(this);
    }

    componentDidMount() {
        this.state = {
            selectedChoice: null,
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
        value = value.includes('0x') ?
            `0x${value.slice(2).toUpperCase()}` :
            `0x${value.toUpperCase()}`;
        this.setState({
            selectedValue: value,
            customValue: value,
            isValidInput: !isNaN(parseInt(value, 16)),
        });
    }


    render() {
        const {
            isVisible,
            onOk,
            onCancel,
        } = this.props;
        console.log(isVisible);
        const isValidInput = this.state ? this.state.isValidInput : false;
        return (
            <Modal show={isVisible} onHide={this.onCancel} backdrop={'static'}>
                <ModalHeader>
                    <ModalTitle>Need user input</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    Modem DFU
                </ModalBody>
                <ModalFooter>
                    <Button
                        bsStyle="primary"
                        className="core-btn"
                        disabled={!isValidInput}
                        onClick={() => onOk(this.state.selectedValue)}
                    >
                        OK
                    </Button>
                    {
                        <Button
                            className="core-btn"
                            onClick={() => onCancel()}
                        >
                            Cancel
                        </Button>
                    }
                </ModalFooter>
            </Modal>
        );
    }
}

ModemUpdateDialogView.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

ModemUpdateDialogView.defaultProps = {
};
