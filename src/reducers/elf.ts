/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

export interface ElfFile {
    abiversion: string;
    body: {
        programs: ElfProgram[];
        sections: ElfSection[];
    };
    class: string;
    ehsize: number;
    endian: string;
    entry: number;
    flags: number;
    machine: string;
    osabi: string;
    phentsize: number;
    phnum: number;
    phoff: number;
    shentsize: number;
    shnum: number;
    shoff: number;
    shstrndx: number;
    type: string;
    version: number;
}
interface ElfSection {
    addr: number;
    addralign: number;
    data: Buffer;
    entsize: number;
    flags: { write: boolean; alloc: boolean; execinstr: boolean };
    info: number;
    link: number;
    name: string;
    off: number;
    size: number;
    type: string;
}

interface ElfProgram {
    align: number;
    data: Buffer;
    filesz: number;
    flags: { x: boolean; w: boolean; r: boolean };
    memsz: number;
    offset: number;
    paddr: number;
    type: string;
    vaddr: number;
}
