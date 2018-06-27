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

import { List, Set, Record } from 'immutable';
import { logger } from 'nrfconnect/core';
import Crypto from 'crypto';
import SerialPort from 'serialport';
import * as dfujs from 'pc-nrf-dfu-js';
import { initPacket, detachAndWaitFor, waitForDevice, dfuTrigger } from 'nrf-device-setup';
import * as targetActions from './targetActions';
import * as devices from '../util/devices';
import { Region, RegionPermission, RegionName, getSoftDeviceId } from '../util/regions';
import { setExpectedSerialNumber } from './deviceChangeActions';

const { InitPacket } = initPacket;

const DfuImage = new Record({
    name: null,
    initPacket: new InitPacket(),
    firmwareImage: null,
});


// Get device versions by calling version command
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
function loadDeviceInfo(selectedDevice) {
    return async dispatch => {
        const { comName } = selectedDevice.serialport;
        dispatch(targetActions.targetWarningKnownAction());
        dispatch(targetActions.targetTypeKnownAction(devices.CommunicationType.USBSDFU, false));
        logger.info('Using USB SDFU protocol to communicate with target');

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

            // Add MBR to regions
            if (deviceInfo.uicrBaseAddr) {
                regions = regions.push(new Region({
                    name: 'MBR',
                    version: 0,
                    startAddress: deviceInfo.mbrBaseAddr,
                    regionSize: deviceInfo.mbrSize,
                    permission: RegionPermission.NONE,
                }));
            }

            // Add bootloader, softDevice, applications to regions
            firmwareVersions.forEach(firmwareVersion => {
                const imageType = firmwareVersion.imageType;
                const regionSize = imageType === RegionName.SOFTDEVICE ?
                    firmwareVersion.length - 0x1000 : firmwareVersion.length;
                regions = regions.push(new Region({
                    name: imageType,
                    version: firmwareVersion.version,
                    startAddress: firmwareVersion.addr,
                    regionSize,
                    permission: imageType === 'application' || imageType === 'softdevice' ?
                    RegionPermission.READ_WRITE :
                    RegionPermission.READ_ONLY,
                }));
            });

            dispatch(targetActions.targetRegionsKnownAction(regions));
            dispatch(targetActions.updateFileAppRegions());
            dispatch(targetActions.updateTargetWritable());
        } catch (versionError) {
            logger.error(`Error when fetching device versions: ${versionError}`);
        }
    };
}

export function openDevice(selectedDevice) {
    return dispatch => Promise.resolve(selectedDevice)
        .then(device => {
            console.log(device);
            if (device.usb) {
                const usbdev = device.usb.device;
                const interfaceNumber = dfuTrigger.getDFUInterfaceNumber(usbdev);
                if (interfaceNumber >= 0) {
                    logger.info('DFU trigger interface found, changing to bootloader...');
                    dispatch(setExpectedSerialNumber(selectedDevice.serialNumber));
                    return detachAndWaitFor(usbdev, interfaceNumber, selectedDevice.serialNumber)
                        .then(newDevice => {
                            dispatch(setExpectedSerialNumber());
                            dispatch(targetActions.targetPortChanged(
                                newDevice.serialNumber, newDevice.serialport.comName,
                            ));
                            return newDevice;
                        });
                }
            }
            return device;
        })
        .then(device => dispatch(loadDeviceInfo(device)));
}

function createDfuImage(regionName, fwType) {
    const initPacketInUse = new InitPacket({
        fwType,
    });
    const dfuImage = new DfuImage({
        name: regionName,
        initPacket: initPacketInUse,
    });
    return dfuImage;
}

function createDfuImages(detectedRegionNames) {
    let dfuImages = new List();
    return dispatch => {
        detectedRegionNames.forEach(regionName => {
            switch (regionName) {
                case RegionName.BOOTLOADER:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.BOOTLOADER));
                    break;
                case RegionName.SOFTDEVICE:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.SOFTDEVICE));
                    break;
                case RegionName.APPLICATION:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.APPLICATION));
                    break;
                default:
                    break;
            }
        });
        dispatch(targetActions.dfuImagesUpdateAction(dfuImages));
    };
}

// Check if the files can be written to the target device
// If there are not any writable regions it should give a warning
// If there is a region starting from 0x0 it should give a warning
// If there are two regions, one is softdevice and the other one is mbr, it should be alright
// Other than that, it should give a warning
export function canWrite() {
    return (dispatch, getState) => {
        const { file } = getState().app;
        const regionChecklist = new List([
            RegionName.APPLICATION,
            RegionName.SOFTDEVICE,
            RegionName.BOOTLOADER,
            // RegionName.MBR_OR_APP,
        ]);
        let detectedRegionNames = new Set();
        file.regions.forEach(r => {
            if (r.name && regionChecklist.includes(r.name)) {
                detectedRegionNames = detectedRegionNames.add(r.name);
            }
        });
        let isWritable = false;

        if (detectedRegionNames.size) {
            isWritable = true;
            dispatch(targetActions.targetWarningKnownAction());
        } else {
            dispatch(targetActions.targetWarningKnownAction('No writable region is detected.'));
        }

        dispatch(targetActions.targetWritableKnownAction(isWritable));
        dispatch(createDfuImages(detectedRegionNames));
    };
}

// Calclulate hash 256
function calculateSHA256Hash(image) {
    const digest = Crypto.createHash('sha256');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

// Calclulate hash 512
function calculateSHA512Hash(image) {
    const digest = Crypto.createHash('sha512');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

function handleImage(image, regions, memMap) {
    if (!image.initPacket) {
        throw new Error('Init packet was not created.');
    }

    const region = regions.find(r => r.name === image.name);
    let fwSizeStr;

    if (image.name.includes(RegionName.BOOTLOADER)) {
        fwSizeStr = 'blSize';
    } else if (image.name.includes(RegionName.SOFTDEVICE)) {
        fwSizeStr = 'sdSize';
    } else if (image.name.includes(RegionName.APPLICATION)) {
        fwSizeStr = 'appSize';
    } else {
        throw new Error('Firmware type is unknown when setting firmware size.');
    }

    const firmwareImage = memMap.slicePad(region.startAddress, region.regionSize);
    return image.set('firmwareImage', firmwareImage)
                .setIn(['initPacket', fwSizeStr], firmwareImage.length);
}

function handleHwVersion(image, hwVersion) {
    return image.setIn(['initPacket', 'hwVersion'], hwVersion);
}

function handleSdReq(image, memMap, deviceInfo) {
    const sdReq = [0xFFE];
    sdReq.push(getSoftDeviceId(memMap, deviceInfo));
    return image.setIn(['initPacket', 'sdReq'], sdReq);
}

function handleUserInput(imageInput, userInput) {
    let image = imageInput;
    const sdReq = image.getIn(['initPacket', 'sdReq']);
    let sdReqInput;
    let fwVersion;

    if (image.name.includes(RegionName.BOOTLOADER)) {
        sdReqInput = userInput.blSdReq;
        fwVersion = userInput.blVer;
    } else if (image.name.includes(RegionName.SOFTDEVICE)) {
        sdReqInput = userInput.sdSdReq;
        fwVersion = userInput.sdVer;
    } else if (image.name.includes(RegionName.APPLICATION)) {
        sdReqInput = userInput.appSdReq;
        fwVersion = userInput.appVer;
    } else {
        throw new Error('Firmware type is unknown when setting user input.');
    }

    image = sdReqInput ? image.setIn(['initPacket', 'sdReq'], sdReq.concat(sdReqInput)) : image;
    image = fwVersion ? image.setIn(['initPacket', 'fwVersion'], fwVersion) : image;
    image = userInput.isDebug ? image.setIn(['initPacket', 'isDebug'], userInput.isDebug) : image;

    return image;
}

function handleHash(image, hashType) {
    let hash;
    switch (hashType) {
        case initPacket.HashType.NO_HASH:
            logger.error('No hash is not supported');
            break;
        case initPacket.HashType.SHA128:
            logger.error('Hash type SHA128 is not supported');
            break;
        case initPacket.HashType.SHA256:
            hash = calculateSHA256Hash(image.firmwareImage);
            logger.info('Hash is generated by SHA256');
            break;
        case initPacket.HashType.SHA512:
            hash = calculateSHA512Hash(image.firmwareImage);
            logger.info('Hash is generated by SHA512');
            break;
        case initPacket.HashType.CRC:
            logger.error('Hash type CRC is not supported');
            break;
        default:
            logger.error('Unknown hash type');
    }

    return image.setIn(['initPacket', 'hashType'], hashType)
                .setIn(['initPacket', 'hash'], hash);
}

function operateDFU() {
    return async (dispatch, getState) => {
        console.log('start');
        const target = getState().app.target;
        if (!target.dfuImages.size) {
            logger.info('All dfu images have been written to the target device.');
            dispatch(targetActions.writeProgressFinishedAction());
            dispatch(setExpectedSerialNumber());
            dispatch({ type: 'DEVICE_DESELECTED' });
            return;
        }

        const port = new SerialPort(target.port, { baudRate: 115200, autoOpen: false });
        const image = target.dfuImages.first();
        const packet = await initPacket.createInitPacketUint8Array(image.initPacket);

        const firmwareUpdates = new dfujs.DfuUpdates([{
            initPacket: packet,
            firmwareImage: image.firmwareImage,
        }]);
        const serialTransport = new dfujs.DfuTransportSerial(port, 0);
        const dfu = new dfujs.DfuOperation(firmwareUpdates, serialTransport);

        dispatch(targetActions.targetWritableKnownAction(false));
        logger.info('Performing DFU. This may take a few seconds');

        dispatch(targetActions.writeProgressStartAction());
        dfu.start(true)
            .then(() => {
                logger.info(`DFU for ${target.dfuImages.first().name} completed successfully!`);
                dispatch(targetActions.dfuImagesUpdateAction(target.dfuImages.delete(0)));
                logger.info(`${target.dfuImages.size - 1} dfu pakcage(s) left.`);
            })
            .catch(error => {
                logger.error(`DFU failed. Reason: ${error.message || error}`);
            })
            .then(async () => {
                dispatch(setExpectedSerialNumber(target.serialNumber));
                port.close(async err => {
                    if (err) {
                        logger.error(err);
                    }
                    console.log('Before waiting');
                    const device = await waitForDevice(target.serialNumber);
                    console.log('After waiting');
                    if (device) {
                        console.log(device);
                        dispatch(openDevice(device));
                        dispatch(operateDFU());
                    } else {
                        logger.error('No device was found.');
                    }
                });
            });
    };
}

// Write files to target device
export function write() {
    return async (dispatch, getState) => {
        const fileRegions = getState().app.file.regions;
        const memMap = getState().app.file.memMaps[0][1];
        const deviceInfo = getState().app.target.deviceInfo;
        const hwVersion = parseInt(deviceInfo.family.slice(3), 10);
        const userInput = getState().app.target.userInput;
        let dfuImages = getState().app.target.dfuImages;

        dfuImages = dfuImages.map(image => handleImage(image, fileRegions, memMap));
        dfuImages = dfuImages.map(image => handleHwVersion(image, hwVersion));
        dfuImages = dfuImages.map(image => handleSdReq(image, memMap, deviceInfo));
        dfuImages = dfuImages.map(image => handleUserInput(image, userInput));
        dfuImages = dfuImages.map(image => handleHash(image, initPacket.HashType.SHA256));
        dispatch(targetActions.dfuImagesUpdateAction(dfuImages));
        dispatch(operateDFU());
    };
}
