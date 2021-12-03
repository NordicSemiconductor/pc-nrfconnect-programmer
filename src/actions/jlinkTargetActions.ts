/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/* eslint-disable import/no-cycle */

import nrfdl, {
    Device,
    Error as NrfdlError,
    FirmwareReadResult,
    ProtectionStatus,
} from '@nordicsemiconductor/nrf-device-lib-js';
import { remote } from 'electron';
import fs from 'fs';
import MemoryMap, { MemoryMaps } from 'nrf-intel-hex';
import { getDeviceLibContext, logger, usageData } from 'pc-nrfconnect-shared';

import { modemKnown } from '../reducers/modemReducer';
import {
    erasingEnd,
    erasingStart,
    loadingEnd,
    loadingStart,
    targetContentsKnown,
    targetInfoKnown,
    targetRegionsKnown,
    targetTypeKnown,
    targetWritableKnown,
    writingEnd,
    writingStart,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { targetWarningRemove } from '../reducers/warningReducer';
import {
    addCoreToDeviceInfo,
    CommunicationType,
    CoreDefinition,
    DeviceDefinition,
    DeviceFamily,
    getDeviceInfoByJlink,
    VendorId,
} from '../util/devices';
import sequence from '../util/promise';
import { getTargetRegions } from '../util/regions';
import { updateFileAppRegions } from './fileActions';
import { updateTargetWritable } from './targetActions';
import EventAction from './usageDataActions';

/**
 * Check whether the device is JLink device or not by providing vender Id and product Id
 *
 * @param {number} vid Vender Id
 * @param {number} pid Product Id
 * @returns {boolean} whether the device is JLink device
 */
export const isJlink = (vid?: number, pid?: number) =>
    vid && pid && vid === VendorId.SEGGER;

/**
 * Load protection status of the core
 *
 * @param {number}deviceId the Id of the device
 * @param {string} deviceCoreName the name of the core
 * @returns{Promise<ProtectionStatus>} the protection status
 */
export const loadProtectionStatus = async (
    deviceId: number,
    deviceCoreName: string
): Promise<ProtectionStatus> => {
    try {
        logger.info(
            `Loading readback protection status for ${deviceCoreName} core`
        );
        // TODO: fix type in nrfdl: snake_case
        const protectionStatus = (
            await nrfdl.deviceControlGetProtectionStatus(
                getDeviceLibContext(),
                deviceId,
                deviceCoreName === 'Network'
                    ? 'NRFDL_DEVICE_CORE_NETWORK'
                    : 'NRFDL_DEVICE_CORE_APPLICATION'
            )
        ).protection_status;
        logger.info(`Readback protection status: ${protectionStatus}`);
        return protectionStatus;
    } catch (error) {
        const errorMessage = `Failed to load readback protection status: ${
            (error as Error).message || error
        }`;
        usageData.sendErrorReport(errorMessage);
        throw Error(errorMessage);
    }
};

/**
 * Display some information about a DevKit. Called on a DevKit connection.
 * This also triggers reading the whole memory contents of the device.
 *
 * @returns {void}
 */
export const openDevice =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
        const { device: inputDevice } = getState().app.target;
        const device = inputDevice as Device;

        dispatch(loadingStart());
        dispatch(targetWarningRemove());
        dispatch(
            targetTypeKnown({
                targetType: CommunicationType.JLINK,
                isRecoverable: true,
            })
        );
        logger.info(
            'Using @nordicsemiconductor/nrf-device-lib-js to communicate with target via JLink'
        );

        logDeviceInfo(device);
        let deviceInfo = getDeviceInfoByJlink(device);

        // Update modem target info according to detected device info
        const isModem = device.jlink.deviceFamily
            .toLowerCase()
            .includes(DeviceFamily.NRF91.toLowerCase());
        dispatch(modemKnown(isModem));
        if (isModem) logger.info('Modem detected');

        // By default readback protection is none
        let protectionStatus: nrfdl.ProtectionStatus =
            'NRFDL_PROTECTION_STATUS_NONE';

        let coreName = 'Application';
        protectionStatus = await loadProtectionStatus(device.id, coreName);

        const deviceCoreInfo = await nrfdl.getDeviceCoreInfo(
            getDeviceLibContext(),
            device.id
        );
        deviceInfo = addCoreToDeviceInfo(
            deviceInfo,
            deviceCoreInfo,
            coreName,
            protectionStatus
        );
        const isFamilyNrf53 = device.jlink.deviceFamily.includes(
            DeviceFamily.NRF53
        );

        // Since nRF53 family is dual core devices
        // It needs an additional check for readback protection on network core
        if (isFamilyNrf53) {
            coreName = 'Network';
            protectionStatus = await loadProtectionStatus(device.id, coreName);

            // TODO: fix type in nrfdl
            const deviceCoreInfoForNrf53 = await nrfdl.getDeviceCoreInfo(
                getDeviceLibContext(),
                device.id,
                'NRFDL_DEVICE_CORE_NETWORK'
            );

            deviceInfo = addCoreToDeviceInfo(
                deviceInfo,
                deviceCoreInfoForNrf53,
                coreName,
                protectionStatus
            );
        }
        dispatch(targetInfoKnown(deviceInfo));

        dispatch(updateTargetWritable());
        dispatch(loadingEnd());
        logger.info('Device is loaded and ready for further operation');

        const { autoRead } = getState().app.settings;
        if (autoRead) await dispatch(read());
    };

/**
 * Log the device information
 * @param {Device} device the input device from device lister
 * @returns {void}
 */
const logDeviceInfo = (device: Device) => {
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

/**
 * Get device memory map by calling nrf-device-lib and reading the entire non-volatile memory
 * const getDeviceMemMap = async (serialNumber, coreInfo, fullRead = true) => {
 *
 * @param {number} deviceId the Id of the device
 * @param {CoreDefinition} coreInfo the information of the core
 * @returns {void}
 */
const getDeviceMemMap = async (deviceId: number, coreInfo: CoreDefinition) => {
    return (await new Promise(resolve => {
        logger.info(`Reading memory for ${coreInfo.name} core`);
        nrfdl.firmwareRead(
            getDeviceLibContext(),
            deviceId,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_INTEL_HEX',
            result => {
                const errorMessage = (result as NrfdlError).message;
                if (errorMessage) {
                    usageData.sendErrorReport(
                        `Failed to get device memory map: ${errorMessage}`
                    );
                    return;
                }

                let memMap = MemoryMap.fromHex(
                    (result as FirmwareReadResult).data
                );
                const paddedArray = memMap.slicePad(
                    0,
                    coreInfo.romBaseAddr + coreInfo.romSize
                );
                memMap = MemoryMap.fromPaddedUint8Array(paddedArray);
                logger.info(
                    `Reading memory for ${coreInfo.name} core completed`
                );
                resolve(memMap);
            },
            () => {},
            null,
            null,
            coreInfo.name === 'Network'
                ? 'NRFDL_DEVICE_CORE_NETWORK'
                : 'NRFDL_DEVICE_CORE_APPLICATION'
        );
    })) as MemoryMap;
};

/**
 * Check if the files can be written to the target device
 * The typical use case is having some HEX files that use the UICR, and a DevKit
 * that doesn't allow erasing the UICR page(s). Also, the (rare) cases where the
 * nRF SoC has readback protection enabled (and the loaded HEX files write the
 * readback-protected region).
 * In all those cases, this function will return false, and the user should not be
 * able to press the "program" button.
 * There are also instances where the UICR can be erased and overwritten, but
 * unfortunately the casuistics are just too complex.
 *
 * @returns {void}
 */
export const canWrite =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        // TODO: get the UICR address from the target definition. This value
        // works for nRF51s and nRF52s, but other targets might use a different one!!!
        const appState = getState().app;
        const { isErased, isMemLoaded } = appState.target;
        const { isMcuboot } = appState.mcuboot;
        const { memMaps: fileMemMaps, mcubootFilePath } = appState.file;

        // If MCU is enabled and MCU firmware is detected
        if (isMcuboot && mcubootFilePath) {
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
    (memMap: MemoryMap, deviceInfo: DeviceDefinition) =>
    (dispatch: TDispatch) => {
        const memMaps: MemoryMaps = [['', memMap]];
        const regions = getTargetRegions(memMaps, deviceInfo);

        dispatch(targetRegionsKnown(regions));
        dispatch(updateFileAppRegions());
    };

/**
 * Read device flash memory
 * @returns {void}
 */
export const read =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
        dispatch(loadingStart());
        const { device: inputDevice, deviceInfo: inputDeviceInfo } =
            getState().app.target;
        const device = inputDevice as Device;
        const deviceInfo = inputDeviceInfo as DeviceDefinition;

        // Read from the device
        if (
            deviceInfo.cores.find(
                c => c.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE'
            )
        ) {
            logger.info(
                'Skipped reading, since at least one core has app readback protection'
            );
        } else {
            let memMap: MemoryMap[];
            let mergedMemMap;
            try {
                memMap = (await sequence(
                    getDeviceMemMap,
                    [],
                    deviceInfo.cores.map(c => [device.id, c])
                )) as MemoryMap[];
                mergedMemMap = MemoryMap.flattenOverlaps(
                    MemoryMap.overlapMemoryMaps(
                        memMap.filter(m => m).map(m => ['', m])
                    )
                );
            } catch (error) {
                throw Error(
                    `getDeviceMemMap: ${(error as Error).message || error}`
                );
            }
            dispatch(
                targetContentsKnown({
                    targetMemMap: mergedMemMap,
                    isMemLoaded: true,
                })
            );
            dispatch(updateTargetRegions(mergedMemMap, deviceInfo));
        }

        dispatch(updateTargetWritable());
        dispatch(loadingEnd());
    };

/**
 * Recover one core
 * @param {number} deviceId the Id of the device
 * @param {CoreDefinition} coreInfo the information of one core
 * @returns {void}
 */
export const recoverOneCore =
    (deviceId: number, coreInfo: CoreDefinition) =>
    async (dispatch: TDispatch) => {
        dispatch(erasingStart());
        logger.info(`Recovering ${coreInfo.name} core`);

        try {
            await nrfdl.deviceControlRecover(
                getDeviceLibContext(),
                deviceId,
                coreInfo.name === 'Network'
                    ? 'NRFDL_DEVICE_CORE_NETWORK'
                    : 'NRFDL_DEVICE_CORE_APPLICATION'
            );
            logger.info(`Recovering ${coreInfo.name} core completed`);
            return;
        } catch (error) {
            usageData.sendErrorReport(
                `Failed to recover ${coreInfo.name} core: ${
                    (error as Error).message || error
                }`
            );
        }
    };

/**
 * Recover all cores one by one
 *
 *
 * @param {boolean} continueToWrite if a write action is operated right after the recover, the read action is not needed
 * @returns {void}
 */
export const recover =
    (continueToWrite = false) =>
    async (dispatch: TDispatch, getState: () => RootState) => {
        const { device: inputDevice, deviceInfo: inputDeviceInfo } =
            getState().app.target;
        const { id: deviceId } = inputDevice as Device;
        const { cores } = inputDeviceInfo as DeviceDefinition;
        const results: unknown[] = [];

        const argsArray = cores.map((c: CoreDefinition) => [deviceId, c]);
        await sequence(
            (id: number, coreInfo: CoreDefinition) =>
                dispatch(recoverOneCore(id, coreInfo)),
            results,
            argsArray
        );

        dispatch(erasingEnd());
        logger.info('Device recovery completed');

        if (!continueToWrite) await dispatch(openDevice());
    };

/**
 * Write firmware in intel HEX format to the device
 * @param {number} deviceId the Id of the device
 * @param {CoreDefinition} coreInfo the information of each core
 * @param {string} hexFileString the converted string of the intel HEX file
 *
 * @returns {void}
 */
const writeHex = (
    deviceId: number,
    coreInfo: CoreDefinition,
    hexFileString: string
) =>
    new Promise<void>(resolve => {
        logger.info(`Writing HEX to ${coreInfo.name} core`);

        nrfdl.firmwareProgram(
            getDeviceLibContext(),
            deviceId,
            'NRFDL_FW_BUFFER',
            'NRFDL_FW_INTEL_HEX',
            Buffer.from(hexFileString, 'utf8'),
            err => {
                if (err)
                    usageData.sendErrorReport(
                        `Device programming failed with error: ${err}`
                    );
                logger.info(`Writing HEX to ${coreInfo.name} core completed`);
                resolve();
            },
            ({ progressJson: progress }: nrfdl.Progress.CallbackParameters) => {
                const status = `${progress.message.replace('.', ':')} ${
                    progress.progressPercentage
                }%`;
                logger.info(status);
            },
            null,
            coreInfo.name === 'Network'
                ? 'NRFDL_DEVICE_CORE_NETWORK'
                : 'NRFDL_DEVICE_CORE_APPLICATION'
        );
    });

/**
 * Write one core
 *
 * @param {number} deviceId the Id of the device
 * @param {CoreDefinition} coreInfo the information of one core
 * @returns {void}
 */
export const writeOneCore =
    (deviceId: number, coreInfo: CoreDefinition) =>
    async (dispatch: TDispatch, getState: () => RootState) => {
        logger.info(`Writing procedure starts for ${coreInfo.name} core`);
        dispatch(writingStart());
        const { memMaps } = getState().app.file;

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
        const programRegions = MemoryMap.flattenOverlaps(overlaps).paginate(
            coreInfo.pageSize
        );

        await writeHex(deviceId, coreInfo, programRegions.asHexString());
        logger.info(`Writing procedure ends for ${coreInfo.name} core`);
    };

/**
 * Write provided file(s) to the device
 *
 * @returns {void}
 */
export const write =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
        const { device: inputDevice, deviceInfo: inputDeviceInfo } =
            getState().app.target;
        const { id: deviceId } = inputDevice as Device;
        const { cores } = inputDeviceInfo as DeviceDefinition;
        const results: unknown[] = [];
        const argsArray = cores.map(c => [deviceId, c]);
        await sequence(
            (id: number, coreInfo: CoreDefinition) =>
                dispatch(writeOneCore(id, coreInfo)),
            results,
            argsArray
        );
        dispatch(writingEnd());
        await dispatch(resetDevice());
        await dispatch(openDevice());
        dispatch(updateTargetWritable());
    };

/**
 * Erase all on device and write file to it.
 *
 * @returns {void}
 */
export const recoverAndWrite = () => async (dispatch: TDispatch) => {
    const continueToWrite = true;
    await dispatch(recover(continueToWrite));
    await dispatch(write());
};

/**
 * Reset device to Application mode
 * @returns {Promise<void>} resolved promise
 */
export const resetDevice =
    () => async (_: TDispatch, getState: () => RootState) => {
        logger.info(`Resetting device`);
        const { device: inputDevice } = getState().app.target;
        const device = inputDevice as Device;

        await nrfdl.deviceControlReset(getDeviceLibContext(), device.id);
        logger.info(`Resetting device completed`);
    };

/**
 * Save the content from the device memory as hex file.
 *
 * @returns {void}
 */
export const saveAsFile = () => (_: TDispatch, getState: () => RootState) => {
    const { memMap, deviceInfo: inputDeviceInfo } = getState().app.target;
    const deviceInfo = inputDeviceInfo as DeviceDefinition;
    const maxAddress = Math.max(
        ...deviceInfo.cores.map(c => c.romBaseAddr + c.romSize)
    );

    const options = {
        title: 'Save memory as file',
        defaultPath: `nRF_Connect_Programmer_${Date.now()}.hex`,
    };

    const save = ({ filePath }: Electron.SaveDialogReturnValue) => {
        if (filePath) {
            const data = memMap?.slice(0, maxAddress).asHexString();

            if (data === undefined) {
                logger.error('No data in memory map');
                return;
            }

            fs.writeFile(filePath, data, err => {
                if (err) {
                    logger.error(`Failed to save file: ${err.message || err}`);
                }
                logger.info(`File is successfully saved at ${filePath}`);
            });
        }
    };
    remote.dialog.showSaveDialog(options).then(save);
};
