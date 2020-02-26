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

import { Record } from 'immutable';

import * as modemTargetActions from '../actions/modemTargetActions';

const InitialState = new Record({
    isModem: false,
    isReady: false,
    isWriting: false,
    isWritingSucceed: false,
    isWritingFail: false,
    modemFwName: '',
    progressMsg: modemTargetActions.MODEM_DFU_NOT_STARTED,
    progressPercentage: 0,
    progressDuration: 0,
    progressStep: 0,
    errorMsg: '',
});

export default function target(state = new InitialState(), action) {
    switch (action.type) {
        case modemTargetActions.MODEM_KNOWN:
            return state
                .set('isModem', action.isModem);

        case modemTargetActions.MODEM_PROCESS_UPDATE:
            return state
                .set('progressMsg', action.message)
                .set('progressPercentage', action.percentage)
                .set('progressDuration', action.duration)
                .set('progressStep', action.step);

        case modemTargetActions.MODEM_WRITING_READY:
            return state
                .set('modemFwName', action.fileName)
                .set('progressMsg', modemTargetActions.MODEM_DFU_NOT_STARTED)
                .set('isWriting', false)
                .set('isWritingSucceed', false)
                .set('isWritingFail', false)
                .set('isReady', true)
                .set('errorMsg', '');

        case modemTargetActions.MODEM_WRITING_CLOSE:
            return state
                .set('isReady', false);

        case modemTargetActions.MODEM_WRITING_START:
            return state
                .set('isWriting', true);

        case modemTargetActions.MODEM_WRITING_END:
            return state
                .set('isWriting', false);

        case modemTargetActions.MODEM_WRITING_SUCCEED:
            return state
                .set('isWritingSucceed', true)
                .set('isWriting', false);

        case modemTargetActions.MODEM_WRITING_FAIL:
            return state
                .set('isWritingFail', true)
                .set('isWriting', false)
                .set('errorMsg', action.errorMsg);

        default:
    }

    return state;
}
