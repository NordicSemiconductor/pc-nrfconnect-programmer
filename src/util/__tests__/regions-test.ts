/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { readFileSync } from 'fs';
import MemoryMap, { MemoryMaps } from 'nrf-intel-hex';

import { defaultCore as CoreDefinition } from '../devices';
import * as regions from '../regions';

const mbrFile = 'src/util/__tests__/hex/mbr_nrf52_2.3.0-2.alpha_mbr.hex';
const bootloaderFile =
    'src/util/__tests__/hex/dongle_bootloader_mbr_pca10056.hex';
const softDeviceFile =
    'src/util/__tests__/hex/s140_nrf52840_5.0.0-2.alpha_softdevice.hex';
const twoAppFile = 'src/util/__tests__/hex/app_two.hex';

describe('get regions', () => {
    it('should read MBR region', () => {
        const data = readFileSync(mbrFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getMBRRegion(memMap, CoreDefinition);
        expect(region?.startAddress).toEqual(0);
    });

    it('should read Bootloader region', () => {
        const data = readFileSync(bootloaderFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getBootloaderRegion(memMap, CoreDefinition);
        expect(region?.startAddress).toEqual(0xe0000);
    });

    it('should read SoftDevice region', () => {
        const data = readFileSync(softDeviceFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const region = regions.getSoftDeviceRegion(memMap, CoreDefinition);
        expect(region?.startAddress).toEqual(0x1000);
    });
});

describe('detect regions', () => {
    it('should detect only MBR region', () => {
        const data = readFileSync(mbrFile);
        const memMap = MemoryMap.fromHex(data.toString());
        const memMaps = [['', memMap]] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(1);
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
        const memMaps = [['', memMap]] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(2);
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
        const memMaps = [['', memMap]] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(2);
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
        const memMaps = [['', memMap]] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(2);
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
        ] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(4);
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
        ] satisfies MemoryMaps<string>;
        const regionList = regions.generateFileRegions(memMaps, CoreDefinition);
        expect(regionList.length).toEqual(6);
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
