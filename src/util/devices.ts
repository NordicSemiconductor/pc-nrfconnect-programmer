/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    DeviceCore,
    DeviceCoreInfo,
    DeviceInfo,
    NrfutilDevice,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import MemoryMap from 'nrf-intel-hex';

import {
    CoreDefinition,
    CoreDefinitions,
    DeviceDefinition,
    DeviceFamily,
} from './deviceTypes';

/**
 * Default definition of device core
 */
export const defaultCore: CoreDefinition = {
    romBaseAddr: 0x0,
    romSize: 0x100000, // 1 MB
    ramSize: 0x0,
    pageSize: 0x1000, // 4 KB
    blockSize: 0x200, // 0.5 KB
    ficrBaseAddr: 0x10000000,
    ficrSize: 0x400, // Todo: check and make sure!
    uicrBaseAddr: 0x10001000,
    uicrSize: 0x400, // Todo: check and make sure!
    blAddrOffset: 0x14,
    mbrParamsOffset: 0x18,
    mbrBaseAddr: 0x0,
    mbrSize: 0x1000,
};

/**
 * Default definition for device info
 */
export const defaultDeviceDefinition: DeviceDefinition<
    Required<Pick<CoreDefinitions, 'Application'>>
> = {
    family: DeviceFamily.UNKNOWN,
    type: 'UNKNOWN',
    coreDefinitions: {
        Application: defaultCore,
    },
    coreProtection: {},
    coreMemMap: {},
    coreOperation: {},
    deviceBusy: false,
};

// nRF52840 dongle cannot fetch info by nrfutil device-lib
export const nRF51822DefaultDevice: DeviceDefinition<
    Required<Pick<CoreDefinitions, 'Application'>>
> = {
    ...defaultDeviceDefinition,
    family: DeviceFamily.NRF51,
    type: 'nRF51822',
};

// nRF52840 dongle cannot fetch info by nrfutil device-lib
export const nRF52840DefaultDevice: DeviceDefinition<
    Required<Pick<CoreDefinitions, 'Application'>>
> = {
    ...defaultDeviceDefinition,
    family: DeviceFamily.NRF52,
    type: 'nRF52840',
    coreDefinitions: {
        Application: {
            ...defaultCore,
            romSize: 0x100000, // 1 Mb
            ramSize: 0x40000, // 256 Kb
            pageSize: 0x1000, // 4Kb
        },
    },
};

// nRF9160 has different ficr and uicr base address
export const nRF9160DefaultDevice: DeviceDefinition<
    Required<Pick<CoreDefinitions, 'Application'>>
> = {
    ...defaultDeviceDefinition,
    family: DeviceFamily.NRF91,
    type: 'nRF9160',
    coreDefinitions: {
        Application: {
            ...defaultCore,
            ficrBaseAddr: 0xff0000,
            uicrBaseAddr: 0xff8000,
        },
    },
};

// nRF5340 has dual core definitions
export const nRF5340DefaultDevice: DeviceDefinition<
    Required<Pick<CoreDefinitions, 'Application' | 'Network'>>
> = {
    ...defaultDeviceDefinition,
    family: DeviceFamily.NRF53,
    type: 'nRF5340',
    coreDefinitions: {
        Application: {
            ...defaultCore,
            romBaseAddr: 0x0,
            romSize: 0x100000, // 1 MB
            ficrBaseAddr: 0xff0000,
            uicrBaseAddr: 0xff8000,
        },
        Network: {
            ...defaultCore,
            romBaseAddr: 0x1000000,
            romSize: 0x40000, // 256 KB
            ficrBaseAddr: 0x1ff0000,
            uicrBaseAddr: 0x1ff8000,
        },
    },
};

/**
 * Some information cannot be fetch by nrfutil device-lib
 * Define the default values here
 */
export const deviceDefinitions: DeviceDefinition[] = [
    nRF51822DefaultDevice,
    nRF52840DefaultDevice,
    nRF9160DefaultDevice,
    nRF5340DefaultDevice,
];

/**
 * Nordic SoftDevice Id referring to pc-nrfutil
 */
export const NordicFwIds = {
    '0xA7': 's112_nrf51_6.0.0',
    '0x67': 's130_nrf51_1.0.0',
    '0x80': 's130_nrf51_2.0.0',
    '0x87': 's130_nrf51_2.0.1',
    '0x81': 's132_nrf52_2.0.0',
    '0x88': 's132_nrf52_2.0.1',
    '0x8C': 's132_nrf52_3.0.0',
    '0x91': 's132_nrf52_3.1.0',
    '0x95': 's132_nrf52_4.0.0',
    '0x98': 's132_nrf52_4.0.2',
    '0x99': 's132_nrf52_4.0.3',
    '0x9E': 's132_nrf52_4.0.4',
    '0x9F': 's132_nrf52_4.0.5',
    '0x9D': 's132_nrf52_5.0.0',
    '0xA5': 's132_nrf52_5.1.0',
    '0xA8': 's132_nrf52_6.0.0',
    '0xAF': 's132_nrf52_6.1.0',
    '0xA9': 's140_nrf52_6.0.0',
    '0xAE': 's140_nrf52_6.1.0',
    '0x103': 's112_nrf52_7.2.0',
    '0x101': 's132_nrf52_7.2.0',
    '0x100': 's140_nrf52_7.2.0',
};

/**
 * Supported USB vender IDs
 */
export enum VendorId {
    SEGGER = 0x1366,
    NORDIC_SEMICONDUCTOR = 0x1915,
}

/**
 * Supported USB serial DFU product IDs
 */
export const USBProductIds = [0x521f, 0xc00a, 0xcafe];

/**
 * Supported USB MCUboot product IDs
 */
export const McubootProductIds = [
    // Thingy91
    0x520f, 0x9100,
    // Thingy53
    0x530c,
    // nPM1300
    0x53ab,
    // nPM1300-Serial-Recovery
    0x53ac,
];

/**
 * Supported USB modem product IDs
 */
export const ModemProductIds = [
    // Thingy91
    0x520f, 0x9100,
];

export const getDeviceDefinition = (type: string): DeviceDefinition => {
    const predefined = deviceDefinitions.find((device: DeviceDefinition) =>
        device?.type?.toLowerCase().includes(type.toLowerCase())
    );
    return {
        ...(predefined ?? defaultDeviceDefinition),
        type,
    };
};

const getDeviceDefinitionByFamily = (
    family: DeviceFamily
): DeviceDefinition => {
    const predefined = deviceDefinitions.find(
        device => device.family === family
    );

    return (
        predefined ?? {
            ...defaultDeviceDefinition,
            family,
        }
    );
};

const getProductId = (device: NrfutilDevice) => {
    if (!device.serialPorts) return 0;

    return parseInt(
        device.serialPorts.reduce(
            (m, p) => (p.vendorId === '1915' ? p.productId : '') || m,
            ''
        ),
        16
    );
};

const identifyUsbByVersion = (deviceInfo?: DeviceInfo) => {
    if (!deviceInfo?.hwInfo || deviceInfo?.hwInfo.deviceVersion?.length === 0)
        return null;

    return getDeviceDefinition(
        deviceInfo?.hwInfo.deviceVersion.slice(0, 8) // example 'NRF52840_AAD0'
    );
};

const identifyUsbBySerialPort = (device: NrfutilDevice) => {
    const productId = getProductId(device);

    // nRF52
    if (USBProductIds.some(id => id === productId)) {
        return deviceDefinitions.find(d => d.family === DeviceFamily.NRF52);
    }

    // nRF91
    if (ModemProductIds.some(id => id === productId)) {
        return deviceDefinitions.find(d => d.family === DeviceFamily.NRF91);
    }

    return null;
};

// Get device info by calling version command
export const getDeviceInfoByUSB = (
    device: NrfutilDevice,
    deviceInfo?: DeviceInfo
) =>
    identifyUsbByVersion(deviceInfo) ||
    identifyUsbBySerialPort(device) ||
    defaultDeviceDefinition;

// Get default device info from jLink family
export const getDefaultDeviceInfoByJlinkFamily = (
    deviceInfo?: DeviceInfo
): DeviceDefinition => {
    const type = deviceInfo?.jlink?.deviceVersion ?? DeviceFamily.UNKNOWN;
    const family = deviceInfo?.jlink
        ? (deviceInfo.jlink?.deviceFamily as DeviceFamily)
        : DeviceFamily.UNKNOWN;

    return {
        ...getDeviceDefinitionByFamily(family),
        type,
        family,
    };
};

/**
 * Add core info to device info (jLink)
 *
 * @param {DeviceDefinition} existingDefinition - existing device info
 * @param {DeviceCoreInfo} inputCoreInfo - core info to be added
 *
 * @returns {DeviceDefinition} the updated device info
 */

export const mergeNrfutilDeviceInfoInCoreDefinition = (
    existingDefinition: CoreDefinition,
    inputCoreInfo: DeviceCoreInfo
): CoreDefinition => ({
    ...existingDefinition,
    ramSize: inputCoreInfo.ramSize,
    romBaseAddr: inputCoreInfo.codeAddress,
    romSize: inputCoreInfo.codeSize,
    pageSize: inputCoreInfo.codePageSize,
    uicrBaseAddr: inputCoreInfo.uicrAddress,
    uicrSize: inputCoreInfo.codePageSize,
});

export const generateMergedMemMap = (deviceDefinition: DeviceDefinition) => {
    const coreMemMaps = convertDeviceDefinitionToCoreArray(
        deviceDefinition
    ).map(deviceInfo => deviceInfo.coreMemMap ?? new MemoryMap([]));

    return MemoryMap.flattenOverlaps(
        MemoryMap.overlapMemoryMaps(
            coreMemMaps.filter(m => m).map(m => ['', m])
        )
    );
};

export type CoreInfo = ReturnType<
    typeof convertDeviceDefinitionToCoreArray
>[number];

export const convertDeviceDefinitionToCoreArray = (
    deviceDefinition: DeviceDefinition
) =>
    Object.keys(deviceDefinition.coreDefinitions).map(core => ({
        name: core as DeviceCore,
        coreDefinitions: deviceDefinition.coreDefinitions[
            core as DeviceCore
        ] as CoreDefinition,
        ...(deviceDefinition.coreProtection[core as DeviceCore] && {
            coreProtection: deviceDefinition.coreProtection[core as DeviceCore],
        }),
        ...(deviceDefinition.coreMemMap[core as DeviceCore] && {
            coreMemMap: deviceDefinition.coreMemMap[core as DeviceCore],
        }),
        ...(deviceDefinition.coreOperation[core as DeviceCore] && {
            coreOperation: deviceDefinition.coreOperation[core as DeviceCore],
        }),
    }));
