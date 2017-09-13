
import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';
import { overlapBlockSets, flattenOverlaps, paginate, arraysToHex } from 'nrf-intel-hex';

import hexpad from '../hexpad';

function getDeviceInfo(serialNumber) {
    return new Promise((resolve, reject) => {
        nrfjprog.getDeviceInfo(serialNumber, (err, info) => {
            if (err) {
                reject(err);
            } else {
                resolve(info);
            }
        });
    });
}

function getDeviceModel(deviceInfo) {
    const deviceModels = {
        [nrfjprog.NRF51_FAMILY]: {
            [nrfjprog.NRF51xxx_xxAA_REV1]: 'NRF51xxx_xxAA_REV1',
            [nrfjprog.NRF51xxx_xxAA_REV2]: 'NRF51xxx_xxAA_REV2',
            [nrfjprog.NRF51xxx_xxAA_REV3]: 'NRF51xxx_xxAA_REV3',
            [nrfjprog.NRF51801_xxAB_REV3]: 'NRF51801_xxAB_REV3',
            [nrfjprog.NRF51802_xxAA_REV3]: 'NRF51802_xxAA_REV3',
            [nrfjprog.NRF51xxx_xxAB_REV3]: 'NRF51xxx_xxAB_REV3',
            [nrfjprog.NRF51xxx_xxAC_REV3]: 'NRF51xxx_xxAC_REV3',
        },
        [nrfjprog.NRF52_FAMILY]: {
            [nrfjprog.NRF52810_xxAA_FUTURE]: 'NRF52810_xxAA_FUTURE',
            [nrfjprog.NRF52832_xxAA_ENGA]: 'NRF52832_xxAA_ENGA',
            [nrfjprog.NRF52832_xxAA_ENGB]: 'NRF52832_xxAA_ENGB',
            [nrfjprog.NRF52832_xxAA_REV1]: 'NRF52832_xxAA_REV1',
            [nrfjprog.NRF52832_xxAB_REV1]: 'NRF52832_xxAB_REV1',
            [nrfjprog.NRF52832_xxAA_FUTURE]: 'NRF52832_xxAA_FUTURE',
            [nrfjprog.NRF52832_xxAB_FUTURE]: 'NRF52832_xxAB_FUTURE',
            [nrfjprog.NRF52840_xxAA_ENGA]: 'NRF52840_xxAA_ENGA',
            [nrfjprog.NRF52810_xxAA_REV1]: 'NRF52810_xxAA_REV1',
            [nrfjprog.NRF52840_xxAA_FUTURE]: 'NRF52840_xxAA_FUTURE',
        },
    };

    if (deviceInfo.family in deviceModels &&
        deviceInfo.deviceType in deviceModels[deviceInfo.family]) {
        return deviceModels[deviceInfo.family][deviceInfo.deviceType];
    }
    return 'Unknown model';
}

export function logDeviceInfo(serialNumber, comName) {
    return dispatch => {
        getDeviceInfo(serialNumber)
            .then(info => {
                const { codeSize, codePageSize, ramSize } = info;
                logger.info(`Probed ${serialNumber}. Model: ${getDeviceModel(info)}. ` +
                    `RAM: ${ramSize / 1024}KiB. Flash: ${codeSize / 1024}KiB in pages of ` +
                    `${codePageSize / 1024}KiB.`);

                // Suggestion: Do this the other way around. F.ex. dispatch a
                // LOAD_TARGET_INFO action, listen to LOAD_TARGET_INFO_SUCCESS
                // in middleware and log it from there?
                dispatch({
                    type: 'target-size-known',
                    targetPort: comName,
                    targetSize: codeSize,
                    targetPageSize: codePageSize,
                });
            })
            .catch(error => {
                logger.error(`Could not fetch memory size of target devkit: ${error.message}`);
            });
    };
}

// function writeBlock(serialNumber, pages, dispatch) {
//
//     const pageWriteCalls = Array.from(pages.entries()).map(
//         ([address, page]) => function writeOnePage(callback) {
//             const pageStart = address;
//             const pageSize = page.length;
//             const pageEnd = pageStart + pageSize;
//
//             console.log(`Erasing 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
//             logger.info(`Erasing 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
//
//             nrfjprog.erase(serialNumber, {
//                 erase_mode: nrfjprog.ERASE_PAGES_INCLUDING_UICR,
//                 start_address: pageStart,
//                 // Legacy (bugged) property name, see https://github.com/NordicSemiconductor/pc-nrfjprog-js/pull/7
//                 start_adress: pageStart,
//                 end_address: pageEnd,
//             }, err => {
//                 if (err) {
//                     console.error(err);
//                     console.error(err.log);
//                     logger.error(err.log);
//                 } else {
//                     console.log(`Writing 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
//                     logger.info(`Writing 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
//
//                     nrfjprog.write(serialNumber, pageStart, Array.from(page), err2 => {
//                         if (err2) {
//                             console.error(err2);
//                             console.error(err2.log);
//                             logger.error(err2);
//                         } else {
//                             dispatch({
//                                 type: 'write-progress',
//                                 address: pageEnd,
//                             });
//
//                             requestAnimationFrame(() => { callback(); });
//     //                             requestAnimationFrame(() => { writeBlockClosure(); });
//                         }
//                     });
//                 }
//             });
//         }
//     );
//
//     return function writeBlockClosure() {
// //         const addresses = Array.from(appState.blocks.keys());
//
//         const pageWriteCall = pageWriteCalls.shift();
//
//         if (!pageWriteCall) {
//             console.log('Finished erasing/writing.');
//             console.log('Finished erasing/writing.');
//             dispatch({
//                 type: 'write-progress-finished',
//             });
//         } else {
//             pageWriteCall(writeBlockClosure);
//         }
//     };
// }

function writeHex(serialNumber, hexString, dispatch) {
    nrfjprog.program(serialNumber, hexString, {
        inputFormat: nrfjprog.INPUT_FORMAT_HEX_STRING,
//         chip_erase_mode: nrfjprog.ERASE_PAGES_INCLUDING_UICR,
        chip_erase_mode: nrfjprog.ERASE_PAGES,

    }, (progress) => { // Progress callback

//         console.log(`Programming progress: 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
        console.log('Programming progress: ', progress);
        logger.info(progress.process);

//         dispatch({
//             type: 'write-progress',
//             address: pageEnd,
//         });

    }, (err) => {   // Finish callback
        if (err) {
            console.error(err);
            console.error(err.log);
            err.log.split('\n').forEach((line)=>logger.error(line));
//             logger.error(err.log);
            return;
        }
//         console.log(`Programming progress: 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);
        console.log('Programming finished: ');
//         logger.info(`Erasing 0x${hexpad(pageStart)}-0x${hexpad(pageEnd)}`);

        dispatch({
            type: 'write-progress-finished',
        });
    });
}


export function write(appState) {
    return dispatch => {
        const serialNumber = appState.targetSerialNumber;
        const pageSize = appState.targetPageSize;

        if (!serialNumber || !pageSize) {
            logger.error('Select a device before writing');
            return;
        }

        const pages = paginate(
                        flattenOverlaps(
                            overlapBlockSets(appState.blocks),
                        ), pageSize);

        console.log(pages);
        console.log(arraysToHex(pages, 64));

//         const writeBlockClosure = writeBlock(serialNumber, pages, dispatch);
//         writeBlockClosure();

        writeHex(serialNumber, arraysToHex(pages, 64), dispatch);
    };
}


export function recover(appState) {
    return dispatch => {
        const serialNumber = appState.targetSerialNumber;

        if (!serialNumber) {
            logger.error('Select a device before recovering');
            return;
        }

        nrfjprog.recover(serialNumber, (progress)=>{
            console.log('Recovery progress: ', progress);
            logger.info(progress.process);
        }, (err)=>{
            if (err) {
                console.error(err);
                console.error(err.log);
                err.log.split('\n').forEach((line)=>logger.error(line));
    //             logger.error(err.log);
                return;
            }

            dispatch({
                type: 'write-progress-finished',
            });
        });
    };
}

