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

import { List, Set } from 'immutable';
import { logger } from 'nrfconnect/core';
import Crypto from 'crypto';
import * as dfujs from 'pc-nrf-dfu-js';
import SerialPort from 'serialport';
import * as targetActions from './targetActions';
import * as devices from '../util/devices';
import { Region, RegionPermission, RegionName, getRegionSizeByFwType } from '../util/regions';
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

            // Store hwVersion
            const hwVersion = parseInt(deviceInfo.family.slice(3), 10);
            dispatch(targetActions.initPacketHwVersionKnownAction(hwVersion));

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
            dispatch(targetActions.updateTargetWritable());
        } catch (versionError) {
            logger.error(`Error when fetching device versions: ${versionError}`);
        }
    };
}

export function canWrite() {
    return (dispatch, getState) => {
        const { target, file } = getState().app;
        const regionChecklist = new List([
            RegionName.APPLICATION,
            RegionName.SOFTDEVICE,
            RegionName.BOOTLOADER,
        ]);
        let fileRegionNames = new Set();
        let targetRegionNames = new Set();
        file.regions.forEach(r => {
            fileRegionNames = r.name && regionChecklist.includes(r.name) ?
                fileRegionNames.add(r.name) : fileRegionNames;
        });
        target.regions.forEach(r => {
            targetRegionNames = r.name && regionChecklist.includes(r.name) ?
                targetRegionNames.add(r.name) : targetRegionNames;
        });
        let isWritable = false;

        console.log(fileRegionNames);
        switch (fileRegionNames.size) {
            case 0: {
                dispatch(targetActions.targetWarningKnownAction(new List(['None writable regions'])));
                break;
            }
            case 1: {
                switch (fileRegionNames.first()) {
                    case RegionName.APPLICATION: {
                        const sdReq = 0;
                        dispatch(targetActions.initPacketAPPKnownAction(
                            getRegionSizeByFwType(file.regions, RegionName.APPLICATION), sdReq));
                        const fwVersion = 1;
                        dispatch(targetActions.initPacketFwVersionKnownAction(
                            initPacket.FwType.APPLICATION, fwVersion));
                        isWritable = true;
                        dispatch(targetActions.targetWarningKnownAction(new List()));
                        break;
                    }
                    case RegionName.SOFTDEVICE: {
                        console.log('softdevice');
                        dispatch(targetActions.initPacketSDKnownAction(
                            getRegionSizeByFwType(file.regions, RegionName.SOFTDEVICE)));
                        const fwVersion = 1;
                        dispatch(targetActions.initPacketFwVersionKnownAction(
                            initPacket.FwType.SOFTDEVICE), fwVersion);
                        isWritable = true;
                        dispatch(targetActions.targetWarningKnownAction(new List()));
                        break;
                    }
                    case RegionName.BOOTLOADER: {
                        dispatch(targetActions.initPacketBLKnownAction(
                            getRegionSizeByFwType(file.regions, RegionName.BOOTLOADER)));
                        const fwVersion = 1;
                        dispatch(targetActions.initPacketFwVersionKnownAction(
                            initPacket.FwType.BOOTLOADER), fwVersion);
                        isWritable = true;
                        dispatch(targetActions.targetWarningKnownAction(new List()));
                        break;
                    }
                    case RegionName.MBR_OR_APP:
                    default:
                }
                break;
            }
            case 2: {
                break;
            }
            default:
        }
        dispatch(targetActions.targetWritableKnownAction(isWritable));
    };
}

function calculateSHA256Hash(image) {
    const digest = Crypto.createHash('sha256');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

function calculateSHA512Hash(image) {
    const digest = Crypto.createHash('sha512');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

export function write() {
    return async (dispatch, getState) => {
        const target = getState().app.target;
        const port = new SerialPort(target.port, { baudRate: 115200, autoOpen: false });
        const memMaps = getState().app.file.memMaps;
        const memMap = memMaps.values().next().value[1];
        let initPacketParams;

        let startAddress;
        let endAddress;
        memMap.forEach((block, address) => {
            if (address < target.deviceInfo.romSize) {
                startAddress = !startAddress ? address : startAddress;
                endAddress = address + block.length;
            }
        });
        const firmwareImage = memMap.slicePad(startAddress, endAddress - startAddress);

        const hashType = initPacket.HashType.SHA256;
        let hash;
        switch (hashType) {
            case initPacket.HashType.NO_HASH:
                logger.error('No hash is not supported');
                break;
            case initPacket.HashType.SHA128:
                logger.error('Hash type SHA128 is not supported');
                break;
            case initPacket.HashType.SHA256:
                hash = calculateSHA256Hash(firmwareImage);
                logger.info('Hash is generated by SHA256');
                break;
            case initPacket.HashType.SHA512:
                hash = calculateSHA512Hash(firmwareImage);
                logger.info('Hash is generated by SHA512');
                break;
            case initPacket.HashType.CRC:
                logger.error('Hash type CRC is not supported');
                break;
            default:
                logger.error('Unknown hash type');
        }
        initPacketParams = target.initPacket
            .set('hashType', hashType)
            .set('hash', hash);
        dispatch(targetActions.initPacketHashKnownAction(hashType, hash));

        switch (initPacketParams.fwType) {
            case initPacket.FwType.APPLICATION:
                initPacketParams = initPacketParams.set('appSize', firmwareImage.length);
                break;
            case initPacket.FwType.BOOTLOADER:
                initPacketParams = initPacketParams.set('blSize', firmwareImage.length);
                break;
            case initPacket.FwType.SOFTDEVICE:
                initPacketParams = initPacketParams.set('sdSize', firmwareImage.length);
                break;
            case initPacket.FwType.SOFTDEVICE_BOOTLOADER:
                logger.error('Firmware of Bootloader and SoftDevice');
                break;
            default:
                logger.error('Unknown firmware type');
        }
        const packet = await initPacket.createInitPacketUint8Array(initPacketParams);

        const firmwareUpdates = new dfujs.DfuUpdates([{
            initPacket: packet,
            firmwareImage,
        }]);
        const serialTransport = new dfujs.DfuTransportSerial(port, 0);
        const dfu = new dfujs.DfuOperation(firmwareUpdates, serialTransport);
        dfu.start(true)
            .then(() => {
                logger.info('Seems like the DFU completed successfully!!');
            })
            .catch(error => {
                logger.error(`DFU failed. Reason: ${error}`);
            });

        // dfujs.DfuUpdates.fromZipFilePath('/Users/chun/Development/workspace/hex/softdevice/s140_nrf52840_5.0.0-2.alpha_softdevice.zip')
        // .then(async updates => {
        //     console.log(updates);
        //     const firmwareUpdates = new dfujs.DfuUpdates([{
        //         initPacket: packet,
        //         // initPacket: updates.updates[0].initPacket,
        //         firmwareImage,
        //     }]);
        //     // const protoPath = Path.join(getAppDir(), 'resources/dfu-cc.proto');
        //     // const root = await Protobuf.load(protoPath);
        //     // const packetMessage = root.lookupType('dfu.Packet');
        //     // const packetBack1 = packetMessage.decode(updates.updates[0].initPacket);
        //     // const packetBack2 = packetMessage.decode(packet);
        //     // console.log(packetBack1);
        //     // console.log(packetBack2);

        //     const serialTransport = new dfujs.DfuTransportSerial(port, 0);
        //     const dfu = new dfujs.DfuOperation(firmwareUpdates, serialTransport);
        //     dfu.start(true)
        //         .then(() => {
        //             logger.info('Seems like the DFU completed successfully!!');
        //         })
        //         .catch(error => {
        //             logger.error(`DFU failed. Reason: ${error}`);
        //         });
        // });
    };
}

