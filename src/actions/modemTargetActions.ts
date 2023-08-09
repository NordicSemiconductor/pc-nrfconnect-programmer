/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { describeError, Device, logger, usageData } from 'pc-nrfconnect-shared';
import { NrfutilDeviceLib, Progress } from 'pc-nrfconnect-shared/nrfutil';

export const performUpdate = async (
    device: Device,
    fileName: string,
    onProgress: (progress: Progress) => void
) => {
    logger.info('Modem DFU starts to write...');
    logger.info(`Writing ${fileName} to device ${device.serialNumber || ''}`);

    try {
        await NrfutilDeviceLib.program(device, fileName, onProgress);

        logger.info('Modem DFU completed successfully!');
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = e as any;
        let errorMsg = describeError(error);
        logger.error(`Modem DFU failed with error: ${errorMsg}`);
        if (error.error_code === 0x25b) {
            errorMsg =
                'Please make sure that the device is in MCUboot mode and try again.';
        }

        usageData.sendErrorReport(errorMsg);
        throw new Error(errorMsg);
    }
};
