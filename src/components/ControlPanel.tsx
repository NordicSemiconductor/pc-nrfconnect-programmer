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
    AppDispatch,
    Button,
    colors,
    Group,
    logger,
    preventAppCloseUntilComplete,
    selectedDevice,
    SidePanel,
    Toggle,
    truncateMiddle,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { webUtils } from 'electron';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as settingsActions from '../actions/settingsActions';
import * as targetActions from '../actions/targetActions';
import * as usbsdfuTargetActions from '../actions/usbsdfuTargetActions';
import {
    getDeviceDefinition,
    getDeviceIsBusy,
    setDeviceBusy,
} from '../reducers/deviceDefinitionReducer';
import {
    getFileRegions,
    getMruFiles,
    getZipFilePath,
} from '../reducers/fileReducer';
import { getAutoRead, getAutoReset } from '../reducers/settingsReducer';
import { getIsWritable } from '../reducers/targetReducer';
import { convertDeviceDefinitionToCoreArray } from '../util/devices';
import { DeviceFamily } from '../util/deviceTypes';

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

            // calling this after our code would result in opening the file in an editor (atleast this was the case on linux)
            event.preventDefault();

            // eslint-disable-next-line no-restricted-syntax
            for (const file of event.dataTransfer.files) {
                const path = webUtils.getPathForFile(file);

                // eslint-disable-next-line no-await-in-loop
                await dispatch(fileActions.openFile(path));
            }
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
            <Button variant="secondary" className="tw-full" onClick={onClick}>
                <span className="mdi mdi-folder-open" />
                Add file
            </Button>
        </>
    );
};

const ControlPanel = () => {
    const dispatch = useDispatch<AppDispatch>();
    const device = useSelector(selectedDevice);
    const fileRegionSize = useSelector(getFileRegions)?.length;
    const mruFiles = useSelector(getMruFiles);
    const autoRead = useSelector(getAutoRead);
    const autoReset = useSelector(getAutoReset);
    const targetIsWritable = useSelector(getIsWritable);
    const deviceDefinition = useSelector(getDeviceDefinition);
    const zipFile = useSelector(getZipFilePath);
    const targetIsReady = !useSelector(getDeviceIsBusy) && !!device;
    const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
    const canRead = !!coreInfos.find(
        coreInfo => coreInfo.coreProtection === 'NRFDL_PROTECTION_STATUS_NONE'
    );

    const isMemLoaded = coreInfos.find(coreInfo => !!coreInfo.coreMemMap);
    const isJLink = !!device?.traits.jlink;
    const isNordicDfu = !!device?.traits.nordicDfu;
    const isMcuboot = !!device?.traits.mcuBoot;
    const isModem = !!device?.traits.modem;

    const isNRF54LFamily = deviceDefinition.family === DeviceFamily.NRF54L;

    const targetIsRecoverable = isJLink;

    const refreshAllFiles = () => dispatch(fileActions.refreshAllFiles());

    return (
        <SidePanel className="control-panel">
            <Group heading="File">
                <Mru mruFiles={mruFiles} />
                <Button
                    variant="secondary"
                    className="tw-full"
                    onClick={refreshAllFiles}
                >
                    <span className="mdi mdi-refresh" />
                    Reload files
                </Button>
                <Button
                    variant="secondary"
                    className="tw-full"
                    onClick={() => dispatch(fileActions.closeFiles())}
                >
                    <span className="mdi mdi-minus-circle" />
                    Clear files
                </Button>
            </Group>
            <Group heading="Device">
                <Button
                    variant="secondary"
                    className="tw-full"
                    key="performRecover"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(setDeviceBusy(true));

                        dispatch(
                            preventAppCloseUntilComplete(
                                {
                                    message: `The device is being recovered.
Closing application right now might result in some unknown behavior and might also brick the device.
Are you sure you want to continue?`,
                                },
                                dispatch(
                                    jlinkTargetActions.recover(device)
                                ).finally(() => dispatch(setDeviceBusy(false)))
                            )
                        );
                    }}
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
                    variant="secondary"
                    key="performRecoverAndWrite"
                    className="tw-full"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(setDeviceBusy(true));
                        dispatch(
                            preventAppCloseUntilComplete(
                                {
                                    message: `The device is being programmed.
Closing application right now might result in some unknown behavior and might also brick the device.
Are you sure you want to continue?`,
                                },
                                dispatch(
                                    jlinkTargetActions.recoverAndWrite(device)
                                ).finally(() => dispatch(setDeviceBusy(false)))
                            )
                        );
                    }}
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
                    variant="secondary"
                    key="performSaveAsFile"
                    className="tw-full"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }
                        dispatch(jlinkTargetActions.saveAsFile());
                    }}
                    disabled={
                        !isJLink ||
                        !isMemLoaded ||
                        !targetIsReady ||
                        isNRF54LFamily
                    }
                >
                    <span className="mdi mdi-floppy" />
                    Save as file
                </Button>
                <Button
                    key="performReset"
                    variant="secondary"
                    className="tw-full"
                    onClick={async () => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(setDeviceBusy(true));
                        try {
                            if (isNordicDfu) {
                                await dispatch(
                                    usbsdfuTargetActions.resetDevice(device)
                                );
                            } else {
                                await dispatch(
                                    jlinkTargetActions.resetDevice(device)
                                );
                            }
                        } catch (e) {
                            /* empty */
                        }
                        dispatch(setDeviceBusy(false));
                    }}
                    disabled={!isJLink || !targetIsReady}
                >
                    <span className="mdi mdi-record" />
                    Reset
                </Button>
                <Button
                    key="performWrite"
                    variant="secondary"
                    className="tw-full"
                    onClick={() => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(setDeviceBusy(true));
                        try {
                            // Refresh all files in case that some files have been updated right before write action.
                            refreshAllFiles();
                            dispatch(targetActions.write(device));
                        } catch (e) {
                            /* empty */
                        }
                        dispatch(setDeviceBusy(false));
                    }}
                    disabled={
                        !targetIsReady ||
                        !targetIsWritable ||
                        (isJLink && !zipFile)
                    }
                    title={
                        isJLink && !zipFile
                            ? 'The Write operation is not supported for JLink devices. Use Erase & write.'
                            : undefined
                    }
                >
                    <span className="mdi mdi-pencil" />
                    Write
                </Button>
                <Button
                    variant="secondary"
                    key="performJLinkRead"
                    className="tw-full"
                    onClick={async () => {
                        if (!device) {
                            logger.error('No target device!');
                            return;
                        }

                        dispatch(setDeviceBusy(true));
                        try {
                            await dispatch(jlinkTargetActions.read(device));
                        } catch (e) {
                            /* empty */
                        }
                        dispatch(setDeviceBusy(false));
                    }}
                    title={
                        isNRF54LFamily
                            ? 'Reading memory from nRF54L family is not supported.'
                            : undefined
                    }
                    disabled={
                        isMcuboot ||
                        !isJLink ||
                        !targetIsReady ||
                        !canRead ||
                        isNRF54LFamily
                    }
                >
                    <span className="mdi mdi-refresh" />
                    Read
                </Button>
            </Group>
            <Group heading="J-Link Settings">
                <Toggle
                    onToggle={() => dispatch(settingsActions.toggleAutoRead())}
                    isToggled={autoRead && !isNRF54LFamily}
                    label="Auto read memory"
                    barColor={colors.gray700}
                    handleColor={colors.gray300}
                    disabled={isNRF54LFamily}
                    title={
                        isNRF54LFamily
                            ? 'Reading memory from nRF54L15 family is not supported.'
                            : undefined
                    }
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
                    onToggle={() => {}}
                    isToggled={isMcuboot}
                    disabled
                    title="This feature is being disabled due to to lack of proper support. Enable MCUboot was an experimental feature to allow customers to program custom kits with Nordic SoCs and SiPs that have MCUboot."
                    label="Enable MCUboot"
                    barColor={colors.gray700}
                    handleColor={colors.gray300}
                />
            </Group>
        </SidePanel>
    );
};

export default ControlPanel;
