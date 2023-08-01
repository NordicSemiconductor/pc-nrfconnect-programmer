/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import nrfdl, { Device } from '@nordicsemiconductor/nrf-device-lib-js';
import {
    describeError,
    getDeviceLibContext,
    logger,
    usageData,
} from 'pc-nrfconnect-shared';

export const performUpdate = (
    device: Device,
    fileName: string,
    onProgress: (progress: nrfdl.Progress.Operation) => void
) =>
    new Promise<void>((resolve, reject) => {
        logger.info('Modem DFU starts to write...');
        logger.info(
            `Writing ${fileName} to device ${device.serialNumber || ''}`
        );

        nrfdl.firmwareProgram(
            getDeviceLibContext(),
            device.id,
            'NRFDL_FW_FILE',
            'NRFDL_FW_NRF91_MODEM',
            fileName,
            error => {
                if (error) {
                    let errorMsg = describeError(error);
                    logger.error(`Modem DFU failed with error: ${errorMsg}`);
                    // @ts-expect-error To be fixed in nrfdl
                    if (error.error_code === 0x25b) {
                        errorMsg =
                            'Please make sure that the device is in MCUboot mode and try again.';
                    }

                    usageData.sendErrorReport(errorMsg);
                    reject(new Error(errorMsg));
                } else {
                    logger.info('Modem DFU completed successfully!');
                    resolve();
                }
            },
            ({ progressJson: progress }: nrfdl.Progress.CallbackParameters) => {
                onProgress(progress);
            }
        );
    });
