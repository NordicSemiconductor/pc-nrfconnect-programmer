
import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';
import { overlapBlockSets } from 'nrf-intel-hex';


import hexpad from '../hexpad';

export function logDeviceInfo(serialNumber, comName, dispatch) {
    nrfjprog.getDeviceInfo(serialNumber, (err, info) => {
        if (err) {
            logger.error(err);
            logger.error('Could not fetch memory size of target devkit');
            return;
        }
        const { codeSize, codePageSize, ramSize } = info;

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

        let deviceModel = 'Unknown model';
        if (info.family in deviceModels &&
            info.deviceType in deviceModels[info.family]) {
            deviceModel = deviceModels[info.family][info.deviceType];
        }

        logger.info(`Probed ${serialNumber}. Model: ${deviceModel}. RAM: ${ramSize / 1024}KiB. Flash: ${codeSize / 1024}KiB in pages of ${codePageSize / 1024}KiB.`);

        dispatch({
            type: 'target-size-known',
            targetPort: comName,
            targetSize: codeSize,
            targetPageSize: codePageSize,
        });
    });
}


function writeBlock(appState, dispatch) {

    let written = 0;
    let erased = 0;
//                 const writeSize = 64 * 1024;
    const pageSize = appState.targetPageSize;

    const overlaps = overlapBlockSets(appState.blocks);


    return function writeBlockClosure() {
//         const addresses = Array.from(appState.blocks.keys());

        for (const [address, overlap ] of overlaps) {
            const blockStart = address;
//             const block = appState.blocks.get(blockStart);
            const block = overlap[ overlap.length - 1 ][1];
            const blockSize = block.length;
            const blockEnd = blockStart + blockSize;

            if (written < blockEnd) {
                const increment = Math.min(pageSize, blockEnd - written);
                const writeStart = Math.max(blockStart, written);
                written = writeStart + increment;

                const formattedStart = hexpad(writeStart);
// const formattedEnd = written.toString(16).toUpperCase().padStart(8, '0');
// const formattedIncrement = increment.toString(16).toUpperCase().padStart(8, '0');

                const subBlock = Array.from(block.subarray(
                    writeStart - blockStart,
                    (writeStart - blockStart) + increment,
                ));

                const formattedSubblockSize = hexpad(subBlock.length);
                const formattedEnd = hexpad((writeStart + subBlock.length) - 1);
                const serialNumber = appState.targetSerialNumber;

                function writeRaw() {
                    console.log(`Writing at 0x${formattedStart}-0x${formattedEnd}, 0x${formattedSubblockSize}bytes`);
                    logger.info(`Writing at 0x${formattedStart}-0x${formattedEnd}, 0x${formattedSubblockSize}bytes`);

                    nrfjprog.write(serialNumber, writeStart, subBlock, err => {
                        if (err) {
                            console.error(err);
                            console.error(err.log);
                            logger.error(err);
                        } else {
                            dispatch({
                                type: 'write-progress',
                                address: written,
                            });

                            requestAnimationFrame(() => { writeBlockClosure(); });
//                         setTimeout(()=>{ writeBlockClosure(); }, 3000);
                        }
                    });
                }

//             setTimeout(fake4KiB, 250);

                if (erased > written) {
                    writeRaw();
                } else {
                    const eraseStart = writeStart - (writeStart % pageSize);
                    erased = (blockEnd - (blockEnd % pageSize)) + (pageSize - 1);

                    const formattedEraseStart = eraseStart.toString(16).toUpperCase().padStart(8, '0');
                    const formattedEraseEnd = erased.toString(16).toUpperCase().padStart(8, '0');
                    console.log(`Erasing 0x${formattedEraseStart}-0x${formattedEraseEnd}`);
                    logger.info(`Erasing 0x${formattedEraseStart}-0x${formattedEraseEnd}`);

                    nrfjprog.erase(serialNumber, {
                        erase_mode: nrfjprog.ERASE_PAGES_INCLUDING_UICR,
                        start_address: eraseStart,
                        start_adress: eraseStart,   // / Legacy (bugged) property name, see https://github.com/NordicSemiconductor/pc-nrfjprog-js/pull/7
                        end_address: erased,
                    }, err => {
                        if (err) {
                            console.error(err);
                            console.error(err.log);
                            logger.error(err.log);
                        } else {
                            writeRaw();
                        }
                    });
                }

                return;
            }
        }

        dispatch({
            type: 'write-progress-finished',
        });
    }
}



export function write(appState, dispatch) {
    // / FIXME: Store a copy of the currently connected s/n, to prevent race conditions
    // / Alternatively, disable the devkit drop-down while a write is in progress.

    let writeBlockClosure = writeBlock(appState, dispatch);

    writeBlockClosure();
}

