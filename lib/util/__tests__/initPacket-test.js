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

jest.mock('nrfconnect/core', () => {
    return {
        getAppDir: () => '.',
    }
});
import path from 'path';
import protobuf from 'protobufjs';
import { getAppDir } from 'nrfconnect/core';
import { createResetPacketBuffer, createInitPacketBuffer, SignatureType, FwType, HashType } from '../initPacket';

const TIMEOUT_ZERO = 0;
const TIMEOUT_ONE = 1;
const FW_VERSION = 0;
const HW_VERSION = 0;
const SD_REQ = [1, 2, 3, 4];
const SD_SIZE = 0xFFFF;
const BL_SIZE = 0xFFFF;
const APP_SIZE = 0xFFFF;
const HASH = [0x01, 0x02, 0x03, 0x04];
const IS_DEBUG_TRUE = true;
const IS_DEBUG_FALSE = false;
const SIGNATURE = [0x01, 0x02, 0x03, 0x04];
 
const protoPath = path.join(getAppDir(), 'resources/dfu-cc.proto');

async function getPacket(buffer) {
    if (!buffer)
        return buffer;

    const root = await protobuf.load(protoPath);
    const packetMessage = root.lookupType('dfu.Packet');
    const packet = packetMessage.decode(buffer);

    return packet;
}

describe('reset packet', async () => {
    it('reset packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer(TIMEOUT_ONE));
        expect(packet.command.reset.timeout).toEqual(TIMEOUT_ONE);
    });

    it('should success with timeout 0 when creating init packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer(TIMEOUT_ZERO));
        expect(packet.command.reset.timeout).toEqual(TIMEOUT_ZERO);
    });

    it('should fail without timeout when creating init packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer());
        expect(packet).toEqual();
    });
    
    it('should success with both signature type and signature when creating init packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer(TIMEOUT_ONE, SignatureType.ECDSA_P256_SHA256, SIGNATURE));
        expect(packet.signedCommand.command.reset.timeout).toEqual(TIMEOUT_ONE);
        expect(packet.signedCommand.signatureType).toEqual(SignatureType.ECDSA_P256_SHA256);
        expect(packet.signedCommand.signature).toEqual(new Buffer(SIGNATURE));
    });
    
    it('should fail without signature type when creating init packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer(TIMEOUT_ONE, SignatureType.ECDSA_P256_SHA256));
        expect(packet).toEqual();
    });
    
    it('should fail without signature when creating init packet with unsigned reset command', async () => {
        const packet = await getPacket(await createResetPacketBuffer(TIMEOUT_ONE, undefined, SIGNATURE));
        expect(packet).toEqual();
    });
});

describe('init packet', () => {
    it('init packet with unsigned init command', async () => {
        const packet = await getPacket(await createInitPacketBuffer(FW_VERSION, HW_VERSION, SD_REQ, FwType.APPLICATION, SD_SIZE, BL_SIZE, APP_SIZE, HashType.SHA128, HASH, IS_DEBUG_FALSE));
        expect(packet.command.init.fwVersion).toEqual(FW_VERSION);
        expect(packet.command.init.hwVersion).toEqual(HW_VERSION);
        expect(packet.command.init.sdReq).toEqual(SD_REQ);
        expect(packet.command.init.type).toEqual(FwType.APPLICATION);
        expect(packet.command.init.sdSize).toEqual(SD_SIZE);
        expect(packet.command.init.blSize).toEqual(BL_SIZE);
        expect(packet.command.init.appSize).toEqual(APP_SIZE);
        expect(packet.command.init.hash.hashType).toEqual(HashType.SHA128);
        expect(packet.command.init.hash.hash).toEqual(new Buffer(HASH));
        expect(packet.command.init.isDebug).toEqual(IS_DEBUG_FALSE);
        // await expect(createInitPacketBuffer(FW_VERSION, HW_VERSION, SD_REQ, FwType.APPLICATION, SD_SIZE, BL_SIZE, APP_SIZE, HashType.SHA128, HASH, IS_DEBUG_FALSE))
        //     .resolves.toEqual(new Buffer([18, 12, 10, 6, 8, 0, 26, 2, 8, TIMEOUT_ONE, 16, 0, 26, 4, 1, 2, 3, 4]));
    });
    // it('should success with timeout 0 when creating init packet with unsigned reset command', async () => {
    //     await expect(createResetPacket(0)).resolves.not.toBeNull();
    // });
    // it('should fail without timeout when creating init packet with unsigned reset command', async () => {
    //     await expect(createResetPacket()).rejects.not.toBeNull();
    // });
    // it('should success with both signature type and signature when creating init packet with unsigned reset command', async () => {
    //     await expect(createResetPacket(1, 0, 0)).resolves.not.toBeNull();
    // });
    // it('should fail without signature type when creating init packet with unsigned reset command', async () => {
    //     await expect(createResetPacket(1, 0)).rejects.not.toBeNull();
    // });
    // it('should fail without signature when creating init packet with unsigned reset command', async () => {
    //     await expect(createResetPacket(1, undefined, 0)).rejects.not.toBeNull();
    // });
});
