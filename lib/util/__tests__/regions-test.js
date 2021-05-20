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

import { readFileSync } from 'fs';
import MemoryMap from 'nrf-intel-hex';

import { CoreDefinition } from '../devices';
import * as regions from '../regions';

const mbrFile = 'lib/util/__tests__/hex/mbr_nrf52_2.3.0-2.alpha_mbr.hex';
const bootloaderFile =
    'lib/util/__tests__/hex/dongle_bootloader_mbr_pca10056.hex';
const softDeviceFile =
    'lib/util/__tests__/hex/s140_nrf52840_5.0.0-2.alpha_softdevice.hex';
const twoAppFile = 'lib/util/__tests__/hex/app_two.hex';

describe('get regions', () => {
    it('should read MBR region', () => {
        const data = readFileSync(mbrFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getMBRRegion(memMap, CoreDefinition);
        expect(region.startAddress).toEqual(0);
    });

    it('should read Bootloader region', () => {
        const data = readFileSync(bootloaderFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getBootloaderRegion(memMap, CoreDefinition);
        expect(region.startAddress).toEqual(0xe0000);
    });

    it('should read SoftDevice region', () => {
        const data = readFileSync(softDeviceFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getSoftDeviceRegion(memMap, CoreDefinition);
        expect(region.startAddress).toEqual(0x1000);
    });
});

describe('detect regions', () => {
    it('should detect only MBR region', () => {
        const data = readFileSync(mbrFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const memMaps = [['', memMap]];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(1);
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).toBeUndefined();
    });

    it('should detect only Bootloader region and UICR region', () => {
        const data = readFileSync(bootloaderFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const memMaps = [['', memMap]];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(2);
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).toBeUndefined();
    });

    it('should detect MBR and SoftDevice region', () => {
        const data = readFileSync(softDeviceFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const memMaps = [['', memMap]];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(2);
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).toBeUndefined();
    });

    it('should detect two Application regions', () => {
        const data = readFileSync(twoAppFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const memMaps = [['', memMap]];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(2);
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).toBeUndefined();
    });

    it('should detect MBR, SoftDevice and Bootloader with UICR regions', () => {
        let data = readFileSync(bootloaderFile);
        const memMap = MemoryMap.fromHex(data.toString());
        data = readFileSync(softDeviceFile);
        const memMap2 = MemoryMap.fromHex(data.toString());
        const memMaps = [
            ['', memMap],
            ['', memMap2],
        ];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(4);
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).toBeUndefined();
    });

    it('should detect two Application, MBR, SoftDevice and Bootloader with UICR regions', () => {
        let data = readFileSync(bootloaderFile);
        const memMap = MemoryMap.fromHex(data.toString());
        data = readFileSync(softDeviceFile);
        const memMap2 = MemoryMap.fromHex(data.toString());
        data = readFileSync(twoAppFile);
        const memMap3 = MemoryMap.fromHex(data.toString());
        const memMaps = [
            ['', memMap],
            ['', memMap2],
            ['', memMap3],
        ];
        const regionList = regions.getFileRegions(memMaps, CoreDefinition);
        expect(regionList.size).toEqual(6);
        expect(
            regionList.find(r => r.name === regions.RegionName.MBR_OR_APP)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.SOFTDEVICE)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.BOOTLOADER)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.APPLICATION)
        ).not.toBeUndefined();
        expect(
            regionList.find(r => r.name === regions.RegionName.NONE)
        ).not.toBeUndefined();
    });
});
