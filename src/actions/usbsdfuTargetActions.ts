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
import Crypto from 'crypto';
import fs from 'fs';
import MemoryMap from 'nrf-intel-hex';
import {
    getDeviceLibContext,
    logger,
    sdfuOperations,
    startWatchingDevices,
    stopWatchingDevices,
    waitForDevice,
} from 'pc-nrfconnect-shared';

import {
    dfuImagesUpdate,
    loadingEnd,
    targetInfoKnown,
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
    DeviceDefinition,
    getDeviceInfoByUSB,
    NordicFwIds,
} from '../util/devices';
import * as initPacket from '../util/initPacket';
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

const defaultDfuImage: initPacket.DfuImage = {
    name: '',
    initPacket: initPacket.defaultInitPacket,
    firmwareImage: undefined,
};

/**
 * Display some information about a devkit. Called on a devkit connection.
 *
 * @returns {Promise<void>} resolved promise
 */
export const openDevice =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
        const { device: inputDevice } = getState().app.target;
        const device = inputDevice as Device;

        dispatch(targetWarningRemove());
        dispatch(
            targetTypeKnown({
                targetType: CommunicationType.USBSDFU,
                isRecoverable: false,
            })
        );
        logger.info(
            'Using @nordicsemiconductor/nrf-device-lib-js to communicate with target via USB SDFU protocol'
        );

        try {
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
            const { imageInfoList } = fwInfo;
            imageInfoList.forEach((image: nrfdl.FWInfo.Image) => {
                // TODO: fix type in nrfdl
                const { image_type: imageType, imageLocation, version } = image;
                const startAddress = imageLocation.address;
                const regionSize =
                    // TODO: fix type in nrfdl
                    imageType === 'NRFDL_IMAGE_TYPE_SOFTDEVICE'
                        ? imageLocation.size - 0x1000
                        : imageLocation.size;
                if (regionSize === 0) return;

                const regionName =
                    {
                        // TODO: fix type in nrfdl
                        [nrfdl.NRFDL_IMAGE_TYPE_BOOTLOADER]:
                            RegionName.BOOTLOADER,
                        [nrfdl.NRFDL_IMAGE_TYPE_SOFTDEVICE]:
                            RegionName.SOFTDEVICE,
                        [nrfdl.NRFDL_IMAGE_TYPE_APPLICATION]:
                            RegionName.APPLICATION,
                    }[imageType] || RegionName.NONE;
                const color =
                    {
                        // TODO: fix type in nrfdl
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
                        version,
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
        } catch (versionError: Error) {
            logger.error(
                `Error when fetching device versions: ${
                    versionError.message || versionError
                }`
            );
        }
    };

/**
 * Reset device to Application mode
 * @returns {Promise<void>} resolved promise
 */
export const resetDevice =
    () => async (_: TDispatch, getState: () => RootState) => {
        const { device: inputDevice } = getState().app.target;
        const device = inputDevice as Device;

        nrfdl.deviceControlReset(getDeviceLibContext(), device.id);
    };

/**
 * Create DFU image by given region name and firmware type
 * @param {string} regionName the name of region
 * @param {number} fwType the type of firmware
 * @returns {Promise<void>} resolved promise
 */
const createDfuImage = (regionName: string, fwType: number) => {
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
};

/**
 * Create DFU image list by given detected region names
 *
 * @returns {Promise<void>} resolved promise
 */
const createDfuImages =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        let dfuImages: initPacket.DfuImage[] = [];
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

/**
 * Check if the files can be written to the target device
 *
 * @returns {Promise<void>} resolved promise
 */
export const canWrite =
    () => (dispatch: TDispatch, getState: () => RootState) => {
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

/**
 * Calculate hash 256
 *
 * @param {MemoryMap} image the input memory map
 * @returns {Buffer} the calculated hash
 */
const calculateSHA256Hash = (image: MemoryMap) => {
    const digest = Crypto.createHash('sha256');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
};

/**
 * Calculate hash 512
 *
 * @param {MemoryMap} image the input memory map
 * @returns {Buffer} the calculated hash
 */
const calculateSHA512Hash = (image: MemoryMap) => {
    const digest = Crypto.createHash('sha512');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
};

/**
 * Update firmware image and its length
 *
 * @param {initPacket.DfuImage} image the DFU image
 * @param {Region[]} regions the list of region
 * @param {MemoryMap} memMap the memory map of firmware
 * @returns {initPacket.DfuImage} the updated DFU image
 */
const handleImage = (
    image: initPacket.DfuImage,
    regions: Region[],
    memMap: MemoryMap
) => {
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
            [fwSizeStr]: firmwareImage.length,
            sdReq,
        },
    };
};

/**
 * Update hardware version
 *
 * @param {initPacket.DfuImage} image the DFU image
 * @param {number} hwVersion the version of hardware
 * @returns {initPacket.DfuImage} the updated DFU image
 */
const handleHwVersion = (image: initPacket.DfuImage, hwVersion: number) => ({
    ...image,
    initPacket: {
        ...image.initPacket,
        hwVersion,
    },
});

/**
 * Update SoftDevice required version
 *
 * @param {initPacket.DfuImage} image the DFU image
 * @param {MemoryMap} fileMemMap the memory map loaded from the file
 * @param {DeviceDefinition} deviceInfo the information of device
 * @returns {initPacket.DfuImage} the updated DFU image
 */
const handleSdReq = (
    image: initPacket.DfuImage,
    fileMemMap: MemoryMap,
    deviceInfo: DeviceDefinition
) => {
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
};

/**
 * Update init packet with user input
 *
 * @param {initPacket.DfuImage} imageInput the DFU image
 * @returns {initPacket.DfuImage} the updated DFU image
 */
const handleUserInput = (imageInput: initPacket.DfuImage) => {
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
};

/**
 * Update calculated hash regarding to the DFU image
 *
 * @param {initPacket.DfuImage} image the DFU image
 * @param {number} hashType the type of hash
 * @returns {initPacket.DfuImage} the updated DFU image
 */
const handleHash = (image: initPacket.DfuImage, hashType: number) => {
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
};

/**
 * Operate DFU process with update all the images on the target device
 *
 * @param {number} deviceId the Id of device
 * @param {initPacket.DfuImage[]} inputDfuImages the list of DFU image
 *
 * @returns {Promise<void>} resolved promise
 */
const operateDFU = async (
    deviceId: number,
    inputDfuImages: initPacket.DfuImage[]
) => {
    const zipBuffer = await sdfuOperations.createDfuZipBuffer(inputDfuImages);
    fs.writeFileSync('/tmp/sdfu.zip', zipBuffer);

    let prevPercentage: number;

    return new Promise(resolve =>
        nrfdl.firmwareProgram(
            getDeviceLibContext(),
            deviceId,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_SDFU_ZIP',
            zipBuffer,
            (error?: Error) => {
                if (error) {
                    if (
                        error.error_code ===
                        nrfdl.NRFDL_ERR_SDFU_EXT_SD_VERSION_FAILURE
                    ) {
                        logger.error('Failed to write to the target device');
                        logger.error(
                            'The required SoftDevice version does not match'
                        );
                    } else {
                        logger.error(error);
                    }
                    throw error;
                } else {
                    // if (restImages.length === 0) {
                    logger.info(
                        'All dfu images have been written to the target device'
                    );
                    resolve();
                    // return;
                    // }
                    // return operateDFU(deviceId, restImages);
                }
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
        )
    );
};

/**
 * Write files to target device
 *
 * @returns {Promise<void>} resolved promise
 */
export const write =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
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

        stopWatchingDevices();
        try {
            const { device } = getState().app.target;
            if (!device) throw Error(`Failed to write due to device not found`);
            await operateDFU(device.id, dfuImages);
            dispatch(writingEnd());
            startWatchingDevices();
            const reconnectedDevice = await waitForDevice(device.serialNumber);
            dispatch(targetActions.openDevice(reconnectedDevice));
        } catch (error) {
            logger.error(`Failed to write: ${error}`);
        }
    };
