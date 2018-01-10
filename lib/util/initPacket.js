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

import protobuf from 'protobufjs';
import path from 'path';
import { getAppDir } from 'nrfconnect/core';
import { resolve } from 'dns';
import { create } from 'domain';

const protoPath = path.join(getAppDir(), 'resources/dfu-cc.proto');

export const OpCode = {
    RESET: 0,
    INIT: 1,
}

export const FwType = {
    APPLICATION: 0,
    SOFTDEVICE: 1,
    BOOTLOADER: 2,
    SOFTDEVICE_BOOTLOADER: 3,
}

export const HashType = {
    NO_HASH: 0,
    CRC: 1,
    SHA128: 2,
    SHA256: 3,
    SHA512: 4,
}

export const SignatureType = {
    ECDSA_P256_SHA256: 0,
    ED25519: 1,
}

async function createHash(hash_type, hash) {
    const root = await protobuf.load(protoPath);
    const hashMessage = root.lookupType('dfu.Hash');
    const hashPayload = {
        hash_type,
        hash
    }
    return hashMessage.create(hashPayload);
}

// Create reset command
async function createResetCommand(timeout) {
    const root = await protobuf.load(protoPath);
    const resetCommandMessage = root.lookupType('dfu.ResetCommand');
    const resetCommandPayload = {
        timeout,
    }
    return resetCommandMessage.create(resetCommandPayload);
}

// Create init command
async function createInitCommand(fw_version, hw_version, sd_req, type, sd_size, bl_size, app_size, hash, is_debug) {
    const root = await protobuf.load(protoPath);
    const initCommandMessage = root.lookupType('dfu.InitCommand');
    const initCommandPayload = {
        fw_version,
        hw_version,
        sd_req,
        type,
        sd_size,
        bl_size,
        app_size,
        hash,
        is_debug: is_debug || false,
    }
    return initCommandMessage.create(initCommandPayload);
}

// Create command
async function createCommand(op_code, commandInput) {
    const root = await protobuf.load(protoPath);
    let init, reset;
    if (op_code) {
        init = commandInput;
    } else {
        reset = commandInput;
    }
    const commandMessage = root.lookupType('dfu.Command');
    const commandPayload = {
        op_code,
        init,
        reset,
    }
    return commandMessage.create(commandPayload);
}

// Create signed command

async function createSignedCommand(command, signature_type, signature) {
    const root = await protobuf.load(protoPath);
    // Create SignedCommand
    const signedCommandMessage = root.lookupType('dfu.SignedCommand');
    const signedCommandPayload = {
        command,
        signature_type,
        signature,
    }
    const signedCommand = signedCommandMessage.create(signedCommandPayload);
    const buffer = signedCommandMessage.encode(signedCommand).finish();
    // console.log(buffer);
    return signedCommand;
}

// Create packet
async function createPacket(commandInput, isSigned) {
    const root = await protobuf.load(protoPath);
    console.log(commandInput);
    let command, signed_command;
    if(isSigned) {
        signed_command = commandInput;
        const signedCommandMessage = root.lookupType('dfu.SignedCommand');
        const buffer1 = signedCommandMessage.encode(signed_command).finish();
        console.log(buffer1);
        const tmp = signedCommandMessage.decode(buffer1);
        console.log(tmp);
    } else 
        command = commandInput;

    console.log('isSigned', isSigned);
    const packetMessage = root.lookupType('dfu.Packet');
    const packetPayload = {
        command,
        signed_command,
    }
    const packet = packetMessage.create(packetPayload);
    const buffer = packetMessage.encode(packet).finish();
    console.log('buffer', buffer);
    console.log('packet', packetMessage.decode(buffer));
    return buffer;
}

/**
 * Create reset command
 *
 * @param {Integer} timeout the timeout for reset
 * 
 * @returns {Packet} the unsigend reset command packet
 */
export async function createResetPacket(timeout, signatureType, signature) {
    // Check input parameters
    timeout === undefined && reject('Timeout is not set');
    signatureType === undefined ^ signature === undefined && reject('Either signature type or signature is not set');

    // Create reset command
    const resetCommand = await createResetCommand(timeout);
    let isSigned = false;
    let command = await createCommand(OpCode.RESET, resetCommand);

    // Create signed command if it is signed
    if (signatureType !== undefined && signature !== undefined) {
        isSigned = true;
        command = await createSignedCommand(command, signatureType, signature);
    } 

    return await createPacket(command, isSigned);
}

export async function createInitPacket(fwVersion, hwVersion, sdReq, fwType, sdSize, blSize, appSize, hashType, hash, isDebug, signatureType, signature) {

    // Create init command
    const hashInput = await createHash(hashType, hash);
    const initCommand = await createInitCommand(fwVersion, hwVersion, sdReq, fwType, sdSize, blSize, appSize, hashInput, isDebug);
    let command = await createCommand(OpCode.INIT, initCommand);
    let isSigned = false;

    // Create signed command if it is signed
    if (signatureType !== undefined && signature !== undefined) {
        command = await createSignedCommand(command, signatureType, signature);
        isSigned = true;
    } 

    console.log(await createPacket(command, signatureType, signature));
    return await createPacket(command, signatureType, signature);
}
