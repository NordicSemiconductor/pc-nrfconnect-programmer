/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';

import { hexpad8 } from '../util/hexpad';

import '../../resources/css/section-info-view.scss';

interface SectionInfoViewProps {
    name: string;
    type: string;
    startAddress: number;
    sectionSize: number;
    flags: object;
}

const SectionInfoView = ({
    name,
    type,
    startAddress,
    sectionSize,
    flags,
}: SectionInfoViewProps) => (
    <div className="section-info-view">
        {name && (
            <div className="fields">
                <h6>Section name</h6>
                <p>{name}</p>
            </div>
        )}
        <div className="fields">
            <h6>Type</h6>
            <p>{type}</p>
        </div>
        <div className="fields">
            <h6>Address{sectionSize !== 0 && ' range'}</h6>
            <p>
                {hexpad8(startAddress)}
                {sectionSize !== 0 &&
                    ` -- ${hexpad8(startAddress + sectionSize - 1)}`}
            </p>
        </div>
        <div className="fields">
            <h6>Size</h6>
            <p>{sectionSize} bytes</p>
        </div>
        {Object.keys(flags).length > 0 && (
            <div className="fields">
                <h6>Flags</h6>
                <p>{Object.keys(flags).join(', ')}</p>
            </div>
        )}
    </div>
);

export default SectionInfoView;
