/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { truncateMiddle } from 'pc-nrfconnect-shared';
import PropTypes from 'prop-types';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as mcubootTargetActions from '../actions/mcubootTargetActions';
import * as settingsActions from '../actions/settingsActions';
import * as targetActions from '../actions/targetActions';
import * as usbsdfuTargetActions from '../actions/usbsdfuTargetActions';
import { getFileRegions, getMruFiles } from '../reducers/fileReducer';
import { getIsMcuboot } from '../reducers/mcubootReducer';
import { getIsModem } from '../reducers/modemReducer';
import { getAutoRead, getAutoReset } from '../reducers/settingsReducer';
import {
    getDeviceInfo,
    getIsMemLoaded,
    getIsReady,
    getIsRecoverable,
    getIsWritable,
    getTargetType,
} from '../reducers/targetReducer';
import { CommunicationType } from '../util/devices';

const useRegisterDragEvents = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        const onDragover = (event: DragEvent) => {
            if (!event.dataTransfer) return;
            event.dataTransfer.dropEffect = 'copy';
            event.preventDefault();
        };

        const onDrop = (event: DragEvent) => {
            if (!event.dataTransfer) return;

            Array.from(event.dataTransfer.files).forEach(file => {
                dispatch(
                    fileActions.openFile(
                        // Electron has meddled with this type without exposing new type definition
                        (file as unknown as { path: string }).path
                    )
                );
            });
            event.preventDefault();
        };

        document.body.addEventListener('drop', onDrop);
        document.body.addEventListener('dragover', onDragover);

        return () => {
            document.body.removeEventListener('drop', onDrop);
            document.body.removeEventListener('dragover', onDragover);
        };
    }, [dispatch]);
};

const useLoadSettingsInitially = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(settingsActions.loadSettings());
    }, [dispatch]);
};

const Mru = ({ mruFiles }: { mruFiles: string[] }) => {
    useRegisterDragEvents();
    useLoadSettingsInitially();

    const [show, setShow] = useState(false);
    const [target, setTarget] = useState<HTMLElement | null>(null);

    const dispatch = useDispatch();
    const openFile = (filename: string) =>
        dispatch(fileActions.openFile(filename));
    const openFileDialog = () => dispatch(fileActions.openFileDialog());
    const onToggleFileList = () => dispatch(fileActions.loadMruFiles());

    const onClick = (event: React.MouseEvent) => {
        if (!event.target) return;
        onToggleFileList();
        setShow(!show);
        setTarget(event.target as HTMLElement);
    };
    // (eventKey: string | null, e: React.SyntheticEvent<unknown>) => void
    const onSelect = (filePath: string) => {
        if (filePath) {
            openFile(filePath);
        } else {
            openFileDialog();
        }
        setShow(false);
    };

    const containerNode = document.getElementsByClassName(
        'core-main-layout'
    )[0] as HTMLElement;

    return (
        <>
            <Overlay
                show={show}
                target={target}
                placement="bottom-end"
                container={containerNode}
                rootClose
                onHide={() => setShow(false)}
                transition={false}
            >
                <Popover
                    id="mru-popover"
                    className="mru-popover"
                    placement="bottom-end"
                    content
                >
                    {mruFiles.length ? (
                        mruFiles.map(filePath => (
                            <Dropdown.Item
                                key={filePath}
                                onSelect={() => onSelect(filePath)}
                                title={filePath}
                            >
                                {truncateMiddle(filePath, 30, 40)}
                            </Dropdown.Item>
                        ))
                    ) : (
                        <Dropdown.Item disabled>
                            No recently used files, click <i>Browse</i> or drag
                            and drop files to add them
                        </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item
                        /* @ts-ignore This works */
                        onSelect={onSelect}
                        style={{ fontWeight: 700 }}
                    >
                        Browse...
                    </Dropdown.Item>
                </Popover>
            </Overlay>
            <Button variant="primary" onClick={onClick}>
                <span className="mdi mdi-folder-open" />
                Add file
            </Button>
        </>
    );
};

Mru.propTypes = {
    mruFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ControlPanel = () => {
    const fileRegionSize = useSelector(getFileRegions)?.length;
    const mruFiles = useSelector(getMruFiles);
    const autoRead = useSelector(getAutoRead);
    const autoReset = useSelector(getAutoReset);
    const targetIsWritable = useSelector(getIsWritable);
    const targetIsRecoverable = useSelector(getIsRecoverable);
    const targetIsMemLoaded = useSelector(getIsMemLoaded);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
    );
    const targetIsReady = useSelector(getIsReady);
    const isJLink = useSelector(getTargetType) === CommunicationType.JLINK;
    const isUsbSerial =
        useSelector(getTargetType) === CommunicationType.USBSDFU;
    const isMcuboot = useSelector(getIsMcuboot);
    const isModem = useSelector(getIsModem);

    const dispatch = useDispatch();
    const closeFiles = () => dispatch(fileActions.closeFiles());
    const refreshAllFiles = () => dispatch(fileActions.refreshAllFiles());
    const toggleAutoRead = () => dispatch(settingsActions.toggleAutoRead());
    const toggleAutoReset = () => dispatch(settingsActions.toggleAutoReset());
    const toggleMcuboot = () => dispatch(mcubootTargetActions.toggleMcuboot());
    const performRecover = () => dispatch(jlinkTargetActions.recover());
    const performRecoverAndWrite = () =>
        dispatch(jlinkTargetActions.recoverAndWrite());
    const performSaveAsFile = () => dispatch(jlinkTargetActions.saveAsFile());
    const performJLinkRead = () => dispatch(jlinkTargetActions.read());
    const performReset = () => {
        if (isUsbSerial) {
            dispatch(usbsdfuTargetActions.resetDevice());
        } else {
            dispatch(jlinkTargetActions.resetDevice());
        }
    };
    const performWrite = () => dispatch(targetActions.write());

    return (
        <div className="control-panel">
            <Card>
                <Card.Header>File</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Mru mruFiles={mruFiles} />
                        <Button onClick={refreshAllFiles}>
                            <span className="mdi mdi-refresh" />
                            Reload files
                        </Button>
                        <Button onClick={closeFiles}>
                            <span className="mdi mdi-minus-circle" />
                            Clear files
                        </Button>
                    </ButtonGroup>
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Device</Card.Header>
                <Card.Body>
                    <ButtonGroup vertical>
                        <Button
                            key="performRecover"
                            onClick={performRecover}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                !targetIsRecoverable
                            }
                        >
                            <span className="mdi mdi-eraser" />
                            Erase all
                        </Button>
                        <Button
                            key="performRecoverAndWrite"
                            onClick={performRecoverAndWrite}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                !fileRegionSize ||
                                !(targetIsRecoverable && mruFiles.length)
                            }
                        >
                            <span className="mdi mdi-pencil" />
                            Erase & write
                        </Button>
                        <Button
                            key="performSaveAsFile"
                            onClick={performSaveAsFile}
                            disabled={!isJLink || !targetIsMemLoaded}
                        >
                            <span className="mdi mdi-floppy" />
                            Save as file
                        </Button>
                        <Button
                            key="performReset"
                            onClick={performReset}
                            disabled={!isJLink || !targetIsReady}
                        >
                            <span className="mdi mdi-record" />
                            Reset
                        </Button>
                        <Button
                            key="performWrite"
                            onClick={performWrite}
                            disabled={!targetIsReady || !targetIsWritable}
                        >
                            <span className="mdi mdi-pencil" />
                            Write
                        </Button>
                        <Button
                            key="performJLinkRead"
                            onClick={performJLinkRead}
                            disabled={
                                isMcuboot ||
                                !isJLink ||
                                !targetIsReady ||
                                isProtected
                            }
                        >
                            <span className="mdi mdi-refresh" />
                            Read
                        </Button>
                    </ButtonGroup>
                    <Form.Group controlId="formBasicChecbox">
                        <Form.Check
                            type="checkbox"
                            id="auto-read-memory-checkbox"
                            className="last-checkbox"
                            onChange={() => toggleAutoRead()}
                            checked={autoRead}
                            label="Auto read memory"
                        />
                        <Form.Check
                            type="checkbox"
                            id="auto-reset-checkbox"
                            className="last-checkbox auto-reset-checkbox"
                        >
                            <Form.Check.Input
                                type="checkbox"
                                checked={autoReset}
                                onChange={() => toggleAutoReset()}
                                title="Reset device after read/write operations"
                            />
                            <Form.Label>
                                <span>Auto reset</span>
                                {isJLink && isModem && autoReset && (
                                    <span
                                        title="Resetting modem too many times might cause it to lock up, use this setting with care for devices with modem."
                                        className="mdi mdi-alert"
                                    />
                                )}
                            </Form.Label>
                        </Form.Check>
                        <Form.Check
                            type="checkbox"
                            id="toggle-mcuboot-checkbox"
                            className="last-checkbox"
                            onChange={() => toggleMcuboot()}
                            checked={isMcuboot}
                            label="Enable MCUboot"
                        />
                    </Form.Group>
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Cellular Modem</Card.Header>
                <Card.Body>
                    To update the modem:
                    <ol>
                        <li>Connect a device</li>
                        <li>
                            Click <b>Add file</b>
                        </li>
                        <li>Select modem zip file</li>
                        <li>
                            Click <b>Write</b>
                        </li>
                    </ol>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ControlPanel;
