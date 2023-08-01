/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { basename } from 'path';

import { hexpad8 } from '../util/hexpad';

interface RegionInfoViewProps {
    name?: string;
    startAddress: number;
    regionSize: number;
    fileNames: string[];
}

const RegionInfoView = ({
    name,
    startAddress,
    regionSize,
    fileNames,
}: RegionInfoViewProps) => (
    <>
        {name && (
            <div>
                <h5>Region name</h5>
                <p>{name}</p>
            </div>
        )}
        {fileNames.length > 0 && (
            <div className="files">
                <h5>
                    {fileNames.length > 1 ? 'Overlapping files!' : 'File name'}
                </h5>
                <p>
                    {fileNames.map((fileName, index) => (
                        <span key={`${index + 1}`}>{basename(fileName)}</span>
                    ))}
                </p>
            </div>
        )}
        <div>
            <h5>Address range</h5>
            <p>
                {hexpad8(startAddress)} &mdash;{' '}
                {hexpad8(startAddress + regionSize - 1)}
            </p>
        </div>
        <div>
            <h5>Size</h5>
            <p>{regionSize} bytes</p>
        </div>
    </>
);

export default RegionInfoView;
