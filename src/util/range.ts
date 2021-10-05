/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/**
 * Create an array of numbers from start and up to (and including) end.
 *
 * @param {number} start Start of range.
 * @param {number} end End of range.
 *
 * @returns {Array} Range of numbers.
 */
export default (start: number, end: number): Array<number> =>
    Array.from({ length: end + 1 - start }, (_, i) => i + start);
