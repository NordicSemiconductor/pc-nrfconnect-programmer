/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectedDevice } from 'pc-nrfconnect-shared';
import PropTypes from 'prop-types';

import { getZipFilePath } from '../reducers/fileReducer';
import { getForceMcuBoot } from '../reducers/settingsReducer';
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
    const device = useSelector(selectedDevice);
    const regions = useSelector((state: RootState) =>
        isTarget ? state.app.target.regions : state.app.file.regions
    );
    const zipFilePath = useSelector(getZipFilePath);
    const isJLink = useSelector(getForceMcuBoot) || !!device?.traits.jlink;
    const isNordicDfu =
        useSelector(getForceMcuBoot) || !!device?.traits.nordicDfu;
    const isMcuboot = useSelector(getForceMcuBoot) || !!device?.traits.mcuBoot;
    const isWriting = useSelector(getIsWriting);
    const isErasing = useSelector(getIsErasing);
    const isLoading = useSelector(getIsLoading);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
    );
    const refreshEnabled = useSelector(getRefreshEnabled);
    const targetCores = useSelector(getDeviceInfo)?.cores as CoreDefinition[];

    const placeHolder =
        isTarget && isLoading
            ? // When it is target and during loading, show something.
              [<CoreView key="placeholder" active core={targetCores[0]} />]
            : // When it is target and during writing, show file regions active.
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              convertCoresToViews(targetCores, regions!, isTarget && isWriting);

    return (
        <>
            {placeHolder.map(coreView => (
                <div
                    key={coreView.props.core.mbrBaseAddr}
                    className="core-container"
                    style={{
                        flex: coreView.props.core.romSize,
                    }}
                >
                    {coreView}
                    {isTarget && isErasing && (
                        <div className="erase-indicator striped active" />
                    )}
                    {isTarget && refreshEnabled && isJLink && !isMcuboot && (
                        <div className="centering-container">
                            {!isProtected && (
                                <div className="read-indicator">
                                    <p>Device is connected</p>
                                    <p>
                                        Press <strong>READ</strong> button to
                                        read the memory
                                    </p>
                                </div>
                            )}
                            {isProtected && (
                                <div className="read-indicator">
                                    <p>Device is protected</p>
                                    <p>
                                        Press <strong>Erase all</strong> button
                                        to recover the protected memory
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {isTarget && isMcuboot && (
                        <div className="centering-container">
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>
                                    Memory layout is not available via MCUboot
                                </p>
                            </div>
                        </div>
                    )}
                    {isTarget && !isMcuboot && !isJLink && !isNordicDfu && (
                        <div className="centering-container">
                            <div className="read-indicatorv  tw-break-words tw-text-center">
                                <p>Device is connected</p>
                            </div>
                        </div>
                    )}
                    {!isTarget && zipFilePath && (
                        <div className="centering-container">
                            <div className="read-indicator">
                                <p>ZIP file is selected</p>
                                <p>{zipFilePath}</p>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </>
    );
};

MemoryView.propTypes = {
    isTarget: PropTypes.bool.isRequired,
};

export default MemoryView;
