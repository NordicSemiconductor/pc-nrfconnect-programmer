/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import FormLabel from 'react-bootstrap/FormLabel';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { useStopwatch } from 'react-timer-hook';
import {
    Alert,
    classNames,
    Dialog,
    DialogButton,
    getPersistentStore,
    NumberInlineInput,
    Slider,
    Spinner,
    Toggle,
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
import { timerTimeToSeconds } from '../util/helpers';

const TOOLTIP_TEXT =
    'Delay duration to allow successful image swap from RAM NET to NET core after image upload. Recommended default timeout is 40s. Should be increased for the older Thingy:53 devices';

const NET_CORE_UPLOAD_DELAY = 40;

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

    const writingHasStarted = isWriting || isWritingFail || isWritingSucceed;

    const device = useSelector(getDevice);

    const [uploadDelay, setUploadDelay] = useState(NET_CORE_UPLOAD_DELAY);
    const [keepDefaultTimeout, setKeepDefaultTimeout] = useState(true);
    const [showDelayTimeout, setShowDelayTimeout] = useState(true);
    const uploadDelayRange = {
        min: 20,
        max: 300,
        step: 5,
    };

    useEffect(() => {
        // note: check may be redundant as Thingy:91 has a different modal
        const isThingy53 =
            device?.usb?.device.descriptor.idProduct === 0x5300 &&
            device?.usb?.device.descriptor.idVendor === 0x1915;
        setShowDelayTimeout(isThingy53);
    }, [device]);

    useEffect(() => {
        if (!showDelayTimeout || !device) return;

        const timeout =
            getPersistentStore().get(
                `firmwareProgram:device:${device.serialNumber}`
            )?.netCoreUploadDelay ?? NET_CORE_UPLOAD_DELAY;
        setUploadDelay(timeout);

        if (timeout !== NET_CORE_UPLOAD_DELAY) {
            setKeepDefaultTimeout(false);
        }
    }, [device, showDelayTimeout]);

    const dispatch = useDispatch();
    const onCancel = () => dispatch(mcubootWritingClose());

    const { seconds, minutes, hours, days, isRunning, start, pause, reset } =
        useStopwatch({ autoStart: true });

    const onWriteStart = useCallback(() => {
        reset();
        start();
        dispatch(performUpdate(showDelayTimeout ? uploadDelay : null));
    }, [reset, start, dispatch, showDelayTimeout, uploadDelay]);

    const updateUploadDelayTimeout = useCallback(
        (timeout: number) => {
            if (!device) return;
            setUploadDelay(timeout);
            getPersistentStore().set(
                `firmwareProgram:device:${device.serialNumber}`,
                {
                    netCoreUploadDelay: timeout,
                }
            );
        },
        [device]
    );

    const toggleDefaultTimeoutUI = (shouldKeep: boolean) => {
        setKeepDefaultTimeout(shouldKeep);
        if (shouldKeep) {
            updateUploadDelayTimeout(NET_CORE_UPLOAD_DELAY);
        }
    };

    if (isRunning && (isWritingSucceed || isWritingFail)) {
        pause();
    }

    return (
        <Dialog
            isVisible={isVisible}
            onHide={onCancel}
            closeOnUnfocus={false}
            className="mcu-update-dialog"
        >
            <Dialog.Header title="MCUboot DFU" />
            <Dialog.Body>
                <Form.Group>
                    <Form.Label className="mb-0">
                        <strong>Firmware:</strong>
                    </Form.Label>
                    <p>{mcubootFwPath || zipFilePath}</p>
                </Form.Group>
                <Form.Group>
                    <Form.Label>
                        <strong>Status:</strong>
                        <span>{` ${progressMsg}`}</span>
                    </Form.Label>
                    <ProgressBar
                        hidden={!isWriting}
                        animated
                        now={progressPercentage}
                        label={`${progressPercentage}%`}
                    />
                </Form.Group>
                {!writingHasStarted && showDelayTimeout && (
                    <Form.Group className="upload-delay p-3">
                        <div className="d-flex justify-content-between">
                            <Form.Label className="mb-0">
                                <strong>
                                    Keep default delay after image upload
                                </strong>
                                <OverlayTrigger
                                    placement="bottom-end"
                                    overlay={
                                        <Tooltip id="tooltip-delay-info">
                                            <div className="info text-left">
                                                <span>{TOOLTIP_TEXT}</span>
                                            </div>
                                        </Tooltip>
                                    }
                                >
                                    <span className="mdi mdi-information-outline info-icon ml-1" />
                                </OverlayTrigger>
                            </Form.Label>
                            <Toggle
                                onToggle={toggleDefaultTimeoutUI}
                                isToggled={keepDefaultTimeout}
                            />
                        </div>
                        <FormLabel
                            className={classNames(
                                'w-100 mt-3 mb-0',
                                keepDefaultTimeout ? 'd-none' : 'd-block'
                            )}
                        >
                            <div className="d-flex flex-row justify-content-between mb-2">
                                <div>
                                    <strong>Set delay duration</strong>
                                </div>
                                <div className="d-flex">
                                    <NumberInlineInput
                                        value={uploadDelay}
                                        range={uploadDelayRange}
                                        onChange={updateUploadDelayTimeout}
                                    />
                                    <span>sec</span>
                                </div>
                            </div>
                            <Slider
                                values={[uploadDelay]}
                                onChange={[
                                    value => updateUploadDelayTimeout(value),
                                ]}
                                range={uploadDelayRange}
                            />

                            {uploadDelay !== NET_CORE_UPLOAD_DELAY && (
                                <p className="note">
                                    Note: recommended delay for <i>most</i> of
                                    the devices is {NET_CORE_UPLOAD_DELAY}{' '}
                                    seconds.
                                </p>
                            )}
                        </FormLabel>
                    </Form.Group>
                )}
                <Form.Group>
                    {!writingHasStarted && (
                        <Alert variant="warning">
                            <div>
                                <p className="mb-0">
                                    You are now programming via MCUboot.
                                </p>
                                <p className="mb-0">
                                    The device will be recovered if you proceed
                                    to write.
                                </p>
                                <p className="mb-0">
                                    Make sure the device is in{' '}
                                    <strong>MCUboot mode</strong>.
                                </p>
                            </div>
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
                            Completed successfully in {` `}
                            {timerTimeToSeconds(seconds, minutes, hours, days)}
                            {` `} seconds.
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
            </Dialog.Body>
            <Dialog.Footer>
                {isWriting && <Spinner />}

                {!isWritingSucceed && (
                    <DialogButton
                        variant="primary"
                        onClick={onWriteStart}
                        disabled={isWriting}
                    >
                        Write
                    </DialogButton>
                )}
                <DialogButton onClick={onCancel} disabled={isWriting}>
                    Close
                </DialogButton>
            </Dialog.Footer>
        </Dialog>
    );
};

export default McuUpdateDialogView;
