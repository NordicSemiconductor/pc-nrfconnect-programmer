
import { logger } from 'nrfconnect/core';
import hexpad from './hexpad';
import { hexpad2 } from './hexpad';


// Given an instance of MemoryMap, return the heuristically detected
// regions and labels for nRF SoCs.

export default function memRegions(memMap, uicrStartAddr = 0x10001000) {
    const regions = {};
    const labels = {};

    // Does this memMap contain updated info about bootlader and readbac prot?
    // Try querying the UICR and see if there's valid data in there
//     const clenr0 = memMap.getUint32(uicrStartAddr, true);
//     const rpbConf = memMap.getUint32(uicrStartAddr + 0x04, true);
    const bootloaderAddress = memMap.getUint32(uicrStartAddr + 0x14, true);
    const mbrParams = memMap.getUint32(uicrStartAddr + 0x18, true);
//     let readbackProtectAddress;

    // / TODO: Get some .hex files which handle clenr0/rpbConf

//             // Sanity checks on clenr0+rpbConf
//             if (rpbConf !== undefined) {
//                 if ((rpbConf & 0xFF0F) === 0) {
//                     // Set the address to 0.5GiB - the size of the whole code region
//                     // in the ARM 32-bit address space
//                     readbackProtectAddress = 0x2000000;
//                 } else if ((rpbConf & 0xFFF0) === 0) {
//                     readbackProtectAddress = clenr0;
//                 }
//             }

    // Look for softdevice magic
    for (let address = 0x1000; address < 0x10000; address += 0x1000) {
        if (memMap.getUint32(address + 0x04, true) === 0x51B1E5DB) {
//             labels.softDeviceStart = address;
            const softDeviceSize = memMap.getUint32(address + 0x08, true);
//                     softDeviceEnd = address + softDeviceSize;
            labels['SoftDevice end'] = softDeviceSize;

            /* eslint-disable no-bitwise */
            const fwId = memMap.getUint32(address + 0x0C, true) & 0x00FF;
            /* eslint-enable no-bitwise */

            labels[`SoftDevice start, id ${hexpad2(fwId)}`] = address;

            logger.info(`Found match for SoftDevice signature. Start/End/ID: ${
                hexpad(address)}`,
                hexpad(softDeviceSize),
                hexpad2(fwId),
            );

            break;
        }
    }

//     if (clenr0) {
//         regions.region0 = [0, clenr0];
//         logger.info(`UICR info found: code region 0 length ${hexpad(clenr0)}`);
//     }
//     if (readbackProtectAddress) {
//         regions.readback = [0, readbackProtectAddress];
//         logger.info(`UICR info found: readback config record: ${hexpad(rpbConf)}`);

//     }
    if (bootloaderAddress) {
        labels.bootloader = bootloaderAddress;
        logger.info(`UICR info found: bootloader at ${hexpad(bootloaderAddress)}`);
    }
    if (mbrParams) {
        labels['MBR parameters'] = mbrParams;
        logger.info(`UICR info found: MBR parameteres at ${hexpad(mbrParams)}`);
    }

    return {
        regions,
        labels,
    };
}

