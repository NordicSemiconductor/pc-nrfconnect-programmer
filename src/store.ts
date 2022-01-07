/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getPersistentStore } from 'pc-nrfconnect-shared';

interface StoreSchema {
    settings: { autoRead: boolean };
    mruFiles: string[];
}

interface Settings {
    autoRead: boolean;
}

const { set, get } = getPersistentStore<StoreSchema>();

export const setSettings = (settings: Settings) => {
    set('settings', settings);
};

export const getSettings = () => get('settings');

export const getMruFiles = () => get('mruFiles') ?? [];
export const setMruFiles = (files: string[]) => set('mruFiles', files);
