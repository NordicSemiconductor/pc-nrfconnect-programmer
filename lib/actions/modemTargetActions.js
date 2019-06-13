/* Copyright (c) 2015 - 2018, Nordic Semiconductor ASA
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

import { remote } from 'electron';
import nrfjprog from 'pc-nrfjprog-js';
import { logger } from 'nrfconnect/core';
import * as targetActions from './targetActions';

export const MODEM_DFU_NOT_STARTED = 'Not started.';
export const MODEM_DFU_STARTING = 'Starting...';

export const selectModemFirmware = () => dispatch => {
    remote.dialog.showOpenDialog(
        {
            title: 'Select a modem firmware zip file',
            filters: [{ name: 'Modem firmware zip file', extensions: ['zip'] }],
            properties: ['openFile'],
        },
        fileName => {
            if (fileName && fileName.length > 0) {
                dispatch(targetActions.modemWritingReadyAction(fileName[0]));
            }
        },
    );
};


export const cancelUpdate = () => dispatch => {
    dispatch(targetActions.modemWritingCloseAction());
};

export const performUpdate = () => (dispatch, getState) => {
    dispatch(targetActions.modemWritingStartAction());
    dispatch(targetActions.modemProcessUpdateAction(MODEM_DFU_STARTING));
    logger.info('Modem DFU starts to write...');

    const fileName = getState().app.target.modemFwName;
    const serialNumber = Number(getState().app.target.serialNumber);
    logger.info(`Writting to device with serial number: ${serialNumber}`);
    logger.info(`Writting to device with file: ${fileName}`);

    const progressCallback = progress => {
        logger.info(progress.process);
        dispatch(targetActions.modemProcessUpdateAction(progress.process));
    };

    const callback = err => {
        if (err) {
            logger.error(`Modem DFU failed with error: ${err}`);
            dispatch(targetActions.modemWritingFailAction());
            return;
        }
        logger.info('Modem DFU completed successfully!');
        dispatch(targetActions.modemWritingSucceedAction());
    };

    nrfjprog.programDFU(serialNumber,
        fileName,
        progressCallback,
        callback,
    );
};

