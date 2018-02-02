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

import { List } from 'immutable';
import debug from 'debug';
import { logger } from 'nrfconnect/core';
import * as dfujs from 'pc-nrf-dfu-js';
import SerialPort from 'serialport';
import * as targetActions from './targetActions';
import * as devices from '../util/devices';
import { Region, RegionPermission } from '../util/regions';
import * as initPacket from '../util/initPacket';

export async function getDeviceVersions(comName) {
    const port = new SerialPort(comName, { baudRate: 115200, autoOpen: false });
    return new Promise(async resolve => {
        const serialTransport = new dfujs.DfuTransportSerial(port, 0);
        const protocolVersion = await serialTransport.getProtocolVersion();
        logger.info(`Protocol Version:  ${protocolVersion} found`);
        const hardwareVersion = await serialTransport.getHardwareVersion();
        logger.info(`Hardware: ${hardwareVersion.part.toString(16)} found`);
        const firmwareVersions = await serialTransport.getAllFirmwareVersions();
        firmwareVersions.forEach(ver => {
            logger.info(`Firmware: ${ver.imageType} found`);
        });
        resolve({
            protocolVersion,
            hardwareVersion,
            firmwareVersions,
        });
    })
    .then(versions => new Promise(resolve => {
        port.close(closeError => {
            if (closeError) {
                logger.error(`Error when closing serial port: ${closeError}`);
            }
            resolve(versions);
        });
    }))
    .catch(error => {
        logger.error(`Error when calling version command: ${error}`);
        port.close(closeError => {
            if (closeError) {
                logger.error(`Error when closing serial port: ${closeError}`);
            }
        });
    });
}

// Display some information about a devkit. Called on a devkit connection.
export function loadDeviceInfo(comName) {
    return async dispatch => {
        dispatch(targetActions.targetTypeKnownAction(devices.CommunicationType.USB));
        logger.info('Target device has the communication type of USB');

        try {
            const { hardwareVersion, firmwareVersions } = await getDeviceVersions(comName);
            const deviceInfo = devices.getDeviceInfoByUSB(hardwareVersion);

            dispatch(targetActions.targetInfoKnownAction(deviceInfo));

            let regions = new List();

            // Add FICR to regions
            if (deviceInfo.ficrBaseAddr) {
                regions = regions.push(new Region({
                    name: 'FICR',
                    version: 0,
                    startAddress: deviceInfo.ficrBaseAddr,
                    regionSize: deviceInfo.ficrSize,
                    permission: RegionPermission.NONE,
                }));
            }

            // Add UICR to regions
            if (deviceInfo.uicrBaseAddr) {
                regions = regions.push(new Region({
                    name: 'UICR',
                    version: 0,
                    startAddress: deviceInfo.uicrBaseAddr,
                    regionSize: deviceInfo.uicrSize,
                    permission: RegionPermission.NONE,
                }));
            }

            // Add bootloader, softDevice, applications to regions
            firmwareVersions.forEach(firmwareVersion => {
                const imageType = firmwareVersion.imageType;
                regions = regions.push(new Region({
                    name: imageType,
                    version: firmwareVersion.version,
                    startAddress: firmwareVersion.addr,
                    regionSize: firmwareVersion.length,
                    permission: imageType === 'application' || imageType === 'softdevice' ?
                    RegionPermission.READ_WRITE :
                    RegionPermission.READ_ONLY,
                }));
            });

            dispatch(targetActions.targetRegionsKnownAction(regions));

            // Todo: it is different approach to check wheather the device is writable or not
            // Find a way to check if it writable for usb target.
            // dispatch(this.updateTargetWritable());
        } catch (versionError) {
            logger.error(`Error when fetching device versions: ${versionError}`);
        }
    };
}

export function write() {
    return async (dispatch, getState) => {
        const comName = getState().app.target.port;
        const port = new SerialPort('/dev/tty.usbmodem1421', { baudRate: 115200, autoOpen: false });
        const memMaps = getState().app.file.memMaps;
        let memMap;
        memMaps.forEach(m => {
            memMap = m[1];
        });
        console.log('Origin memMap, memMap1');
        console.log(memMap);

        const startAddress = memMap.keys().next().value;
        let endAddress;
        let entirePageSize = 0;
        memMap.forEach((block, address) => {
            endAddress = address + block.length;
            entirePageSize += block.length;
        });
        const imageSize = endAddress - startAddress;
        entirePageSize = (Math.floor(entirePageSize / 1024) + 1) * 1024;
        console.log('entirePageSize:', entirePageSize);
        console.log('imageSize:', imageSize);
        const memMap2 = memMap.paginate(2048);
        console.log('Current memMap: memMap2');
        console.log(memMap2);
        console.log(memMap2.get(startAddress));
        const hashString = '0d17f773961803f089c54267dfb8f36a1a61d9ac0fec2559fcaa65f7a3d474c3';
        const hashArray = [];
        for (let i = 0; i < hashString.length; i += 2) {
            hashArray.push(hashString.substr(i, 2));
        }
        console.log(hashArray);
        const packet = await initPacket.createInitPacketBuffer(
            1,
            52,
            0,
            initPacket.FwType.APPLICATION,
            0,
            0,
            imageSize,
            initPacket.HashType.SHA256,
            hashArray,
        );
        console.log(new Uint8Array(packet));

        console.log('debug', debug);
//        debug.enable('dfu:*');
        debug.enable('*');
        dfujs.DfuUpdates.fromZipFilePath('/Users/chun/Development/workspace/hex/blinky/blinky_dongle.zip')
        .then(updates => {
            console.log(updates.updates[0].initPacket);
            const firmwareUpdates = new dfujs.DfuUpdates([{
                initPacket: updates.updates[0].initPacket,
                firmwareImage: updates.updates[0].firmwareImage,
            }]);

            console.log(firmwareUpdates);
            console.log(port);
            const serialTransport = new dfujs.DfuTransportSlowSerial(port, 250, 0,16);
//            const serialTransport = new dfujs.DfuTransportSerial(port, 0);
            console.log(serialTransport);
            const dfu = new dfujs.DfuOperation(updates, serialTransport);

            dfu.start(true)
                .then(() => {
                    console.log('Seems like the DFU completed successfully!!');
                })
                .catch(err => {
                    console.error('DFU failed. Reason:');
                    console.error(err);
                });
        });
    };
}
