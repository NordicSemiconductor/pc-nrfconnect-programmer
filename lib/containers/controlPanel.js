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

import { connect } from 'react-redux';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';

import * as fileActions from '../actions/fileActions';
import * as jlinkTargetActions from '../actions/jlinkTargetActions';
import * as mcubootTargetActions from '../actions/mcubootTargetActions';
import * as modemTargetActions from '../actions/modemTargetActions';
import { toggleAutoRead } from '../actions/settingsActions';
import * as targetActions from '../actions/targetActions';
import * as usbsdfuTargetActions from '../actions/usbsdfuTargetActions';
import ControlPanel from '../components/ControlPanel';
import { CommunicationType } from '../util/devices';

export default connect(
    ({ app }, props) => ({
        ...props,
        fileRegionSize: app.file.regions.length,
        mruFiles: app.file.mruFiles,
        autoRead: app.settings.autoRead,
        targetIsWritable: app.target.isWritable,
        targetIsRecoverable: app.target.isRecoverable,
        targetIsMemLoaded: app.target.isMemLoaded,
        isProtected: !!app.target.deviceInfo.cores.find(
            c => c.protectionStatus !== nrfdl.NRFDL_PROTECTION_STATUS_NONE
        ),
        targetIsReady:
            !app.target.isLoading &&
            !app.target.isWriting &&
            !app.target.isErasing,
        isJLink: app.target.targetType === CommunicationType.JLINK,
        isUsbSerial: app.target.targetType === CommunicationType.USBSDFU,
        isModem: app.modem.isModem,
        isMcuboot: app.mcuboot.isMcuboot,
    }),
    (dispatch, props) => ({
        ...props,
        openFile: filename => dispatch(fileActions.openFile(filename)),
        closeFiles: () => {
            dispatch(fileActions.closeFiles());
        },
        removeFile: filePath => {
            dispatch(fileActions.removeFile(filePath));
        },
        refreshAllFiles: () => {
            dispatch(fileActions.refreshAllFiles());
        },
        onToggleFileList: () => dispatch(fileActions.loadMruFiles()),
        openFileDialog: () => dispatch(fileActions.openFileDialog()),
        toggleAutoRead: () => {
            dispatch(toggleAutoRead());
        },
        toggleMcuboot: () => {
            dispatch(mcubootTargetActions.toggleMcuboot());
        },
        performRecover: () => {
            dispatch(jlinkTargetActions.recover());
        },
        performRecoverAndWrite: () => {
            dispatch(jlinkTargetActions.recoverAndWrite());
        },
        performSaveAsFile: () => {
            dispatch(jlinkTargetActions.saveAsFile());
        },
        performJLinkRead: () => dispatch(jlinkTargetActions.read()),
        performReset: () => {
            dispatch(usbsdfuTargetActions.resetDevice());
        },
        performWrite: () => {
            dispatch(targetActions.write());
        },
        performModemUpdate: () => {
            dispatch(modemTargetActions.selectModemFirmware());
        },
    })
)(ControlPanel);
