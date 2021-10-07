/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

/**
 * Parser/writer for the "Intel hex" format.
 */

declare module "nrf-intel-hex" {
    export type MemoryBlocks =
        | { [x: number]: Uint8Array }
        | [number, Uint8Array][]
        | [string, Uint8Array][];

    export type Overlap = [string, Uint8Array][];
    export type Overlaps = Map<number, Overlap>;
    export type MemoryMapTuple = [string, MemoryMap];
    export type MemoryMaps = MemoryMapTuple[];

    export default class MemoryMap extends Map<number, Uint8Array> {
        constructor(blocks: MemoryBlocks);

        static flattenOverlaps(overlaps: Overlaps): MemoryMap;

        static overlapMemoryMaps(
            memoryMaps: MemoryMaps
        ): Overlaps;

        static fromHex(hexText: string, maxBlockSize?: number): MemoryMap;

        public join(maxBlockSize: number): MemoryMap;

        public paginate(pageSize?: number, pad?: number): MemoryMap;

        public getUint32(
            offset: number,
            littleEndian?: boolean
        ): number | undefined;

        public asHexString(lineSize?: number): string;

        public clone(): MemoryMap;

        static fromPaddedUint8Array(
            bytes: Uint8Array,
            padByte?: number,
            minPadLength?: number
        ): MemoryMap;

        public slice(address: number, length: number): MemoryMap;

        public slicePad(
            address: number,
            length: number,
            padByte?: number
        ): Uint8Array;

        public contains(memMap: MemoryMap): boolean;
    }
}
