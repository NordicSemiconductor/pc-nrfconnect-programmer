/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/**
 * Takes in an integer, returns a string
 * representing that integer as a string of 8 hexadecimal
 * numbers prepended by '0x'.
 *
 * @param {number} n the number to be operated
 *
 * @returns {string} padded string
 */
export const hexpad8 = (n: number | string): string =>
    `0x${n.toString(16).toUpperCase().padStart(8, '0')}`;

/**
 * Takes in an integer, returns a string
 * representing that integer as a string of 2 hexadecimal
 * numbers prepended by '0x'.
 *
 * @param {number} n the number to be operated
 *
 * @returns {string} padded string
 */
export const hexpad2 = (n: number): string =>
    `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
