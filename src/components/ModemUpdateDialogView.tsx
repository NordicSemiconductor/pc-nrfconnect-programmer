/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import { useStopwatch } from 'react-timer-hook';
import { Alert } from 'pc-nrfconnect-shared';

import { performUpdate } from '../actions/modemTargetActions';
import { getIsMcuboot } from '../reducers/mcubootReducer';
import {
    getErrorMsg,
    getIsReady,
    getIsWriting,
    getIsWritingFail,
    getIsWritingSucceed,
    getModemFwName,
    getProgressMsg,
    getProgressPercentage,
    modemWritingClose,
} from '../reducers/modemReducer';

const ModemUpdateDialogView = () => {
    const isVisible = useSelector(getIsReady);
    const isWriting = useSelector(getIsWriting);
    const isWritingSucceed = useSelector(getIsWritingSucceed);
    const isWritingFail = useSelector(getIsWritingFail);
    const modemFwName = useSelector(getModemFwName);
    const progressMsg = useSelector(getProgressMsg);
    const progressPercentage = useSelector(getProgressPercentage);
    const errorMsg = useSelector(getErrorMsg);
    const isMcuboot = useSelector(getIsMcuboot);
    const expectedFwName = /mfw_nrf9160_\d+\.\d+\.\d+\.*.zip/.test(modemFwName);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(modemWritingClose());

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

    const temporarilySkippingProgressBar = true;

    return (
        <Modal show={isVisible} onHide={onCancel} backdrop="static">
            <Modal.Header>
                <Modal.Title className="modem-dialog-title">
                    Modem DFU
                    {isMcuboot && ' via MCUboot'}
                </Modal.Title>
                {isWriting && <span className="mdi mdi-refresh icon-spin" />}
            </Modal.Header>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>
                        <b>Modem firmware</b>
                    </Form.Label>
                    <div>{modemFwName}</div>
                </Form.Group>
                <Form.Group>
                    {!isWriting &&
                        !isWritingSucceed &&
                        !isWritingFail &&
                        !expectedFwName && (
                            <Alert
                                label="Unexpected file name detected"
                                variant="warning"
                            >
                                <br />
                                Nordic official modem firmware files are named
                                mfw_nrf9160_X.X.X*.zip.
                                <br />
                                Modem firmware files can be downloaded from{' '}
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.nordicsemi.com/Products/Development-hardware/nrf9160-dk/download#infotabs"
                                >
                                    www.nordicsemi.com
                                </a>
                                .
                            </Alert>
                        )}
                </Form.Group>
                <Form.Group>
                    <Form.Label>
                        <b>Status</b>
                    </Form.Label>
                    <div>{progressMsg}</div>
                    {isWriting && !temporarilySkippingProgressBar && (
                        <ProgressBar
                            hidden={!isWriting}
                            animated
                            now={progressPercentage}
                            label={`${progressPercentage}%`}
                        />
                    )}
                </Form.Group>
                <Form.Group>
                    {isMcuboot &&
                        !isWriting &&
                        !isWritingSucceed &&
                        !isWritingFail && (
                            <Alert variant="warning">
                                <p>
                                    You are now performing modem DFU via
                                    MCUboot.
                                </p>
                                <p>
                                    The device will be overwritten if you
                                    proceed to write.
                                </p>
                                <p>
                                    Make sure the device is in{' '}
                                    <strong>MCUboot mode</strong>.
                                </p>
                            </Alert>
                        )}
                    {isWritingSucceed && !isWriting && (
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
                    {isWritingFail && !isWriting && (
                        <Alert label="Error" variant="danger">
                            <br />
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
                        onClick={onWriteStart}
                        disabled={isWriting}
                    >
                        Write
                    </Button>
                )}
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isWriting}
                >
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

ModemUpdateDialogView.defaultProps = {};

export default ModemUpdateDialogView;
