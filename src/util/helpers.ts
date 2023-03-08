/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export const timerTimeToSeconds = (
    seconds: number,
    minutes: number,
    hours: number,
    days: number
) => days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
