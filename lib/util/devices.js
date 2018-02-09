/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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

import { List, Record } from 'immutable';
import nrfjprog from 'pc-nrfjprog-js';
import { logger } from 'nrfconnect/core';

export const DeviceDefinition = Record({
    family: null,
    type: null,
    name: null,
    romBaseAddr: 0x0,
    romSize: 0x100000, // 1 MB
    ramSize: null,
    pageSize: 0x4,  // 4 KB
    blockSize: 0.5, // KB
    ficrBaseAddr: 0x10000000,
    ficrSize: 0x400, // Todo: check and make sure!
    uicrBaseAddr: 0x10001000,
    uicrSize: 0x400, // Todo: check and make sure!
    blAddrOffset: 0x14,
    mbrParamsOffset: 0x18,
});

const deviceDefinitions = new List([
    new DeviceDefinition({
        family: 'nRF51',
        type: 'nRF51422',
        romSize: 0x20000,   // 128 KB
        ramSize: 0x4000,    // 16 KB
    }),
    new DeviceDefinition({
        family: 'nRF51',
        type: 'nRF51422',
        romSize: 0x40000,   // 256 KB
        ramSize: 0x8000,    // 32 KB
    }),
    new DeviceDefinition({
        family: 'nRF51',
        type: 'nRF51822',
        romSize: 0x20000,   // 128 KB
        ramSize: 0x4000,    // 32 KB
    }),
    new DeviceDefinition({
        family: 'nRF51',
        type: 'nRF51822',
        romSize: 0x40000,   // 256 KB
        ramSize: 0x8000,    // 32 KB
    }),
    new DeviceDefinition({
        family: 'nRF51',
        type: 'nRF51824',
        romSize: 0x40000,   // 256 KB
        ramSize: 0x4000,    // 16 KB
    }),
    new DeviceDefinition({
        family: 'nRF52',
        type: 'nRF52832',
        romSize: 0x40000,   // 256 KB
        ramSize: 0x8000,    // 32 KB
    }),
    new DeviceDefinition({
        family: 'nRF52',
        type: 'nRF52832',
        romSize: 0x80000,   // 512 KB
        ramSize: 0x10000,   // 64 KB
    }),
    new DeviceDefinition({
        family: 'nRF52',
        type: 'nRF52840',
        romSize: 0x100000,  // 1 MB
        ramSize: 0x40000,   // 256 KB
    }),
    new DeviceDefinition({
        family: 'nRF9',
        type: 'nRF9120',
        romSize: 0x100000,  // 1 MB
        ramSize: 0x40000,   // 256 KB
        ficrBaseAddr: 0xFF0000,
        uficrBaseAddr: 0xFF8000,
    }),
]);

export const VendorId = {
    SEGGER: 0x1366,
    NORDIC_SEMICONDUCTOR: 0x1915,
};

export const ProductId = {
    SEGGER: 0x0105,
    NRF521F: 0x521F,
};

export const USBProductIds = [
    ProductId.NRF521F,
];

export const CommunicationType = {
    UNKNOWN: 0,
    PORT: 1,
    USB: 2,
};

// Device variants from jprog.
export function getDeviceModel(deviceInfo) {
    const deviceModels = {
        [nrfjprog.NRF51_FAMILY]: {
            [nrfjprog.NRF51xxx_xxAA_REV1]: 'NRF51xxx_xxAA_REV1',
            [nrfjprog.NRF51xxx_xxAA_REV2]: 'NRF51xxx_xxAA_REV2',
            [nrfjprog.NRF51xxx_xxAA_REV3]: 'NRF51xxx_xxAA_REV3',
            [nrfjprog.NRF51801_xxAB_REV3]: 'NRF51801_xxAB_REV3',
            [nrfjprog.NRF51802_xxAA_REV3]: 'NRF51802_xxAA_REV3',
            [nrfjprog.NRF51xxx_xxAB_REV3]: 'NRF51xxx_xxAB_REV3',
            [nrfjprog.NRF51xxx_xxAC_REV3]: 'NRF51xxx_xxAC_REV3',
        },
        [nrfjprog.NRF52_FAMILY]: {
            [nrfjprog.NRF52810_xxAA_FUTURE]: 'NRF52810_xxAA_FUTURE',
            [nrfjprog.NRF52832_xxAA_ENGA]: 'NRF52832_xxAA_ENGA',
            [nrfjprog.NRF52832_xxAA_ENGB]: 'NRF52832_xxAA_ENGB',
            [nrfjprog.NRF52832_xxAA_REV1]: 'NRF52832_xxAA_REV1',
            [nrfjprog.NRF52832_xxAB_REV1]: 'NRF52832_xxAB_REV1',
            [nrfjprog.NRF52832_xxAA_FUTURE]: 'NRF52832_xxAA_FUTURE',
            [nrfjprog.NRF52832_xxAB_FUTURE]: 'NRF52832_xxAB_FUTURE',
            [nrfjprog.NRF52840_xxAA_ENGA]: 'NRF52840_xxAA_ENGA',
            [nrfjprog.NRF52810_xxAA_REV1]: 'NRF52810_xxAA_REV1',
            [nrfjprog.NRF52840_xxAA_FUTURE]: 'NRF52840_xxAA_FUTURE',
        },
    };

    if (deviceInfo.family in deviceModels &&
        deviceInfo.deviceType in deviceModels[deviceInfo.family]) {
        return deviceModels[deviceInfo.family][deviceInfo.deviceType];
    }

    return 'Unknown model';
}

export function getDeviceInfo(type) {
    return deviceDefinitions.find(device => device.type.includes(type));
}

export function getDeviceInfoByUSB(hardwareVersion) {
    const deviceInfo = getDeviceInfo(hardwareVersion.part.toString(16));

    if (deviceInfo.romSize !== hardwareVersion.memory.romSize) {
        logger.info(`Update device info since device flash size in definition is ${deviceInfo.romSize} ` +
             `while from version command it is ${hardwareVersion.memory.romSize}.`);
    }

    return deviceInfo
        .set('romSize', hardwareVersion.memory.romSize)
        .set('ramSize', hardwareVersion.memory.ramSize);
}

export function getDeviceInfoByJprog(info) {
    const model = getDeviceModel(info);
    let type;
    if (model === 'Unknown model') {
        type = '52840';
    } else {
        type = model.split('_')[0].substring(3); // Get device type digits
    }
    const deviceInfo = getDeviceInfo(type);

    if (deviceInfo.romSize !== info.codeSize) {
        logger.info(`Update device info since device flash size in definition is ${deviceInfo.romSize} ` +
             `while from jprog it is ${info.codeSize}.`);
    }

    return deviceInfo
        .set('romSize', info.codeSize)
        .set('ramSize', info.ramSize)
        .set('pageSize', info.codePageSize);
}
