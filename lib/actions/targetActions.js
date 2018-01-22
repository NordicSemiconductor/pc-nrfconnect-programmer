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

import { Record } from 'immutable';

class TargetAcations {
    constructor() {
        this.TARGET_SIZE_KNOWN = 'TARGET_SIZE_KNOWN';
        this.TARGET_CONTENTS_KNOWN = 'TARGET_CONTENTS_KNOWN';
        this.TARGET_REGIONS_KNOWN = 'TARGET_REGIONS_KNOWN';
        this.TARGET_WRITABLE_KNOWN = 'TARGET_WRITABLE_KNOWN';
        this.WRITE_PROGRESS_START = 'WRITE_PROGRESS_START';
        this.WRITE_PROGRESS_FINISHED = 'WRITE_PROGRESS_FINISHED';
        this.REFRESH_ALL_FILES_START = 'REFRESH_ALL_FILES_START';
        this.WRITE_START = 'WRITE_START';
        this.RECOVER_START = 'RECOVER_START';

        this.TARGET_COLOUR = ['#C0C0C0'];

        this.RegionPermittion = {
            NONE: 0,
            READ_ONLY: 1,
            READ_WRITE: 2,
        };

        this.Region = new Record({
            name: null,
            startAddress: null,
            regionSize: null,
            colours: [],
            permittion: this.RegionPermittion.READ_ONLY,
        });
    }

    targetSizeKnownAction(targetSize, targetPageSize) {
        return {
            type: this.TARGET_SIZE_KNOWN,
            targetSize,
            targetPageSize,
        };
    }

    targetContentsKnownAction(targetMemMap) {
        return {
            type: this.TARGET_CONTENTS_KNOWN,
            targetMemMap,
        };
    }

    targetRegionsKnownAction(regions) {
        return {
            type: this.TARGET_REGIONS_KNOWN,
            regions,
        };
    }

    targetWritableAction(isWritable) {
        return {
            type: this.TARGET_WRITABLE_KNOWN,
            isWritable,
        };
    }

    writeProgressFinishedAction() {
        return {
            type: this.WRITE_PROGRESS_FINISHED,
        };
    }

    writeProgressStartAction() {
        return {
            type: this.WRITE_PROGRESS_START,
        };
    }

    refreshAllFilesStartAction() {
        return {
            type: this.REFRESH_ALL_FILES_START,
        };
    }

    writeStartAction() {
        return {
            type: this.WRITE_START,
        };
    }

    recoverStartAction() {
        return {
            type: this.RECOVER_START,
        };
    }
}

export default TargetAcations;
