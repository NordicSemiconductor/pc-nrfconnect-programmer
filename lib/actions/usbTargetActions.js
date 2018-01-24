/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { List } from 'immutable';
import { logger } from 'nrfconnect/core';
import * as dfujs from 'pc-nrf-dfu-js';
import SerialPort from 'serialport';
import TargetActions from './targetActions';
import * as deviceDefinitions from '../util/deviceDefinitions';
import { Region, RegionPermission } from '../util/memRegions';

class USBTargetActions extends TargetActions {
    usbTargetGetVersionsActions([protocolVersion, hardwareVersion, firmwareVersions]) {
        return {
            type: this.USB_TARGET_GET_VERSIONS,
            protocolVersion,
            hardwareVersion,
            firmwareVersions,
        };
    }

    async getDeviceVersions(comName) {
        return new Promise(async resolve => {
            const port = new SerialPort(comName, { baudRate: 115200, autoOpen: false });
            this.serialTransport = new dfujs.DfuTransportSerial(port, 0);
            const protocolVersion = await this.serialTransport.getProtocolVersion();
            logger.info('Protocol Version: ', protocolVersion);
            const hardwareVersion = await this.serialTransport.getHardwareVersion();
            logger.info(`Hardware: ${hardwareVersion.part.toString(16)} found`);
            const firmwareVersions = await this.serialTransport.getAllFirmwareVersions();
            firmwareVersions.forEach(ver => {
                logger.info(`Firmware: ${ver.imageType} found`);
            });
            port.close();

            resolve([protocolVersion, hardwareVersion, firmwareVersions]);
        });
    }

    // Display some information about a devkit. Called on a devkit connection.
    loadDeviceInfo(comName) {
        return async dispatch => {
            const versions =
                await this.getDeviceVersions(comName);
            const hardwareVersion = versions[1];
            const firmwareVersions = versions[2];
            const deviceDefinition = deviceDefinitions.getDeviceDefinition(
                hardwareVersion.part.toString(16),
            );

            dispatch(this.targetSizeKnownAction(
                hardwareVersion.memory.romSize || deviceDefinition.romSize,
                deviceDefinition.pageSize,
            ));

            let regions = new List();

            // Add FICR to regions
            if (deviceDefinition.ficrBaseAddr) {
                regions = regions.push(new Region({
                    name: 'FICR',
                    version: 0,
                    startAddress: deviceDefinition.ficrBaseAddr,
                    regionSize: deviceDefinition.ficrSize,
                    permission: RegionPermission.NONE,
                }));
            }

            // Add UICR to regions
            if (deviceDefinition.uicrBaseAddr) {
                regions = regions.push(new Region({
                    name: 'UICR',
                    version: 0,
                    startAddress: deviceDefinition.uicrBaseAddr,
                    regionSize: deviceDefinition.uicrSize,
                    permission: RegionPermission.NONE,
                }));
            }

            // Add bootloader, softdevice, applications to regions
            firmwareVersions.forEach(firmwareVersion => {
                const imageType = firmwareVersion.imageType;
                regions = regions.push(new Region({
                    name: imageType,
                    version: firmwareVersion.version,
                    startAddress: firmwareVersion.addr,
                    regionSize: firmwareVersion.length,
                    permission: imageType === 'application' || imageType === 'softdevice' ?
                        RegionPermission.READ_WRITE :
                        RegionPermission.READ_ONLY,
                }));
            });

            dispatch(this.targetRegionsKnownAction(regions));

            // Todo: it is different approach to check wheather the device is writable or not
            // Find a way to check if it writable for usb target.
            // dispatch(this.updateTargetWritable());
        };
    }


}

export default USBTargetActions;
