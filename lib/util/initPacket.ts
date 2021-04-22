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

import MemoryMap from 'nrf-intel-hex';
import protobuf from 'protobufjs';

import dfuCcProto from './dfu-cc';

const root = protobuf.Root.fromJSON(dfuCcProto);

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

export interface InitPacket {
    fwVersion?: number;
    hwVersion?: number;
    sdReq?: number;
    fwType?: number;
    sdSize: number;
    blSize: number;
    appSize: number;
    hashType: number;
    hash?: [];
    isDebug: boolean;
    signatureType?: number;
    signature?: [];
}

export const defaultInitPacket: InitPacket = {
    fwVersion: 0xffffffff,
    hwVersion: undefined,
    sdReq: undefined,
    fwType: undefined,
    sdSize: 0,
    blSize: 0,
    appSize: 0,
    hashType: HashType.NO_HASH,
    hash: undefined,
    isDebug: true,
    signatureType: undefined,
    signature: undefined,
};

export interface DfuImage {
    name: string;
    initPacket: InitPacket;
    firmwareImage: MemoryMap;
}

// Create hash by using hash type and bytes
const createHash = (hashType: number, hashInput: []): protobuf.Message => {
    const hashMessage = root.lookupType('dfu.Hash');
    const hashPayload = {
        hashType,
        hash: hashInput,
    };
    const hash = hashMessage.create(hashPayload);

    return hash;
};

// Create reset command
const createResetCommand = (timeout: number): protobuf.Message => {
    const resetCommandMessage = root.lookupType('dfu.ResetCommand');
    const resetCommandPayload = {
        timeout,
    };
    const resetCommand = resetCommandMessage.create(resetCommandPayload);

    return resetCommand;
};

// Create init command
const createInitCommand = (
    fwVersion: number | undefined,
    hwVersion: number | undefined,
    sdReq: number | undefined,
    type: number | undefined,
    sdSize: number | undefined,
    blSize: number | undefined,
    appSize: number | undefined,
    hash: protobuf.Message | undefined,
    isDebug = false
): protobuf.Message => {
    const initCommandMessage = root.lookupType('dfu.InitCommand');
    const initCommandPayload = {
        ...defaultInitPacket,
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
};

// Create command
const createCommand = (
    opCode: number,
    commandInput: protobuf.Message
): protobuf.Message => {
    const commandMessage = root.lookupType('dfu.Command');
    const commandPayload = {
        opCode,
        [opCode === OpCode.INIT ? 'init' : 'reset']: commandInput,
    };
    const command = commandMessage.create(commandPayload);

    return command;
};

// Create signed command
const createSignedCommand = (
    command: protobuf.Message,
    signatureType: number,
    signature: []
): protobuf.Message => {
    const signedCommandMessage = root.lookupType('dfu.SignedCommand');
    const signedCommandPayload = {
        command,
        signatureType,
        signature,
    };
    const signedCommand = signedCommandMessage.create(signedCommandPayload);

    return signedCommand;
};

// Create packet
const createPacket = (
    command: protobuf.Message,
    isSigned: boolean
): protobuf.Message => {
    const packetPayload = {
        [isSigned ? 'signedCommand' : 'command']: command,
    };
    const packetMessage = root.lookupType('dfu.Packet');
    const packet = packetMessage.create(packetPayload);

    return packet;
};

// Convert protocol buffer message to buffer
const messageToBuffer = (
    type: string,
    message: protobuf.Message
): Uint8Array => {
    if (!message) {
        throw Error('The message to be converted is undefined.');
    }

    const dfuMessage = root.lookup(`dfu.${type}`) as protobuf.Type;
    if (!dfuMessage) {
        throw Error('DFU type not found.');
    }

    const buffer = dfuMessage.encode(message).finish();

    return buffer;
};

/**
 * Create reset command packet
 *
 * @param {Integer} timeout         the timeout for reset
 * @param {Integer} signatureType   the type of signature
 * @param {Array}   signature       the signature in bytes
 *
 * @returns {protobuf.Message | undefined} reset command packet
 */
export const createResetPacket = (
    timeout: number,
    signatureType: number,
    signature: []
): protobuf.Message => {
    // Check input parameters
    if (timeout === undefined) {
        throw new Error('Timeout is not set');
    }

    // It checks both null and undefined here
    if (
        (signatureType == null && signature != null) ||
        (signatureType != null && signature == null)
    ) {
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
};

/**
 * Create reset command buffer
 *
 * @param {Integer} timeout         the timeout for reset
 * @param {Integer} signatureType   the type of signature
 * @param {Array}   signature       the signature in bytes
 *
 * @returns {Uint8Array} converted from reset command packet
 */
export const createResetPacketBuffer = (
    timeout: number,
    signatureType: number,
    signature: []
): Uint8Array => {
    const packet = createResetPacket(timeout, signatureType, signature);
    const buffer = messageToBuffer('Packet', packet);

    return buffer;
};

/**
 * Create init command packet
 *
 * @param {Integer}         fwVersion       the firmware version
 * @param {Integer}         hwVersion       the hardware version
 * @param {Array}           sdReq           the softdevice requirements
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
 * @returns {protobuf.Message} init command packet
 */
export const createInitPacket = (
    fwVersion: number | undefined,
    hwVersion: number | undefined,
    sdReq: number | undefined,
    fwType: number | undefined,
    sdSize: number | undefined,
    blSize: number | undefined,
    appSize: number | undefined,
    hashType: number | undefined,
    hash: [] | undefined,
    isDebug: boolean,
    signatureType: number | undefined,
    signature: [] | undefined
): protobuf.Message => {
    // It checks both null and undefined here
    if (
        (signatureType == null && signature != null) ||
        (signatureType != null && signature == null)
    ) {
        throw new Error('Either signature type or signature is not set');
    }

    // Create init command
    const hashInput = createHash(hashType || HashType.NO_HASH, hash || []);
    const initCommand = createInitCommand(
        fwVersion,
        hwVersion,
        sdReq,
        fwType,
        sdSize,
        blSize,
        appSize,
        hashInput,
        isDebug
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
};

/**
 * Create init command buffer
 *
 * @param {Integer}         fwVersion       the firmware version
 * @param {Integer}         hwVersion       the hardware version
 * @param {Array}           sdReq           the softdevice requirements
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
 * @returns {Uint8Array} converted from init command packet
 */
export const createInitPacketBuffer = (
    fwVersion: number,
    hwVersion: number,
    sdReq: number,
    fwType: number,
    sdSize: number,
    blSize: number,
    appSize: number,
    hashType: number,
    hash: [],
    isDebug: boolean,
    signatureType: number,
    signature: []
): Uint8Array => {
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
        signature
    );
    const buffer = messageToBuffer('Packet', packet);

    return buffer;
};

/**
 * Create init command packet Uint8Array
 *
 * @param {InitPacket} packetParams the InitPacket which carries all information
 *
 * @returns {Uint8Array} converted from init command packet buffer
 */
export const createInitPacketUint8Array = (
    packetParams: InitPacket
): Uint8Array => {
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
        packetParams.signature
    );
    const buffer = messageToBuffer('Packet', packet);

    return new Uint8Array(buffer);
};
