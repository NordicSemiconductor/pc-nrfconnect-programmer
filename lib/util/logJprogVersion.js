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

import { logger } from 'nrfconnect/core';
import nrfjprog from 'pc-nrfjprog-js';
import { join } from 'path';
import { existsSync } from 'fs';
import { remote } from 'electron';

/**
 * @returns {string} path to package.json of pc-nrfjprog-js
 */
function getPackageJsonPath() {
    const inBuiltCore = join(process.resourcesPath, 'app.asar', 'node_modules', 'pc-nrfjprog-js', 'package.json');
    if (existsSync(inBuiltCore)) {
        return inBuiltCore;
    }
    let inDevEnv;
    if (process.platform === 'darwin') {
        inDevEnv = join(process.resourcesPath, '..', '..', '..', '..', '..', 'pc-nrfjprog-js', 'package.json');
    } else {
        inDevEnv = join(process.resourcesPath, '..', '..', '..', 'pc-nrfjprog-js', 'package.json');
    }
    return inDevEnv;
}

/**
 * @returns {string} version string of pc-nrfjprog-js
 */
function getJsVersion() {
    return remote.require(getPackageJsonPath()).version;
}

/**
 * Log version string of both nrfjprog library and pc-nrfjprog-js module
 *
 * @returns {undefined}
 */
export default function logJprogVersion() {
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
