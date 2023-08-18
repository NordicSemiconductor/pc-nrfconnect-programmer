/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';

import { CoreInfo } from '../util/devices';
import { Region } from '../util/regions';
import RegionView from './RegionView';

interface CoreViewProps {
    coreInfo: CoreInfo;
    active: boolean;
    regions?: Region[];
}

export default ({ coreInfo, active, regions = [] }: CoreViewProps) => {
    const regionViews = [];
    if (regions.length === 0) {
        return (
            <RegionView key={0} coreInfo={coreInfo} width={1} active={active} />
        );
    }

    // Sort the regions by start address and generate a view for it, also
    // generate a gap view between regions
    const { romSize, romBaseAddr } = coreInfo.coreDefinitions;
    let lastAddress = romBaseAddr;
    regions
        .sort((a, b) => a.startAddress - b.startAddress)
        .forEach(region => {
            const { startAddress, regionSize } = region;

            // Generate the region view only if it is inside the ROM
            if (startAddress < romBaseAddr + romSize) {
                // Start to generate views from the base address
                if (lastAddress === romBaseAddr) {
                    // Generate a region view if the region starts with the base address
                    if (startAddress === romBaseAddr) {
                        regionViews.push(
                            <RegionView
                                key={startAddress}
                                region={region}
                                hoverable
                                active={active}
                                width={regionSize}
                            />
                        );
                    }

                    // Generate a gap view if the region does not start with the base address
                    else if (startAddress > romBaseAddr) {
                        regionViews.push(
                            <RegionView
                                key={lastAddress}
                                coreInfo={coreInfo}
                                width={startAddress}
                            />
                        );
                        regionViews.push(
                            <RegionView
                                key={startAddress}
                                region={region}
                                hoverable
                                active={active}
                                width={regionSize}
                            />
                        );
                    }

                    // Update lastAddress
                    lastAddress = startAddress + regionSize - 1;
                } else {
                    regionViews.push(
                        <RegionView
                            key={lastAddress}
                            coreInfo={coreInfo}
                            width={startAddress - lastAddress}
                        />
                    );

                    regionViews.push(
                        <RegionView
                            key={startAddress}
                            region={region}
                            hoverable
                            active={active}
                            width={regionSize}
                        />
                    );

                    // Update lastAddress
                    lastAddress = startAddress + regionSize - 1;
                }
            }
        });
    regionViews.push(
        <RegionView
            key={lastAddress}
            coreInfo={coreInfo}
            width={romBaseAddr + romSize - lastAddress}
        />
    );

    // eslint-disable-next-line react/jsx-no-useless-fragment -- RegionViews is an array and requires a fragment
    return <>{regionViews}</>;
};
