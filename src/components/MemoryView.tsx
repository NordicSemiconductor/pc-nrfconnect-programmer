/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import PropTypes from 'prop-types';

import { getIsMcuboot } from '../reducers/mcubootReducer';
import {
    getDeviceInfo,
    getIsErasing,
    getIsLoading,
    getIsWriting,
    getRefreshEnabled,
} from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import { CoreDefinition } from '../util/devices';
import { Region } from '../util/regions';
import CoreView from './CoreView';

const allocateCores = (cores: CoreDefinition[], regions: Region[]) =>
    cores.map(core => ({
        ...core,
        regions: regions.filter(
            r =>
                r.startAddress >= core.romBaseAddr &&
                r.startAddress + r.regionSize <= core.romBaseAddr + core.romSize
        ),
    }));

const convertCoresToViews = (
    targetCores: CoreDefinition[],
    regions: Region[],
    active: boolean
) =>
    allocateCores(targetCores, regions)
        .sort((a, b) => b.romBaseAddr - a.romBaseAddr)
        .map(c => <CoreView core={c} active={active} key={c.mbrBaseAddr} />);

interface MemoryViewProps {
    isTarget: boolean;
}

const MemoryView = ({ isTarget }: MemoryViewProps) => {
    const regions = useSelector((state: RootState) =>
        isTarget ? state.app.target.regions : state.app.file.regions
    );
    const isMcuboot = useSelector(getIsMcuboot);
    const isWriting = useSelector(getIsWriting);
    const isErasing = useSelector(getIsErasing);
    const isLoading = useSelector(getIsLoading);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== nrfdl.NRFDL_PROTECTION_STATUS_NONE
    );
    const refreshEnabled = useSelector(getRefreshEnabled);
    const targetCores = useSelector(getDeviceInfo)?.cores as CoreDefinition[];

    const placeHolder =
        isTarget && isLoading ? (
            // When it is target and during loading, show something.
            <CoreView width={1} striped active core={targetCores[0]} />
        ) : (
            // When it is target and during writing, show file regions active.
            // : convertRegionsToViews(regions, targetSize, isTarget && isWriting, targetFicrBaseAddr);
            convertCoresToViews(targetCores, regions, isTarget && isWriting)
        );
    return placeHolder.map((coreView, index) => (
        <React.Fragment key={index.toString()}>
            <div
                className="core-container"
                style={{
                    flex: coreView.props.core.romSize,
                }}
            >
                {coreView}
                {isTarget && isErasing && (
                    <div className="erase-indicator striped active" />
                )}
                {isTarget && refreshEnabled && (
                    <div className="centering-container">
                        {!isProtected && (
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>
                                    Press <strong>READ</strong> button to read
                                    the memory
                                </p>
                            </div>
                        )}
                        {isProtected && (
                            <div className="read-indicator">
                                <p>Device is protected</p>
                                <p>
                                    Press <strong>Erase all</strong> button to
                                    recover the protected memory
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {isTarget && isMcuboot && (
                    <div className="centering-container">
                        <div className="read-indicator">
                            <p>Device is connected</p>
                            <p>Memory layout is not available via MCUboot</p>
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    ));
};

MemoryView.propTypes = {
    isTarget: PropTypes.bool.isRequired,
};

export default MemoryView;
