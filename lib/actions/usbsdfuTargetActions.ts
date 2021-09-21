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
 * THIS SOFTWARE, EVEN IF ADxVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable import/no-cycle */

import nrfdl, { Device, Error } from '@nordicsemiconductor/nrf-device-lib-js';
import AdmZip from 'adm-zip';
import Crypto from 'crypto';
import MemoryMap from 'nrf-intel-hex';
import path from 'path';
import { DfuTransportUsbSerial } from 'pc-nrf-dfu-js';
import { logger } from 'pc-nrfconnect-shared';
import tmp from 'tmp';

import {
    dfuImagesUpdate,
    loadingEnd,
    targetInfoKnown,
    targetPortChanged,
    targetRegionsKnown,
    targetTypeKnown,
    targetWritableKnown,
    writingEnd,
    writingStart,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import {
    targetWarningRemove,
    userWarningRemove,
} from '../reducers/warningReducer';
import {
    CommunicationType,
    context,
    DeviceDefinition,
    getDeviceFromNrfdl,
    getDeviceInfoByUSB,
    NordicFwIds,
} from '../util/devices';
import * as initPacket from '../util/initPacket';
import portPath from '../util/portPath';
import {
    defaultRegion,
    getSoftDeviceId,
    Region,
    RegionColor,
    RegionName,
    RegionPermission,
} from '../util/regions';
import * as fileActions from './fileActions';
import * as targetActions from './targetActions';
import * as userInputActions from './userInputActions';

function createDfuZip(dfuImages: initPacket.DfuImage[]) {
    return new Promise(resolve => {
        const data = createDfuDataFromImages(dfuImages);
        const zip = new AdmZip();
        const manifest = { application: {}, softdevice: {} };

        if (data.application) {
            manifest.application = {
                bin_file: 'application.bin',
                dat_file: 'application.dat',
            };
            zip.addFile('application.bin', data.application.bin);
            zip.addFile('application.dat', data.application.dat);
        }

        if (data.softdevice) {
            manifest.softdevice = {
                bin_file: 'softdevice.bin',
                dat_file: 'softdevice.dat',
            };
            zip.addFile('softdevice.bin', data.softdevice.bin);
            zip.addFile('softdevice.dat', data.softdevice.dat);
        }

        const manifestJson = JSON.stringify({ manifest });
        const manifestBuffer = Buffer.alloc(manifestJson.length, manifestJson);
        zip.addFile('manifest.json', manifestBuffer);

        resolve(zip);
    });
}

async function createDfuZipBuffer(dfuImages: initPacket.DfuImage[]) {
    const zip = await createDfuZip(dfuImages);
    const buffer = zip.toBuffer();
    return buffer;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createDfuZipFile(dfuImages: initPacket.DfuImage[]) {
    const zip = await createDfuZip(dfuImages);
    const { name: tmpPath } = tmp.dirSync();
    const zipPath = path.join(tmpPath, 'dfu_pkg.zip');

    zip.writeZip(zipPath, (err: string) => {
        logger.error(`Failed to write zip to ${zipPath} with error: ${err}`);
        return undefined;
    });

    logger.info(`Created DFU zip file at ${zipPath}`);

    return zipPath;
}

function createDfuDataFromImages(dfuImages: initPacket.DfuImage[]) {
    const extract = (image: initPacket.DfuImage) => ({
        bin: image.firmwareImage,
        dat: initPacket.createInitPacketBuffer(
            image.initPacket.fwVersion as number,
            image.initPacket.hwVersion as number,
            image.initPacket.sdReq[0] as number,
            image.initPacket.fwType as number,
            image.initPacket.sdSize as number,
            image.initPacket.blSize,
            image.initPacket.appSize,
            image.initPacket.hashType,
            image.initPacket.hash as [],
            image.initPacket.isDebug,
            image.initPacket.signatureType as number,
            image.initPacket.signature as []
        ),
    });

    const application = dfuImages.find(i => i.name === 'Application');
    const softdevice = dfuImages.find(i => i.name === 'SoftDevice');

    return {
        application: application && extract(application),
        softdevice: softdevice && extract(softdevice),
    };
}

const defaultDfuImage: initPacket.DfuImage = {
    name: '',
    initPacket: initPacket.defaultInitPacket,
    firmwareImage: undefined,
};

// Display some information about a devkit. Called on a devkit connection.
const loadDeviceInfo =
    (selectedDevice: Device) => async (dispatch: TDispatch) => {
        // const serialportPath = portPath(selectedDevice.serialport);
        dispatch(targetWarningRemove());
        dispatch(
            targetTypeKnown({
                targetType: CommunicationType.USBSDFU,
                isRecoverable: false,
            })
        );
        logger.info(
            'Using @nordicsemiconductor/nrf-device-lib-js to communicate with target through USB SDFU protocol'
        );

        const device = await getDeviceFromNrfdl(selectedDevice.serialNumber);

        try {
            // const { hardwareVersion, firmwareVersions } = await getDeviceVersions(
            //     serialportPath
            // );
            const hardwareVersion = {
                part: 337984,
                variant: 1094796080,
                memory: {
                    romSize: 1048576,
                    ramSize: 262144,
                    romPageSize: 4096,
                },
            };
            const fwInfo: nrfdl.FWInfo.ReadResult = await nrfdl.readFwInfo(
                getDeviceLibContext(),
                device.id
            );
            const deviceInfoOrigin = getDeviceInfoByUSB(hardwareVersion);
            dispatch(targetInfoKnown(deviceInfoOrigin));

            const appCoreNumber = 0;
            const coreInfo = deviceInfoOrigin.cores[appCoreNumber];

            let regions: Region[] = [];

            // Add FICR to regions
            if (coreInfo.ficrBaseAddr) {
                regions = [
                    ...regions,
                    {
                        ...defaultRegion,
                        name: RegionName.FICR,
                        version: 0,
                        startAddress: coreInfo.ficrBaseAddr,
                        regionSize: coreInfo.ficrSize,
                        permission: RegionPermission.NONE,
                    },
                ];
            }

            // Add UICR to regions
            if (coreInfo.uicrBaseAddr) {
                regions = [
                    ...regions,
                    {
                        ...defaultRegion,
                        name: RegionName.UICR,
                        version: 0,
                        startAddress: coreInfo.uicrBaseAddr,
                        regionSize: coreInfo.uicrSize,
                        permission: RegionPermission.NONE,
                    },
                ];
            }

            // Add MBR to regions
            if (coreInfo.uicrBaseAddr) {
                regions = [
                    ...regions,
                    {
                        ...defaultRegion,
                        name: RegionName.MBR,
                        version: 0,
                        startAddress: coreInfo.mbrBaseAddr,
                        regionSize: coreInfo.mbrSize,
                        color: RegionColor.MBR,
                        permission: RegionPermission.NONE,
                    },
                ];
            }

            // Add bootloader, softDevice, applications to regions
            const { image_info_list: imageInfoList } = fwInfo;
            imageInfoList.forEach((image: nrfdl.FWInfo.Image) => {
                const {
                    image_type: imageType,
                    image_location: imageLocation,
                    version,
                } = image;
                const startAddress = imageLocation.address;
                const regionSize =
                    imageType === nrfdl.NRFDL_IMAGE_TYPE_SOFTDEVICE
                        ? imageLocation.size - 0x1000
                        : imageLocation.size;
                if (regionSize === 0) return;

                const regionName =
                    {
                        [nrfdl.NRFDL_IMAGE_TYPE_BOOTLOADER]:
                            RegionName.BOOTLOADER,
                        [nrfdl.NRFDL_IMAGE_TYPE_SOFTDEVICE]:
                            RegionName.SOFTDEVICE,
                        [nrfdl.NRFDL_IMAGE_TYPE_APPLICATION]:
                            RegionName.APPLICATION,
                    }[imageType] || RegionName.NONE;
                const color =
                    {
                        [nrfdl.NRFDL_IMAGE_TYPE_BOOTLOADER]:
                            RegionColor.BOOTLOADER,
                        [nrfdl.NRFDL_IMAGE_TYPE_SOFTDEVICE]:
                            RegionColor.SOFTDEVICE,
                        [nrfdl.NRFDL_IMAGE_TYPE_APPLICATION]:
                            RegionColor.APPLICATION,
                    }[imageType] || RegionColor.NONE;
                regions = [
                    ...regions,
                    {
                        ...defaultRegion,
                        name: regionName,
                        version: version.incremental,
                        startAddress,
                        regionSize,
                        color,
                    },
                ];
            });

            dispatch(targetRegionsKnown(regions));
            dispatch(fileActions.updateFileRegions());
            dispatch(targetActions.updateTargetWritable());
            dispatch(loadingEnd());
        } catch (versionError) {
            logger.error(
                `Error when fetching device versions: ${versionError}`
            );
        }
    };

// Open device and return promise
export const openDevice = (selectedDevice: Device) => (dispatch: TDispatch) =>
    Promise.resolve(selectedDevice)
        .then(device => {
            // if (device && device.usb) {
            //     const usbdev = device.usb.device;
            //     const interfaceNumber =
            //         dfuTrigger.getDFUInterfaceNumber(usbdev);
            //     if (interfaceNumber >= 0) {
            //         logger.info(
            //             'DFU trigger interface found, changing to bootloader...'
            //         );
            //         // Unsure whether this can be removed with nrf-device-lib
            //         // dispatch(stopWatchingDevices());
            //         return detachAndWaitFor(
            //             usbdev,
            //             interfaceNumber,
            //             selectedDevice.serialNumber
            //         ).then((newDevice: Device) => {
            //             dispatch(
            //                 targetPortChanged({
            //                     serialNumber: newDevice.serialNumber,
            //                     path: portPath(newDevice.serialport),
            //                 })
            //             );
            //             // Unsure whether this can be removed with nrf-device-lib
            //             // dispatch(startWatchingDevices());
            //             return newDevice;
            //         });
            //     }
            // }
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
    return async (getState: () => RootState) => {
        const { serialNumber } = getState().app.target;
        const serialUsbTransport = new DfuTransportUsbSerial(serialNumber);
        return serialUsbTransport.abort();
        // Not yet supported
        // const device = await getDeviceFromNrfdl(serialNumber);

        // try {
        //     return await nrfdl.deviceControlReset(context, device.id);
        // } catch (e) {
        //     logger.error(`${e.origin} - ${e.message} (${e.error_code})`);
        // }
    };
}

// Create DFU image by given region name and firmware type
function createDfuImage(regionName: string, fwType: number) {
    const initPacketInUse = {
        ...initPacket.defaultInitPacket,
        fwType,
    };
    const dfuImage: initPacket.DfuImage = {
        ...defaultDfuImage,
        name: regionName,
        initPacket: initPacketInUse,
    };
    return dfuImage;
}

// Create DFU image list by given detected region names
function createDfuImages() {
    let dfuImages: initPacket.DfuImage[] = [];
    return (dispatch: TDispatch, getState: () => RootState) => {
        getState().app.file.detectedRegionNames.forEach(regionName => {
            switch (regionName) {
                case RegionName.BOOTLOADER:
                    dfuImages = [
                        ...dfuImages,
                        createDfuImage(
                            regionName,
                            initPacket.FwType.BOOTLOADER
                        ),
                    ];
                    break;
                case RegionName.SOFTDEVICE:
                    dfuImages = [
                        ...dfuImages,
                        createDfuImage(
                            regionName,
                            initPacket.FwType.SOFTDEVICE
                        ),
                    ];
                    break;
                case RegionName.APPLICATION:
                    dfuImages = [
                        ...dfuImages,
                        createDfuImage(
                            regionName,
                            initPacket.FwType.APPLICATION
                        ),
                    ];
                    break;
                default:
                    break;
            }
        });
        dispatch(dfuImagesUpdate(dfuImages));
    };
}

// Check if the files can be written to the target device
export function canWrite() {
    return (dispatch: TDispatch, getState: () => RootState) => {
        // Disable write button
        dispatch(targetWritableKnown(false));
        dispatch(targetWarningRemove());

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
        dispatch(targetWarningRemove());
        dispatch(targetWritableKnown(true));
    };
}

// Calculate hash 256
function calculateSHA256Hash(image: MemoryMap) {
    const digest = Crypto.createHash('sha256');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

// Calculate hash 512
function calculateSHA512Hash(image: MemoryMap) {
    const digest = Crypto.createHash('sha512');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
}

// Update firmware image and its length
function handleImage(
    image: initPacket.DfuImage,
    regions: Region[],
    memMap: MemoryMap
) {
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
        if (region?.startAddress === 0x1000) {
            sdReq = [0x00];
        }
    } else {
        throw new Error('Firmware type is unknown when setting firmware size.');
    }

    const firmwareImage = memMap.slicePad(
        region?.startAddress as number,
        Math.ceil((region?.regionSize as number) / 4) * 4
    );
    return {
        ...image,
        firmwareImage,
        initPacket: {
            ...image.initPacket,
            [fwSizeStr]: firmwareImage.size,
            sdReq,
        },
    };
}

// Update hardware version
function handleHwVersion(image: initPacket.DfuImage, hwVersion: number) {
    return {
        ...image,
        initPacket: {
            ...image.initPacket,
            hwVersion,
        },
    };
}

// Update SoftDevice required version
function handleSdReq(
    image: initPacket.DfuImage,
    fileMemMap: MemoryMap,
    deviceInfo: DeviceDefinition
) {
    // If sdReq is already set, then do not handle it.
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

    return {
        ...image,
        initPacket: {
            ...image.initPacket,
            sdReq,
        },
    };
}

// Update init packet with user input
function handleUserInput(imageInput: initPacket.DfuImage) {
    return async (dispatch: TDispatch) => {
        let image = imageInput;
        let sdReq;

        if (image.name.startsWith(RegionName.APPLICATION)) {
            // Handle sdReq
            if (!image.initPacket.sdReq) {
                const message =
                    'Please select the SoftDevice required by the application firmware:';
                sdReq = await userInputActions.getUserInput(
                    dispatch,
                    message,
                    NordicFwIds
                );
                sdReq = typeof sdReq === 'string' ? parseInt(sdReq, 16) : sdReq;
            }
        }
        image = sdReq
            ? ({
                  ...image,
                  initPacket: {
                      ...image.initPacket,
                      sdReq: [sdReq],
                  },
              } as initPacket.DfuImage)
            : image;

        return image;
    };
}

// Update calculated hash regarding to the DFU image
function handleHash(image: initPacket.DfuImage, hashType: number) {
    let hash;
    switch (hashType) {
        case initPacket.HashType.NO_HASH:
            logger.error('No hash is not supported');
            break;
        case initPacket.HashType.SHA128:
            logger.error('Hash type SHA128 is not supported');
            break;
        case initPacket.HashType.SHA256:
            hash = calculateSHA256Hash(image.firmwareImage as MemoryMap);
            logger.info('Hash is generated by SHA256');
            break;
        case initPacket.HashType.SHA512:
            hash = calculateSHA512Hash(image.firmwareImage as MemoryMap);
            logger.info('Hash is generated by SHA512');
            break;
        case initPacket.HashType.CRC:
            logger.error('Hash type CRC is not supported');
            break;
        default:
            logger.error('Unknown hash type');
    }

    return {
        ...image,
        initPacket: {
            ...image.initPacket,
            hashType,
            hash,
        },
    } as initPacket.DfuImage;
}

// Write files to target device
export function write() {
    return async (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(targetWarningRemove());
        dispatch(userWarningRemove());
        dispatch(fileActions.updateFileBlRegion());
        dispatch(fileActions.updateFileAppRegions());
        dispatch(createDfuImages());

        const fileRegions = getState().app.file.regions;
        const fileMemMaps = getState().app.file.memMaps;
        const fileOverlaps = MemoryMap.overlapMemoryMaps(fileMemMaps);
        const fileMemMap = MemoryMap.flattenOverlaps(fileOverlaps);
        const { deviceInfo } = getState().app.target;
        const hwVersion = parseInt(deviceInfo?.family.slice(3), 10);
        let { dfuImages } = getState().app.target;

        dfuImages = dfuImages?.map(image =>
            handleImage(image, fileRegions, fileMemMap)
        );
        dfuImages = dfuImages?.map(image => handleHwVersion(image, hwVersion));
        dfuImages = dfuImages?.map(image =>
            handleSdReq(image, fileMemMap, deviceInfo as DeviceDefinition)
        );
        dfuImages = dfuImages?.map(image =>
            handleHash(image, initPacket.HashType.SHA256)
        );
        dfuImages = await Promise.all(
            dfuImages?.map(async image =>
                dispatch(await handleUserInput(image))
            ) as Promise<initPacket.DfuImage>[]
        );
        dispatch(dfuImagesUpdate(dfuImages));

        // Start writing after handling images since user may cancel userInput
        logger.info('Performing DFU. This may take a few seconds');
        dispatch(writingStart());

        // Unsure whether this can be removed with nrf-device-lib
        // Stop watching devices during the DFU
        // dispatch(stopWatchingDevices());

        const { serialNumber } = getState().app.target;
        const { id: deviceId } = await getDeviceFromNrfdl(
            serialNumber as string
        );
        const zipBuffer = await createDfuZipBuffer(dfuImages);

        let prevPercentage: number;

        nrfdl.firmwareProgram(
            getDeviceLibContext(),
            deviceId,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_SDFU_ZIP',
            zipBuffer,
            (err: Error) => {
                if (err) {
                    if (
                        err.error_code ===
                        nrfdl.NRFDL_ERR_SDFU_EXT_SD_VERSION_FAILURE
                    ) {
                        logger.error('Failed to write to the target device');
                        logger.error(
                            'The required SoftDevice version does not match'
                        );
                    } else {
                        logger.error(err);
                    }
                } else {
                    logger.info(
                        'All dfu images have been written to the target device'
                    );
                }
                // Unsure whether this can be removed with nrf-device-lib
                // dispatch(startWatchingDevices());
                dispatch(writingEnd());
            },
            ({ progressJson: progress }: nrfdl.Progress) => {
                // Don't repeat percentage steps that have already been logged.
                if (prevPercentage !== progress.progress_percentage) {
                    const status = `${progress.message.replace('.', ':')} ${
                        progress.progress_percentage
                    }%`;
                    logger.info(status);
                    prevPercentage = progress.progress_percentage;
                }
            }
        );
    };
}
