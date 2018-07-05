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

import { List } from 'immutable';
import * as jlinkTargetActions from './jlinkTargetActions';
import * as usbsdfuTargetActions from './usbsdfuTargetActions';
import { CommunicationType } from '../util/devices';
import { RegionName } from '../util/regions';
import { fileRegionsKnownAction } from './fileActions';

export const TARGET_TYPE_KNOWN = 'TARGET_TYPE_KNOWN';
export const TARGET_INFO_KNOWN = 'TARGET_INFO_KNOWN';
export const TARGET_WARNING_KNOWN = 'TARGET_WARNING_KNOWN';
export const TARGET_CONTENTS_KNOWN = 'TARGET_CONTENTS_KNOWN';
export const TARGET_REGIONS_KNOWN = 'TARGET_REGIONS_KNOWN';
export const TARGET_WRITABLE_KNOWN = 'TARGET_WRITABLE_KNOWN';
export const DFU_IMAGES_UPDATE = 'DFU_IMAGES_UPDATE';
export const INIT_PACKET_FW_VERSION_KNOWN = 'INIT_PACKET_FW_VERSION_KNOWN';
export const INIT_PACKET_HW_VERSION_KNOWN = 'INIT_PACKET_HW_VERSION_KNOWN';
export const INIT_PACKET_APP_KNOWN = 'INIT_PACKET_APP_KNOWN';
export const INIT_PACKET_SD_KNOWN = 'INIT_PACKET_SD_KNOWN';
export const INIT_PACKET_BL_KNOWN = 'INIT_PACKET_BL_KNOWN';
export const INIT_PACKET_HASH_KNOWN = 'INIT_PACKET_HASH_KNOWN';
export const INIT_PACKET_IS_DEBUG_KNOWN = 'INIT_PACKET_IS_DEBUG_KNOWN';
export const INIT_PACKET_SIGNATURE_KNOWN = 'INIT_PACKET_SIGNATURE_KNOWN';
export const WRITE_PROGRESS_START = 'WRITE_PROGRESS_START';
export const WRITE_PROGRESS_FINISHED = 'WRITE_PROGRESS_FINISHED';
export const REFRESH_ALL_FILES_START = 'REFRESH_ALL_FILES_START';
export const WRITE_START = 'WRITE_START';
export const RECOVER_START = 'RECOVER_START';
export const TARGET_PORT_CHANGED = 'TARGET_PORT_CHANGED';

export function targetTypeKnownAction(targetType, isRecoverable) {
    return {
        type: TARGET_TYPE_KNOWN,
        targetType,
        isRecoverable,
    };
}

export function targetInfoKnownAction(deviceInfo) {
    return {
        type: TARGET_INFO_KNOWN,
        deviceInfo,
    };
}

export function targetWarningKnownAction(...warnings) {
    return {
        type: TARGET_WARNING_KNOWN,
        warnings: new List([...warnings]),
    };
}

export function targetContentsKnownAction(targetMemMap) {
    return {
        type: TARGET_CONTENTS_KNOWN,
        targetMemMap,
    };
}

export function targetRegionsKnownAction(regions) {
    return {
        type: TARGET_REGIONS_KNOWN,
        regions,
    };
}

export function targetWritableKnownAction(isWritable) {
    return {
        type: TARGET_WRITABLE_KNOWN,
        isWritable,
    };
}

export function dfuImagesUpdateAction(dfuImages) {
    return {
        type: DFU_IMAGES_UPDATE,
        dfuImages,
    };
}

export function initPacketHwVersionKnownAction(hwVersion) {
    return {
        type: INIT_PACKET_HW_VERSION_KNOWN,
        hwVersion,
    };
}

export function initPacketAPPKnownAction(appSize, sdReq) {
    return {
        type: INIT_PACKET_APP_KNOWN,
        appSize,
        sdReq,
    };
}

export function initPacketBLKnownAction(blSize, sdReq) {
    return {
        type: INIT_PACKET_BL_KNOWN,
        blSize,
        sdReq,
    };
}

export function initPacketSDKnownAction(sdSize) {
    return {
        type: INIT_PACKET_SD_KNOWN,
        sdSize,
    };
}

export function initPacketHashKnownAction(hashType, hash) {
    return {
        type: INIT_PACKET_HASH_KNOWN,
        hashType,
        hash,
    };
}

export function initPacketIsDebugKnownAction(isDebug) {
    return {
        type: INIT_PACKET_IS_DEBUG_KNOWN,
        isDebug,
    };
}

export function initPacketSignatureKnownAction(signatureType, signature) {
    return {
        type: INIT_PACKET_SIGNATURE_KNOWN,
        signatureType,
        signature,
    };
}

export function writeProgressFinishedAction() {
    return {
        type: WRITE_PROGRESS_FINISHED,
    };
}

export function writeProgressStartAction() {
    return {
        type: WRITE_PROGRESS_START,
    };
}

export function refreshAllFilesStartAction() {
    return {
        type: REFRESH_ALL_FILES_START,
    };
}

export function writeStartAction() {
    return {
        type: WRITE_START,
    };
}

export function recoverStartAction() {
    return {
        type: RECOVER_START,
    };
}

export function targetPortChanged(serialNumber, comName) {
    return {
        type: TARGET_PORT_CHANGED,
        device: {
            serialNumber,
            serialport: {
                comName,
            },
        },
    };
}

// There is an Application on top of SoftDevice in the .hex file,
// but there is no SoftDevice in the .hex file,
// In this case, if there is a SoftDevice being found in target device,
// then the Application region should be displayed.
// If there is no SoftDevice in both .hex file and target device,
// then the user should give input instead.
// (Or fix getting softdevice id from bootloader)
export function updateFileAppRegions() {
    return (dispatch, getState) => {
        let fileRegions = getState().app.file.regions;
        const targetRegions = getState().app.target.regions;
        const deviceInfo = getState().app.target.deviceInfo;

        // Assume that the region on top of the SoftDevice is application.
        // Assume also that the region on top of the MBR which is not SoftDevice is application.
        const fileSoftDeviceRegion = fileRegions.find(r => r.name === RegionName.SOFTDEVICE);
        const targetSoftDeviceRegion = targetRegions.find(r => r.name === RegionName.SOFTDEVICE);
        const pageSize = deviceInfo.pageSize;
        if (!fileSoftDeviceRegion && targetSoftDeviceRegion) {
            const softDeviceEnd = targetSoftDeviceRegion.startAddress
                + targetSoftDeviceRegion.regionSize;
            let appRegion = fileRegions.find(r =>
                r.startAddress === Math.ceil((softDeviceEnd) / pageSize) * pageSize);
            if (appRegion) {
                const appRegionIndex = fileRegions.indexOf(appRegion);
                appRegion = appRegion.set('name', RegionName.APPLICATION);
                fileRegions = fileRegions.set(appRegionIndex, appRegion);
                dispatch(fileRegionsKnownAction(fileRegions));
            }
        }

        // Remove Application label if there is no SoftDevice region existing.
        // TODO: fix after dfu
        if (!fileSoftDeviceRegion && !targetSoftDeviceRegion) {
            let appRegion = fileRegions.find(r => r.name === RegionName.APPLICATION);
            if (appRegion) {
                const appRegionIndex = fileRegions.indexOf(appRegion);
                appRegion = appRegion.set('name', RegionName.NONE);
                fileRegions = fileRegions.set(appRegionIndex, appRegion);
                dispatch(fileRegionsKnownAction(fileRegions));
            }
        }
    };
}

// Update the states of target whether it is writable or not
export function updateTargetWritable() {
    return (dispatch, getState) => {
        switch (getState().app.target.targetType) {
            case CommunicationType.JLINK:
                dispatch(jlinkTargetActions.canWrite());
                break;
            case CommunicationType.USBSDFU:
                dispatch(usbsdfuTargetActions.canWrite());
                break;
            default:
                dispatch(targetWarningKnownAction('Target type is unknown'));
                dispatch(targetWritableKnownAction(false));

        }
    };
}
