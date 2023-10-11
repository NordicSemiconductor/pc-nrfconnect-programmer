/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { dialog, getCurrentWindow } from '@electron/remote';
import {
    AppThunk,
    describeError,
    ErrorDialogActions,
    logger,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import { readFile, stat, Stats, statSync } from 'fs';
import MemoryMap, { MemoryMapTuple, Overlap } from 'nrf-intel-hex';
import { basename } from 'path';

import {
    getDeviceDefinition as getDeviceDefinitionFromRedux,
    setDeviceDefinition,
} from '../reducers/deviceDefinitionReducer';
import {
    fileParse,
    filesEmpty,
    mcubootFileKnown,
    mruFilesLoadSuccess,
    zipFileKnown,
} from '../reducers/fileReducer';
import { RootState } from '../reducers/types';
import { fileWarningRemove } from '../reducers/warningReducer';
import { getMruFiles, setMruFiles } from '../store';
import { defaultDeviceDefinition, nRF5340DefaultDevice } from '../util/devices';
import { DeviceFamily } from '../util/deviceTypes';
import { updateTargetWritable } from './targetActions';

// Update core info when file actions happen and not when the device is selected
const updateCoreInfo = (): AppThunk<RootState> => (dispatch, getState) => {
    const deviceDefinition = getDeviceDefinitionFromRedux(getState());

    // If device is selected, device family and device type will not be null
    // and so will not assume target cores by file regions.
    if (
        deviceDefinition.family !== DeviceFamily.UNKNOWN ||
        deviceDefinition.type !== 'UNKNOWN'
    ) {
        return;
    }

    const file = getState().app.file;

    // Display multiple cores if at least one of the regions matches
    // the requirements of nRF5340
    const overlaps = MemoryMap.overlapMemoryMaps(file.memMaps);
    const startAddresses = [...overlaps.keys()].sort().reverse();
    const networkCore = nRF5340DefaultDevice.coreDefinitions.Network;

    if (
        startAddresses.find(
            s =>
                s >= networkCore.romBaseAddr &&
                s <= networkCore.romBaseAddr + networkCore.romSize
        )
    ) {
        dispatch(setDeviceDefinition(nRF5340DefaultDevice));
        return;
    }

    // Display 1 MB memory size or display to end address if the end address is greater than 1 MB
    const lastStartAddress = startAddresses[startAddresses.length - 1];
    const lastOverlap = overlaps.get(lastStartAddress) as Overlap;
    if (lastOverlap) {
        const lastEndAddress =
            lastStartAddress + (lastOverlap[0][1]?.length ?? 0);
        dispatch(
            setDeviceDefinition({
                ...defaultDeviceDefinition,
                coreDefinitions: {
                    Application: {
                        ...defaultDeviceDefinition.coreDefinitions.Application,
                        romBaseAddr: 0x0,
                        romSize: Math.max(lastEndAddress, 0x100000), // 1 MB
                    },
                },
            })
        );
    }
};

export const removeFile =
    (filePath: string): AppThunk<RootState> =>
    (dispatch, getState) => {
        const { loaded, memMaps } = getState().app.file;
        const newLoaded = { ...loaded };
        const newMemMaps = memMaps.filter(element => element[0] !== filePath);
        delete newLoaded[filePath];

        dispatch(fileParse({ loaded: newLoaded, memMaps: newMemMaps }));
        dispatch(updateCoreInfo());
        dispatch(updateTargetWritable());
    };

export const closeFiles = (): AppThunk<RootState> => (dispatch, getState) => {
    dispatch(fileWarningRemove());
    dispatch(filesEmpty());

    // Initialize the state of deviceInfo if no device is selected
    if (!getState().device.selectedDevice?.serialNumber) {
        // TODO CHECK WHY THIS IS NEEDED
        dispatch(setDeviceDefinition(defaultDeviceDefinition));
    }
    dispatch(updateTargetWritable());
};

export const loadMruFiles = (): AppThunk => dispatch => {
    const files = getMruFiles();
    dispatch(mruFilesLoadSuccess(files));
};

const removeMruFile = (filename: string) => {
    const files = getMruFiles();
    setMruFiles(files.filter((file: string) => file !== filename));
};

const addMruFile = (filename: string) => {
    const files = getMruFiles();
    if (files.indexOf(filename) === -1) {
        setMruFiles([filename, ...files.slice(0, 9)]);
    }
};

const parseZipFile =
    (filePath: string): AppThunk<RootState, Promise<void>> =>
    async dispatch => {
        const stats = await new Promise<Stats>((resolve, reject) => {
            stat(filePath, (statsError, result) => {
                if (statsError) {
                    logger.error(
                        `Could not open ZIP file: ${describeError(statsError)}`
                    );
                    dispatch(
                        ErrorDialogActions.showDialog(describeError(statsError))
                    );
                    removeMruFile(filePath);
                    return reject();
                }
                return resolve(result);
            });
        });
        logger.info('Checking ZIP file: ', filePath);
        logger.info('File was last modified at ', stats.mtime.toLocaleString());
        addMruFile(filePath);
    };

const parseHexFile =
    (filePath: string): AppThunk<RootState, Promise<void>> =>
    async (dispatch, getState) => {
        const { loaded, memMaps } = getState().app.file;
        if (loaded[filePath]) {
            return;
        }

        const stats: Stats = await new Promise((resolve, reject) => {
            stat(filePath, (statsError, result) => {
                if (statsError) {
                    logger.error(
                        `Could not open HEX file: ${describeError(statsError)}`
                    );
                    dispatch(
                        ErrorDialogActions.showDialog(describeError(statsError))
                    );
                    removeMruFile(filePath);
                    return reject();
                }
                return resolve(result);
            });
        });

        const data: Buffer = await new Promise((resolve, reject) => {
            readFile(filePath, {}, (readError, result) => {
                logger.info('Parsing HEX file: ', filePath);
                logger.info(
                    'File was last modified at ',
                    stats.mtime.toLocaleString()
                );
                if (readError) {
                    logger.error(
                        `Could not open HEX file: ${describeError(readError)}`
                    );
                    dispatch(
                        ErrorDialogActions.showDialog(describeError(readError))
                    );
                    removeMruFile(filePath);
                    return reject();
                }
                addMruFile(filePath);
                return resolve(result);
            });
        });

        let memMap;
        try {
            memMap = MemoryMap.fromHex(data.toString());
        } catch (e) {
            logger.error(`Could not open HEX file: ${describeError(e)}`);
            dispatch(ErrorDialogActions.showDialog(describeError(e)));
            return;
        }

        // Last selected file will be set as mcuboot file
        dispatch(mcubootFileKnown(filePath));

        const newLoaded = {
            ...loaded,
            [filePath]: {
                filename: basename(filePath),
                modTime: stats.mtime,
                loadTime: new Date(),
                memMap,
            },
        };
        const newMemMaps = [...memMaps, [filePath, memMap]] as MemoryMapTuple[];
        dispatch(fileParse({ loaded: newLoaded, memMaps: newMemMaps }));
        dispatch(updateCoreInfo());
    };

export const openFile =
    (...params: string[]): AppThunk<RootState, Promise<unknown>> =>
    async (dispatch): Promise<unknown> => {
        const filePath = params[0];
        if (!filePath) return dispatch(loadMruFiles());

        // The last selected file has higher priority
        dispatch(mcubootFileKnown(undefined));
        dispatch(zipFileKnown(undefined));

        if (filePath.toLowerCase().endsWith('.zip')) {
            dispatch(filesEmpty());
            dispatch(zipFileKnown(filePath));
            await dispatch(parseZipFile(filePath));
            dispatch(updateTargetWritable());
            return dispatch(openFile(...params.slice(1)));
        }
        if (
            filePath.toLowerCase().endsWith('.hex') ||
            filePath.toLowerCase().endsWith('.ihex')
        ) {
            await dispatch(parseHexFile(filePath));
            return dispatch(openFile(...params.slice(1)));
        }
    };

export const openFileDialog = (): AppThunk => dispatch => {
    const dialogOptions = {
        title: 'Select a HEX / ZIP file',
        filters: [
            {
                name: 'HEX / ZIP files',
                extensions: ['hex', 'iHex', 'zip'],
            },
        ],
        properties: ['openFile', 'multiSelections'],
        // eslint-disable-next-line no-undef
    } as Electron.OpenDialogOptions;
    dialog
        .showOpenDialog(getCurrentWindow(), dialogOptions)
        .then(
            ({ filePaths }: { filePaths: string[] }) =>
                filePaths && dispatch(openFile(...filePaths))
        );
};

export const refreshAllFiles =
    (): AppThunk<RootState, Promise<void>> => (dispatch, getState) =>
        Promise.all(
            Object.keys(getState().app.file.loaded).map(async filePath => {
                const entry = getState().app.file.loaded[filePath];
                try {
                    const stats = statSync(filePath);
                    if (entry.loadTime < stats.mtime) {
                        dispatch(removeFile(filePath));
                        logger.info('Reloading: ', filePath);
                        await dispatch(parseHexFile(filePath));
                        return;
                    }
                    logger.info('Does not need to be reloaded: ', filePath);
                } catch (error) {
                    logger.error(
                        `Could not open HEX file: ${describeError(error)}`
                    );
                    dispatch(
                        ErrorDialogActions.showDialog(describeError(error))
                    );
                }
            })
        ).then(() => Promise.resolve());
