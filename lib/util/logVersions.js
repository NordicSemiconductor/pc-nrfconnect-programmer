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

import { exec } from 'child_process';
import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';
import { join } from 'path';
import { existsSync } from 'fs';
import { remote } from 'electron';

/**
 * @returns {string} path to pc-nrfjprog-js
 */
function getJprogJsPath() {
    const inBuiltCore = join(process.resourcesPath, 'app.asar', 'node_modules', 'pc-nrfjprog-js');
    if (existsSync(inBuiltCore)) {
        return inBuiltCore;
    }
    let inDevEnv;
    if (process.platform === 'darwin') {
        inDevEnv = join(process.resourcesPath, '..', '..', '..', '..', '..', 'pc-nrfjprog-js');
    } else {
        inDevEnv = join(process.resourcesPath, '..', '..', '..', 'pc-nrfjprog-js');
    }
    return inDevEnv;
}

/**
 * @returns {string} path to package.json of pc-nrfjprog-js
 */
function getJprogJsonPath() {
    return join(getJprogJsPath(), 'package.json');
}

/**
 * @returns {string} version string of pc-nrfjprog-js
 */
function getJsVersion() {
    return remote.require(getJprogJsonPath()).version;
}

/**
 * Log version string of both nrfjprog library and pc-nrfjprog-js module
 *
 * @returns {undefined}
 */
export function logJprogVersion() {
    const logVersion = (err, { major, minor, revision }) => {
        if (err) return;
        logger.info(`Using nrfjprog library ${major}.${minor}.${revision}, pc-nrfjprog-js ${getJsVersion()}`);
    };

    if (nrfjprog.getLibraryVersion) {
        nrfjprog.getLibraryVersion(logVersion);
    } else {
        nrfjprog.getDllVersion(logVersion);
    }
}

/**
 * Log version string of JLink
 *
 * @returns {undefined}
 */
export function logJLinkVersion() {
    if (process.platform === 'win32') {
        exec('nrfjprog --version', (error, stdout) => {
            const regex = /^JLink.*?: (\d+.\d+)$/m;
            const result = regex.exec(stdout) || [];
            if (result.length > 1) {
                logger.info(`Using JLink version ${result[1]}`);
            } else {
                logger.error('JLink is not found. Please install the latest JLink.');
            }
        });
    } else {
        const cmd = process.platform === 'darwin' ? '/usr/local/bin/JLinkExe' : 'JLinkExe';
        exec(cmd, (error, stdout) => {
            const regex = /^SEGGER.*?V(\d+.\d+).*$/m;
            const result = regex.exec(stdout) || [];
            if (result.length > 1) {
                logger.info(`Using JLink version ${result[1]}`);
            } else {
                logger.error('JLink is not found. Please install the latest JLink.');
            }
        });
    }
}
