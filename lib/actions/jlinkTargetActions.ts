import nrfdl, { Device } from 'nrf-device-lib-js';
import { logger } from 'pc-nrfconnect-shared';
import MemoryMap, { MemoryBlocks } from 'nrf-intel-hex';
import nrfjprog, { Version } from 'pc-nrfjprog-js';

const context = nrfdl.createContext();

type SerialNumber = string;

/**
 * Enumerates the connected devices and returns a promise potentially
 * containing the one matching the given `serial`, if it exists.
 *
 * If no such device is found, the promise will be rejected.
 *
 * @param serial The serial number of the device to return.
 */
function getDeviceFromSerial(serial: SerialNumber): Promise<Device> {
  return new Promise(async (resolve, reject) => {
    try {
      const devices = await nrfdl.enumerate(context);
      const device = devices.find(d => d.serialnumber === serial);
      if (device) return resolve(device);
      return reject(new Error(`No device found with serial number ${serial}`));
    } catch {
      reject(new Error('Failed to fetch devices'));
    }
  });
}

function formatSerialNumber(serial: SerialNumber): SerialNumber {
  return `000${serial.substring(0, 9)}`;
}

// Missing from nrfdl:
// * Segger OB serial number
// * Segger OB speed
// * Segger OB version
// * Device RAM size
// * Device code page size
// * Basically everything about the device cores
function printDeviceInfo(device: Device): void {
  logger.info('Using nrf-device-lib v', nrfdl.apiVersion());
  logger.info('Segger version:', device.jlink.jlink_ob_firmware_version);
  logger.info('Core probed:', device.serialnumber);
  logger.info('Model:', device.jlink.device_version);
}

function getJLinkVersion(serial: SerialNumber): Promise<Version> {
  return new Promise((resolve, reject) => {
    nrfjprog.getLibraryInfo(serial, (err, libraryInfo) => {
      if (err) return reject(new Error(err.lowlevelError));
      return resolve(libraryInfo.version);
    });
  });
}

function isThing<T>(err: (T extends String ? number : string), result: T): result is T {
  if ("fromCodePoint" in result) {
  }
  return err === undefined
}


