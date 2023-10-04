/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useCallback, useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    clearWaitForDevice,
    describeError,
    DialogButton,
    GenericDialog,
    logger,
    selectedDevice,
    setWaitForDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { Progress } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

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
import { WithRequired } from '../util/types';

export default () => {
    const [progress, setProgress] =
        useState<WithRequired<Progress, 'message'>>();
    const [writing, setWriting] = useState(false);
    const [writingFail, setWritingFail] = useState(false);
    const [writingSucceed, setWritingSucceed] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [writingFailError, setWritingFailError] = useState<string>();

    const device = useSelector(selectedDevice);
    const isVisible = useSelector(getUsbSdfuProgrammingDialog);
    const images = useSelector(getDFUImages);

    const dispatch = useDispatch();

    const onWriteStart = useCallback(async () => {
        if (!device) {
            logger.error('No target device!');
            return;
        }

        setStartTime(Date.now());
        // Start writing after handling images since user may cancel userInput
        logger.info('Performing DFU. This may take a few seconds');
        dispatch(
            updateCoreOperations({
                core: 'Application',
                state: 'writing',
            })
        );

        // We might have more that one reboot of the device during the next operation
        dispatch(
            setWaitForDevice({
                timeout: 10000,
                when: 'always',
                once: false,
            })
        );

        setWriting(true);
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

        // Operation done reconnect one more time only
        dispatch(
            setWaitForDevice({
                timeout: 10000,
                when: 'always',
                once: true,
                onSuccess: programmedDevice =>
                    dispatch(refreshMemoryLayout(programmedDevice)),
            })
        );

        dispatch(
            updateCoreOperations({
                core: 'Application',
                state: 'idle',
            })
        );
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
                    {Math.round((Date.now() - startTime) / 1000)} seconds.
                </Alert>
            )}
            {writingFail && (
                <Alert variant="danger">
                    {writingFailError?.trim() ||
                        'Failed. Check the log below for more details...'}
                </Alert>
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
        </GenericDialog>
    );
};
