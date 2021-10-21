/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { SerialPort } from '@nordicsemiconductor/nrf-device-lib-js';

/**
 *
 * @param {SerialPort} serialPort
 *
 * @returns {string} the path of serialport
 * appended with the result of each promise.
 */

export default (serialPort: SerialPort): string | null =>
    serialPort?.comName || null;
