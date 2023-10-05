/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    DialogButton,
    Dropdown,
    DropdownItem,
    GenericDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { cancelUserInput, receiveUserInput } from '../actions/userInputActions';
import {
    getChoices,
    getIsRequired,
    getMessage,
} from '../reducers/userInputReducer';
import { hexpad2 } from '../util/hexpad';

const UserInputDialogView = () => {
    const isVisible = useSelector(getIsRequired);
    const message = useSelector(getMessage);
    const choices = useSelector(getChoices);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(cancelUserInput());

    const choiceItems: DropdownItem[] = useMemo(
        () => [
            ...Object.keys(choices).map(choice => ({
                value: choice,
                label: `${hexpad2(parseInt(choice, 16))} (${choices[choice]})`,
            })),
            { value: 'Custom', label: 'Custom' },
        ],
        [choices]
    );

    const [isValidInput, setIsValidInput] = useState(false);

    const onSelectChoice = (choice: DropdownItem) => {
        setSelectedValue(choice);

        if (choice.value === 'Custom') {
            setIsValidInput(false);
            setCustomValue('');
        } else {
            setIsValidInput(true);
        }
    };

    const [selectedValue, setSelectedValue] = useState(choiceItems[0]);
    useEffect(() => {
        onSelectChoice(choiceItems[0]);
    }, [choiceItems]);

    const [customValue, setCustomValue] = useState('');

    const onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value || '';
        value = value !== '0' ? value : '';
        value = value.includes('0x')
            ? `0x${value.slice(2).toUpperCase()}`
            : `0x${value.toUpperCase()}`;
        setCustomValue(value);
        setIsValidInput(value.match(/^0[xX][0-9a-fA-F]+$/) != null);
    };

    return (
        <GenericDialog
            title="Need user input"
            footer={
                <>
                    <DialogButton
                        variant="primary"
                        disabled={!isValidInput}
                        onClick={() => {
                            if (selectedValue.value !== 'Custom') {
                                dispatch(receiveUserInput(selectedValue.value));
                            } else {
                                dispatch(receiveUserInput(customValue));
                            }
                        }}
                    >
                        OK
                    </DialogButton>
                    <DialogButton onClick={onCancel}>Cancel</DialogButton>
                </>
            }
            isVisible={isVisible}
            onHide={onCancel}
        >
            <div className="tw-flex tw-flex-col tw-gap-2">
                <Dropdown
                    label={message}
                    items={choiceItems}
                    selectedItem={
                        choiceItems.find(
                            item => item.value === selectedValue.value
                        ) ?? choiceItems[0]
                    }
                    onSelect={item => onSelectChoice(item)}
                    numItemsBeforeScroll={10}
                />
                {selectedValue.value === 'Custom' && (
                    <input
                        className="tw-w-full"
                        id="sdControlsText"
                        type="text"
                        placeholder="Custom SoftDevice ID"
                        onFocus={() =>
                            onSelectChoice(choiceItems[choiceItems.length - 1])
                        }
                        onChange={onInputChanged}
                        value={customValue}
                    />
                )}
            </div>
        </GenericDialog>
    );
};

export default UserInputDialogView;
