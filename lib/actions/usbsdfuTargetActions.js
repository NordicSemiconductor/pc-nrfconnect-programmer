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

/* eslint-disable import/no-cycle */

import Crypto from 'crypto';

import { List, Record } from 'immutable';
import {
    detachAndWaitFor,
    dfuTrigger,
    initPacket,
    waitForDevice,
} from 'nrf-device-setup';
import MemoryMap from 'nrf-intel-hex';
import {
    logger,
    startWatchingDevices,
    stopWatchingDevices,
} from 'nrfconnect/core';
import {
    DfuOperation,
    DfuTransportSerial,
    DfuTransportUsbSerial,
    DfuUpdates,
    ErrorCode,
} from 'pc-nrf-dfu-js';
import SerialPort from 'serialport';

import {
    CommunicationType,
    NordicFwIds,
    getDeviceInfoByUSB,
} from '../util/devices';
import {
    Region,
    RegionColor,
    RegionName,
    RegionPermission,
    getSoftDeviceId,
} from '../util/regions';
import * as fileActions from './fileActions';
import * as targetActions from './targetActions';
import * as userInputActions from './userInputActions';
import * as warningActions from './warningActions';
import portPath from '../util/portPath';

const { InitPacket } = initPacket;
const DfuImage = new Record({
    name: null,
    initPacket: new InitPacket(),
    firmwareImage: null,
});

// Get device versions by calling version command
const getDeviceVersions = async path => {
    const port = new SerialPort(path, { baudRate: 115200, autoOpen: false });
    return new Promise(async resolve => {
        const serialTransport = new DfuTransportSerial(port, 0);
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
};

// Display some information about a devkit. Called on a devkit connection.
const loadDeviceInfo = selectedDevice => async dispatch => {
    const path = portPath(selectedDevice.serialport);
    dispatch(warningActions.targetWarningRemoveAction());
    dispatch(targetActions.targetTypeKnownAction(CommunicationType.USBSDFU, false));
    logger.info('Using USB SDFU protocol to communicate with target');

    try {
        const { hardwareVersion, firmwareVersions } = await getDeviceVersions(path);
        const deviceInfoOrigin = getDeviceInfoByUSB(hardwareVersion);
        dispatch(targetActions.targetInfoKnownAction(deviceInfoOrigin));

        const coreInfo = deviceInfoOrigin.cores[0];

        let regions = new List();

        // Add FICR to regions
        if (coreInfo.ficrBaseAddr) {
            regions = regions.push(new Region({
                name: 'FICR',
                version: 0,
                startAddress: coreInfo.ficrBaseAddr,
                regionSize: coreInfo.ficrSize,
                permission: RegionPermission.NONE,
            }));
        }

        // Add UICR to regions
        if (coreInfo.uicrBaseAddr) {
            regions = regions.push(new Region({
                name: 'UICR',
                version: 0,
                startAddress: coreInfo.uicrBaseAddr,
                regionSize: coreInfo.uicrSize,
                permission: RegionPermission.NONE,
            }));
        }

        // Add MBR to regions
        if (coreInfo.uicrBaseAddr) {
            regions = regions.push(new Region({
                name: 'MBR',
                version: 0,
                startAddress: coreInfo.mbrBaseAddr,
                regionSize: coreInfo.mbrSize,
                color: RegionColor.MBR,
                permission: RegionPermission.NONE,
            }));
        }

        // Add bootloader, softDevice, applications to regions
        firmwareVersions.forEach(firmwareVersion => {
            const { imageType } = firmwareVersion;
            const regionSize = imageType === RegionName.SOFTDEVICE
                ? firmwareVersion.length - 0x1000 : firmwareVersion.length;

            const regionColor = {
                [RegionName.BOOTLOADER]: RegionColor.BOOTLOADER,
                [RegionName.SOFTDEVICE]: RegionColor.SOFTDEVICE,
                [RegionName.APPLICATION]: RegionColor.APPLICATION,
            }[imageType] || RegionColor.NONE;

            regions = regions.push(new Region({
                name: imageType,
                version: firmwareVersion.version,
                startAddress: firmwareVersion.addr,
                regionSize,
                color: regionColor,
            }));
        });

        dispatch(targetActions.targetRegionsKnownAction(regions));
        dispatch(fileActions.updateFileRegions());
        dispatch(targetActions.updateTargetWritable());
        dispatch(targetActions.loadingEndAction());
    } catch (versionError) {
        logger.error(`Error when fetching device versions: ${versionError}`);
    }
};

// Open device and return promise
export const openDevice = selectedDevice => dispatch => Promise.resolve(selectedDevice)
    .then(device => {
        if (device && device.usb) {
            const usbdev = device.usb.device;
            const interfaceNumber = dfuTrigger.getDFUInterfaceNumber(usbdev);
            if (interfaceNumber >= 0) {
                logger.info('DFU trigger interface found, changing to bootloader...');
                dispatch(stopWatchingDevices());
                return detachAndWaitFor(usbdev, interfaceNumber, selectedDevice.serialNumber)
                    .then(newDevice => {
                        dispatch(targetActions.targetPortChangedAction(
                            newDevice.serialNumber, portPath(newDevice.serialport),
                        ));
                        dispatch(startWatchingDevices());
                        return newDevice;
                    });
            }
        }
        return device;
    })
    .then(device => dispatch(loadDeviceInfo(device)))
    .catch(error => {
        logger.error(error.message || error);
        dispatch({
            type: 'DEVICE_DESELECTED',
        });
    });

// Reset device to Application mode
export function resetDevice() {
    return (dispatch, getState) => {
        const { serialNumber } = getState().app.target;
        const serialUsbTransport = new DfuTransportUsbSerial(serialNumber);
        return serialUsbTransport.abort();
    };
}

// Create DFU image by given region name and firmware type
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

// Create DFU image list by given detected region names
function createDfuImages() {
    let dfuImages = new List();
    return (dispatch, getState) => {
        getState().app.file.detectedRegionNames.forEach(regionName => {
            switch (regionName) {
                case RegionName.BOOTLOADER:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.BOOTLOADER),
                    );
                    break;
                case RegionName.SOFTDEVICE:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.SOFTDEVICE),
                    );
                    break;
                case RegionName.APPLICATION:
                    dfuImages = dfuImages.push(
                        createDfuImage(regionName, initPacket.FwType.APPLICATION),
                    );
                    break;
                default:
                    break;
            }
        });
        dispatch(targetActions.dfuImagesUpdateAction(dfuImages));
    };
}

// Check if the files can be written to the target device
export function canWrite() {
    return (dispatch, getState) => {
        // Disable write button
        dispatch(targetActions.targetWritableKnownAction(false));
        dispatch(warningActions.targetWarningRemoveAction());

        // Check if there are writable regions.
        // If not, then return.
        const { detectedRegionNames } = getState().app.file;
        if (!detectedRegionNames.size) {
            return;
        }

        // Check if any file is added
        if (!getState().app.file.memMaps.length) {
            return;
        }

        // Enable write button if all above items have been checked
        dispatch(warningActions.targetWarningRemoveAction());
        dispatch(targetActions.targetWritableKnownAction(true));
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

// Update firmware image and its length
function handleImage(image, regions, memMap) {
    if (!image.initPacket) {
        throw new Error('Init packet was not created.');
    }

    const region = regions.find(r => r.name === image.name);
    let fwSizeStr;
    let sdReq;

    if (image.name === RegionName.BOOTLOADER) {
        fwSizeStr = 'blSize';
    } else if (image.name === RegionName.SOFTDEVICE) {
        fwSizeStr = 'sdSize';
    } else if (image.name.startsWith(RegionName.APPLICATION)) {
        fwSizeStr = 'appSize';
        if (region.startAddress === 0x1000) {
            sdReq = [0x00];
        }
    } else {
        throw new Error('Firmware type is unknown when setting firmware size.');
    }

    const firmwareImage = memMap.slicePad(
        region.startAddress,
        Math.ceil(region.regionSize / 4) * 4,
    );
    return image
        .set('firmwareImage', firmwareImage)
        .setIn(['initPacket', fwSizeStr], firmwareImage.length)
        .setIn(['initPacket', 'sdReq'], sdReq);
}

// Update hardware version
function handleHwVersion(image, hwVersion) {
    return image.setIn(['initPacket', 'hwVersion'], hwVersion);
}

// Update SoftDevice required virsion
function handleSdReq(image, fileMemMap, deviceInfo) {
    // If sdReq is alread set, then do not handle it.
    if (image.initPacket.sdReq && image.initPacket.sdReq.length > 0) {
        return image;
    }

    let sdReq;

    if (image.name === RegionName.BOOTLOADER) {
        logger.info('SdReq for Bootloader is not detected. Need user input.');
    } else if (image.name === RegionName.SOFTDEVICE) {
        sdReq = [0x00];
        logger.info('SdReq for SoftDevice is set as 0x00.');
    } else if (image.name.startsWith(RegionName.APPLICATION)) {
        const sdId = getSoftDeviceId(fileMemMap, deviceInfo.cores[0]);
        sdReq = sdId ? [sdId] : undefined;
    } else {
        throw new Error('Firmware type is unknown when setting user input.');
    }

    return image.setIn(['initPacket', 'sdReq'], sdReq);
}

// Update init packet with ueser input
function handleUserInput(imageInput) {
    return async dispatch => {
        let image = imageInput;
        let sdReq;

        if (image.name.startsWith(RegionName.APPLICATION)) {
            // Handle sdReq
            if (!image.initPacket.sdReq) {
                const message = 'Please select the SoftDevice required by the application firmware:';
                sdReq = await userInputActions.getUserInput(dispatch, message, NordicFwIds);
            }
        }
        image = sdReq ? image.setIn(['initPacket', 'sdReq'], [sdReq]) : image;

        return image;
    };
}

// Update calculated hash regarding to the DFU image
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

    return image
        .setIn(['initPacket', 'hashType'], hashType)
        .setIn(['initPacket', 'hash'], hash);
}

// Operate DFU process with update all the images on the target device
function operateDFU(inputDfuImages, inputDevice) {
    if (inputDfuImages.size === 0) {
        return () => Promise.resolve(inputDevice);
    }

    const dfuImages = inputDfuImages;
    let image;
    let serialNumber;
    let serialUsbTransport;

    return (dispatch, getState) => Promise.resolve()
        // When dfu starts
        .then(() => {
            image = dfuImages.first();
            serialNumber = getState().app.target.serialNumber; // eslint-disable-line
            serialUsbTransport = new DfuTransportUsbSerial(serialNumber);
            const packet = initPacket.createInitPacketUint8Array(image.initPacket);
            const firmwareUpdates = new DfuUpdates([{
                initPacket: packet,
                firmwareImage: image.firmwareImage,
            }]);
            const dfu = new DfuOperation(firmwareUpdates, serialUsbTransport);

            dispatch(targetActions.targetWritableKnownAction(false));
            logger.info('DFU procedure starts. This may take a few seconds.');
            return dfu.start(true);
        })
        // Catch error during dfu
        .catch(async error => {
            logger.error(`DFU failed: ${error.message || error}`);

            // Notify the user to choose writable firmwares
            // The error code refers to pc-nrf-dfu-js
            if (error.code === ErrorCode.ERROR_EXT_SD_VERSION_FAILURE) {
                dispatch(warningActions.addUserWarning(
                    'The specified sdReq does not match the current SoftDevice. '
                    + 'Please select a different value.',
                ));
            }

            // Notify the user to choose writable Bootloader
            // The error code refers to pc-nrf-dfu-js
            if (error.code === ErrorCode.ERROR_EXT_SIGNATURE_MISSING) {
                dispatch(warningActions.addUserWarning(
                    'The bootloader update must be signed. The DFU operation has been cancelled.',
                ));
            }

            await serialUsbTransport.waitForDisconnect();
            throw new Error();
        })
        // Wait for the device to reattach
        .then(() => {
            logger.info(`DFU for ${dfuImages.first().name} completed successfully!`);
            logger.info(`${dfuImages.size - 1} dfu package(s) left.`);
            logger.info('Waiting for device');
            if (image.name === RegionName.BOOTLOADER
                || image.name === RegionName.SOFTDEVICE) {
                return waitForDevice(serialNumber, 5000, ['serialport']);
            }
            if (image.name.startsWith(RegionName.APPLICATION)) {
                return waitForDevice(serialNumber, 5000, ['nordicDfu']);
            }
            throw new Error('Device type is unknown when waiting for device.');
        })
        // Remove the current dfu image and continue with the next
        .then(device => dispatch(operateDFU(dfuImages.delete(0), device)))
        // Catch error when reopening device
        .catch(error => {
            if (error.message) {
                logger.error(`Reopen device failed: ${error.message || error}`);

                // Notify the user to reset the device without Nordic DFU Trigger Interface.
                // The error refers to nrf-device-setup-js
                if (error.message.startsWith('Timeout while waiting')) {
                    logger.info('Nordic DFU Trigger Interface was not found.'
                        + 'Please physically reset device.');
                    dispatch(warningActions.addUserWarning(
                        'Nordic DFU Trigger Interface was not found. '
                        + 'Please physically reset device.',
                    ));
                    return;
                }
            }

            dispatch(targetActions.updateTargetWritable());
        });
}

// Write files to target device
export function write() {
    return async (dispatch, getState) => {
        dispatch(warningActions.targetWarningRemoveAction());
        dispatch(warningActions.userWarningRemoveAction());
        dispatch(fileActions.updateFileBlRegion());
        dispatch(fileActions.updateFileAppRegions());
        dispatch(createDfuImages());

        const fileRegions = getState().app.file.regions;
        const fileMemMaps = getState().app.file.memMaps;
        const fileOverlaps = MemoryMap.overlapMemoryMaps(fileMemMaps);
        const fileMemMap = MemoryMap.flattenOverlaps(fileOverlaps);
        const { deviceInfo } = getState().app.target;
        const hwVersion = parseInt(deviceInfo.family.slice(3), 10);
        let { dfuImages } = getState().app.target;

        dfuImages = dfuImages.map(image => handleImage(image, fileRegions, fileMemMap));
        dfuImages = dfuImages.map(image => handleHwVersion(image, hwVersion));
        dfuImages = dfuImages.map(image => handleSdReq(image, fileMemMap, deviceInfo));
        dfuImages = dfuImages.map(image => handleHash(image, initPacket.HashType.SHA256));
        dfuImages = new List(await Promise.all(
            dfuImages.map(async image => dispatch(await handleUserInput(image))),
        ));
        dispatch(targetActions.dfuImagesUpdateAction(dfuImages));

        // Start writing after handling images since user may cancel userinput
        logger.info('Performing DFU. This may take a few seconds');
        dispatch(targetActions.writingStartAction());

        // Stop watching devices during the DFUs
        dispatch(stopWatchingDevices());

        dispatch(operateDFU(dfuImages))
            .then(async device => {
                // In case that DFU fails and no device is returned,
                // an error message should be displayed in log.
                // Moreover, the error should be handled during operating DFU
                // by giving a warning and description to the user.
                if (!device) {
                    logger.error('Device not found due to failure during DFU');
                    return;
                }

                // When success, wait for a while and open the device.
                await new Promise(resolve => {
                    setTimeout(() => {
                        logger.info('All dfu images have been written to the target device.');
                        dispatch(openDevice(device))
                            .then(() => dispatch(targetActions.updateTargetWritable()))
                            .then(resolve);
                    }, 1000);
                });
            })
            .then(() => {
                // Start watching devices after the DFUs are finished
                dispatch(startWatchingDevices());
                dispatch(targetActions.writingEndAction());
            });
    };
}
