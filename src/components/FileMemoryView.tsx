/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logger } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { DeviceCore } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';

import { updateTargetWritable } from '../actions/targetActions';
import {
    getCoreDefinitions,
    getDeviceDefinition,
} from '../reducers/deviceDefinitionReducer';
import {
    fileRegionsKnown,
    getFileMemMaps,
    getFileRegions,
    getZipFilePath,
} from '../reducers/fileReducer';
import { fileWarningAdd, fileWarningRemove } from '../reducers/warningReducer';
import { convertDeviceDefinitionToCoreArray, CoreInfo } from '../util/devices';
import { CoreDefinition, DeviceDefinition } from '../util/deviceTypes';
import { generateFileRegions, Region } from '../util/regions';
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
                    active={false}
                    regions={c.regions}
                    key={c.coreDefinitions.mbrBaseAddr}
                />
            ),
        }));
};

export default () => {
    const dispatch = useDispatch();
    const fileRegions = useSelector(getFileRegions);
    const memMaps = useSelector(getFileMemMaps);
    const deviceDefinition = useSelector(getDeviceDefinition);
    const coreDefinitions = useSelector(getCoreDefinitions);
    const zipFilePath = useSelector(getZipFilePath);

    useEffect(() => {
        dispatch(updateTargetWritable());
    }, [dispatch, fileRegions]);

    useEffect(() => {
        dispatch(fileWarningRemove());
        const validFileRegions = Object.keys(coreDefinitions)
            .map(core => {
                const name = core as DeviceCore;
                const coreInfo = coreDefinitions[name] as CoreDefinition;

                logger.info(`Update files regions according to ${name} core`);
                const allRegions = generateFileRegions(memMaps, coreInfo);
                const validRegions = allRegions.filter(
                    r =>
                        r.startAddress >= coreInfo.romBaseAddr &&
                        r.startAddress + r.regionSize <=
                            coreInfo.romBaseAddr + coreInfo.romSize
                );

                if (validRegions.length !== allRegions.length) {
                    dispatch(
                        fileWarningAdd(
                            'Part of the HEX regions are out of the device memory size, ' +
                                'but you can still proceed write operation'
                        )
                    );
                }

                return allRegions.filter(
                    r =>
                        r.startAddress >= coreInfo.romBaseAddr &&
                        r.startAddress + r.regionSize <=
                            coreInfo.romBaseAddr + coreInfo.romSize
                );
            })
            .flat();

        // Show file warning if overlapping.
        if (validFileRegions.find(r => r.fileNames && r.fileNames.length > 1)) {
            dispatch(
                fileWarningAdd('Some of the HEX files have overlapping data.')
            );
        }

        dispatch(fileRegionsKnown(validFileRegions));
    }, [coreDefinitions, dispatch, memMaps]);

    return (
        <>
            {convertCoresToViews(deviceDefinition, fileRegions).map(
                coreView => (
                    <div
                        key={coreView.core.name}
                        className="core-container"
                        style={{
                            flex: coreView.core.coreDefinitions.romSize,
                        }}
                    >
                        {coreView.jsxElement}
                        {zipFilePath && (
                            <div className="centering-container">
                                <div className="read-indicator">
                                    <p>ZIP file is selected</p>
                                    <p>{zipFilePath}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )
            )}
        </>
    );
};
