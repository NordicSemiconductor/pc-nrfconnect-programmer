/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';

import { cancelUserInput, receiveUserInput } from '../actions/userInputActions';
import {
    getChoices,
    getIsRequired,
    getMessage,
} from '../reducers/userInputReducer';
import { hexpad2 } from '../util/hexpad';

const UserInputDialogView = () => {
    const [selectedValue, setSelectedValue] = useState<string>('');
    const [customChecked, setCustomChecked] = useState<boolean>(false);
    const [customValue, setCustomValue] = useState<string>('');
    const [isValidInput, setIsValidInput] = useState<boolean>(false);

    const isVisible = useSelector(getIsRequired);
    const message = useSelector(getMessage);
    const choices = useSelector(getChoices);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(cancelUserInput());

    function onSelectChoice(choice: string) {
        if (choice === 'Custom') {
            setCustomChecked(true);
        } else {
            setSelectedValue(choice);
            setCustomChecked(false);
            setIsValidInput(true);
        }
    }

    const onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value || '';
        value = value !== '0' ? value : '';
        value = value.includes('0x')
            ? `0x${value.slice(2).toUpperCase()}`
            : `0x${value.toUpperCase()}`;
        setSelectedValue(value);
        setCustomValue(value);
        setIsValidInput(!Number.isNaN(parseInt(value, 16)));
    };

    return (
        <Modal show={isVisible} onHide={onCancel} backdrop="static">
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
                            onClick={() => onSelectChoice(choice)}
                            label={`${hexpad2(parseInt(choice, 16))} (${
                                choices[choice]
                            })`}
                        />
                    ))}
                    <Form.Check
                        type="radio"
                        key="Custom"
                        name="radioGroup"
                        onClick={() => onSelectChoice('Custom')}
                        checked={customChecked}
                    >
                        <Form.Control
                            id="sdControlsText"
                            type="text"
                            value={customValue}
                            onFocus={() => onSelectChoice('Custom')}
                            onChange={onInputChanged}
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
                    onClick={() => dispatch(receiveUserInput(selectedValue))}
                >
                    OK
                </Button>
                <Button className="core-btn" onClick={() => onCancel()}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UserInputDialogView;
