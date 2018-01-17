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

import * as dfujs from 'pc-nrf-dfu-js';
import SerialPort from 'serialport';
import TargetActions from './targetActions';


class USBTargetAcations extends TargetActions {

    // Display some information about a devkit. Called on a devkit connection.
    loadDeviceInfo(device) {
        return async (dispatch, getState) => {
            console.log(device);
            // this.a = new dfujs.DfuTransportSerial();
            const comName = '/dev/cu.usbmodem1421';
            const port = new SerialPort(comName, { baudRate: 115200, autoOpen: false });
            console.log(port);
            this.serialTransport = new dfujs.DfuTransportSerial(port, 0);
            this.serialTransport.getProtocolVersion()
            .then(version => console.log('DFU protocol version: ', version))
            .then(() => this.serialTransport.getHardwareVersion())
            .then(version => {
                console.log('HW version part: ', version.part.toString(16));
                console.log('HW version variant: ', version.variant.toString(16));
                console.log('HW version ROM: ', version.memory.romSize / 1024);
                console.log('HW version RAM: ', version.memory.ramSize / 1024);
            })
            .then(() => this.serialTransport.getAllFirmwareVersions())
            .then(version => console.log('FW images: ', version))
            .then(() => port.close());
        };
    }

}

export default USBTargetAcations;
