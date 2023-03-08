/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormLabel from 'react-bootstrap/FormLabel';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import { useStopwatch } from 'react-timer-hook';
import {
    Alert,
    getPersistentStore,
    NumberInlineInput,
    Slider,
} from 'pc-nrfconnect-shared';

import { performUpdate } from '../actions/mcubootTargetActions';
import { getMcubootFilePath, getZipFilePath } from '../reducers/fileReducer';
import {
    getErrorMsg,
    getIsFirmwareValid,
    getIsReady,
    getIsWriting,
    getIsWritingFail,
    getIsWritingSucceed,
    getProgressMsg,
    getProgressPercentage,
    mcubootWritingClose,
} from '../reducers/mcubootReducer';
import { getDevice } from '../reducers/targetReducer';

const McuUpdateDialogView = () => {
    const errorMsg = useSelector(getErrorMsg);
    const isVisible = useSelector(getIsReady);
    const isWriting = useSelector(getIsWriting);
    const isWritingFail = useSelector(getIsWritingFail);
    const isWritingSucceed = useSelector(getIsWritingSucceed);
    const isFirmwareValid = useSelector(getIsFirmwareValid);
    const mcubootFwPath = useSelector(getMcubootFilePath);
    const zipFilePath = useSelector(getZipFilePath);
    const progressMsg = useSelector(getProgressMsg);
    const progressPercentage = useSelector(getProgressPercentage);

    const device = useSelector(getDevice);

    const [flashTimeout, setFlashTimeout] = useState<number | null>(null);
    const flashTimeoutRange = {
        min: 20,
        max: 120,
        step: 5,
    };

    useEffect(() => {
        const isThingy53 =
            device?.usb?.device.descriptor.idProduct === 0x5300 &&
            device?.usb?.device.descriptor.idVendor === 0x1915;
        const timeout =
            getPersistentStore().get(
                `programmer:device:${device?.serialNumber}`
            )?.flashTimeout ?? 40;
        setFlashTimeout(isThingy53 ? timeout : null);
    }, [device]);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(mcubootWritingClose());

    const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
        useStopwatch({ autoStart: true });

    const onWriteStart = useCallback(() => {
        reset();
        start();
        dispatch(performUpdate(flashTimeout));
    }, [dispatch, flashTimeout, reset, start]);

    const updateFlashTimeout = useCallback(
        (timeout: number) => {
            if (!device) return;
            setFlashTimeout(timeout);
            getPersistentStore().set(
                `programmer:device:${device.serialNumber}`,
                {
                    flashTimeout: timeout,
                }
            );
        },
        [device]
    );

    if (isRunning && (isWritingSucceed || isWritingFail)) {
        pause();
    }

    return (
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
                    <div>{mcubootFwPath || zipFilePath}</div>
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
                            MCUboot DFU.
                        </Alert>
                    )}
                    {isWritingSucceed && (
                        <Alert variant="success">
                            Completed successfully in
                            {` ${
                                days * 24 * 60 * 60 +
                                hours * 60 * 60 +
                                minutes * 60 +
                                seconds
                            } `}
                            seconds.
                        </Alert>
                    )}
                    {isWritingFail && (
                        <Alert label="Error" variant="danger">
                            <br />
                            {errorMsg ||
                                'Failed. Check the log below for more details...'}
                        </Alert>
                    )}
                </Form.Group>
                {flashTimeout && (
                    <Form.Group>
                        <FormLabel className="flex-row">
                            RAM NET core Flash timeout
                            <NumberInlineInput
                                value={flashTimeout}
                                range={flashTimeoutRange}
                                onChange={value => updateFlashTimeout(value)}
                            />
                            seconds
                        </FormLabel>
                        <Slider
                            values={[flashTimeout]}
                            onChange={[value => updateFlashTimeout(value)]}
                            range={flashTimeoutRange}
                        />
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer>
                {!isWritingSucceed && (
                    <Button
                        variant="primary"
                        className="core-btn"
                        onClick={onWriteStart}
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
};

export default McuUpdateDialogView;
