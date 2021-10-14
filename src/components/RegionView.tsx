/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import * as fileActions from '../actions/fileActions';
import { CoreDefinition } from '../util/devices';
import { Region } from '../util/regions';
import CoreInfoView from './CoreInfoView';
import RegionInfoView from './RegionInfoView';

interface RegionViewProps {
    width: number;
    active?: boolean;
    striped?: boolean;
    hoverable?: boolean;
    region: Region;
    core: CoreDefinition;
}

const RegionView = ({
    width,
    active,
    striped,
    hoverable,
    region,
    core,
}: RegionViewProps) => {
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState<HTMLElement>();
    const ref = useRef(null);

    const dispatch = useDispatch();
    const removeFile = (filePath: string) =>
        dispatch(fileActions.removeFile(filePath));

    const toggleShow = (event: React.PointerEvent<HTMLElement>) => {
        setShow(!show);
        setTarget(event.target as HTMLElement);
    };

    const color = region ? region.color : '#d9e1e2';
    const fileNames = region ? region.fileNames : [];

    let className = 'region centering-container';
    className = striped ? `${className} striped` : className;
    className = active ? `${className} active striped` : className;
    className = hoverable ? `${className} hoverable` : className;
    className = fileNames.length > 1 ? `${className} crosses` : className;

    const containerNode = document.getElementsByClassName(
        'core-main-layout'
    )[0] as HTMLElement;

    return (
        <div
            ref={ref}
            onPointerEnter={toggleShow}
            onPointerLeave={toggleShow}
            className={className}
            style={{
                flexGrow: width,
                backgroundColor: color,
            }}
        >
            <Overlay
                trigger={['focus', 'hover']}
                placement="right"
                // @ts-ignore -- Don't care about this for now
                target={target}
                container={containerNode}
                show={show}
                rootClose
                onHide={() => setShow(false)}
                transition={false}
            >
                <Popover id="popover-region" className="memory-details" content>
                    {region && (
                        <RegionInfoView
                            name={region.name}
                            startAddress={region.startAddress}
                            regionSize={region.regionSize}
                            fileNames={region.fileNames}
                        />
                    )}
                    {core && (
                        <CoreInfoView
                            name={core.name}
                            romBaseAddr={core.romBaseAddr}
                            romSize={core.romSize}
                        />
                    )}
                </Popover>
            </Overlay>
            {region && region.fileNames.length > 0 && !active && (
                <Button
                    className="transparent"
                    onClick={() => removeFile(region.fileNames[0])}
                >
                    <span className="mdi mdi-minus-circle" />
                </Button>
            )}
        </div>
    );
};

RegionView.propTypes = {
    width: PropTypes.number.isRequired,
    active: PropTypes.bool,
    striped: PropTypes.bool,
    hoverable: PropTypes.bool,
    region: PropTypes.instanceOf(Object),
    core: PropTypes.instanceOf(Object),
};

RegionView.defaultProps = {
    active: false,
    striped: false,
    hoverable: false,
    region: null,
    core: null,
};

export default RegionView;
