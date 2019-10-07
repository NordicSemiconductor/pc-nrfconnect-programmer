/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
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

import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';

import { CommunicationType } from '../util/devices';
import * as targetActions from './targetActions';

export const MCU_DFU_NOT_STARTED = 'Not started.';
export const MCU_DFU_STARTING = 'Starting...';

// Open device and return promise
export const openDevice = selectedDevice => dispatch => {
    dispatch(targetActions.targetTypeKnownAction(CommunicationType.MCU, false));
    dispatch(targetActions.mcuKnownAction(true));
    dispatch(targetActions.mcuPortKnownAction(selectedDevice['serialport.1'].comName));
    dispatch(targetActions.loadingEndAction());
};

export const prepareUpdate = () => (dispatch, getState) => {
    const filesLoaded = getState().app.file.loaded;
    const fileName = Object.keys(filesLoaded)[0];
    dispatch(targetActions.mcuWritingReadyAction(fileName));
};

export const performUpdate = () => (dispatch, getState) => {
    const { mcuPort, port } = getState().app.target;
    const { mcuFwName } = getState().app.file;
    const noSerialNumber = -1;
    const baudrate = 115200;
    const timeout = 12000;
    let totalPercentage = 0;
    let totalDuration = 0;

    const progressCallback = progress => {
        let process;
        try {
            process = JSON.parse(progress.process);
        } catch (e) {
            dispatch(targetActions.mcuProcessUpdateAction(
                progress.process,
                totalPercentage,
                totalDuration,
            ));
            return;
        }

        if (process && process.operation === 'upload_image') {
            totalPercentage = process.progress_percentage;
            totalDuration = process.duration;
        }

        dispatch(targetActions.mcuProcessUpdateAction(
            process.operation,
            totalPercentage,
            totalDuration,
        ));
    };

    const callback = error => {
        if (error) {
            logger.error(`MCUBoot DFU failed. ${error.message || error}`);
            dispatch(targetActions.mcuWritingFailAction(error.message || error));
            return;
        }

        dispatch(targetActions.mcuWritingSucceedAction());
    };

    dispatch(targetActions.mcuWritingStartAction());
    nrfjprog.programMcuBootDFU(
        noSerialNumber,
        mcuFwName,
        mcuPort || port,
        baudrate,
        timeout,
        progressCallback,
        callback,
    );
};

export const cancelUpdate = () => dispatch => {
    dispatch(targetActions.mcuWritingCloseAction());
};
