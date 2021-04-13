/**
 * Parser/writer for the "Intel hex" format.
 */
declare module "nrf-intel-hex" {
    export type MemoryBlocks =
        | { [x: number]: Uint8Array }
        | [number, Uint8Array][];

    export type Overlap = [string, Uint8Array][];
    export type Overlaps = Map<number, Overlap>;

    export default class MemoryMap extends Map<number, Uint8Array> {
        constructor(blocks: MemoryBlocks);

        static flattenOverlaps(overlaps: Overlaps): MemoryMap;

        static overlapMemoryMaps(
            memoryBlock: MemoryBlocks
        ): Overlaps;

        public fromHex(hexText: string, maxBlockSize: number): MemoryMap;

        public join(maxBlockSize: number): MemoryMap;

        public paginate(pageSize?: number, pad?: number): MemoryMap;

        public getUint32(
            offset: number,
            littleEndian?: boolean
        ): number | undefined;

        public asHexString(lineSize?: number): string;

        public clone(): MemoryMap;

        public fromPaddedUint8Array(
            bytes: Uint8Array,
            padByte?: number,
            minPadLength?: number
        ): MemoryMap;

        public slice(address: number, length: number): MemoryMap;

        public slicePad(
            address: number,
            length: number,
            padByte?: number
        ): MemoryMap;

        public contains(memMap: MemoryMap): boolean;
    }
}
