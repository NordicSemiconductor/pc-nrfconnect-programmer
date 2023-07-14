/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    describeError,
    Device,
    getDeviceLib,
    logger,
    Progress,
    usageData,
} from 'pc-nrfconnect-shared';

export const performUpdate = (
    device: Device,
    fileName: string,
    onProgress: (progress: Progress) => void
) =>
    new Promise<void>((resolve, reject) => {
        logger.info('Modem DFU starts to write...');
        logger.info(
            `Writing ${fileName} to device ${device.serialNumber || ''}`
        );

        getDeviceLib().then(deviceLib => {
            deviceLib
                .program(device, fileName, onProgress)
                .then(() => {
                    logger.info('Modem DFU completed successfully!');
                    resolve();
                })
                .catch(error => {
                    let errorMsg = describeError(error);
                    logger.error(`Modem DFU failed with error: ${errorMsg}`);
                    if (error.error_code === 0x25b) {
                        errorMsg =
                            'Please make sure that the device is in MCUboot mode and try again.';
                    }

                    usageData.sendErrorReport(errorMsg);
                    reject(new Error(errorMsg));
                });
        });
    });
