/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

interface ImeiAllocationResource {
    createdAt: string;
    id: string;
    imeis: string;
    product: 'nRF9131' | 'nRF9151' | 'nRF9161';
    scope: 'DEVELOPMENT' | 'PRODUCTION';
}

export default async (
    product: 'nRF9131' | 'nRF9151' | 'nRF9161',
    scope: 'DEVELOPMENT' | 'PRODUCTION',
    apiKey: string
) => {
    const response = await fetch(
        'https://api.imei.nrfcloud.com/v1/imei-management/allocations',
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ scope, product, count: 1 }),
        }
    );

    if (response.status !== 200) {
        throw new Error(
            `Error fetching IMEI: ${response.status}.${
                response.statusText ? `statusText: ${response.statusText}` : ''
            }. Make sure the API key is valid.`
        );
    }

    const imei = ((await response.json()) as ImeiAllocationResource).imeis[0];
    return imei;
};
