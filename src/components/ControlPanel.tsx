/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { Group, SidePanel, Slider, truncateMiddle } from 'pc-nrfconnect-shared';
import PropTypes from 'prop-types';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as settingsActions from '../actions/settingsActions';
import { getElf, getMruFiles } from '../reducers/fileReducer';
import { getIsMcuboot } from '../reducers/mcubootReducer';
import {
    getDeviceInfo,
    getIsMemLoaded,
    getIsReady,
    getTargetType,
} from '../reducers/targetReducer';
import { getResolution, upadateResolution } from '../reducers/userInputReducer';
import { CommunicationType } from '../util/devices';

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
    // (eventKey: string | null, e: React.SyntheticEvent<unknown>) => void
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
            <Button variant="secondary" onClick={onClick}>
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
    const mruFiles = useSelector(getMruFiles);

    const targetIsMemLoaded = useSelector(getIsMemLoaded);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
    );
    const targetIsReady = useSelector(getIsReady);
    const isJLink = useSelector(getTargetType) === CommunicationType.JLINK;
    const isMcuboot = useSelector(getIsMcuboot);

    const dispatch = useDispatch();
    const closeFiles = () => dispatch(fileActions.closeFiles());
    const refreshAllFiles = () => dispatch(fileActions.refreshAllFiles());

    const performSaveAsFile = () => dispatch(jlinkTargetActions.saveAsFile());
    const performJLinkRead = () => dispatch(jlinkTargetActions.read());

    const resolution = useSelector(getResolution);
    const elf = useSelector(getElf);

    return (
        <SidePanel className="control-panel">
            <Group heading="File">
                <Mru mruFiles={mruFiles} />
                <Button variant="secondary" onClick={refreshAllFiles}>
                    <span className="mdi mdi-refresh" />
                    Reload files
                </Button>
                <Button variant="secondary" onClick={closeFiles}>
                    <span className="mdi mdi-minus-circle" />
                    Clear files
                </Button>
            </Group>
            <Group heading="Device">
                <Button
                    key="performSaveAsFile"
                    variant="secondary"
                    onClick={performSaveAsFile}
                    disabled={!isJLink || !targetIsMemLoaded}
                >
                    <span className="mdi mdi-floppy" />
                    Save as file
                </Button>
                <Button
                    key="performJLinkRead"
                    variant="secondary"
                    onClick={performJLinkRead}
                    disabled={
                        isMcuboot || !isJLink || !targetIsReady || isProtected
                    }
                >
                    <span className="mdi mdi-refresh" />
                    Read
                </Button>
            </Group>
            {elf && (
                <Group>
                    <Form.Label htmlFor="resolution">
                        Minimum block size:{' '}
                        {(2 ** resolution).toLocaleString('en')} bytes
                    </Form.Label>
                    <Slider
                        ticks
                        id="resolution"
                        values={[resolution]}
                        range={{ min: 8, max: 16 }} // 2^8 to 2^16, 256 to 65536 Bytes
                        onChange={[value => dispatch(upadateResolution(value))]}
                    />
                </Group>
            )}
        </SidePanel>
    );
};

export default ControlPanel;
