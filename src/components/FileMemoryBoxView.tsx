/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import { useDispatch, useSelector } from 'react-redux';

import { getLoaded, getZipFilePath } from '../reducers/fileReducer';
import { fileWarningRemove } from '../reducers/warningReducer';
import FileMemoryView from './FileMemoryView';

const hasFileContent = (loaded: Record<string, unknown>) =>
    Object.keys(loaded).length > 0;

export default () => {
    const title = 'File memory layout';
    const description = 'Drag & drop HEX/ZIP files here';
    const iconName = 'mdi mdi-folder-open';
    const loaded = useSelector(getLoaded);
    const zipFilePath = useSelector(getZipFilePath);
    const isHolder = !hasFileContent(loaded) && !zipFilePath;
    const dispatch = useDispatch();

    useEffect(() => {
        if (isHolder) dispatch(fileWarningRemove());
    }, [isHolder, dispatch]);

    return (
        <Card className="memory-layout">
            <Card.Header className="panel-heading">
                <Card.Title className="panel-title">
                    {title}
                    <span className={`glyphicon ${iconName}`} />
                </Card.Title>
            </Card.Header>
            <Card.Body className={`panel-body ${isHolder && 'empty'} stacked`}>
                {isHolder && (
                    <div className="memory-layout-container">
                        <h1>
                            <span className={`glyphicon ${iconName}`} />
                        </h1>
                        <p>{description}</p>
                    </div>
                )}
                {!isHolder && <FileMemoryView />}
            </Card.Body>
        </Card>
    );
};
