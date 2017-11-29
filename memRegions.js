
import { logger } from 'nrfconnect/core';
import { hexpad8, hexpad2 } from './hexpad';

// List taken from py-nrfutil
const knownSoftDevices = {
    0x64: 'S110 v8.0.0',
    0x67: 'S130 v1.0.0',
    0x80: 'S130 v2.0.0',
    0x81: 'S132 v2.0.0',
    0x87: 'S130 v2.0.1',
    0x88: 'S132 v2.0.1',
    0x8C: 'S132 v3.0.0',
    0x91: 'S132 v3.1.0',
    0x95: 'S132 v4.0.0',
    0x98: 'S132 v4.0.2',
    0x99: 'S132 v4.0.3',
    0x9E: 'S132 v4.0.4',
    0x9D: 'S132 v5.0.0',
    0xA5: 'S132 v5.1.0',
};


// Given an instance of MemoryMap, return the heuristically detected
// regions and labels for nRF SoCs.

export default function memRegions(memMap, uicrStartAddr = 0x10001000) {
    const regions = {};
    const labels = {};

    // Does this memMap contain updated info about bootlader and readbac prot?
    // Try querying the UICR and see if there's valid data in there
    const clenr0 = memMap.getUint32(uicrStartAddr, true);
    const rpbConf = memMap.getUint32(uicrStartAddr + 0x04, true);

    const bootloaderAddress = memMap.getUint32(uicrStartAddr + 0x14, true);
    const mbrParams = memMap.getUint32(uicrStartAddr + 0x18, true);
//     let readbackProtectAddress;

    // / TODO: Get some .hex files which handle clenr0/rpbConf

    // Sanity checks on clenr0+rpbConf
    if (rpbConf !== undefined && rpbConf !== 0xFFFFFFFF) {
        logger.info(`Found readback protection info: ${hexpad8(clenr0)}, ${hexpad8(rpbConf)}`);
//                 if ((rpbConf & 0xFF0F) === 0) {
//                     // Set the address to 0.5GiB - the size of the whole code region
//                     // in the ARM 32-bit address space
//                     readbackProtectAddress = 0x2000000;
//                 } else if ((rpbConf & 0xFFF0) === 0) {
//                     readbackProtectAddress = clenr0;
//                 }
    }

    // Look for softdevice infoblock magic
    for (let address = 0x1000; address < 0x10000; address += 0x1000) {
        if (memMap.getUint32(address + 0x04, true) === 0x51B1E5DB) {
//             labels.softDeviceStart = address;
            const softDeviceSize = memMap.getUint32(address + 0x08, true);
//                     softDeviceEnd = address + softDeviceSize;
            labels['SoftDevice end'] = softDeviceSize;

            /* eslint-disable no-bitwise */
            const infoBlockSize = memMap.getUint32(address, true) & 0x000000FF;
            const fwId = memMap.getUint32(address + 0x0C, true) & 0x0000FFFF;
            /* eslint-enable no-bitwise */

            logger.info('Found match for SoftDevice signature. Start/End/ID: ',
                hexpad8(address),
                hexpad8(softDeviceSize),
                hexpad2(fwId),
            );

            if (infoBlockSize >= 0x18) {    // Including SoftDev ID (S000) and version
                if (infoBlockSize >= 0x2C) {    // Including 20-byte rev hash
                    // rev hash is only logged, not explicitly shown in the GUI.
                    let hash = [
                        memMap.getUint32(address + 0x18, false),
                        memMap.getUint32(address + 0x1C, false),
                        memMap.getUint32(address + 0x20, false),
                        memMap.getUint32(address + 0x24, false),
                        memMap.getUint32(address + 0x28, false)];
                    hash = hash.map(n => n.toString(16).padStart(8, '0')).join('');
                    logger.info('SoftDevice signature contains hash: ', hash);
                }

                const softDeviceId = memMap.getUint32(address + 0x10, true);
                const softDeviceVersion = memMap.getUint32(address + 0x14, true);
                if (softDeviceVersion === 0) {
                    labels[`SoftDevice start, id ${hexpad2(fwId)} (S${softDeviceId} prerelease)`] = address;
                } else {
                    const softDeviceVersionMajor = Math.floor((softDeviceVersion / 1000000) % 1000);
                    const softDeviceVersionMinor = Math.floor((softDeviceVersion / 1000) % 1000);
                    const softDeviceVersionPatch = softDeviceVersion % 1000;
                    labels[`SoftDevice start, id ${hexpad2(fwId)} (S${softDeviceId} v${
                        softDeviceVersionMajor}.${softDeviceVersionMinor}.${softDeviceVersionPatch})`] = address;
                }

                logger.info(`SoftDevice signature contains version info: (S${softDeviceId}, ${softDeviceVersion})`);
            } else if (knownSoftDevices[fwId]) {
                labels[`SoftDevice start, id ${hexpad2(fwId)} (${knownSoftDevices[fwId]})`] = address;
            } else {
                labels[`SoftDevice start, id ${hexpad2(fwId)}`] = address;
            }

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
    if (bootloaderAddress && bootloaderAddress !== 0xFFFFFFFF) {
        labels.bootloader = bootloaderAddress;
        logger.info(`UICR info found: bootloader at ${hexpad8(bootloaderAddress)}`);
    }
    if (mbrParams && mbrParams !== 0xFFFFFFFF) {
        labels['MBR parameters'] = mbrParams;
        logger.info(`UICR info found: MBR parameters at ${hexpad8(mbrParams)}`);
    }

    return {
        regions,
        labels,
    };
}

