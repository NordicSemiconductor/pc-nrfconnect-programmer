/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    DropdownItem,
    NumberDropdownItem,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

export const getSelectedDropdownItem = (
    itemList: DropdownItem[],
    value: unknown,
    notFound?: DropdownItem
) => {
    if (typeof value === 'boolean') value = value ? 'on' : 'off';

    if (value === undefined) return notFound ?? itemList[0];

    const result = itemList[itemList.findIndex(e => e.value === `${value}`)];

    return result === undefined ? notFound ?? itemList[0] : result;
};

export const convertToDropDownItems: <T>(
    data: T[],
    addAuto?: boolean
) => DropdownItem[] = (data, addAuto = true) => {
    const mappedData = data.map(v => ({
        label: `${v}`,
        value: `${v}`,
    }));

    return addAuto
        ? [{ label: 'Default', value: 'undefined' }, ...mappedData]
        : mappedData;
};

export const convertToNumberDropDownItems: (
    data: number[]
) => NumberDropdownItem[] = data =>
    data.map(v => ({
        label: `${v}`,
        value: v,
    }));
