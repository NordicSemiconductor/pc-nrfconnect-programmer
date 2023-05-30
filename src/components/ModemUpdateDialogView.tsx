/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    DialogButton,
    GenericDialog,
    useStopwatch,
} from 'pc-nrfconnect-shared';

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
    const onCancel = useCallback(() => {
        if (!isWriting) {
            dispatch(modemWritingClose());
        }
    }, [dispatch, isWriting]);

    const { time, start, pause, reset } = useStopwatch({
        autoStart: false,
    });

    const onWriteStart = () => {
        reset();
        start();
        dispatch(performUpdate());
    };

    useEffect(() => {
        if (isWritingSucceed || isWritingFail) {
            pause();
        }
    }, [isWritingFail, isWritingSucceed, pause]);

    const temporarilySkippingProgressBar = true;

    return (
        <GenericDialog
            title={`Modem DFU ${isMcuboot ? ' via MCUboot' : ''}`}
            showSpinner={isWriting}
            onHide={onCancel}
            closeOnEsc
            closeOnUnfocus
            footer={
                <>
                    <DialogButton
                        variant="primary"
                        onClick={onWriteStart}
                        disabled={
                            isWriting || isWritingSucceed || isWritingFail
                        }
                    >
                        Write
                    </DialogButton>
                    <DialogButton
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isWriting}
                    >
                        Close
                    </DialogButton>
                </>
            }
            isVisible={isVisible}
        >
            <>
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
                                <p className="mb-0">
                                    You are now performing modem DFU via
                                    MCUboot.
                                </p>
                                <p className="mb-0">
                                    The device will be overwritten if you
                                    proceed to write.
                                </p>
                                <p className="mb-0">
                                    Make sure the device is in{' '}
                                    <strong>MCUboot mode</strong>.
                                </p>
                            </Alert>
                        )}
                    {isWritingSucceed && !isWriting && (
                        <Alert variant="success">
                            Completed successfully in
                            {` ${Math.round(time / 1000)} `}
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
            </>
        </GenericDialog>
    );
};

ModemUpdateDialogView.defaultProps = {};

export default ModemUpdateDialogView;
