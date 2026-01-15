/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import {
    addConfirmBeforeClose,
    Alert,
    clearConfirmBeforeClose,
    clearWaitForDevice,
    describeError,
    DialogButton,
    GenericDialog,
    logger,
    selectedDevice,
    setWaitForDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { type Progress } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

import {
    operateDFU,
    refreshMemoryLayout,
} from '../actions/usbsdfuTargetActions';
import { updateCoreOperations } from '../reducers/deviceDefinitionReducer';
import {
    getDFUImages,
    getUsbSdfuProgrammingDialog,
    setUsbSdfuProgrammingDialog,
} from '../reducers/usbSdfuReducer';
import { type WithRequired } from '../util/types';

export default () => {
    const [progress, setProgress] =
        useState<WithRequired<Progress, 'message'>>();
    const [writing, setWriting] = useState(false);
    const [writingFail, setWritingFail] = useState(false);
    const [writingSucceed, setWritingSucceed] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(Date.now());
    const [writingFailError, setWritingFailError] = useState<string>();

    const device = useSelector(selectedDevice);
    const isVisible = useSelector(getUsbSdfuProgrammingDialog);
    const images = useSelector(getDFUImages);

    const dispatch = useDispatch();

    useEffect(() => {
        if (writing) {
            setStartTime(Date.now());
        } else {
            setEndTime(Date.now());
        }
    }, [writing]);

    const onWriteStart = useCallback(async () => {
        if (!device) {
            logger.error('No target device!');
            return;
        }

        // Start writing after handling images since user may cancel userInput
        logger.info('Performing DFU. This may take a few seconds');
        dispatch(
            updateCoreOperations({
                core: 'Application',
                state: 'writing',
            }),
        );

        let canceled = false;

        // We might have more that one reboot of the device during the next operation
        dispatch(
            setWaitForDevice({
                timeout: 10000,
                when: 'always',
                once: false,
                skipRefetchDeviceInfo: true,
                onCanceled: () => {
                    canceled = true;
                },
            }),
        );

        setWriting(true);
        dispatch(
            addConfirmBeforeClose({
                id: 'usbSdfuProgramming',
                message: `The device is being programmed.
Closing application right now might result in some unknown behavior and might also brick the device.
Are you sure you want to continue?`,
            }),
        );

        try {
            await operateDFU(device, images, programmingProgress => {
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
            });
            setWritingSucceed(true);
        } catch (e) {
            const error = e as Error;
            logger.error(`Failed to write: ${describeError(error)}`);
            dispatch(refreshMemoryLayout(device));
            setWritingFailError(error.message);
            setWritingFail(true);
        }

        setWriting(false);
        dispatch(clearConfirmBeforeClose('usbSdfuProgramming'));

        if (!canceled) {
            // Operation done reconnect one more time only
            dispatch(
                setWaitForDevice({
                    timeout: 10000,
                    when: 'always',
                    once: true,
                    onSuccess: programmedDevice =>
                        dispatch(refreshMemoryLayout(programmedDevice)),
                }),
            );

            dispatch(
                updateCoreOperations({
                    core: 'Application',
                    state: 'idle',
                }),
            );
        }
    }, [device, dispatch, images]);

    useEffect(() => {
        const writingHasStarted = writing || writingFail || writingSucceed;
        if (isVisible && !writingHasStarted) {
            onWriteStart();
        }
    }, [isVisible, onWriteStart, writing, writingFail, writingSucceed]);

    useEffect(() => {
        if (!isVisible) {
            setProgress(undefined);
            setWriting(false);
            setWritingSucceed(false);
            setWritingFail(false);
            setWritingFailError(undefined);
        }
    }, [isVisible]);

    const onCancel = () => {
        dispatch(clearWaitForDevice());
        dispatch(setUsbSdfuProgrammingDialog(false));
    };

    return (
        <GenericDialog
            title="Nordic SDFU"
            isVisible={isVisible}
            onHide={onCancel}
            showSpinner={writing}
            closeOnUnfocus={false}
            footer={
                <DialogButton onClick={onCancel} disabled={writing}>
                    Close
                </DialogButton>
            }
        >
            {writingSucceed && (
                <Alert variant="success">
                    Completed successfully in{' '}
                    {Math.round((endTime - startTime) / 1000)} seconds.
                </Alert>
            )}
            {writingFail && (
                <Alert variant="danger">
                    {writingFailError?.trim() ||
                        'Failed. Check the log below for more details...'}
                </Alert>
            )}
            {writing && (
                <div className="tw-flex tw-flex-col tw-gap-2">
                    <div>
                        <strong>Status: </strong>
                        <span>{` ${
                            progress ? progress.message : 'Starting...'
                        }`}</span>
                    </div>
                    <ProgressBar
                        hidden={!writing}
                        now={progress?.stepProgressPercentage ?? 0}
                        style={{ height: '4px' }}
                    />
                </div>
            )}
        </GenericDialog>
    );
};
