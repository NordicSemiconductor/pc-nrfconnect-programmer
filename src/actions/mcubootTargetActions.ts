/* Copyright (c) 2015 - 2021, Nordic Semiconductor ASA
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

/* eslint-disable import/no-cycle */

import nrfdl, {
    Device,
    SerialPort,
} from '@nordicsemiconductor/nrf-device-lib-js';
import { getDeviceLibContext, logger } from 'pc-nrfconnect-shared';

import {
    mcubootFirmwareValid,
    mcubootKnown,
    mcubootPortKnown,
    mcubootProcessUpdate,
    mcubootWritingClose,
    mcubootWritingFail,
    mcubootWritingReady,
    mcubootWritingStart,
    mcubootWritingSucceed,
} from '../reducers/mcubootReducer';
import { modemKnown } from '../reducers/modemReducer';
import {
    loadingEnd,
    targetTypeKnown,
    targetWritableKnown,
} from '../reducers/targetReducer';
import { RootState, TDispatch } from '../reducers/types';
import { targetWarningRemove } from '../reducers/warningReducer';
import { CommunicationType } from '../util/devices';
import portPath from '../util/portPath';
import { updateTargetWritable } from './targetActions';

export const pickSerialPort = (serialports: Array<SerialPort>) => {
    if (!serialports) {
        return undefined;
    }

    const platform = process.platform.slice(0, 3);
    switch (platform) {
        case 'win':
            return serialports.find(s => /MI_00/.test(s.pnpId));
        case 'lin':
            return serialports.find(s => /-if00$/.test(s.pnpId));
        case 'dar':
            return serialports.find(s => /1$/.test(portPath(s)));
        default:
    }

    return undefined;
};

export const pickSerialPort2 = (serialports: Array<SerialPort>) => {
    const platform = process.platform.slice(0, 3);

    switch (platform) {
        case 'win':
            return serialports.find(s => /MI_0[23]/.test(s.pnpId));
        case 'lin':
            return serialports.find(s => /-if0[23]$/.test(s.pnpId));
        case 'dar':
            return serialports.find(s => /[34]$/.test(portPath(s)));
        default:
    }

    return {};
};

export const openDevice = (selectedDevice: Device) => (dispatch: TDispatch) => {
    const { serialPorts } = selectedDevice;
    dispatch(
        targetTypeKnown({
            targetType: CommunicationType.MCUBOOT,
            isRecoverable: false,
        })
    );
    dispatch(mcubootKnown(true));
    dispatch(modemKnown(true));
    dispatch(
        mcubootPortKnown({
            port: portPath(pickSerialPort(serialPorts)),
            port2: portPath(pickSerialPort2(serialPorts)),
        })
    );
    dispatch(updateTargetWritable());
    dispatch(loadingEnd());
};

export const toggleMcuboot =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const { port } = getState().app.target;
        const { isMcuboot } = getState().app.mcuboot;

        if (isMcuboot) {
            dispatch(mcubootKnown(false));
            dispatch(mcubootPortKnown({}));
        } else {
            dispatch(mcubootKnown(true));
            dispatch(mcubootPortKnown({ port }));
        }

        dispatch(updateTargetWritable());
    };

export const prepareUpdate =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        const filesLoaded = getState().app.file.loaded;
        const fileName = Object.keys(filesLoaded)[0];
        // Not sure why a parameter is sent in here
        dispatch(mcubootWritingReady(fileName));
    };

export const canWrite =
    () => (dispatch: TDispatch, getState: () => RootState) => {
        // Disable write button
        dispatch(targetWritableKnown(false));
        dispatch(targetWarningRemove());

        // Check if mcu firmware is detected.
        // If not, then return.
        const { mcubootFilePath, regions } = getState().app.file;
        if (!mcubootFilePath) {
            return;
        }

        // Check if target is MCU target.
        // If not, then return.
        const { isMcuboot } = getState().app.mcuboot;
        if (!isMcuboot) {
            return;
        }

        // Check if region starting at 0x0 is detected for Thingy91
        if (regions.find(r => r.startAddress === 0)) {
            dispatch(mcubootFirmwareValid(false));
        } else {
            dispatch(mcubootFirmwareValid(true));
        }

        // Enable write button if all above items have been checked
        dispatch(targetWarningRemove());
        dispatch(targetWritableKnown(true));
    };

export const performUpdate =
    () => async (dispatch: TDispatch, getState: () => RootState) => {
        const { mcubootFilePath } = getState().app.file;
        const { serialNumber } = getState().app.target;

        logger.info(
            `Writing ${mcubootFilePath} to device ${serialNumber || ''}`
        );

        let totalPercentage = 0;
        let totalDuration = 0;
        let progressMsg = '';

        const progressCallback = ({
            progressJson: progress,
        }: nrfdl.Progress.CallbackParameters) => {
            let dfuProcess;
            try {
                dfuProcess = JSON.parse(progress.process);
            } catch (e) {
                dispatch(
                    mcubootProcessUpdate({
                        message: progress.process,
                        percentage: totalPercentage,
                        duration: totalDuration,
                    })
                );
                return;
            }

            if (dfuProcess && dfuProcess.operation === 'upload_image') {
                totalPercentage = dfuProcess.progress_percentage;
                totalDuration = dfuProcess.duration;

                progressMsg = dfuProcess.message || progressMsg;
                dispatch(
                    mcubootProcessUpdate({
                        message: progressMsg,
                        percentage: totalPercentage,
                        duration: totalDuration,
                    })
                );
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorCallback = (error: any) => {
            if (error) {
                let errorMsg = error.message || error;

                // Program without setting device in MCUboot mode will throw such an error:
                // Errorcode: CouldNotCallFunction (0x9)
                // Lowlevel error: Unknown value (ffffff24)
                if (errorMsg.includes('0x9')) {
                    errorMsg =
                        'Please make sure that the device is in MCUboot mode and try again.';
                }

                logger.error(`MCUboot DFU failed. ${errorMsg}`);
                dispatch(mcubootWritingFail(errorMsg));
                return;
            }

            dispatch(mcubootWritingSucceed());
        };

        const completeCallback = () => {
            dispatch(mcubootWritingSucceed());
        };

        dispatch(mcubootWritingStart());

        try {
            const { device: inputDevice } = getState().app.target;
            const device = inputDevice as Device;
            nrfdl.firmwareProgram(
                getDeviceLibContext(),
                device.id,
                'NRFDL_FW_FILE',
                'NRFDL_FW_MCUBOOT',
                mcubootFilePath as string,
                completeCallback,
                progressCallback
            );
        } catch (e) {
            errorCallback(e);
        }

        dispatch(updateTargetWritable());
    };

export const cancelUpdate = () => (dispatch: TDispatch) => {
    dispatch(mcubootWritingClose());
};
