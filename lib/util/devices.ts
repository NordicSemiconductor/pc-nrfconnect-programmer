/* Copyright (c) 2015 - 2021, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import nrfdl, {
    DeviceCore,
    DeviceCoreInfo,
    DeviceFamily,
    ProtectionStatus,
} from '@nordicsemiconductor/nrf-device-lib-js';
import { logger } from 'nrfconnect/core';

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
export const McubootProductIds = [0x520f, 0x9100];

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
    const model = device.jlink.device_version;
    const family = device.jlink.device_family;
    logger.info(`Device family ${family}`);
    logger.info(`Device model ${model}`);

    return {
        ...getDeviceDefinition(model),
        family,
        cores: [],
    };
};

/**
 * Add core info to device info
 *
 * @param {DeviceDefinition} deviceInfo - existing device info
 * @param {DeviceCoreInfo} inputCoreInfo - core info to be added
 * @param {string} coreName - the name of the core
 *
 * @returns {DeviceDefinition} the updated device info
 */
export const addCoreToDeviceInfo = (
    deviceInfo: DeviceDefinition,
    inputCoreInfo: DeviceCoreInfo,
    coreName: string
) => ({
    ...deviceInfo,
    cores: [
        ...deviceInfo.cores,
        {
            ...defaultCore,
            name: coreName,
            coreNumber: deviceInfo.cores.length,
            romBaseAddr: inputCoreInfo.codeAddress,
            romSize: inputCoreInfo.codeSize,
            ramSize: inputCoreInfo.RAMSize,
            pageSize: inputCoreInfo.codePageSize,
            // TODO: Check if uicrAddress is present in nrfjprog under nrf-device-lib
            // uicrBaseAddr: inputCoreInfo.uicrAddress,
            uicrSize: inputCoreInfo.codePageSize,
            ...inputCoreInfo,
        },
    ],
});

export const context = nrfdl.createContext();

/**
 * Uses `@nordicsemiconductor/nrf-device-lib-js` to fetch the attached device with the * given `serialNumber`,
 * if it exists.
 *
 * @param {string} serialNumber The serial number of the device to return.
 * @returns {Promise<nrfdl.Device>} A promise potentially containing the device info.
 */
export const getDeviceFromNrfdl = (
    serialNumber: string
): Promise<nrfdl.Device> =>
    new Promise((resolve, reject) => {
        nrfdl.enumerate(context).then(devices => {
            // This is not needed when @nordicsemiconductor/nrf-device-lib-js is integrated in device selector
            // eslint-disable-next-line no-restricted-syntax
            for (const device of devices) {
                if (device.serialnumber === serialNumber) {
                    return resolve(device);
                }
            }

            return reject(
                new Error(
                    `No device found with serial number '${serialNumber}'`
                )
            );
        });
    });
