/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/**
 * Prefer to use the serialport 8 property or fall back to the serialport 7 property.
 *
 * @param {any} serialPort serialport v8/v7
 *
 * @returns {string} the path of serialport
 * appended with the result of each promise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (serialPort: any): string =>
    serialPort ? serialPort.comName : undefined;
