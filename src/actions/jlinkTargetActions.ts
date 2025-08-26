/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog, getCurrentWindow } from '@electron/remote';
import {
    AppThunk,
    describeError,
    Device,
    logger,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import {
    BatchCallbacks,
    DeviceBatch,
    DeviceCore,
    DeviceCoreInfo,
    DeviceInfo,
    GetProtectionStatusResult,
    NrfutilDeviceLib,
    ReadResult,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device';
import { XReadOptions } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device/xRead';
import { setSelectedDeviceInfo } from '@nordicsemiconductor/pc-nrfconnect-shared/src/Device/deviceSlice';
import fs from 'fs';
import MemoryMap, { MemoryMaps } from 'nrf-intel-hex';

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

        logDeviceInfo(device, getState().device.selectedDeviceInfo);
        const defaultDeviceInfo = getDefaultDeviceInfoByJlinkFamily(
            getState().device.selectedDeviceInfo
        );
        const deviceCoreNames = convertDeviceDefinitionToCoreArray(
            defaultDeviceInfo
        ).map(c => c.name);

        dispatch(setDeviceDefinition(defaultDeviceInfo));

        await dispatch(getAllCoreProtectionStatusBatch(deviceCoreNames)).run(
            device,
            abortController
        );

        await dispatch(getAllCoreInfoBatch(true)).run(device);

        const batch = NrfutilDeviceLib.batch();

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(true, batch));
        }

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            await batch
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore For now
                .reset('Application', 'RESET_DEFAULT')
                .run(device, abortController);
            await dispatch(
                getAllCoreProtectionStatusBatch(deviceCoreNames)
            ).run(device, abortController);
        } else {
            await batch.run(device, abortController);
        }

        logger.info('Device is loaded and ready for further operation');
    };

const logDeviceInfo = (device: Device, deviceInfo?: DeviceInfo) => {
    if (!deviceInfo?.jlink) return;

    logger.info(
        'JLink OB firmware version',
        deviceInfo.jlink.jlinkObFirmwareVersion
    );
    logger.info('Device family', device.devkit?.deviceFamily);
    logger.info('Device version', deviceInfo.jlink.deviceVersion);
    logger.info('Board version', device.devkit?.boardVersion);
};

const readAllCoresBatch =
    (
        checkProtection: boolean,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    (dispatch, getState) => {
        const deviceDefinition = getDeviceDefinition(getState());
        convertDeviceDefinitionToCoreArray(deviceDefinition).reduce(
            (accBatch, deviceCoreInfo) => {
                const xReadOptions = {
                    address: deviceCoreInfo.coreDefinitions.romBaseAddr,
                    bytes: deviceCoreInfo.coreDefinitions.romSize,
                } as XReadOptions;
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
                return accBatch.xRead(
                    deviceCoreInfo.name,
                    xReadOptions,
                    batchLoggingCallbacks<ReadResult>(
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
                        (success, data) => {
                            if (success && data) {
                                const memMap = MemoryMap.fromHex(data.intelHex);

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
    (device: Device): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        await dispatch(updateDeviceInfo(device));

        await dispatch(readAllCoresBatch(true)).run(device, abortController);
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
            logger.error(
                `Failed "${message.toLowerCase()}". Error:${
                    taskEnd.error
                        ? ` code: ${taskEnd.error.code}, description: ${taskEnd.error.description},`
                        : ''
                } message: ${taskEnd.message}`
            );
        }
    },
    onException: () => {
        onEnd?.(false);
    },
    onProgress: progress => {
        const status = `${message.replace(
            '.',
            ':'
        )} ${progress.totalProgressPercentage.toFixed(0)}%`;
        logger.info(status);
    },
});

const recoverOneCoreBatch =
    (
        core: DeviceCore,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    dispatch => {
        dispatch(updateCoreMemMap({ [core]: undefined }));
        return batch.recover(
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
    };

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

const geCoreHexIntel = (
    coreInfo: CoreDefinition,
    memMaps: MemoryMaps<string>
) => {
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
            overlapEndAddr <= coreInfo.uicrBaseAddr + coreInfo.uicrSize;
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
        memMaps: MemoryMaps<string>,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    (dispatch, getState) => {
        const deviceDefinition = getDeviceDefinition(getState());
        return convertDeviceDefinitionToCoreArray(deviceDefinition).reduce(
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
    };

const updateDeviceInfo =
    (device: Device): AppThunk<RootState, Promise<DeviceDefinition>> =>
    async (dispatch, getState) => {
        const deviceInfo = await NrfutilDeviceLib.deviceInfo(
            device,
            undefined,
            undefined,
            abortController
        );

        if (
            deviceInfo?.jlink?.deviceFamily ===
            getDeviceDefinition(getState()).family
        ) {
            return getDeviceDefinition(getState());
        }

        dispatch(setSelectedDeviceInfo(deviceInfo));
        const defaultDeviceInfo = getDefaultDeviceInfoByJlinkFamily(deviceInfo);

        dispatch(setDeviceDefinition(defaultDeviceInfo));

        const coreInfos = convertDeviceDefinitionToCoreArray(defaultDeviceInfo);
        const coreNames = coreInfos.map(c => c.name);
        await dispatch(getAllCoreProtectionStatusBatch(coreNames)).run(
            device,
            abortController
        );

        return getDeviceDefinition(getState());
    };

export const recover =
    (device: Device): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        const deviceDefinition = await dispatch(updateDeviceInfo(device));
        const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
        const coreNames = coreInfos.map(c => c.name);
        let batch = dispatch(recoverAllCoresBatch(coreNames));

        await dispatch(
            getAllCoreInfoBatch(
                false, // No need to check protection as we recovered
                batch
            )
        ).run(device);

        batch = NrfutilDeviceLib.batch();

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(false, batch)); // No need to check protection as we recovered
        }

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore For now
            batch.reset('Application', 'RESET_DEFAULT');
        }

        await batch.run(device, abortController);

        await dispatch(updateDeviceInfo(device));

        await dispatch(getAllCoreProtectionStatusBatch(coreNames)).run(
            device,
            abortController
        );
    };

export const recoverAndWrite =
    (device: Device): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        const deviceDefinition = await dispatch(updateDeviceInfo(device));
        const coreInfos = convertDeviceDefinitionToCoreArray(deviceDefinition);
        const coreNames = coreInfos.map(c => c.name);
        let batch = dispatch(recoverAllCoresBatch(coreNames));

        await dispatch(
            getAllCoreInfoBatch(
                false, // No need to check protection as we recovered
                batch
            )
        ).run(device);

        batch = NrfutilDeviceLib.batch();
        const memMaps = getState().app.file.memMaps;
        dispatch(writeToAllCoresBatch(memMaps, batch));

        const autoRead = getState().app.settings.autoRead;
        if (autoRead) {
            dispatch(readAllCoresBatch(false, batch)); // No need to check protection as we recovered
        }

        const autoReset = getState().app.settings.autoReset;
        if (autoReset) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore For now
            batch.reset('Application', 'RESET_DEFAULT');
        }

        await batch.run(device, abortController);

        await dispatch(updateDeviceInfo(device));

        await dispatch(getAllCoreProtectionStatusBatch(coreNames)).run(
            device,
            abortController
        );
    };

export const resetDevice =
    (device: Device): AppThunk =>
    async dispatch => {
        const deviceDefinition = await dispatch(updateDeviceInfo(device));

        await NrfutilDeviceLib.reset(
            device,
            'Application',
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore For now
            'RESET_DEFAULT',
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
        checkProtection: boolean,
        batch = NrfutilDeviceLib.batch()
    ): AppThunk<RootState, DeviceBatch> =>
    (dispatch, getState) => {
        const currentDeviceDefinition = getDeviceDefinition(getState());
        return convertDeviceDefinitionToCoreArray(
            currentDeviceDefinition
        ).reduce((accBatch, coreInfo) => {
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
        }, batch);
    };
