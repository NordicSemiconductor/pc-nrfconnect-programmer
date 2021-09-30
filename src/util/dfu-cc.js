/* eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins */
import * as $protobuf from 'protobufjs/light';

const $root = (
    $protobuf.roots.default || ($protobuf.roots.default = new $protobuf.Root())
).addJSON({
    dfu: {
        nested: {
            OpCode: {
                values: {
                    RESET: 0,
                    INIT: 1,
                },
            },
            FwType: {
                values: {
                    APPLICATION: 0,
                    SOFTDEVICE: 1,
                    BOOTLOADER: 2,
                    SOFTDEVICE_BOOTLOADER: 3,
                },
            },
            HashType: {
                values: {
                    NO_HASH: 0,
                    CRC: 1,
                    SHA128: 2,
                    SHA256: 3,
                    SHA512: 4,
                },
            },
            Hash: {
                fields: {
                    hashType: {
                        rule: 'required',
                        type: 'HashType',
                        id: 1,
                    },
                    hash: {
                        rule: 'required',
                        type: 'bytes',
                        id: 2,
                    },
                },
            },
            InitCommand: {
                fields: {
                    fwVersion: {
                        type: 'uint32',
                        id: 1,
                    },
                    hwVersion: {
                        type: 'uint32',
                        id: 2,
                    },
                    sdReq: {
                        rule: 'repeated',
                        type: 'uint32',
                        id: 3,
                    },
                    type: {
                        type: 'FwType',
                        id: 4,
                    },
                    sdSize: {
                        type: 'uint32',
                        id: 5,
                    },
                    blSize: {
                        type: 'uint32',
                        id: 6,
                    },
                    appSize: {
                        type: 'uint32',
                        id: 7,
                    },
                    hash: {
                        type: 'Hash',
                        id: 8,
                    },
                    isDebug: {
                        type: 'bool',
                        id: 9,
                        options: {
                            default: false,
                        },
                    },
                },
            },
            ResetCommand: {
                fields: {
                    timeout: {
                        rule: 'required',
                        type: 'uint32',
                        id: 1,
                    },
                },
            },
            Command: {
                fields: {
                    opCode: {
                        type: 'OpCode',
                        id: 1,
                    },
                    init: {
                        type: 'InitCommand',
                        id: 2,
                    },
                    reset: {
                        type: 'ResetCommand',
                        id: 3,
                    },
                },
            },
            SignatureType: {
                values: {
                    ECDSA_P256_SHA256: 0,
                    ED25519: 1,
                },
            },
            SignedCommand: {
                fields: {
                    command: {
                        rule: 'required',
                        type: 'Command',
                        id: 1,
                    },
                    signatureType: {
                        rule: 'required',
                        type: 'SignatureType',
                        id: 2,
                    },
                    signature: {
                        rule: 'required',
                        type: 'bytes',
                        id: 3,
                    },
                },
            },
            Packet: {
                fields: {
                    command: {
                        type: 'Command',
                        id: 1,
                    },
                    signedCommand: {
                        type: 'SignedCommand',
                        id: 2,
                    },
                },
            },
        },
    },
});

export { $root as default };
