/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog, getCurrentWindow } from '@electron/remote';
import fs from 'fs';
import MemoryMap, { MemoryMaps } from 'nrf-intel-hex';
import {
    AppThunk,
    describeError,
    Device,
    DeviceCore,
    getDeviceLib,
    logger,
    ProtectionStatus,
    selectedDevice,
    usageData,
} from 'pc-nrfconnect-shared';

import {
    erasingEnd,
    erasingStart,
    loadingEnd,
    loadingStart,
    targetContentsKnown,
    targetContentsUnknown,
    targetInfoKnown,
    targetRegionsKnown,
    targetWritableKnown,
    writingEnd,
    writingStart,
} from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import {
    CoreDefinition,
    DeviceDefinition,
    getDeviceInfoByJlink,
    updateCoreInfo,
} from '../util/devices';
import { getTargetRegions } from '../util/regions';
import { updateFileAppRegions, updateFileRegions } from './regionsActions';
import EventAction from './usageDataActions';

export const getProtectionStatus = (
    device: Device,
    deviceCoreName: DeviceCore
): Promise<ProtectionStatus> =>
    new Promise<ProtectionStatus>((resolve, reject) => {
        logger.info(
            `Reading readback protection status for ${deviceCoreName} core`
        );

        getDeviceLib().then(deviceLib => {
            deviceLib
                .getProtectionStatus(device, deviceCoreName)
                .then(result => {
                    logger.info(
                        `Readback protection status: ${result.protectionStatus}`
                    );
                    resolve(result.protectionStatus);
                })
                .catch(error => {
                    const errorMessage = `Failed to load readback protection status: ${describeError(
                        error
                    )}`;
                    usageData.sendErrorReport(errorMessage);
                    reject(new Error(errorMessage));
                });
        });
    });

export const openDevice =
    (
        device: Device,
        autoRead: boolean,
        autoReset: boolean
    ): AppThunk<RootState> =>
    async dispatch => {
        dispatch(loadingStart());
        logger.info(
            'Using nrfutil device to communicate with target via JLink'
        );

        logDeviceInfo(device);
        let deviceInfo = getDeviceInfoByJlink(device);
        deviceInfo = await updateCoresWithNrfdl(device, deviceInfo);

        // Update modem target info according to detected device info
        const isModem = device.traits.modem;
        if (isModem) logger.info('Modem detected');

        dispatch(targetInfoKnown(deviceInfo));
        dispatch(
            targetContentsKnown({
                targetMemMap: new MemoryMap([]),
                isMemLoaded: false,
            })
        );
        dispatch(updateTargetRegions(new MemoryMap([]), deviceInfo));

        dispatch(updateFileRegions());
        dispatch(canWrite());
        dispatch(loadingEnd());
        logger.info('Device is loaded and ready for further operation');

        if (autoRead) await dispatch(read(device, autoReset));
    };

/**
 * Log the device information
 * @param {Device} device the input device from device lister
 * @returns {void}
 */
const logDeviceInfo = (device: Device) => {
    if (!device.jlink) return;

    const {
        jlinkObFirmwareVersion,
        deviceFamily,
        deviceVersion,
        boardVersion,
    } = device.jlink;
    logger.info('JLink OB firmware version', jlinkObFirmwareVersion);
    usageData.sendUsageData(
        EventAction.OPEN_DEVICE_JLINK_OB,
        `${jlinkObFirmwareVersion}`
    );
    logger.info('Device family', deviceFamily);
    usageData.sendUsageData(EventAction.OPEN_DEVICE_FAMILY, `${deviceFamily}`);
    logger.info('Device version', deviceVersion);
    usageData.sendUsageData(
        EventAction.OPEN_DEVICE_VERSION,
        `${deviceVersion}`
    );
    logger.info('Board version', boardVersion);
    usageData.sendUsageData(
        EventAction.OPEN_DEVICE_BOARD_VERSION,
        `${boardVersion}`
    );
};

const getDeviceMemMap = async (device: Device, coreInfo: CoreDefinition) =>
    (await new Promise((resolve, reject) => {
        logger.info(`Reading memory for ${coreInfo.name} core`);
        getDeviceLib()
            .then(deviceLib =>
                deviceLib
                    .firmwareRead(device, coreInfo.name)
                    .then(hexBuffer => {
                        const hexText = hexBuffer.toString('utf8');
                        const memMap = MemoryMap.fromHex(hexText);

                        const paddedArray = memMap.slicePad(
                            0,
                            coreInfo.romBaseAddr + coreInfo.romSize
                        );
                        const paddedMemMap =
                            MemoryMap.fromPaddedUint8Array(paddedArray);
                        logger.info(
                            `Reading memory for ${coreInfo.name} core completed`
                        );
                        resolve(paddedMemMap);
                    })
                    .catch(error => {
                        usageData.sendErrorReport(
                            `Failed to get device memory map: ${describeError(
                                error
                            )}`
                        );
                        reject(error);
                    })
            )
            .catch(reject);
    })) as MemoryMap;

/*
 * Check if the files can be written to the target device
 * The typical use case is having some HEX files that use the UICR, and a DevKit
 * that doesn't allow erasing the UICR page(s). Also, the (rare) cases where the
 * nRF SoC has readback protection enabled (and the loaded HEX files write the
 * readback-protected region).
 * In all those cases, this function will return false, and the user should not be
 * able to press the "program" button.
 * There are also instances where the UICR can be erased and overwritten, but
 * unfortunately the casuistics are just too complex.
 */
export const canWrite = (): AppThunk<RootState> => (dispatch, getState) => {
    const device = selectedDevice(getState());

    if (!device) {
        dispatch(targetWritableKnown(false));
        return;
    }

    // TODO: get the UICR address from the target definition. This value
    // works for nRF51s and nRF52s, but other targets might use a different one!!!
    const appState = getState().app;
    const { isErased, isMemLoaded } = appState.target;
    const isMcuboot = !!device.traits.mcuBoot;
    const {
        memMaps: fileMemMaps,
        mcubootFilePath,
        zipFilePath,
    } = appState.file;
    const isModem = device.traits.modem;

    // If MCU is enabled and MCU firmware is detected
    if (isMcuboot && mcubootFilePath) {
        dispatch(targetWritableKnown(true));
        return;
    }

    if (zipFilePath && (isMcuboot || isModem)) {
        dispatch(targetWritableKnown(true));
        return;
    }

    // If the device has been erased or the memory has been loaded and firmware is selected
    if ((!isErased && !isMemLoaded) || !fileMemMaps.length) {
        dispatch(targetWritableKnown(false));
        return;
    }

    dispatch(targetWritableKnown(true));
};

const updateTargetRegions =
    (memMap: MemoryMap, deviceInfo: DeviceDefinition): AppThunk =>
    dispatch => {
        const memMaps: MemoryMaps = [['', memMap]];
        const regions = getTargetRegions(memMaps, deviceInfo);

        dispatch(targetRegionsKnown(regions));
        dispatch(updateFileAppRegions());
    };

export const read =
    (device: Device, autoReset: boolean): AppThunk<RootState> =>
    async (dispatch, getState) => {
        const deviceInfo = getState().app.target.deviceInfo;

        if (!deviceInfo) {
            logger.error('No device info loaded');
            return;
        }

        if (
            deviceInfo.cores.find(
                c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
            )
        ) {
            logger.info(
                'Skipped reading, since at least one core has app readback protection'
            );
            return;
        }

        dispatch(loadingStart());
        // Read from the device

        try {
            const promises = deviceInfo.cores.map(core =>
                getDeviceMemMap(device, core)
            );

            const memMap: MemoryMap[] = [];
            const p = promises.reduce((previousPromise, nextPromise) =>
                previousPromise
                    .then(map => {
                        memMap.push(map);
                        return nextPromise;
                    })
                    .catch(Promise.reject)
            );
            memMap.push(await p);

            const mergedMemMap = MemoryMap.flattenOverlaps(
                MemoryMap.overlapMemoryMaps(
                    memMap.filter(m => m).map(m => ['', m])
                )
            );

            dispatch(
                targetContentsKnown({
                    targetMemMap: mergedMemMap,
                    isMemLoaded: true,
                })
            );
            dispatch(updateTargetRegions(mergedMemMap, deviceInfo));

            dispatch(canWrite());
            dispatch(loadingEnd());

            if (autoReset) resetDevice(device);
        } catch (error) {
            console.log(error);
            dispatch(targetContentsUnknown());
            dispatch(canWrite());
            dispatch(loadingEnd());
            logger.error('Error when reading device');
        }
    };

const recoverOneCore = async (device: Device, coreInfo: CoreDefinition) => {
    logger.info(`Recovering ${coreInfo.name} core`);

    try {
        await (await getDeviceLib()).recover(device, coreInfo.name);
        logger.info(`Recovering ${coreInfo.name} core completed`);
        return;
    } catch (error) {
        usageData.sendErrorReport(
            `Failed to recover ${coreInfo.name} core: ${describeError(error)}`
        );
    }
};

export const recover =
    (
        device: Device,
        autoRead: boolean,
        autoReset: boolean,
        continueToWrite = false
    ): AppThunk<RootState> =>
    async (dispatch, getState) => {
        const deviceInfo = getState().app.target.deviceInfo;
        const promises = deviceInfo?.cores.map(core => {
            dispatch(erasingStart());
            return recoverOneCore(device, core);
        });

        await promises?.reduce(
            (accumulatorPromise, promise) =>
                accumulatorPromise.then(() => promise).catch(Promise.reject),
            Promise.resolve()
        );

        dispatch(erasingEnd());
        logger.info('Device recovery completed');

        if (!continueToWrite)
            await dispatch(openDevice(device, autoRead, autoReset));
    };

const writeHex = (
    device: Device,
    coreInfo: CoreDefinition,
    hexFileString: string
) =>
    new Promise<void>((resolve, reject) => {
        logger.info(`Writing HEX to ${coreInfo.name} core`);

        getDeviceLib().then(deviceLib =>
            deviceLib
                .programBuffer(
                    device,
                    Buffer.from(hexFileString, 'utf8'),
                    'hex',
                    progress => {
                        const message = progress.message || '';

                        const status = `${message.replace('.', ':')} ${
                            progress.progressPercentage
                        }%`;
                        logger.info(status);
                    },
                    coreInfo.name
                )
                .then(() => {
                    logger.info(
                        `Writing HEX to ${coreInfo.name} core completed`
                    );
                    resolve();
                })
                .catch(error => {
                    usageData.sendErrorReport(
                        `Device programming failed with error: ${describeError(
                            error
                        )}`
                    );
                    reject(error); // This is new behavior
                })
        );
    });

const writeOneCore = async (
    device: Device,
    coreInfo: CoreDefinition,
    memMaps: MemoryMaps
) => {
    logger.info(`Writing procedure starts for ${coreInfo.name} core`);

    // Parse input files and filter program regions with core start address and size
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    overlaps.forEach((overlap, key) => {
        const overlapStartAddr = key;
        const overlapSize = overlap[0][1].length;

        const isInCore =
            overlapStartAddr >= coreInfo.romBaseAddr &&
            overlapStartAddr + overlapSize <=
                coreInfo.romBaseAddr + coreInfo.romSize;
        const isUicr =
            overlapStartAddr >= coreInfo.uicrBaseAddr &&
            overlapStartAddr + overlapSize <=
                coreInfo.uicrBaseAddr + coreInfo.pageSize;
        if (!isInCore && !isUicr) {
            overlaps.delete(key);
        }
    });

    if (overlaps.size <= 0) {
        return undefined;
    }

    const programRegions = MemoryMap.flattenOverlaps(overlaps);

    await writeHex(device, coreInfo, programRegions.asHexString());
    logger.info(`Writing procedure ends for ${coreInfo.name} core`);
};

export const write =
    (
        device: Device,
        autoRead: boolean,
        autoReset: boolean
    ): AppThunk<RootState> =>
    async (dispatch, getState) => {
        const memMaps = getState().app.file.memMaps;
        const deviceInfo = getState().app.target.deviceInfo;

        const promises = deviceInfo?.cores.map(core => {
            dispatch(writingStart());
            return writeOneCore(device, core, memMaps);
        });

        await promises
            ?.reduce(
                (accumulatorPromise, promise) =>
                    accumulatorPromise
                        .then(() => promise)
                        .catch(Promise.reject),
                Promise.resolve()
            )
            .finally(() => dispatch(writingEnd()));

        if (autoReset) await resetDevice(device);
        await dispatch(openDevice(device, autoRead, autoReset));
        dispatch(canWrite());
    };

export const recoverAndWrite =
    (
        device: Device,
        autoRead: boolean,
        autoReset: boolean
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const continueToWrite = true;
        await dispatch(recover(device, autoRead, continueToWrite));
        await dispatch(write(device, autoRead, autoReset));
    };

export const resetDevice = (device: Device) =>
    getDeviceLib().then(deviceLib =>
        deviceLib.reset(device).then(() => {
            logger.info(`Resetting device completed`);
        })
    );

export const saveAsFile = (): AppThunk<RootState> => (_, getState) => {
    const { memMap, deviceInfo: inputDeviceInfo } = getState().app.target;
    const deviceInfo = inputDeviceInfo as DeviceDefinition;
    const maxAddress = Math.max(
        ...deviceInfo.cores.map(c => c.romBaseAddr + c.romSize)
    );

    const options = {
        title: 'Save memory as file',
        defaultPath: `nRF_Connect_Programmer_${Date.now()}`,
        filters: [{ name: 'Hex', extensions: ['hex'] }],
    };

    // eslint-disable-next-line no-undef
    const save = ({ filePath }: Electron.SaveDialogReturnValue) => {
        if (filePath) {
            const data = memMap?.slice(0, maxAddress).asHexString();

            if (data === undefined) {
                logger.error('No data in memory map');
                return;
            }

            fs.writeFile(filePath, data, err => {
                if (err) {
                    logger.error(`Failed to save file: ${describeError(err)}`);
                    return;
                }
                logger.info(`File is successfully saved at ${filePath}`);
            });
        }
    };
    dialog.showSaveDialog(getCurrentWindow(), options).then(save);
};

const updateCoresWithNrfdl = async (
    device: Device,
    deviceInfo: DeviceDefinition
): Promise<DeviceDefinition> => {
    const cores = await Promise.all(
        deviceInfo.cores.map(async (core, index) => {
            try {
                const protectionStatus = await getProtectionStatus(
                    device,
                    core.name
                );
                if (protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE') {
                    return core;
                }
                const deviceCoreInfo = await (
                    await getDeviceLib()
                ).coreInfo(device, core.name);

                return updateCoreInfo(
                    core,
                    index,
                    deviceCoreInfo,
                    protectionStatus
                );
            } catch (e) {
                return core;
            }
        })
    );
    return { ...deviceInfo, cores };
};
