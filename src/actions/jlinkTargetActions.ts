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
    logger,
    usageData,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import {
    getDeviceDefinition,
    setDeviceDefinition,
    updateCoreInfos,
    updateCoreMemMap,
    updateCoreOperations,
    updateCoreProtection,
} from '../reducers/deviceDefinitionReducer';
import { RootState } from '../reducers/types';
import {
    convertDeviceDefinitionToCoreArray,
    generateMergedMemMap,
    getDefaultDeviceInfoByJlinkFamily,
    mergeNrfutilDeviceInfoInCoreDefinition,
} from '../util/devices';
import { CoreDefinition, DeviceDefinition } from '../util/deviceTypes';
import EventAction from './usageDataActions';

let abortController: AbortController | undefined;

export const openDevice =
    (
        device: Device,
        controller: AbortController
    ): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        abortController = controller;
        logger.info(
            'Using nrfutil device to communicate with target via JLink'
        );

        logDeviceInfo(device);
        const defaultDeviceInfo = getDefaultDeviceInfoByJlinkFamily(device);
        const deviceCoreNames = convertDeviceDefinitionToCoreArray(
            defaultDeviceInfo
        ).map(c => c.name);

        dispatch(setDeviceDefinition(defaultDeviceInfo));

        await dispatch(getAllCoreProtectionStatusBatch(deviceCoreNames)).run(
            device,
            abortController
        );

        const deviceDefinition = getDeviceDefinition(getState());

        const batch = dispatch(getAllCoreInfoBatch(deviceDefinition, true));

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(deviceDefinition, true, batch));
        }

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            await batch
                .reset('Application', 'RESET_DEBUG')
                .run(device, abortController);
            await dispatch(
                getAllCoreProtectionStatusBatch(deviceCoreNames)
            ).run(device, abortController);
        } else {
            await batch.run(device, abortController);
        }

        logger.info('Device is loaded and ready for further operation');
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

const readAllCoresBatch =
    (
        deviceDefinition: DeviceDefinition,
        checkProtection: boolean,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch => {
        convertDeviceDefinitionToCoreArray(deviceDefinition).reduce(
            (accBatch, deviceCoreInfo) => {
                if (
                    checkProtection &&
                    deviceCoreInfo.coreProtection !==
                        'NRFDL_PROTECTION_STATUS_NONE'
                ) {
                    logger.info(
                        `Skipping reading core ${deviceCoreInfo.name} as it is protected.`
                    );
                    return accBatch;
                }
                return accBatch.firmwareRead(
                    deviceCoreInfo.name,
                    batchLoggingCallbacks<Buffer>(
                        `Reading memory for ${deviceCoreInfo.name} core`,
                        () => {
                            dispatch(
                                updateCoreOperations({
                                    core: deviceCoreInfo.name,
                                    state: 'reading',
                                })
                            );
                            dispatch(
                                updateCoreMemMap({
                                    [deviceCoreInfo.name]: undefined,
                                })
                            );
                        },
                        (success, hexBuffer) => {
                            if (success && hexBuffer) {
                                const hexText = hexBuffer.toString('utf8');
                                const memMap = MemoryMap.fromHex(hexText);

                                const paddedArray = memMap.slicePad(
                                    0,
                                    deviceCoreInfo.coreDefinitions.romBaseAddr +
                                        deviceCoreInfo.coreDefinitions.romSize
                                );

                                dispatch(
                                    updateCoreMemMap({
                                        [deviceCoreInfo.name]:
                                            MemoryMap.fromPaddedUint8Array(
                                                paddedArray
                                            ),
                                    })
                                );
                            }
                            dispatch(
                                updateCoreOperations({
                                    core: deviceCoreInfo.name,
                                    state: 'idle',
                                })
                            );
                        }
                    )
                );
            },
            batch
        );

        return batch;
    };

export const read =
    (
        device: Device,
        deviceDefinition: DeviceDefinition
    ): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        await dispatch(readAllCoresBatch(deviceDefinition, true)).run(
            device,
            abortController
        );
    };

const batchLoggingCallbacks = <T>(
    message: string,
    onBegin?: () => void,
    onEnd?: (success: boolean, data?: T) => void
): BatchCallbacks<T> => ({
    onTaskBegin: () => {
        logger.info(message);
        onBegin?.();
    },
    onTaskEnd: taskEnd => {
        onEnd?.(taskEnd.result === 'success', taskEnd.data);

        if (taskEnd.result === 'success') {
            logger.info(`${message} completed`);
        } else {
            usageData.sendErrorReport(
                `Failed to ${message.toLowerCase()} core. Error: ${
                    taskEnd.error
                }, message: ${taskEnd.message}`
            );
        }
    },
    onException: () => {
        onEnd?.(false);
    },
    onProgress: progress => {
        const status = `${message.replace('.', ':')} ${
            progress.progressPercentage
        }%`;
        logger.info(status);
    },
});

const recoverOneCoreBatch =
    (
        core: DeviceCore,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        batch.recover(
            core,
            batchLoggingCallbacks(
                `Recovering ${core} core`,
                () => {
                    dispatch(updateCoreMemMap({ [core]: undefined }));
                    dispatch(
                        updateCoreOperations({
                            core,
                            state: 'erasing',
                        })
                    );
                },
                () =>
                    dispatch(
                        updateCoreOperations({
                            core,
                            state: 'idle',
                        })
                    )
            )
        );

const writeOneCoreBatch =
    (
        core: DeviceCore,
        hexFileString: string,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        batch.program(
            { buffer: Buffer.from(hexFileString, 'utf8'), type: 'hex' },
            core,
            undefined,
            {
                ...batchLoggingCallbacks(
                    `Writing HEX to ${core} core`,
                    () => {
                        dispatch(updateCoreMemMap({ [core]: undefined }));
                        dispatch(
                            updateCoreOperations({ core, state: 'writing' })
                        );
                    },
                    () =>
                        dispatch(updateCoreOperations({ core, state: 'idle' }))
                ),
            }
        );

const geCoreHexIntel = (coreInfo: CoreDefinition, memMaps: MemoryMaps) => {
    // Parse input files and filter program regions with core start address and size
    const overlaps = MemoryMap.overlapMemoryMaps(memMaps);
    overlaps.forEach((overlap, key) => {
        const overlapStartAddr = key;
        const overlapSize = overlap[0][1].length;
        const overlapEndAddr = overlapStartAddr + overlapSize;

        const isInCore =
            overlapStartAddr >= coreInfo.romBaseAddr &&
            overlapEndAddr <= coreInfo.romBaseAddr + coreInfo.romSize;
        const isUicr =
            overlapStartAddr >= coreInfo.uicrBaseAddr &&
            overlapEndAddr <= coreInfo.uicrBaseAddr + coreInfo.pageSize;
        if (!isInCore && !isUicr) {
            overlaps.delete(key);
        }
    });

    if (overlaps.size <= 0) {
        return undefined;
    }

    return MemoryMap.flattenOverlaps(overlaps);
};

const recoverAllCoresBatch =
    (
        cores: DeviceCore[],
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        cores.reduce(
            (accBatch, core) => dispatch(recoverOneCoreBatch(core, accBatch)),
            batch
        );

const writeToAllCoresBatch =
    (
        deviceDefinition: DeviceDefinition,
        memMaps: MemoryMaps,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        convertDeviceDefinitionToCoreArray(deviceDefinition).reduce(
            (accBatch, deviceCoreInfo) => {
                const hex = geCoreHexIntel(
                    deviceCoreInfo.coreDefinitions,
                    memMaps
                );
                if (!hex) return accBatch;

                return dispatch(
                    writeOneCoreBatch(
                        deviceCoreInfo.name,
                        hex.asHexString(),
                        accBatch
                    )
                );
            },
            batch
        );

export const recover =
    (
        device: Device,
        deviceDefinition: DeviceDefinition
    ): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
        const coreNames = coreInfos.map(c => c.name);
        const batch = dispatch(recoverAllCoresBatch(coreNames));

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(deviceDefinition, false, batch)); // No need to check protection as we recovered
        }

        dispatch(
            getAllCoreInfoBatch(
                deviceDefinition,
                false, // No need to check protection as we recovered
                batch
            )
        );

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            batch.reset('Application', 'RESET_DEBUG');
        }

        await batch.run(device, abortController);

        await dispatch(getAllCoreProtectionStatusBatch(coreNames, batch)).run(
            device,
            abortController
        );
    };

export const recoverAndWrite =
    (
        device: Device,
        deviceDefinition: DeviceDefinition
    ): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
        const coreNames = coreInfos.map(c => c.name);
        const batch = dispatch(recoverAllCoresBatch(coreNames));

        const memMaps = getState().app.file.memMaps;
        dispatch(writeToAllCoresBatch(deviceDefinition, memMaps, batch));

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(deviceDefinition, false, batch)); // No need to check protection as we recovered
        }

        dispatch(
            getAllCoreInfoBatch(
                deviceDefinition,
                false, // No need to check protection as we recovered
                batch
            )
        );

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            batch.reset('Application', 'RESET_DEBUG');
        }

        await batch.run(device, abortController);

        await dispatch(getAllCoreProtectionStatusBatch(coreNames)).run(
            device,
            abortController
        );
    };

export const resetDevice =
    (device: Device, deviceDefinition: DeviceDefinition): AppThunk =>
    async dispatch => {
        await NrfutilDeviceLib.reset(
            device,
            'Application',
            'RESET_DEBUG',
            undefined,
            abortController
        );

        const deviceCoreNames = convertDeviceDefinitionToCoreArray(
            deviceDefinition
        ).map(c => c.name);

        await dispatch(getAllCoreProtectionStatusBatch(deviceCoreNames)).run(
            device,
            abortController
        );
    };

export const saveAsFile = (): AppThunk<RootState> => (_, getState) => {
    const deviceDefinition = getDeviceDefinition(getState());
    const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
    const maxAddress = Math.max(
        ...coreInfos.map(
            c => c.coreDefinitions.romBaseAddr + c.coreDefinitions.romSize
        )
    );

    const options = {
        title: 'Save memory as file',
        defaultPath: `nRF_Connect_Programmer_${Date.now()}`,
        filters: [{ name: 'Hex', extensions: ['hex'] }],
    };

    // eslint-disable-next-line no-undef
    const save = ({ filePath }: Electron.SaveDialogReturnValue) => {
        if (filePath) {
            const memMap = generateMergedMemMap(deviceDefinition);
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

const getCoreProtectionStatusBatch =
    (
        core: DeviceCore,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        batch.getProtectionStatus(
            core,
            batchLoggingCallbacks<GetProtectionStatusResult>(
                `Reading readback protection status for ${core} core`,
                () => {
                    dispatch(updateCoreProtection({ [core]: undefined }));
                },
                (success, protectionStatus) => {
                    if (success && protectionStatus) {
                        logger.info(
                            `${core} core protection status '${protectionStatus?.protectionStatus}'`
                        );
                        dispatch(
                            updateCoreProtection({
                                [core]: protectionStatus.protectionStatus,
                            })
                        );

                        if (
                            protectionStatus.protectionStatus !==
                            'NRFDL_PROTECTION_STATUS_NONE'
                        ) {
                            dispatch(
                                updateCoreMemMap({
                                    [core]: undefined,
                                })
                            );
                        }
                    }
                }
            )
        );

const getAllCoreProtectionStatusBatch =
    (
        cores: DeviceCore[],
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        cores.reduce(
            (accBatch, core) =>
                dispatch(getCoreProtectionStatusBatch(core, accBatch)),
            batch
        );

const getCoreInfoBatch =
    (
        core: DeviceCore,
        defaultCoreInfo: CoreDefinition,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        batch.getCoreInfo(
            core,
            batchLoggingCallbacks<DeviceCoreInfo>(
                `Loading core information for ${core} core`,
                () => {
                    dispatch(updateCoreOperations({ core, state: 'loading' }));
                    dispatch(updateCoreInfos({ [core]: defaultCoreInfo }));
                },
                (success, coreInfo) => {
                    if (success && coreInfo) {
                        dispatch(
                            updateCoreInfos({
                                [core]: mergeNrfutilDeviceInfoInCoreDefinition(
                                    defaultCoreInfo,
                                    coreInfo
                                ),
                            })
                        );
                    }
                    dispatch(updateCoreOperations({ core, state: 'idle' }));
                }
            )
        );

const getAllCoreInfoBatch =
    (
        currentDeviceDefinition: DeviceDefinition,
        checkProtection: boolean,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch =>
        convertDeviceDefinitionToCoreArray(currentDeviceDefinition).reduce(
            (accBatch, coreInfo) => {
                if (
                    checkProtection &&
                    coreInfo.coreProtection !== 'NRFDL_PROTECTION_STATUS_NONE'
                ) {
                    logger.info(
                        `Skipping reading core ${coreInfo.name} information as it is protected.`
                    );
                    return accBatch;
                }

                return dispatch(
                    getCoreInfoBatch(
                        coreInfo.name,
                        currentDeviceDefinition.coreDefinitions[
                            coreInfo.name
                        ] as CoreDefinition,
                        accBatch
                    )
                );
            },
            batch
        );
