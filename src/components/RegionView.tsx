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
import { colors } from 'pc-nrfconnect-shared';

import * as fileActions from '../actions/fileActions';
import { CoreInfo } from '../util/devices';
import { Region } from '../util/regions';
import CoreInfoView from './CoreInfoView';
import RegionInfoView from './RegionInfoView';

interface RegionViewProps {
    width: number;
    active?: boolean;
    striped?: boolean;
    hoverable?: boolean;
    region?: Region;
    coreInfo?: CoreInfo;
}

const RegionView = ({
    width,
    active,
    striped,
    hoverable,
    region,
    coreInfo,
}: RegionViewProps) => {
    const [show, setShow] = useState(false);
    const [target, setTarget] = useState<HTMLElement>();
    const ref = useRef(null);

    const dispatch = useDispatch();
    const removeFile = (filePath: string) =>
        dispatch(fileActions.removeFile(filePath));

    const toggleShow = (event: React.PointerEvent<HTMLElement>) => {
        setShow(event.type === 'pointerenter');
        setTarget(event.target as HTMLElement);
    };

    const color = region ? region.color : colors.gray100;
    const fileNames = region ? region.fileNames : [];

    let className = 'region';
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
                placement="left"
                // @ts-expect-error -- Don't care about this for now
                target={target}
                container={containerNode}
                show={show}
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
                    {coreInfo && (
                        <CoreInfoView
                            name={coreInfo.name}
                            romBaseAddr={coreInfo.coreDefinitions.romBaseAddr}
                            romSize={coreInfo.coreDefinitions.romSize}
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
export default RegionView;
