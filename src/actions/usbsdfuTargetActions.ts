/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    deviceControlReset,
    Error,
    firmwareProgram,
    FWInfo,
    Progress,
    readFwInfo,
} from '@nordicsemiconductor/nrf-device-lib-js';
import Crypto from 'crypto';
import MemoryMap from 'nrf-intel-hex';
import {
    AppThunk,
    defaultInitPacket,
    describeError,
    Device,
    DfuImage,
    FwType,
    getDeviceLibContext,
    HashType,
    logger,
    sdfuOperations,
    setWaitForDevice,
    switchToBootloaderMode,
    usageData,
} from 'pc-nrfconnect-shared';

import { FileState } from '../reducers/fileReducer';
import {
    loadingEnd,
    targetInfoKnown,
    targetRegionsKnown,
    targetWritableKnown,
    writingEnd,
    writingStart,
} from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import {
    DeviceDefinition,
    DeviceFamily,
    getDeviceInfoByUSB,
    NordicFwIds,
} from '../util/devices';
import {
    defaultRegion,
    getSoftDeviceId,
    Region,
    RegionColor,
    RegionName,
    RegionPermission,
} from '../util/regions';
import {
    updateFileAppRegions,
    updateFileBlRegion,
    updateFileRegions,
} from './regionsActions';
import EventAction from './usageDataActions';
import * as userInputActions from './userInputActions';

const defaultDfuImage: DfuImage = {
    name: '',
    initPacket: defaultInitPacket,
    firmwareImage: Buffer.alloc(0),
};

export const openDevice =
    (device: Device): AppThunk =>
    dispatch => {
        logger.info(
            'Using @nordicsemiconductor/nrf-device-lib-js to communicate with target via USB SDFU protocol'
        );
        usageData.sendUsageData(
            EventAction.OPEN_DEVICE_FAMILY,
            DeviceFamily.NRF52
        );
        usageData.sendUsageData(EventAction.OPEN_DEVICE_VERSION, 'nRF52840');
        usageData.sendUsageData(
            EventAction.OPEN_DEVICE_BOARD_VERSION,
            'PCA10059'
        );

        dispatch(refreshMemoryLayout(device));
    };

const refreshMemoryLayout =
    (device: Device): AppThunk =>
    dispatch => {
        dispatch(
            switchToBootloaderMode(
                device,
                async deviceInBootLoader => {
                    const fwInfo: FWInfo.ReadResult = await readFwInfo(
                        getDeviceLibContext(),
                        deviceInBootLoader.id
                    );
                    const deviceInfo = getDeviceInfoByUSB(deviceInBootLoader);
                    dispatch(targetInfoKnown(deviceInfo));

                    const appCoreNumber = 0;
                    const coreInfo = deviceInfo.cores[appCoreNumber];

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
                    imageInfoList.forEach((image: FWInfo.Image) => {
                        const { imageType, imageLocation, version } = image;

                        if (!imageLocation) return;

                        const startAddress = imageLocation.address;
                        const regionSize =
                            imageType === 'NRFDL_IMAGE_TYPE_SOFTDEVICE'
                                ? imageLocation.size - 0x1000
                                : imageLocation.size;

                        if (regionSize === 0) return;

                        const regionName =
                            (<
                                Partial<{
                                    [key in FWInfo.ImageType]: RegionName;
                                }>
                            >{
                                NRFDL_IMAGE_TYPE_BOOTLOADER:
                                    RegionName.BOOTLOADER,
                                NRFDL_IMAGE_TYPE_SOFTDEVICE:
                                    RegionName.SOFTDEVICE,
                                NRFDL_IMAGE_TYPE_APPLICATION:
                                    RegionName.APPLICATION,
                            })[imageType] || RegionName.NONE;

                        const color =
                            (<
                                Partial<{
                                    [key in FWInfo.ImageType]: RegionColor;
                                }>
                            >{
                                NRFDL_IMAGE_TYPE_BOOTLOADER:
                                    RegionColor.BOOTLOADER,
                                NRFDL_IMAGE_TYPE_SOFTDEVICE:
                                    RegionColor.SOFTDEVICE,
                                NRFDL_IMAGE_TYPE_APPLICATION:
                                    RegionColor.APPLICATION,
                            })[imageType] || RegionColor.NONE;

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
                    dispatch(updateFileRegions());
                    dispatch(canWrite());
                    dispatch(loadingEnd());
                },
                error => {
                    logger.error(
                        `Error when fetching device versions: ${describeError(
                            error
                        )}`
                    );
                }
            )
        );
    };

export const resetDevice = (device: Device) =>
    deviceControlReset(getDeviceLibContext(), device.id).then(() => {
        logger.info(`Resetting device completed`);
    });

/**
 * Create DFU image by given region name and firmware type
 * @param {string} regionName the name of region
 * @param {number} fwType the type of firmware
 * @returns {Promise<void>} resolved promise
 */
const createDfuImage = (regionName: string, fwType: number) => {
    const initPacketInUse = {
        ...defaultInitPacket,
        fwType,
    };
    const dfuImage: DfuImage = {
        ...defaultDfuImage,
        name: regionName,
        initPacket: initPacketInUse,
    };
    return dfuImage;
};

const createDfuImages = (file: FileState) => {
    const dfuImages: DfuImage[] = [];
    file.detectedRegionNames.forEach(regionName => {
        switch (regionName) {
            case RegionName.BOOTLOADER:
                dfuImages.push(createDfuImage(regionName, FwType.BOOTLOADER));
                break;
            case RegionName.SOFTDEVICE:
                dfuImages.push(createDfuImage(regionName, FwType.SOFTDEVICE));
                break;
            case RegionName.APPLICATION:
                dfuImages.push(createDfuImage(regionName, FwType.APPLICATION));
                break;
            default:
                break;
        }
    });

    return dfuImages;
};
/**
 * Check if the files can be written to the target device
 *
 * @returns {Promise<void>} resolved promise
 */
export const canWrite = (): AppThunk => (dispatch, getState) => {
    // Disable write button
    dispatch(targetWritableKnown(false));

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
    dispatch(targetWritableKnown(true));
};

/**
 * Calculate hash 256
 *
 * @param {MemoryMap} image the input memory map
 * @returns {Buffer} the calculated hash
 */
const calculateSHA256Hash = (image = new Uint8Array()) => {
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
const calculateSHA512Hash = (image = new Uint8Array()) => {
    const digest = Crypto.createHash('sha512');
    digest.update(image);
    return Buffer.from(digest.digest().reverse());
};

/**
 * Update firmware image and its length
 *
 * @param {DfuImage} image the DFU image
 * @param {Region[]} regions the list of region
 * @param {MemoryMap} memMap the memory map of firmware
 * @returns {DfuImage} the updated DFU image
 */
const handleImage = (
    image: DfuImage,
    regions: Region[],
    memMap: MemoryMap
): DfuImage => {
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
 * @param {DfuImage} image the DFU image
 * @param {number} hwVersion the version of hardware
 * @returns {DfuImage} the updated DFU image
 */
const handleHwVersion = (image: DfuImage, hwVersion: number): DfuImage => ({
    ...image,
    initPacket: {
        ...image.initPacket,
        hwVersion,
    },
});

/**
 * Update SoftDevice required version
 *
 * @param {DfuImage} image the DFU image
 * @param {MemoryMap} fileMemMap the memory map loaded from the file
 * @param {DeviceDefinition} deviceInfo the information of device
 * @returns {DfuImage} the updated DFU image
 */
const handleSdReq = (
    image: DfuImage,
    fileMemMap: MemoryMap,
    deviceInfo: DeviceDefinition
): DfuImage => {
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
 * @param {DfuImage} imageInput the DFU image
 * @returns {DfuImage} the updated DFU image
 */
const handleUserInput =
    (imageInput: DfuImage): AppThunk<RootState, Promise<DfuImage>> =>
    async dispatch => {
        let image = imageInput;
        let sdReq;

        if (image.name.startsWith(RegionName.APPLICATION)) {
            // Handle sdReq
            if (!image.initPacket.sdReq) {
                const message =
                    'Please select the SoftDevice required by the application firmware:';
                sdReq = await dispatch(
                    userInputActions.getUserInput(message, NordicFwIds)
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
              } as DfuImage)
            : image;

        return image;
    };

/**
 * Update calculated hash regarding to the DFU image
 *
 * @param {DfuImage} image the DFU image
 * @param {number} hashType the type of hash
 * @returns {DfuImage} the updated DFU image
 */
const handleHash = (image: DfuImage, hashType: number): DfuImage => {
    let hash;
    switch (hashType) {
        case HashType.NO_HASH:
            logger.error('No hash is not supported');
            break;
        case HashType.SHA128:
            logger.error('Hash type SHA128 is not supported');
            break;
        case HashType.SHA256:
            hash = calculateSHA256Hash(image.firmwareImage);
            logger.info('Hash is generated by SHA256');
            break;
        case HashType.SHA512:
            hash = calculateSHA512Hash(image.firmwareImage);
            logger.info('Hash is generated by SHA512');
            break;
        case HashType.CRC:
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
    } as DfuImage;
};

const nrfdlErrorSdfuExtSdVersionFailure = (error: unknown) =>
    (error as { error_code: number }).error_code === 514;

const operateDFU = async (device: Device, inputDfuImages: DfuImage[]) => {
    const zipBuffer = await sdfuOperations.createDfuZipBuffer(inputDfuImages);

    let prevPercentage: number;

    return new Promise<void>((resolve, reject) => {
        firmwareProgram(
            getDeviceLibContext(),
            device.id,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_SDFU_ZIP',
            zipBuffer,
            (error?: Error) => {
                if (error) {
                    if (nrfdlErrorSdfuExtSdVersionFailure(error)) {
                        logger.error('Failed to write to the target device');
                        logger.error(
                            'The required SoftDevice version does not match'
                        );
                    } else {
                        logger.error(describeError(error));
                    }
                    reject(error);
                } else {
                    logger.info(
                        'All dfu images have been written to the target device'
                    );
                    resolve();
                }
            },
            ({ progressJson: progress }: Progress.CallbackParameters) => {
                // Don't repeat percentage steps that have already been logged.
                if (prevPercentage === progress.progressPercentage) {
                    return;
                }

                const message = progress.message || '';

                const status = `${message.replace('.', ':')} ${
                    progress.progressPercentage
                }%`;

                logger.info(status);
                prevPercentage = progress.progressPercentage;
            }
        );
    });
};

export const write =
    (device: Device): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        dispatch(updateFileBlRegion());
        dispatch(updateFileAppRegions());
        const dfuImages = createDfuImages(getState().app.file);

        const fileRegions = getState().app.file.regions;
        const fileMemMaps = getState().app.file.memMaps;
        const fileOverlaps = MemoryMap.overlapMemoryMaps(fileMemMaps);
        const fileMemMap = MemoryMap.flattenOverlaps(fileOverlaps);
        const { deviceInfo } = getState().app.target;
        const hwVersion = parseInt(deviceInfo?.family?.slice(3) ?? '0', 10);

        let images = dfuImages
            ?.map(image => handleImage(image, fileRegions, fileMemMap))
            .map(image => handleHwVersion(image, hwVersion))
            .map(image =>
                handleSdReq(image, fileMemMap, deviceInfo as DeviceDefinition)
            )
            .map(image => handleHash(image, HashType.SHA256));
        images = await Promise.all(
            images?.map(async image =>
                dispatch(await handleUserInput(image))
            ) as Promise<DfuImage>[]
        );

        // Start writing after handling images since user may cancel userInput
        logger.info('Performing DFU. This may take a few seconds');
        dispatch(writingStart());

        try {
            // We might have more that one reboot of the device during the next operation
            dispatch(
                setWaitForDevice({
                    timeout: 10000,
                    when: 'always',
                    once: false,
                })
            );
            await operateDFU(device, images);
            dispatch(writingEnd());

            // Operation done reconnect one more time only
            dispatch(
                setWaitForDevice({
                    timeout: 10000,
                    when: 'always',
                    once: true,
                    onSuccess: programmedDevice =>
                        dispatch(refreshMemoryLayout(programmedDevice)),
                })
            );
        } catch (error) {
            logger.error(`Failed to write: ${describeError(error)}`);
            dispatch(writingEnd());
            dispatch(refreshMemoryLayout(device));
        }
    };
