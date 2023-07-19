/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    colors,
    Group,
    logger,
    reset,
    selectedDevice,
    SidePanel,
    Toggle,
    truncateMiddle,
} from 'pc-nrfconnect-shared';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as settingsActions from '../actions/settingsActions';
import * as targetActions from '../actions/targetActions';
import * as usbsdfuTargetActions from '../actions/usbsdfuTargetActions';
import {
    getFileRegions,
    getMruFiles,
    getZipFilePath,
} from '../reducers/fileReducer';
import {
    getAutoRead,
    getAutoReset,
    getForceMcuBoot,
    setForceMcuBoot,
} from '../reducers/settingsReducer';
import {
    getDeviceInfo,
    getIsMemLoaded,
    getIsReady,
    getIsWritable,
} from '../reducers/targetReducer';

const useRegisterDragEvents = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        const onDragover = (event: DragEvent) => {
            if (!event.dataTransfer) return;
            event.dataTransfer.dropEffect = 'copy';
            event.preventDefault();
        };

        const onDrop = async (event: DragEvent) => {
            if (!event.dataTransfer) return;

            // eslint-disable-next-line no-restricted-syntax
            for (const file of event.dataTransfer.files) {
                // eslint-disable-next-line no-await-in-loop
                await dispatch(
                    fileActions.openFile(
                        (file as unknown as { path: string }).path
                    )
                );
            }

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
    const onSelect = (filePath: string | null) => {
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
                        onSelect={onSelect}
                        style={{ fontWeight: 700 }}
                    >
                        Browse...
                    </Dropdown.Item>
                </Popover>
            </Overlay>
            <Button variant="secondary" className="w-100" onClick={onClick}>
                <span className="mdi mdi-folder-open" />
                Add file
            </Button>
        </>
    );
};

const ControlPanel = () => {
    const dispatch = useDispatch();

    const device = useSelector(selectedDevice);
    const fileRegionSize = useSelector(getFileRegions)?.length;
    const mruFiles = useSelector(getMruFiles);
    const autoRead = useSelector(getAutoRead);
    const autoReset = useSelector(getAutoReset);
    const targetIsWritable = useSelector(getIsWritable);
    const targetIsMemLoaded = useSelector(getIsMemLoaded);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
    );
    const zipFile = useSelector(getZipFilePath);
    const forceMcuBoot = useSelector(getForceMcuBoot);

    const targetIsReady = useSelector(getIsReady) && !!device;
    const isJLink = !!device?.traits.jlink;
    const isUsbSerial = !!device?.traits.nordicDfu;
    const isMcuBoot = !!device?.traits.mcuBoot;
    const isModem = !!device?.traits.modem;

    const targetIsRecoverable = isJLink;

    const refreshAllFiles = () => dispatch(fileActions.refreshAllFiles());

    return (
        <SidePanel className="control-panel">
            <Group heading="File">
                <Mru mruFiles={mruFiles} />
                <Button
                    variant="secondary"
                    className="w-100"
                    onClick={refreshAllFiles}
                >
                    <span className="mdi mdi-refresh" />
                    Reload files
                </Button>
                <Button
                    variant="secondary"
                    className="w-100"
                    onClick={() => dispatch(fileActions.closeFiles())}
                >
                    <span className="mdi mdi-minus-circle" />
                    Clear files
                </Button>
            </Group>
            <Group heading="Device">
                <Button
                    variant="secondary"
                    className="w-100"
                    key="performRecover"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }
                        dispatch(
                            jlinkTargetActions.recover(
                                device,
                                autoRead,
                                autoReset
                            )
                        );
                    }}
                    disabled={
                        isMcuBoot ||
                        !isJLink ||
                        !targetIsReady ||
                        !targetIsRecoverable
                    }
                >
                    <span className="mdi mdi-eraser" />
                    Erase all
                </Button>
                <Button
                    variant="secondary"
                    key="performRecoverAndWrite"
                    className="w-100"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(
                            jlinkTargetActions.recoverAndWrite(
                                device,
                                autoRead,
                                autoReset
                            )
                        );
                    }}
                    disabled={
                        isMcuBoot ||
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
                    variant="secondary"
                    key="performSaveAsFile"
                    className="w-100"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }
                        dispatch(jlinkTargetActions.saveAsFile());
                    }}
                    disabled={!isJLink || !targetIsMemLoaded}
                >
                    <span className="mdi mdi-floppy" />
                    Save as file
                </Button>
                <Button
                    key="performReset"
                    variant="secondary"
                    className="w-100"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        if (isUsbSerial) {
                            reset(device);
                            dispatch(usbsdfuTargetActions.resetDevice(device));
                        } else {
                            dispatch(jlinkTargetActions.resetDevice(device));
                        }
                    }}
                    disabled={!isJLink || !targetIsReady}
                >
                    <span className="mdi mdi-record" />
                    Reset
                </Button>
                <Button
                    key="performWrite"
                    variant="secondary"
                    className="w-100"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }
                        // Refresh all files in case that some files have been updated right before write action.
                        refreshAllFiles();
                        dispatch(
                            targetActions.write(device, autoRead, autoReset)
                        );
                    }}
                    disabled={
                        !targetIsReady ||
                        !targetIsWritable ||
                        (isJLink && !zipFile)
                    }
                    title={
                        isJLink && !zipFile
                            ? 'The Write operation is not supported for JLink devices. Use Erase & write.'
                            : ''
                    }
                >
                    <span className="mdi mdi-pencil" />
                    Write
                </Button>
                <Button
                    variant="secondary"
                    key="performJLinkRead"
                    className="w-100"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(jlinkTargetActions.read(device, autoReset));
                    }}
                    disabled={
                        isMcuBoot || !isJLink || !targetIsReady || isProtected
                    }
                >
                    <span className="mdi mdi-refresh" />
                    Read
                </Button>
            </Group>
            <Group heading="Jlink Settings">
                <Toggle
                    onToggle={() => dispatch(settingsActions.toggleAutoRead())}
                    isToggled={autoRead}
                    label="Auto read memory"
                    barColor={colors.gray700}
                    handleColor={colors.gray300}
                />
                <Toggle
                    isToggled={autoReset}
                    onToggle={() => dispatch(settingsActions.toggleAutoReset())}
                    title="Reset device after read/write operations"
                    barColor={colors.gray700}
                    handleColor={colors.gray300}
                >
                    <>
                        Auto reset
                        {isJLink && isModem && autoReset && (
                            <span
                                title="Resetting modem too many times might cause it to lock up, use this setting with care for devices with modem."
                                className="mdi mdi-alert"
                            />
                        )}
                    </>
                </Toggle>
            </Group>
            <Group heading="MCUboot Settings">
                <Toggle
                    onToggle={() => dispatch(setForceMcuBoot(!forceMcuBoot))}
                    isToggled={forceMcuBoot || isMcuBoot}
                    disabled={isMcuBoot}
                    label="Enable MCUboot"
                    barColor={colors.gray700}
                    handleColor={colors.gray300}
                />
            </Group>
            <Group heading="Cellular Modem">
                <div className="cellular-modem-instructions">
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
                </div>
            </Group>
        </SidePanel>
    );
};

export default ControlPanel;
