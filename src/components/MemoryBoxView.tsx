/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import Canvas from './Canvas';
import DeviceInfoView from './DeviceInfoView';
import MemoryView from './MemoryView';

interface MemoryBoxViewProps {
    title: string;
    description?: string;
    hasViz?: boolean;
    iconName?: string;
    isHolder?: boolean;
    isTarget?: boolean;
}

const MemoryBoxView = ({
    title,
    description,
    iconName,
    isHolder,
    hasViz,
    isTarget,
}: MemoryBoxViewProps) => {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <Card className="memory-layout">
            <Card.Header
                className="panel-heading"
                onPointerEnter={() => setShowOverlay(true)}
                onPointerLeave={() => setShowOverlay(false)}
            >
                <Card.Title className="panel-title">
                    {title}
                    {isTarget && (
                        <span className="mdi mdi-information-outline target-info" />
                    )}

                    <span className={`glyphicon ${iconName}`} />
                    {hasViz && '.elf'}
                </Card.Title>
            </Card.Header>
            {!hasViz && isTarget && showOverlay && (
                <Popover
                    id="deviceInfo"
                    placement="bottom"
                    onPointerEnter={() => setShowOverlay(true)}
                    onPointerLeave={() => setShowOverlay(false)}
                    content
                >
                    <DeviceInfoView />
                </Popover>
            )}
            {hasViz && (
                <Card.Body
                    className={`panel-body ${isHolder && 'empty'} stacked`}
                >
                    {isHolder && (
                        <div className="memory-layout-container">
                            <Canvas />
                        </div>
                    )}
                    {!isHolder && <MemoryView isTarget={isTarget as boolean} />}
                </Card.Body>
            )}
            {!hasViz && (
                <Card.Body
                    className={`panel-body ${isHolder && 'empty'} stacked`}
                >
                    {isHolder && (
                        <div className="memory-layout-container">
                            <h1>
                                <span className={`glyphicon ${iconName}`} />
                            </h1>
                            <p>{description}</p>
                        </div>
                    )}
                    {!isHolder && <MemoryView isTarget={isTarget as boolean} />}
                </Card.Body>
            )}
        </Card>
    );
};

MemoryBoxView.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    iconName: PropTypes.string,
    isHolder: PropTypes.bool,
    isTarget: PropTypes.bool,
    hasViz: PropTypes.bool,
};

MemoryBoxView.defaultProps = {
    description: null,
    iconName: null,
    isHolder: false,
    isTarget: false,
    hasViz: false,
};

export default MemoryBoxView;
