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

import protobuf from 'protobufjs';
import { Record } from 'immutable';
import dfuCcProto from './dfu-cc';

const root = protobuf.Root.fromJSON(dfuCcProto);

export const InitPacket = new Record({
    fwVersion: 0xFFFFFFFF,
    hwVersion: null,
    sdReq: null,
    fwType: null,
    sdSize: 0,
    blSize: 0,
    appSize: 0,
    hashType: null,
    hash: null,
    isDebug: true,
    signatureType: null,
    signature: null,
});

export const OpCode = {
    RESET: 0,
    INIT: 1,
};

export const FwType = {
    APPLICATION: 0,
    SOFTDEVICE: 1,
    BOOTLOADER: 2,
    SOFTDEVICE_BOOTLOADER: 3,
};

export const HashType = {
    NO_HASH: 0,
    CRC: 1,
    SHA128: 2,
    SHA256: 3,
    SHA512: 4,
};

export const SignatureType = {
    ECDSA_P256_SHA256: 0,
    ED25519: 1,
};

// Create hash by using hash type and bytes
function createHash(hashType, hashInput) {
    const hashMessage = root.lookupType('dfu.Hash');
    const hashPayload = {
        hashType,
        hash: hashInput,
    };
    const hash = hashMessage.create(hashPayload);

    return hash;
}

// Create reset command
function createResetCommand(timeout) {
    const resetCommandMessage = root.lookupType('dfu.ResetCommand');
    const resetCommandPayload = {
        timeout,
    };
    const resetCommand = resetCommandMessage.create(resetCommandPayload);

    return resetCommand;
}

// Create init command
function createInitCommand(
    fwVersion,
    hwVersion,
    sdReq,
    type,
    sdSize,
    blSize,
    appSize,
    hash,
    isDebug = false,
) {
    const initCommandMessage = root.lookupType('dfu.InitCommand');
    const initCommandPayload = {
        fwVersion,
        hwVersion,
        sdReq,
        type: type || FwType.APPLICATION,
        sdSize,
        blSize,
        appSize,
        hash,
        isDebug,
    };

    return initCommandMessage.create(initCommandPayload);
}

// Create command
function createCommand(opCode, commandInput) {
    const commandMessage = root.lookupType('dfu.Command');
    const commandPayload = {
        opCode,
        [opCode === OpCode.INIT ? 'init' : 'reset']: commandInput,
    };
    const command = commandMessage.create(commandPayload);

    return command;
}

// Create signed command
function createSignedCommand(command, signatureType, signature) {
    const signedCommandMessage = root.lookupType('dfu.SignedCommand');
    const signedCommandPayload = {
        command,
        signatureType,
        signature,
    };
    const signedCommand = signedCommandMessage.create(signedCommandPayload);

    return signedCommand;
}

// Create packet
function createPacket(command, isSigned) {
    const packetPayload = {
        [isSigned ? 'signedCommand' : 'command']: command,
    };
    const packetMessage = root.lookupType('dfu.Packet');
    const packet = packetMessage.create(packetPayload);

    return packet;
}

// Convert protocol buffer message to buffer
function messageToBuffer(type, message) {
    if (!message) {
        return undefined;
    }

    const dfuMessage = root.lookup(`dfu.${type}`);
    const buffer = dfuMessage.encode(message).finish();

    return buffer;
}

/**
 * Create reset command packet
 *
 * @param {Integer} timeout         the timeout for reset
 * @param {Integer} signatureType   the type of signature
 * @param {Array}   signature       the signature in bytes
 *
 * @returns {Promise} the Promise which returns reset command packet
 */
export function createResetPacket(timeout, signatureType, signature) {
    try {
        // Check input parameters
        if (timeout === undefined) {
            throw new Error('Timeout is not set');
        }

        // It checks both null and undefined here
        if ((signatureType == null && signature != null) ||
            (signatureType != null && signature == null)) {
            throw new Error('Either signature type or signature is not set');
        }

        // Create reset command
        const resetCommand = createResetCommand(timeout);
        let isSigned = false;
        let command = createCommand(OpCode.RESET, resetCommand);

        // Create signed command if it is signed
        // It checks both null and undefined here
        if (signatureType != null && signature != null) {
            isSigned = true;
            command = createSignedCommand(command, signatureType, signature);
        }

        // Create packet
        const packet = createPacket(command, isSigned);

        return packet;
    } catch (err) {
        return undefined;
    }
}

/**
 * Create reset command buffer
 *
 * @param {Integer} timeout         the timeout for reset
 * @param {Integer} signatureType   the type of signature
 * @param {Array}   signature       the signature in bytes
 *
 * @returns {Promise} the Promise which returns buffer converted from reset command packet
 */
export function createResetPacketBuffer(timeout, signatureType, signature) {
    const packet = createResetPacket(timeout, signatureType, signature);
    const buffer = messageToBuffer('Packet', packet);

    return buffer;
}

/**
 * Create init command packet
 *
 * @param {Integer}         fwVersion       the firmware version
 * @param {Integer}         hwVersion       the hardware version
 * @param {Array}           sdReq           the softdevcie requirements
 * @param {FwType}          fwType          the firmware type
 * @param {Integer}         sdSize          the size of softDevice
 * @param {Integer}         blSize          the size of bootloader
 * @param {Integer}         appSize         the size of application
 * @param {HashType}        hashType        the type of hash
 * @param {Array}           hash            the hash in bytes
 * @param {Boolean}         isDebug         whether it is in debug mode or not
 * @param {SignatureType}   signatureType   the type of signature
 * @param {Array}           signature       the signature in bytes
 *
 * @returns {Promise} the Promise which returns init command packet
 */
export function createInitPacket(
    fwVersion,
    hwVersion,
    sdReq,
    fwType,
    sdSize,
    blSize,
    appSize,
    hashType,
    hash,
    isDebug,
    signatureType,
    signature,
) {
    try {
        // It checks both null and undefined here
        if ((signatureType == null && signature != null) ||
            (signatureType != null && signature == null)) {
            throw new Error('Either signature type or signature is not set');
        }

        // Create init command
        const hashInput = createHash(hashType, hash);
        const initCommand = createInitCommand(
            fwVersion,
            hwVersion,
            sdReq,
            fwType,
            sdSize,
            blSize,
            appSize,
            hashInput,
            isDebug,
        );
        let command = createCommand(OpCode.INIT, initCommand);
        let isSigned = false;

        // Create signed command if it is signed
        if (signatureType != null && signature != null) {
            command = createSignedCommand(command, signatureType, signature);
            isSigned = true;
        }

        // Create packet
        const packet = createPacket(command, isSigned);

        return packet;
    } catch (err) {
        return undefined;
    }
}

/**
 * Create init command buffer
 *
 * @param {Integer}         fwVersion       the firmware version
 * @param {Integer}         hwVersion       the hardware version
 * @param {Array}           sdReq           the softdevcie requirements
 * @param {FwType}          fwType          the firmware type
 * @param {Integer}         sdSize          the size of softdevice
 * @param {Integer}         blSize          the size of bootloader
 * @param {Integer}         appSize         the size of application
 * @param {HashType}        hashType        the type of hash
 * @param {Array}           hash            the hash in bytes
 * @param {Boolean}         isDebug         whether it is in debug mode or not
 * @param {SignatureType}   signatureType   the type of signature
 * @param {Array}           signature       the signature in bytes
 *
 * @returns {Promise} the Promise which returns buffer converted from init command packet
 */
export function createInitPacketBuffer(
    fwVersion,
    hwVersion,
    sdReq,
    fwType,
    sdSize,
    blSize,
    appSize,
    hashType,
    hash,
    isDebug,
    signatureType,
    signature,
) {
    const packet = createInitPacket(
        fwVersion,
        hwVersion,
        sdReq,
        fwType,
        sdSize,
        blSize,
        appSize,
        hashType,
        hash,
        isDebug,
        signatureType,
        signature,
    );
    const buffer = messageToBuffer('Packet', packet);

    return buffer;
}

/**
 * Create init command packet Uint8Array
 *
 * @param {InitPacket} packetParams the InitPacket which carries all infomations
 *
 * @returns {Promise} the Promise which returns Uint8Array converted from init command packet buffer
 */
export function createInitPacketUint8Array(packetParams) {
    const packet = createInitPacket(
        packetParams.fwVersion,
        packetParams.hwVersion,
        packetParams.sdReq,
        packetParams.fwType,
        packetParams.sdSize,
        packetParams.blSize,
        packetParams.appSize,
        packetParams.hashType,
        packetParams.hash,
        packetParams.isDebug,
        packetParams.signatureType,
        packetParams.signature,
    );
    const buffer = messageToBuffer('Packet', packet);

    return new Uint8Array(buffer);
}
