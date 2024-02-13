/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { DeviceCore } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device';

import { hexpad8 } from '../util/hexpad';

const hexpad9 = (x: number) => hexpad8(x || '');

interface CoreInfoViewProps {
    name: DeviceCore;
    romBaseAddr: number;
    romSize: number;
}

const CoreInfoView = ({ name, romBaseAddr, romSize }: CoreInfoViewProps) => (
    <>
        {name && (
            <div>
                <h5>Core name</h5>
                <p>{name}</p>
            </div>
        )}
        <div>
            <h5>Address range</h5>
            <p>
                {hexpad9(romBaseAddr)} &mdash; {hexpad9(romBaseAddr + romSize)}
            </p>
        </div>
        <div>
            <h5>Size</h5>
            <p>{romSize} bytes</p>
        </div>
    </>
);

export default CoreInfoView;
