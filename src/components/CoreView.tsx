/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import PropTypes from 'prop-types';

import { CoreDefinition } from '../util/devices';
import { Region } from '../util/regions';
import RegionView from './RegionView';

interface CoreWithRegions extends CoreDefinition {
    regions: Region[];
}

interface CoreViewProps {
    core: CoreWithRegions;
    active: boolean;
}

const CoreView = ({ core, active }: CoreViewProps) => {
    const { regions, romSize, romBaseAddr } = core;
    const regionViews = [];
    if (!regions || regions.length <= 0) {
        return <RegionView key={0} core={core} width={1} active={active} />;
    }

    // Sort the regions by start address and generate a view for it, also
    // generate a gap view between regions
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
                    if (startAddress > romBaseAddr) {
                        regionViews.push(
                            <RegionView
                                key={lastAddress}
                                core={core}
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
                            core={core}
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
            core={core}
            width={romBaseAddr + romSize - lastAddress}
        />
    );

    return <>{regionViews}</>;
};

CoreView.propTypes = {
    core: PropTypes.shape({}).isRequired,
    active: PropTypes.bool.isRequired,
};

CoreView.defaultProps = {};

export default CoreView;
