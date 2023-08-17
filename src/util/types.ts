/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
