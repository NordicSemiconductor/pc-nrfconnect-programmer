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
    name: DeviceCore;
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

export interface DeviceDefinition {
    family: DeviceFamily;
    type?: string;
    cores: CoreDefinition[];
}

/**
 * Default definition for device info
 */
export const defaultDeviceDefinition: DeviceDefinition = {
    family: DeviceFamily.UNKNOWN,
    type: 'UNKNOWN',
    cores: [defaultCore],
};

/**
 * Some information cannot be fetch by @nordicsemiconductor/nrf-device-lib-js
 * Define the default values here
 */
export const deviceDefinitions: DeviceDefinition[] = [
    {
        ...defaultDeviceDefinition,
        family: DeviceFamily.NRF51,
        type: 'nRF51822',
    },
    // nRF52840 dongle cannot fetch info by @nordicsemiconductor/nrf-device-lib-js
    {
        ...defaultDeviceDefinition,
        family: DeviceFamily.NRF52,
        type: 'nRF52840',
        cores: [
            {
                ...defaultCore,
                romSize: 0x100000, // 1 Mb
                ramSize: 0x40000, // 256 Kb
                pageSize: 0x1000, // 4Kb
            },
        ],
    },
    // nRF9160 has different ficr and uicr base address
    {
        ...defaultDeviceDefinition,
        family: DeviceFamily.NRF91,
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
        ...defaultDeviceDefinition,
        family: DeviceFamily.NRF53,
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

export const coreFriendlyName = (coreName: DeviceCore) =>
    ({
        NRFDL_DEVICE_CORE_APPLICATION: 'Application',
        NRFDL_DEVICE_CORE_MODEM: 'Modem',
        NRFDL_DEVICE_CORE_NETWORK: 'Network',
    }[coreName] ?? coreName);

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
export const McubootProductIds = [
    // Thingy91
    0x520f, 0x9100,
    // Thingy53
    0x530c,
];

/**
 * Supported USB modem product IDs
 */
export const ModemProductIds = [
    // Thingy91
    0x520f, 0x9100,
];

/**
 * Supported JLink product IDs
 * which can be found in 99-JLink.rules from JLink deb package
 */
export const JLinkProductIds = [
    ...range(0x0101, 0x0108),
    ...range(0x1001, 0x101f),
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

const getProductId = (device: nrfdl.Device) =>
    parseInt(
        device.serialPorts.reduce(
            (m, p) => (p.vendorId === '1915' ? p.productId : '') || m,
            ''
        ),
        16
    );

const identifyUsbByVersion = (device: nrfdl.Device) =>
    device.hwInfo?.deviceVersion?.length > 0
        ? getDeviceDefinition(
              device.hwInfo.deviceVersion.slice(0, 8) // example 'NRF52840_AAD0'
          )
        : null;

const identifyUsbBySerialPort = (device: nrfdl.Device) => {
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
export const getDeviceInfoByUSB = (device: nrfdl.Device) =>
    identifyUsbByVersion(device) ||
    identifyUsbBySerialPort(device) ||
    defaultDeviceDefinition;

// Get device info by calling @nordicsemiconductor/nrf-device-lib-js
export const getDeviceInfoByJlink = (
    device: nrfdl.Device
): DeviceDefinition => {
    const type = device.jlink?.deviceVersion;
    const family = device.jlink?.deviceFamily as DeviceFamily;

    return {
        ...getDeviceDefinition(family),
        type,
        family,
    };
};

/**
 * Add core info to device info
 *
 * @param {DeviceDefinition} existingDefinition - existing device info
 * @param {number} coreNumber - the number of the core
 * @param {DeviceCoreInfo} inputCoreInfo - core info to be added
 * @param {ProtectionStatus} protectionStatus - the protection status
 *
 * @returns {DeviceDefinition} the updated device info
 */
export const updateCoreInfo = (
    existingDefinition: CoreDefinition,
    coreNumber: number,
    inputCoreInfo: DeviceCoreInfo,
    protectionStatus: ProtectionStatus
): CoreDefinition => ({
    ...existingDefinition,
    coreNumber,
    romBaseAddr: inputCoreInfo.codeAddress,
    romSize: inputCoreInfo.codeSize,
    pageSize: inputCoreInfo.codePageSize,
    uicrBaseAddr: inputCoreInfo.uicrAddress,
    uicrSize: inputCoreInfo.codePageSize,
    ...inputCoreInfo,
    protectionStatus,
});
