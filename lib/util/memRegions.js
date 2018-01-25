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

import { Record, List } from 'immutable';

import { logger } from 'nrfconnect/core';
import { hexpad8, hexpad2 } from './hexpad';

// Definition of RegionPermission
export const RegionPermission = {
    NONE: 0,
    READ_ONLY: 1,
    READ_WRITE: 2,
};

// Definition of Region
export const Region = new Record({
    name: null,
    startAddress: null,
    regionSize: null,
    colours: ['#C0C0C0'],
    permission: RegionPermission.READ_ONLY,
});

// List taken from py-nrfutil
const knownSoftDevices = {
    0x64: 'S110 v8.0.0',
    0x67: 'S130 v1.0.0',
    0x80: 'S130 v2.0.0',
    0x81: 'S132 v2.0.0',
    0x87: 'S130 v2.0.1',
    0x88: 'S132 v2.0.1',
    0x8C: 'S132 v3.0.0',
    0x91: 'S132 v3.1.0',
    0x95: 'S132 v4.0.0',
    0x98: 'S132 v4.0.2',
    0x99: 'S132 v4.0.3',
    0x9E: 'S132 v4.0.4',
    0x9D: 'S132 v5.0.0',
    0xA5: 'S132 v5.1.0',
};

/**
 * Given an instance of MemoryMap, return the heuristically detected
 * regions and labels for nRF SoCs.
 *
 * @param {MemoryMap}   memMap              the memory map
 * @param {HexString}   uicrStartAddr       the uicr start address
 *
 * @returns {Object} the object which carries regions and labels
 */
export function memRegions(memMap, uicrStartAddr = 0x10001000) {
    // TODO: Get some .hex files which handle clenr0/rpbConf
    let regions = new List();
    let region = new Region({
        name: 'softdevce',
        startAddress: null,
        regionSize: null,
        permission: RegionPermission.READ_WRITE,
    });

    // Does this memMap contain updated info about bootlader and readbac prot?
    // Try querying the UICR and see if there's valid data in there
    let clenr0 = memMap.getUint32(uicrStartAddr, true);
    const rpbConf = memMap.getUint32(uicrStartAddr + 0x04, true);

    const bootloaderAddress = memMap.getUint32(uicrStartAddr + 0x14, true);
    const mbrParams = memMap.getUint32(uicrStartAddr + 0x18, true);

    // Sanity checks on clenr0+rpbConf
    if (rpbConf !== undefined && rpbConf !== 0xFFFFFFFF) {
        if (clenr0 === undefined) { clenr0 = 0xFFFFFFFF; }
        logger.info(`Found readback protection info: ${hexpad8(clenr0)}, ${hexpad8(rpbConf)}`);
    }

    // Look for softdevice infoblock magic
    for (let address = 0x1000; address < 0x10000; address += 0x1000) {
        if (memMap.getUint32(address + 0x04, true) === 0x51B1E5DB) {
            const softDeviceSize = memMap.getUint32(address + 0x08, true);
            /* eslint-disable no-bitwise */
            const infoBlockSize = memMap.getUint32(address, true) & 0x000000FF;
            const fwId = memMap.getUint32(address + 0x0C, true) & 0x0000FFFF;

            logger.info(
                'Found match for SoftDevice signature. Start/End/ID: ',
                hexpad8(address),
                hexpad8(softDeviceSize),
                hexpad2(fwId),
            );

            if (infoBlockSize >= 0x18) {    // Including SoftDev ID (S000) and version
                if (infoBlockSize >= 0x2C) {    // Including 20-byte rev hash
                    // rev hash is only logged, not explicitly shown in the GUI.
                    let hash = [
                        memMap.getUint32(address + 0x18, false),
                        memMap.getUint32(address + 0x1C, false),
                        memMap.getUint32(address + 0x20, false),
                        memMap.getUint32(address + 0x24, false),
                        memMap.getUint32(address + 0x28, false)];
                    hash = hash.map(n => n.toString(16).padStart(8, '0')).join('');
                    logger.info('SoftDevice signature contains hash: ', hash);
                }

                const softDeviceId = memMap.getUint32(address + 0x10, true);
                const softDeviceVersion = memMap.getUint32(address + 0x14, true);
                if (softDeviceVersion === 0) {
                    region = region.set('startAddress', address);
                    region = region.set('name', `SoftDevice start, id ${hexpad2(fwId)} (S${softDeviceId} prerelease)`);
                } else {
                    const softDeviceVersionMajor = Math.floor((softDeviceVersion / 1000000) % 1000);
                    const softDeviceVersionMinor = Math.floor((softDeviceVersion / 1000) % 1000);
                    const softDeviceVersionPatch = softDeviceVersion % 1000;
                    region = region.set('startAddress', address);
                    region = region.set('name', `SoftDevice start, id ${hexpad2(fwId)} (S${softDeviceId} v${
                        softDeviceVersionMajor}.${softDeviceVersionMinor}.${softDeviceVersionPatch})`);
                }
                logger.info(`SoftDevice signature contains version info: (S${softDeviceId}, ${softDeviceVersion})`);
            } else if (knownSoftDevices[fwId]) {
                region = region.set('startAddress', address);
                region = region.set('name', `SoftDevice start, id ${hexpad2(fwId)} (${knownSoftDevices[fwId]})`);
            } else {
                region = region.set('startAddress', address);
                region = region.set('name', `SoftDevice start, id ${hexpad2(fwId)}`);
            }

            region = region.set('startAddress', 0x1000);
            regions = regions.push(region);
            break;
        }
    }

    if (bootloaderAddress && bootloaderAddress !== 0xFFFFFFFF) {
        region = new Region({
            name: 'bootloader',
            startAddress: bootloaderAddress,
            permission: RegionPermission.READ_WRITE,
        });
        regions = regions.push(region);
        logger.info(`UICR info found: bootloader at ${hexpad8(bootloaderAddress)}`);
    }

    if (mbrParams && mbrParams !== 0xFFFFFFFF) {
        region = new Region({
            name: 'MBR parameters',
            startAddress: mbrParams,
            permission: RegionPermission.READ,
        });
        regions = regions.push(region);
        logger.info(`UICR info found: MBR parameters at ${hexpad8(mbrParams)}`);
    }

    region = new Region({
        name: 'MBR',
        startAddress: 0x0,
        permission: RegionPermission.READ,
    });
    regions = regions.push(region);

    return regions;
}

