/*
 * Copyright (c) 2024 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { getAppFile } from '@nordicsemiconductor/pc-nrfconnect-shared';
import { getModule } from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil';
import path from 'path';

interface IMEINumber {
    devices: {
        imei_numbers: string[];
        serial_number: string;
    }[];
}

const modemFirmware = getAppFile(path.join('resources', 'firmware', 'pti.zip'));

const writeIMEI = async (serialNumber: string, imei: string) => {
    const box = await getModule('91');
    const args: string[] = [
        '--serial-number',
        serialNumber,
        '--modem-firmware',
        modemFirmware,
        '--imei',
        imei,
        '--slot',
        '1',
        '--force',
    ];

    return box.singleInfoOperationOptionalData<IMEINumber>(
        'imei-write',
        undefined,
        args
    );
};

const readIMEI = async (serialNumber: string) => {
    const box = await getModule('91');
    const args: string[] = [
        '--serial-number',
        serialNumber,
        '--modem-firmware',
        modemFirmware,
    ];

    return box
        .singleInfoOperationOptionalData<IMEINumber>(
            'imei-read',
            undefined,
            args
        )
        .then((data: IMEINumber) => {
            const imeiNumbers = data.devices.find(
                d => d.serial_number === serialNumber
            )?.imei_numbers;
            return imeiNumbers && imeiNumbers.length >= 1
                ? imeiNumbers[1]
                : undefined;
        });
};

export { writeIMEI, readIMEI };
