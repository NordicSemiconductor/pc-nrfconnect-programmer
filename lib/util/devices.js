/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
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

import nrfjprog from 'pc-nrfjprog-js';
import { logger } from 'nrfconnect/core';
import range from './range';
import { USE_NRFDL } from '../actions/jlinkTargetActions';

export const CoreDefinition = {
    name: 'Application',
    coreNumber: 0,
    romBaseAddr: 0x0,
    romSize: 0x100000, // 1 MB
    ramSize: null,
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

export const DeviceDefinition = {
    family: null,
    type: null,
    cores: [CoreDefinition],
};

// Some infomation cannot be feteched by nrfjprog
// so they need to be pre-defined here.
const deviceDefinitions = [
    // nRF52840 dongle cannot fetch info by nrfjprog
    {
        ...DeviceDefinition,
        family: 'nRF52',
        type: 'nRF52840',
    },
    // nRF9160 has different ficr and uicr base address
    {
        ...DeviceDefinition,
        family: 'nRF91',
        type: 'nRF9160',
        cores: [
            {
                ...CoreDefinition,
                ficrBaseAddr: 0xff0000,
                uicrBaseAddr: 0xff8000,
            },
        ],
    },
    // TODO: Update comment here
    // nRF5340
    {
        ...DeviceDefinition,
        family: 'nRF53',
        type: 'nRF5340',
        cores: [
            {
                ...CoreDefinition,
                coreNumber: 0,
                name: 'Application',
                romBaseAddr: 0x0,
                romSize: 0x100000, // 1 MB
                ficrBaseAddr: 0xff0000,
                uicrBaseAddr: 0xff8000,
            },
            {
                ...CoreDefinition,
                coreNumber: 1,
                name: 'Network',
                romBaseAddr: 0x1000000,
                romSize: 0x40000, // 256 KB
                ficrBaseAddr: 0x1ff0000,
                uicrBaseAddr: 0x1ff8000,
            },
        ],
    },
];

// Refer to pc-nrfutil
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

export const VendorId = {
    SEGGER: 0x1366,
    NORDIC_SEMICONDUCTOR: 0x1915,
};

export const USBProductIds = [0x521f, 0xc00a, 0xcafe];

export const McubootProductIds = [0x520f, 0x9100];

// IDs can be found in 99-jlink.rules from JLink deb package
export const JlinkProductIds = [
    ...range(0x0101, 0x0108),
    ...range(0x1001, 0x101f),
];

export const CommunicationType = {
    UNKNOWN: 0,
    JLINK: 1,
    USBSDFU: 2,
    MCUBOOT: 3,
};

// Get communication type in string format
export const getCommunicationType = type => {
    switch (type) {
        case CommunicationType.JLINK:
            return 'JLink';
        case CommunicationType.USBSDFU:
            return 'USBSDFU';
        case CommunicationType.MCUBOOT:
            return 'MCUBOOT';
        default:
            return 'Unknown';
    }
};

const deviceFamilies = {
    [nrfjprog.NRF51_FAMILY]: 'nRF51',
    [nrfjprog.NRF52_FAMILY]: 'nRF52',
    [nrfjprog.NRF53_FAMILY]: 'nRF53',
    [nrfjprog.NRF91_FAMILY]: 'nRF91',
};

const deviceModels = {
    // nRF51 versions
    [nrfjprog.NRF51_FAMILY]: {
        [nrfjprog.NRF51801_xxAB_REV3]: 'NRF51801_xxAB_REV3',
        [nrfjprog.NRF51802_xxAA_REV3]: 'NRF51802_xxAA_REV3',
        [nrfjprog.NRF51xxx_xxAA_REV1]: 'NRF51xxx_xxAA_REV1',
        [nrfjprog.NRF51xxx_xxAA_REV2]: 'NRF51xxx_xxAA_REV2',
        [nrfjprog.NRF51xxx_xxAA_REV3]: 'NRF51xxx_xxAA_REV3',
        [nrfjprog.NRF51xxx_xxAB_REV3]: 'NRF51xxx_xxAB_REV3',
        [nrfjprog.NRF51xxx_xxAC_REV3]: 'NRF51xxx_xxAC_REV3',
    },
    // nRF52 versions
    [nrfjprog.NRF52_FAMILY]: {
        // nRF52805 versions
        [nrfjprog.NRF52805_xxAA_REV1]: 'NRF52805_xxAA_REV1',
        [nrfjprog.NRF52805_xxAA_FUTURE]: 'NRF52805_xxAA_FUTURE',
        // nRF52810 versions
        [nrfjprog.NRF52810_xxAA_REV1]: 'NRF52810_xxAA_REV1',
        [nrfjprog.NRF52810_xxAA_REV2]: 'NRF52810_xxAA_REV2',
        [nrfjprog.NRF52810_xxAA_FUTURE]: 'NRF52810_xxAA_FUTURE',
        // nRF52811 versions
        [nrfjprog.NRF52811_xxAA_REV1]: 'NRF52811_xxAA_REV1',
        [nrfjprog.NRF52811_xxAA_FUTURE]: 'NRF52811_xxAA_FUTURE',
        // nRF52820 versions
        [nrfjprog.NRF52820_xxAA_REV1]: 'NRF52820_xxAA_REV1',
        [nrfjprog.NRF52820_xxAA_REV2]: 'NRF52820_xxAA_REV2',
        [nrfjprog.NRF52820_xxAA_FUTURE]: 'NRF52820_xxAA_FUTURE',
        // nRF52832 versions
        [nrfjprog.NRF52832_xxAA_ENGA]: 'NRF52832_xxAA_ENGA',
        [nrfjprog.NRF52832_xxAA_ENGB]: 'NRF52832_xxAA_ENGB',
        [nrfjprog.NRF52832_xxAA_REV1]: 'NRF52832_xxAA_REV1',
        [nrfjprog.NRF52832_xxAA_REV2]: 'NRF52832_xxAA_REV2',
        [nrfjprog.NRF52832_xxAA_FUTURE]: 'NRF52832_xxAA_FUTURE',
        [nrfjprog.NRF52832_xxAB_REV1]: 'NRF52832_xxAB_REV1',
        [nrfjprog.NRF52832_xxAB_REV2]: 'NRF52832_xxAB_REV2',
        [nrfjprog.NRF52832_xxAB_FUTURE]: 'NRF52832_xxAB_FUTURE',
        // nRF52833 versions
        [nrfjprog.NRF52833_xxAA_REV1]: 'NRF52833_xxAA_REV1',
        [nrfjprog.NRF52833_xxAA_FUTURE]: 'NRF52833_xxAA_FUTURE',
        // nRF52840 versions
        [nrfjprog.NRF52840_xxAA_ENGA]: 'NRF52840_xxAA_ENGA',
        [nrfjprog.NRF52840_xxAA_ENGB]: 'NRF52840_xxAA_ENGB',
        [nrfjprog.NRF52840_xxAA_REV1]: 'NRF52840_xxAA_REV1',
        [nrfjprog.NRF52840_xxAA_REV2]: 'NRF52840_xxAA_REV2',
        [nrfjprog.NRF52840_xxAA_FUTURE]: 'NRF52840_xxAA_FUTURE',
    },
    // nRF53 versions
    [nrfjprog.NRF53_FAMILY]: {
        [nrfjprog.NRF5340_xxAA_ENGA]: 'NRF5340_xxAA_ENGA',
        [nrfjprog.NRF5340_xxAA_ENGB]: 'NRF5340_xxAA_ENGB',
        [nrfjprog.NRF5340_xxAA_REV1]: 'NRF5340_xxAA_REV1',
        [nrfjprog.NRF5340_xxAA_FUTURE]: 'NRF5340_xxAA_FUTURE',
    },
    // nRF91 versions
    [nrfjprog.NRF91_FAMILY]: {
        [nrfjprog.NRF9160_xxAA_REV1]: 'NRF9160_xxAA_REV1',
        [nrfjprog.NRF9160_xxAA_REV2]: 'NRF9160_xxAA_REV2',
        [nrfjprog.NRF9160_xxAA_FUTURE]: 'NRF9160_xxAA_FUTURE',
    },
};

// Device variants from jprog.
export const getDeviceModel = (family, type) => {
    if (family in deviceModels && type in deviceModels[family]) {
        return deviceModels[family][type];
    }

    return 'Unknown model';
};

export const getDeviceFamily = family => {
    if (family in deviceFamilies) {
        return deviceFamilies[family];
    }

    return 'Unknown family';
};

// TODO: due to type defined in nrfjprog, the type in string
// does not always match the type in number.
// Update the function and enhence the logic
export const getDeviceDefinition = type =>
    deviceDefinitions.find(device => device.type.includes(type)) || {
        ...DeviceDefinition,
        type: `nRF${type}`,
    };

// Get device info by calling version command
export const getDeviceInfoByUSB = ({ part, memory }) => {
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

// Get device info by calling nrfjprog
export const getDeviceInfoByJprog = device => {
    let model;
    let family;

    if (USE_NRFDL) {
        model = device.jlink.device_version || 'Unknown model';
        family = device.jlink.device_family || 'Unknown family';
    } else {
        model = getDeviceModel(device.family, device.deviceType);
        family = getDeviceFamily(device.family);
    }

    let type;
    if (model === 'Unknown model') {
        type = 'Unknown';
        logger.info(
            'Device type is unknown. It may be a new version of product from Nordic Semiconductor.'
        );
        logger.info('Please check device list supported by nrfjprog.');
    } else {
        type = model.split('_')[0].substring(3); // Get device type digits
        type = parseInt(type, 10);
    }
    if (family === 'Unknown family') {
        family = 'Unknown';
        logger.info('Device family is unknown. It is not supported.');
        logger.info('Please check device list supported by nrfjprog.');
    }

    return {
        ...getDeviceDefinition(type),
        family,
        cores: [],
    };
};

// Add core info to device info
export const addCoreToDeviceInfo = (deviceInfo, coreInfo, coreName) => ({
    ...deviceInfo,
    cores: [
        ...deviceInfo.cores,
        {
            ...CoreDefinition,
            name: coreName,
            coreNumber: deviceInfo.cores.length,
            romBaseAddr: coreInfo.codeAddress,
            romSize: coreInfo.codeSize,
            ramSize: coreInfo.ramSize,
            pageSize: coreInfo.codePageSize,
            uicrBaseAddr: coreInfo.uicrAddress,
            uicrSize: coreInfo.codePageSize,
        },
    ],
});
