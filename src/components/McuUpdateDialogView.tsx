/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import { useStopwatch } from 'react-timer-hook';

import { cancelUpdate, performUpdate } from '../actions/mcubootTargetActions';
import { getMcubootFilePath } from '../reducers/fileReducer';
import {
    getErrorMsg,
    getIsFirmwareValid,
    getIsReady,
    getIsWriting,
    getIsWritingFail,
    getIsWritingSucceed,
    getProgressMsg,
    getProgressPercentage,
} from '../reducers/mcubootReducer';

const McuUpdateDialogView = () => {
    const errorMsg = useSelector(getErrorMsg);
    const isVisible = useSelector(getIsReady);
    const isWriting = useSelector(getIsWriting);
    const isWritingFail = useSelector(getIsWritingFail);
    const isWritingSucceed = useSelector(getIsWritingSucceed);
    const isFirmwareValid = useSelector(getIsFirmwareValid);
    const mcubootFwPath = useSelector(getMcubootFilePath);
    const progressMsg = useSelector(getProgressMsg);
    const progressPercentage = useSelector(getProgressPercentage);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(cancelUpdate());

    const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
        useStopwatch({ autoStart: true });

    const onWriteStart = () => {
        reset();
        start();
        dispatch(performUpdate());
    };

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
