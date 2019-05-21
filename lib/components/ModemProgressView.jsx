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
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA 'AS IS' AND ANY EXPRESS OR
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

import React from 'react';
import PropTypes from 'prop-types';
import { ProgressBar } from 'react-bootstrap';

const fileRx = /File (\d+) of (\d+)/;
const blockRx = /Block (\d+) of (\d+)/;

const ModemProgressView = ({ messages }) => {
    let progress = 0;
    if (messages.includes('Verification completed')) {
        progress = 100;
    } else {
        const msgs = messages.splice(0).reverse();

        const ixNbOfFiles = msgs.findIndex(e => fileRx.test(e));
        if (ixNbOfFiles > -1) {
            msgs.splice(ixNbOfFiles + 1);
            const [file, fileTotal] = fileRx
                .exec(msgs.pop())
                .slice(1)
                .map(Number);
            progress = (100.0 / fileTotal) * (file - 1);

            const msgBlocks = msgs.find(e => blockRx.test(e));
            if (msgBlocks) {
                const [block, blockTotal] = blockRx
                .exec(msgBlocks)
                .slice(1)
                .map(Number);
                progress += (100.0 / fileTotal / blockTotal) * block;
            }
        }
    }

    return <ProgressBar className="modem-progress" now={progress} label={`${progress}%`} />;
};

ModemProgressView.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.string).isRequired,
};

ModemProgressView.defaultProps = {
    messages: [
        'File 1 of 2',
        'Block 1 of 1',
        // 'don\'t care',
        // 'File 2 of 2',
        // 'Block 1 of 4',
        // 'foo',
        // 'Block 2 of 4',
        // 'Block 3 of 4',
        // 'some bogus',
        // 'Block 4 of 4',
        'Verification completed',
    ],
};

export default ModemProgressView;