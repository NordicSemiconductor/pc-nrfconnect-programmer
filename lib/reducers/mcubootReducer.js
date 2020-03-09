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

import * as mcubootTargetActions from '../actions/mcubootTargetActions';

const InitialState = new Record({
    isMcuboot: false,
    isReady: false,
    isWriting: false,
    isWritingSucceed: false,
    isWritingFail: false,
    port: null,
    port2: null,
    progressMsg: mcubootTargetActions.MCUBOOT_DFU_NOT_STARTED,
    progressPercentage: 0,
    progressDuration: 0,
    errorMsg: '',
});

export default function target(state = new InitialState(), action) {
    switch (action.type) {
        case 'DEVICE_SELECTED':
            return new InitialState();

        case mcubootTargetActions.MCUBOOT_KNOWN:
            return state
                .set('isMcuboot', action.isMcuboot);

        case mcubootTargetActions.MCUBOOT_PORT_KNOWN:
            return state
                .set('port', action.port)
                .set('port2', action.port2);

        case mcubootTargetActions.MCUBOOT_PROCESS_UPDATE:
            return state
                .set('progressMsg', action.message)
                .set('progressPercentage', action.percentage)
                .set('progressDuration', action.duration);

        case mcubootTargetActions.MCUBOOT_WRITING_READY:
            return state
                .set('progressMsg', mcubootTargetActions.MCUBOOT_DFU_NOT_STARTED)
                .set('isWriting', false)
                .set('isWritingSucceed', false)
                .set('isWritingFail', false)
                .set('isReady', true)
                .set('errorMsg', '');

        case mcubootTargetActions.MCUBOOT_WRITING_CLOSE:
            return state
                .set('isReady', false);

        case mcubootTargetActions.MCUBOOT_WRITING_START:
            return state
                .set('isWritingSucceed', false)
                .set('isWritingFail', false)
                .set('isWriting', true);

        case mcubootTargetActions.MCUBOOT_WRITING_END:
            return state
                .set('isWriting', false);

        case mcubootTargetActions.MCUBOOT_WRITING_SUCCEED:
            return state
                .set('isWritingSucceed', true)
                .set('isWriting', false);

        case mcubootTargetActions.MCUBOOT_WRITING_FAIL:
            return state
                .set('isWritingFail', true)
                .set('isWriting', false)
                .set('errorMsg', action.errorMsg);

        default:
    }
    return state;
}
