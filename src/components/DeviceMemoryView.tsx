/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    isDeviceInDFUBootloader,
    selectedDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { DeviceCore } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import MemoryMap from 'nrf-intel-hex';

import {
    getCoreDefinitions,
    getCoreMemMap,
    getDeviceDefinition,
} from '../reducers/deviceDefinitionReducer';
import { getForceMcuBoot } from '../reducers/settingsReducer';
import {
    getTargetRegions,
    targetRegionsKnown,
} from '../reducers/targetReducer';
import { convertDeviceDefinitionToCoreArray, CoreInfo } from '../util/devices';
import { CoreDefinition, DeviceDefinition } from '../util/deviceTypes';
import { getCoreRegions, Region } from '../util/regions';
import CoreView from './CoreView';

const allocateCores = (cores: CoreInfo[], regions: Region[]) =>
    cores.map(core => ({
        ...core,
        regions: regions.filter(
            r =>
                r.startAddress >= core.coreDefinitions.romBaseAddr &&
                r.startAddress + r.regionSize <=
                    core.coreDefinitions.romBaseAddr +
                        core.coreDefinitions.romSize
        ),
    }));

const convertCoresToViews = (
    deviceDefinition: DeviceDefinition,
    regions: Region[]
) => {
    const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
    return allocateCores(coreInfos, regions)
        .sort(
            (a, b) =>
                b.coreDefinitions.romBaseAddr - a.coreDefinitions.romBaseAddr
        )
        .map(c => ({
            core: c,
            jsxElement: (
                <CoreView
                    coreInfo={c}
                    active={
                        (c.coreOperation &&
                            c.coreOperation !== 'idle' &&
                            c.coreOperation !== 'erasing') ||
                        (!c.coreMemMap && deviceDefinition.deviceBusy)
                    }
                    regions={c.regions}
                    key={c.coreDefinitions.mbrBaseAddr}
                />
            ),
        }));
};

const TextOverlay = ({
    busy,
    coreInfo,
}: {
    busy: boolean;
    coreInfo: CoreInfo;
}) => {
    const device = useSelector(selectedDevice);
    const isJLink = useSelector(getForceMcuBoot) || !!device?.traits.jlink;
    const isNordicDfu = !!device?.traits.nordicDfu;
    const isMcuboot = useSelector(getForceMcuBoot) || !!device?.traits.mcuBoot;
    return (
        <>
            {coreInfo.coreOperation === 'erasing' && (
                <div className="erase-indicator striped active" />
            )}
            {!busy &&
                !coreInfo.coreMemMap &&
                isJLink &&
                !isMcuboot &&
                !isNordicDfu && (
                    <div className="centering-container">
                        {coreInfo.coreProtection ===
                            'NRFDL_PROTECTION_STATUS_NONE' && (
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>
                                    Press <strong>READ</strong> button to read
                                    the memory
                                </p>
                            </div>
                        )}
                        {coreInfo.coreProtection !== undefined &&
                            coreInfo.coreProtection !==
                                'NRFDL_PROTECTION_STATUS_NONE' && (
                                <div className="read-indicator">
                                    <p>{`${coreInfo.name} core is protected`}</p>
                                    <p>
                                        Press <strong>Erase all</strong> button
                                        to recover the protected memory
                                    </p>
                                </div>
                            )}
                        {coreInfo.coreProtection === undefined && (
                            <div className="read-indicator">
                                <p>Core protection status is unknown</p>
                                <p>
                                    Could not determine any information about
                                    the SOC
                                    <br />
                                    Press <strong>Erase all</strong> button to
                                    recover the protected memory
                                </p>
                            </div>
                        )}
                    </div>
                )}

            {isMcuboot && !isJLink && !isNordicDfu && (
                <div className="centering-container">
                    <div className="read-indicator">
                        <p>Device core is connected</p>
                        <p>Memory layout is not available via MCUboot</p>
                    </div>
                </div>
            )}
            {!isMcuboot && !isJLink && !isNordicDfu && (
                <div className="centering-container">
                    <div className="read-indicatorv  tw-break-words tw-text-center">
                        <p>Device is connected</p>
                    </div>
                </div>
            )}
            {device && isNordicDfu && !isDeviceInDFUBootloader(device) && (
                <div className="centering-container">
                    <div className="read-indicator">
                        <p>Device is connected</p>
                        <p>
                            Memory layout is only available in Bootloader mode
                        </p>
                        <p>
                            Write operations are only supported in Bootloader
                            mode
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default () => {
    const dispatch = useDispatch();
    const targetRegions = useSelector(getTargetRegions);
    const deviceDefinition = useSelector(getDeviceDefinition);
    const coreDefinitions = useSelector(getCoreDefinitions);
    const coreMemMaps = useSelector(getCoreMemMap);

    useEffect(() => {
        const regions = Object.keys(coreDefinitions)
            .map(core => {
                const name = core as DeviceCore;
                const coreInfo = coreDefinitions[name] as CoreDefinition;
                const memMap = coreMemMaps[name] as MemoryMap;
                if (memMap) {
                    return getCoreRegions(memMap, name, coreInfo);
                }
                return [];
            })
            .flat();

        dispatch(targetRegionsKnown(regions));
    }, [coreDefinitions, coreMemMaps, dispatch]);

    return (
        <>
            {convertCoresToViews(deviceDefinition, targetRegions).map(
                coreView => (
                    <div
                        key={coreView.core.name}
                        className="core-container"
                        style={{
                            flex: coreView.core.coreDefinitions.romSize,
                        }}
                    >
                        {coreView.jsxElement}

                        {!deviceDefinition.deviceBusy && (
                            <TextOverlay
                                busy={deviceDefinition.deviceBusy}
                                coreInfo={coreView.core}
                            />
                        )}
                    </div>
                )
            )}
        </>
    );
};
