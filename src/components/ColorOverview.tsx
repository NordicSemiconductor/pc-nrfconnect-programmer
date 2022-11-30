/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import { Group } from 'pc-nrfconnect-shared';

import { colors } from './Colors';

const ColorOverview = () => (
    <Group heading="Colors">
        {Object.keys(colors).map(mem => (
            <div key={mem}>
                <div
                    style={{
                        backgroundColor: colors[mem],
                        border: '1px solid black',
                        height: '15px',
                        width: '15px',
                        float: 'left',
                        marginRight: '10px',
                    }}
                />
                <p>{mem}</p>
            </div>
        ))}
    </Group>
);

export default ColorOverview;
