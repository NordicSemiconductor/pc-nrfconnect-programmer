/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl, {
    DeviceCore,
    DeviceCoreInfo,
    ProtectionStatus,
} from '@nordicsemiconductor/nrf-device-lib-js';

import range from './range';

export type CoreDefinition = {
    name: DeviceCore | string;
    coreNumber: number;
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
    protectionStatus: ProtectionStatus;
};

/**
 * Default definition of device core
 */
export const defaultCore: CoreDefinition = {
    name: 'NRFDL_DEVICE_CORE_APPLICATION',
    coreNumber: 0,
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
    protectionStatus: 'PROTECTION_STATUS_SECURE_REGIONS',
};

type DeviceFamily = 'nRF51' | 'nRF52' | 'nRF53' | 'nRF91' | 'Unknown';

export interface DeviceDefinition {
    family?: DeviceFamily;
    type?: string;
    cores: CoreDefinition[];
}

/**
 * Default definition for device info
 */
export const deviceDefinition: DeviceDefinition = {
    family: 'Unknown',
    type: 'Unknown',
    cores: [defaultCore],
};

/**
 * Some information cannot be fetch by @nordicsemiconductor/nrf-device-lib-js
 * Define the default values here
 */
const deviceDefinitions: DeviceDefinition[] = [
    // nRF52840 dongle cannot fetch info by @nordicsemiconductor/nrf-device-lib-js
    {
        ...deviceDefinition,
        family: 'nRF52',
        type: 'nRF52840',
    },
    // nRF9160 has different ficr and uicr base address
    {
        ...deviceDefinition,
        family: 'nRF91',
        type: 'nRF9160',
        cores: [
            {
                ...defaultCore,
                ficrBaseAddr: 0xff0000,
                uicrBaseAddr: 0xff8000,
            },
        ],
    },
    // nRF5340 has dual core definitions
    {
        ...deviceDefinition,
        family: 'nRF53',
        type: 'nRF5340',
        cores: [
            {
                ...defaultCore,
                coreNumber: 0,
                name: 'NRFDL_DEVICE_CORE_APPLICATION',
                romBaseAddr: 0x0,
                romSize: 0x100000, // 1 MB
                ficrBaseAddr: 0xff0000,
                uicrBaseAddr: 0xff8000,
            },
            {
                ...defaultCore,
                coreNumber: 1,
                name: 'NRFDL_DEVICE_CORE_NETWORK',
                romBaseAddr: 0x1000000,
                romSize: 0x40000, // 256 KB
                ficrBaseAddr: 0x1ff0000,
                uicrBaseAddr: 0x1ff8000,
            },
        ],
    },
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
 * Supported communication types
 */
export enum CommunicationType {
    UNKNOWN,
    JLINK,
    USBSDFU,
    MCUBOOT,
}

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
export const McubootProductIds = [0x520f, 0x9100, 0x530c];

/**
 * Supported USB modem product IDs
 */
export const ModemProductIds = [0x520f, 0x9100];

/**
 * Supported JLink product IDs
 * which can be found in 99-JLink.rules from JLink deb package
 */
export const JLinkProductIds = [
    ...range(0x0101, 0x0108),
    ...range(0x1001, 0x101f),
];

export const getDeviceDefinition = (type: string): DeviceDefinition =>
    deviceDefinitions.find((device: DeviceDefinition) =>
        device?.type?.includes(type)
    ) || {
        ...deviceDefinition,
        type,
    };

// Get device info by calling version command
export const getDeviceInfoByUSB = ({
    part,
    memory,
}: {
    part: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memory: any;
}) => {
    const deviceInfoByUsb = getDeviceDefinition(part.toString(16));
    const [core] = deviceInfoByUsb.cores;
    return {
        ...deviceInfoByUsb,
        cores: [
            {
                ...core,
                romSize: memory.romSize,
                pageSize: memory.romPageSize,
                ramSize: memory.ramSize,
            },
        ],
    };
};

// Get device info by calling @nordicsemiconductor/nrf-device-lib-js
export const getDeviceInfoByJlink = (device: nrfdl.Device) => {
    const model = device.jlink.deviceVersion;
    const family = device.jlink.deviceFamily;

    return {
        ...getDeviceDefinition(model),
        family,
        cores: [],
    } as DeviceDefinition;
};

/**
 * Add core info to device info
 *
 * @param {DeviceDefinition} deviceInfo - existing device info
 * @param {DeviceCoreInfo} inputCoreInfo - core info to be added
 * @param {string} coreName - the name of the core
 * @param {ProtectionStatus} protectionStatus - the protection status
 *
 * @returns {DeviceDefinition} the updated device info
 */
export const addCoreToDeviceInfo = (
    deviceInfo: DeviceDefinition,
    inputCoreInfo: DeviceCoreInfo,
    coreName: string,
    protectionStatus: ProtectionStatus
) =>
    ({
        ...deviceInfo,
        cores: [
            ...deviceInfo.cores,
            {
                ...defaultCore,
                name: coreName,
                coreNumber: deviceInfo.cores.length,
                romBaseAddr: inputCoreInfo.codeAddress,
                romSize: inputCoreInfo.codeSize,
                pageSize: inputCoreInfo.codePageSize,
                // TODO: Check if uicrAddress is present in nrfjprog under nrf-device-lib
                // uicrBaseAddr: inputCoreInfo.uicrAddress,
                uicrSize: inputCoreInfo.codePageSize,
                ...inputCoreInfo,
                protectionStatus,
            },
        ],
    } as DeviceDefinition);
