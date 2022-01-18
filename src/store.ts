/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getPersistentStore } from 'pc-nrfconnect-shared';

interface StoreSchema {
    settings: Settings;
    mruFiles: string[];
}

interface Settings {
    autoRead: boolean;
    autoReset: boolean;
}

const store = getPersistentStore<StoreSchema>();
const set = store.set.bind(store);
const get = store.get.bind(store);

export const setSettings = (settings: Settings) => {
    set('settings', settings);
};

export const getSettings = () => get('settings');

export const getMruFiles = () => get('mruFiles') ?? [];
export const setMruFiles = (files: string[]) => set('mruFiles', files);
