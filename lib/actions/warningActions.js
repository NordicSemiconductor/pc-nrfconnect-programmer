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

export const FILE_WARNING_ADD = 'FILE_WARNING_ADD';
export const FILE_WARNING_REMOVE = 'FILE_WARNING_REMOVE';
export const TARGET_WARNING_ADD = 'TARGET_WARNING_ADD';
export const TARGET_WARNING_REMOVE = 'TARGET_WARNING_REMOVE';
export const USER_WARNING_ADD = 'USER_WARNING_ADD';
export const USER_WARNING_REMOVE = 'USER_WARNING_REMOVE';
export const ALL_WARNING_REMOVE = 'ALL_WARNING_REMOVE';

export function fileWarningAddAction(warnings) {
    return {
        type: FILE_WARNING_ADD,
        warnings,
    };
}

export function fileWarningRemoveAction() {
    return {
        type: FILE_WARNING_REMOVE,
    };
}

export function targetWarningAddAction(warnings) {
    return {
        type: TARGET_WARNING_ADD,
        warnings,
    };
}

export function targetWarningRemoveAction() {
    return {
        type: TARGET_WARNING_REMOVE,
    };
}

export function userWarningAddAction(warnings) {
    return {
        type: USER_WARNING_ADD,
        warnings,
    };
}

export function userWarningRemoveAction() {
    return {
        type: USER_WARNING_REMOVE,
    };
}

export function allWarningRemoveAction() {
    return {
        type: ALL_WARNING_REMOVE,
    };
}

// File warnings are used to display warnings during file actions.
// File warnings are removed everytime when it begins to parse files.
// TODO: refactor current file warnings.
export function addFileWarning(warning) {
    return (dispatch, getState) => {
        const warnings = getState().app.warning.fileWarnings;
        dispatch(fileWarningAddAction(warnings.push(warning)));
    };
}

// Target warnings are used to display warnings during target actions before writing.
// Target warnings are removed everytime when it begins to check target writable.
export function addTargetWarning(warning) {
    return (dispatch, getState) => {
        const warnings = getState().app.warning.targetWarnings;
        dispatch(targetWarningAddAction(warnings.push(warning)));
    };
}

// User warnings are used to display warnings during writing to target device.
// User warnings are removed everytime when write action begins.
// It gives tips to the user to handle exceptions when things happen during write action.
export function addUserWarning(warning) {
    return (dispatch, getState) => {
        const warnings = getState().app.warning.userWarnings;
        dispatch(userWarningAddAction(warnings.push(warning)));
    };
}
