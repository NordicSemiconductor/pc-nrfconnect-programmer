/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useRef, useState } from 'react';
import Form from 'react-bootstrap/Form';
import FormLabel from 'react-bootstrap/FormLabel';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Tooltip from 'react-bootstrap/Tooltip';
import { useDispatch, useSelector } from 'react-redux';
import {
    addConfirmBeforeClose,
    Alert,
    classNames,
    clearConfirmBeforeClose,
    clearWaitForDevice,
    convertToDropDownItems,
    DialogButton,
    Dropdown,
    DropdownItem,
    GenericDialog,
    getPersistentStore,
    getSelectedDropdownItem,
    logger,
    NumberInlineInput,
    Overlay,
    selectedDevice,
    selectedDeviceInfo,
    setWaitForDevice,
    Slider,
    Toggle,
    useStopwatch,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { Progress } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

import { canWrite, performUpdate } from '../actions/mcubootTargetActions';
import { getMcubootFilePath, getZipFilePath } from '../reducers/fileReducer';
import {
    getShowMcuBootProgrammingDialog,
    setShowMcuBootProgrammingDialog,
} from '../reducers/mcubootReducer';
import { WithRequired } from '../util/types';

const TOOLTIP_TEXT =
    'Delay duration to allow successful image swap from RAM NET to NET core after image upload. Recommended default timeout is 40s. Should be increased for the older Thingy:53 devices';
const TOOLTIP_TEXT_MULTIPLE_TARGETS =
    'Your device has multiple targets. Please select the target you want to program.';

const NET_CORE_UPLOAD_DELAY = 120;

const McuUpdateDialogView = () => {
    const abortController = useRef(new AbortController());
    const [progress, setProgress] =
        useState<WithRequired<Progress, 'message'>>();
    const [writing, setWriting] = useState(false);
    const [writingFail, setWritingFail] = useState(false);
    const [writingSucceed, setWritingSucceed] = useState(false);
    const [writingFailError, setWritingFailError] = useState<string>();

    const device = useSelector(selectedDevice);
    const isVisible = useSelector(getShowMcuBootProgrammingDialog);
    const mcubootFwPath = useSelector(getMcubootFilePath);
    const zipFilePath = useSelector(getZipFilePath);
    const deviceInfo = useSelector(selectedDeviceInfo);

    const programmingOptions =
        deviceInfo?.mcuStateOptions?.filter(s => s.type === 'Programming') ??
        [];

    const targetDropdownItems = convertToDropDownItems(
        programmingOptions.map(s => s.arguments?.target),
        false
    );

    const fwPath = mcubootFwPath || zipFilePath;
    const [chosenTarget, setChosenTarget] = useState<string>('');

    const writingHasStarted = writing || writingFail || writingSucceed;

    const dispatch = useDispatch();

    const [uploadDelay, setUploadDelay] = useState(NET_CORE_UPLOAD_DELAY);
    const [keepDefaultTimeout, setKeepDefaultTimeout] = useState(true);
    const [showDelayTimeout, setShowDelayTimeout] = useState(true);
    const uploadDelayRange = {
        min: 20,
        max: 300,
        step: 5,
    };

    const { time, start, pause, reset } = useStopwatch({
        autoStart: false,
        resolution: 200,
    });

    useEffect(() => {
        // note: check may be redundant as Thingy:91 has a different modal
        const isThingy53 =
            device?.usb?.device.descriptor.idProduct === 0x5300 &&
            device?.usb?.device.descriptor.idVendor === 0x1915;
        setShowDelayTimeout(isThingy53);
    }, [device]);

    useEffect(() => {
        if (isVisible) {
            setProgress(undefined);
            setWriting(false);
            setWritingSucceed(false);
            setWritingFail(false);
            setWritingFailError(undefined);
        } else {
            abortController.current.abort();
        }
    }, [isVisible]);

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

    useEffect(() => {
        if (targetDropdownItems.length > 0) {
            setChosenTarget(targetDropdownItems[0].value);
        }
    }, [targetDropdownItems]);

    const onCancel = () => {
        dispatch(clearWaitForDevice());
        dispatch(setShowMcuBootProgrammingDialog(false));
        setProgress(undefined);
        setWriting(false);
        setWritingSucceed(false);
        setWritingFail(false);
        setWritingFailError(undefined);
    };

    const onWriteStart = () => {
        if (!device) {
            logger.error('No target device!');
            return;
        }

        if (!fwPath) {
            logger.error('No file selected');
            return;
        }

        abortController.current = new AbortController();

        setWriting(true);
        dispatch(
            addConfirmBeforeClose({
                id: 'mcuProgramming',
                message: `The device is being programmed.
Closing application right now might result in some unknown behavior and might also brick the device.
Are you sure you want to continue?`,
                onClose: () => abortController.current.abort(),
            })
        );

        reset();
        start();

        dispatch(
            setWaitForDevice({
                timeout: 99999999999999, // Wait 'indefinitely' as we will cancel the wait when programming is complete
                when: 'always',
                once: false,
            })
        );

        performUpdate(
            device,
            fwPath,
            programmingProgress => {
                let updatedProgress: WithRequired<Progress, 'message'> = {
                    ...programmingProgress,
                    message: programmingProgress.message ?? '',
                };

                if (programmingProgress.operation === 'erase_image') {
                    updatedProgress = {
                        ...programmingProgress,
                        message: `${programmingProgress.message} This will take some time.`,
                    };
                }

                setProgress(updatedProgress);
            },
            abortController.current,
            showDelayTimeout ? uploadDelay : undefined,
            mcubootFwPath ? chosenTarget : undefined
        )
            .then(() => {
                setWritingSucceed(true);
            })
            .catch(error => {
                if (!abortController.current.signal.aborted) {
                    setWritingFailError(error.message);
                    setWritingFail(true);
                }
            })
            .finally(() => {
                dispatch(clearWaitForDevice());
                dispatch(canWrite());
                setWriting(false);
                dispatch(clearConfirmBeforeClose('mcuProgramming'));
            });
    };

    const updateUploadDelayTimeout = (timeout: number) => {
        if (!device) return;
        setUploadDelay(timeout);
        getPersistentStore().set(
            `firmwareProgram:device:${device.serialNumber}`,
            {
                netCoreUploadDelay: timeout,
            }
        );
    };

    const toggleDefaultTimeoutUI = (shouldKeep: boolean) => {
        setKeepDefaultTimeout(shouldKeep);
        if (shouldKeep) {
            updateUploadDelayTimeout(NET_CORE_UPLOAD_DELAY);
        }
    };

    useEffect(() => {
        if (writingSucceed || writingFail) {
            pause();
        }
    }, [writingFail, writingSucceed, pause]);

    return (
        <GenericDialog
            title="MCUboot DFU"
            isVisible={isVisible || writingSucceed || writingFail}
            onHide={onCancel}
            showSpinner={writing}
            closeOnUnfocus={false}
            className="mcu-update-dialog"
            footer={
                <>
                    <DialogButton
                        variant="primary"
                        onClick={onWriteStart}
                        disabled={
                            writing ||
                            writingSucceed ||
                            writingFail ||
                            (programmingOptions.length > 1 &&
                                !chosenTarget &&
                                !!mcubootFwPath)
                        }
                    >
                        Write
                    </DialogButton>
                    <DialogButton onClick={onCancel} disabled={writing}>
                        Close
                    </DialogButton>
                </>
            }
        >
            <Form.Group>
                <Form.Label className="mb-0">
                    <strong>Firmware:</strong>
                    <span>{` ${mcubootFwPath || zipFilePath}`}</span>
                </Form.Label>
            </Form.Group>

            {programmingOptions.length > 1 && !zipFilePath && (
                <Form.Group>
                    <Form.Label
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
                        <strong>Target:</strong>
                        <Overlay
                            tooltipChildren={
                                <span>{TOOLTIP_TEXT_MULTIPLE_TARGETS}</span>
                            }
                            keepShowingOnHoverTooltip
                            tooltipId="test"
                            placement="right"
                        >
                            <span className="mdi mdi-information-outline info-icon ml-1" />
                        </Overlay>
                    </Form.Label>
                    <Dropdown
                        items={targetDropdownItems}
                        onSelect={(item: DropdownItem) => {
                            setChosenTarget(item.value);
                        }}
                        selectedItem={getSelectedDropdownItem(
                            targetDropdownItems,
                            chosenTarget
                        )}
                        disabled={writingHasStarted}
                    />
                </Form.Group>
            )}

            {writing && (
                <Form.Group>
                    <Form.Label>
                        <strong>Status: </strong>
                        <span>{` ${
                            progress ? progress.message : 'Starting...'
                        }`}</span>
                    </Form.Label>
                    <ProgressBar
                        hidden={!writing}
                        now={progress?.stepProgressPercentage ?? 0}
                        style={{ height: '4px' }}
                    />
                </Form.Group>
            )}
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
                            'w-100 mb-0 mt-3',
                            keepDefaultTimeout ? 'd-none' : 'd-block'
                        )}
                    >
                        <div className="d-flex justify-content-between mb-2 flex-row">
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
                                (value: number) =>
                                    updateUploadDelayTimeout(value),
                            ]}
                            range={uploadDelayRange}
                        />

                        {uploadDelay !== NET_CORE_UPLOAD_DELAY && (
                            <p className="note">
                                Note: recommended delay for <i>most</i> of the
                                devices is {NET_CORE_UPLOAD_DELAY} seconds.
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
                                The device will be recovered if you proceed to
                                write.
                            </p>
                            <p className="mb-0">
                                Make sure the device is in{' '}
                                <strong>MCUboot mode</strong>.
                            </p>
                        </div>
                    </Alert>
                )}
                {writingSucceed && (
                    <Alert variant="success">
                        Completed successfully in {` `}
                        {` ${Math.round(time / 1000)} `}
                        {` `} seconds.
                    </Alert>
                )}
                {writingFail && (
                    <Alert variant="danger">
                        {writingFailError?.trim() ||
                            'Failed. Check the log below for more details...'}
                    </Alert>
                )}
            </Form.Group>
        </GenericDialog>
    );
};

export default McuUpdateDialogView;
