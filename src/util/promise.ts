/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/**
 * Run promises in sequence and return the result in an array.
 *
 * @param {Function} fun Function that returns a promise
 * @param {Array} results Initial array that will hold the results
 * @param {Array} argsArray First arguments in array
 *
 * @returns {Promise} Promise resolved to the initial results array
 * appended with the result of each promise
 */
const sequence = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fun: (...args: any) => Promise<unknown>,
    // eslint-disable-next-line default-param-last
    results: Array<unknown> = [],
    argsArray: Array<Array<unknown>>
): Promise<unknown> => {
    const [first, ...rest] = argsArray;
    return first
        ? fun(...first).then(result =>
              sequence(fun, [...results, result], rest)
          )
        : Promise.resolve(results);
};

export default sequence;
