/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import range from '../range';

describe('range', () => {
    it('returns one item if start = end', () => {
        expect(range(1, 1)).toEqual([1]);
    });

    it('returns empty array if end < start', () => {
        expect(range(1, 0)).toEqual([]);
    });

    it('returns array with range if start > end', () => {
        expect(range(10, 15)).toEqual([10, 11, 12, 13, 14, 15]);
    });
});
