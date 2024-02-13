/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */
import {
    DeviceCore,
    ProtectionStatus,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device';
import MemoryMap from 'nrf-intel-hex';

export type CoreState = 'loading' | 'writing' | 'reading' | 'erasing' | 'idle';
export type CoreDefinitions = { [key in DeviceCore]?: CoreDefinition };
export type CoreProtection = { [key in DeviceCore]?: ProtectionStatus };
export type CoreMemMap = { [key in DeviceCore]?: MemoryMap };
export type CoreOperations = {
    [key in DeviceCore]?: CoreState;
};

export type CoreDefinition = {
    romBaseAddr: number;
    romSize: number;
    ramSize: number;
    pageSize: number;
    blockSize: number;
    ficrBaseAddr: number;
    ficrSize: number;
    uicrBaseAddr: number;
    uicrSize: number;
    blAddrOffset: number;
    mbrParamsOffset: number;
    mbrBaseAddr: number;
    mbrSize: number;
};

/**
 * Supported Nordic device families
 */
export enum DeviceFamily {
    NRF51 = 'NRF51_FAMILY',
    NRF52 = 'NRF52_FAMILY',
    NRF53 = 'NRF53_FAMILY',
    NRF91 = 'NRF91_FAMILY',
    UNKNOWN = 'UNKNOWN_FAMILY',
}

export interface DeviceDefinition<T = CoreDefinitions> {
    family: DeviceFamily;
    type: string;
    coreDefinitions: T;
    coreProtection: CoreProtection;
    coreMemMap: CoreMemMap;
    coreOperation: CoreOperations;
    deviceBusy: boolean;
}
