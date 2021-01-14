/**
 * The `pc-nrfjprog-js` module exposes the functionality to the
 * nRF5x Command-line tools to your node.js programs.
 */
declare module 'pc-nrfjprog-js' {
  // Functions

  type CallbackResult<T> = (
    err: JProgError | undefined,
    result: T | undefined
  ) => void;

  /**
   * Async function to close a connection to a device opened by `open`.
   *
   * @param serialNumber The serial number of the device to close.
   * @param callback A callback function to handle the async response.
   */
  export function close(
    serialNumber: string,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to erase a chunk of memory.
   *
   * This is the same functionality as running `"nrfjprog --erasepage"`
   * in the command-line tools.
   *
   * Will not erase a locked device; to do so, use `recover`.
   *
   * @param serialNumber The serial number of the device.
   * @param options Options for how to erase the device memory.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function erase(
    serialNumber: string,
    options: EraseOptions,
    progressCallback: (progress: Progress) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to get a list of all connected devices.
   *
   * @param callback A callback function to handle the async response.
   */
  export function getConnectedDevices(
    callback: (
      err: JProgError,
      devices: SerialNumberAndDeviceInformation[]
    ) => void
  ): void;

  /**
   * Async function to get information of a single device, given its serial number.
   *
   * @param serialNumber The serial number of the device to query.
   * @param callback A callback function to handle the async response.
   */
  export function getDeviceInfo(
    serialNumber: string,
    callback: (err: JProgError, device: DeviceInformation) => void
  ): void;

  /**
   * Alias of `getLibrarayVersion`.
   *
   * @deprecated Use `getLibraryVersion` instead.
   */
  export function getDllVersion(
    callback: (err: JProgError, version: Version) => void
  ): void;

  /**
   * Async function to get the version of the nrfjprog library in use.
   *
   * @param callback A callback function to handle the async response.
   */
  export function getLibraryVersion(
    callback: (err: JProgError, version: Version) => void
  ): void;

  /**
   * Async function to get information about the low level library
   * used by the device, given its serial number.
   *
   * @param serialNumber The serial number of the device to query.
   * @param callback A callback function to handle the async response.
   */
  export function getLibraryInfo(
    serialNumber: string,
    callback: (err: JProgError, libraryInfo: LibraryInformation) => void
  ): void;

  /**
   * Async function to get information of a single device,
   * given its serial number.
   *
   * @param serialNumber The serial number of the device to query.
   * @param callback A callback function to handle the async response.
   */
  export function getProbeInfo(
    serialNumber: string,
    callback: (err: JProgError, probeInfo: ProbeInformation) => void
  ): void;

  /**
   * Async function to get the serial numbers of allconnected devices.
   *
   * @param callback A callback function to handle the async response.
   */
  export function getSerialNumbers(
    callback: (err: JProgError, serialNumbers: number[]) => void
  ): void;

  /**
   * Async function to open (and keep open) a connection to a device.
   *
   * By default, all other function calls implicitly open a connection,
   * perform an operation, reset the device and close the connection
   * to the device.
   *
   * This can impact performance negatively. In order to prevent the
   * extra steps (open, reset, close), one can explicitly `open()`
   * and `close()` a connection to a device. This will keep a connection
   * open, allowing all other function calls to execute faster, and
   * resetting the device only once (when the connection is closed).
   *
   * Open connections should be closed by calling `close`. If a
   * connection to a device is opened, then all subsequent calls
   * will use the already-opened connection. Opening a connection twice
   * will close the first connection and return an error. Closing a
   * connection twice will close it on the first `close` call: the
   * second one will have no effect.
   *
   * @param serialNumber The serial number of the device to query.
   * @param callback A callback function to handle the async response.
   */
  export function open(
    serialNumber: string,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to push a program to the device.
   *
   * This is the same functionality as running `"nrfjprog --program"`
   * in the command-line tools.
   *
   * If the `ProgramOption` chip_erase_mode is `ERASE_ALL`, this
   * function will recover the device if it initially is not allowed
   * to program the device due to protection.
   *
   * @param serialNumber The serial number of the device to program.
   * @param fileName Either the filename of the .hex file containing the program, or the contents of such a file.
   * @param options Options about how to push the program.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function program(
    serialNumber: string,
    fileName: string,
    options: ProgramOptions,
    progressCallback: (progress: Progress) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to push a DFU update to the modem coprocessor of the device.
   *
   * @param serialNumber The serial number of the device to program.
   * @param filename The filename of the .zip file containing the update.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function programDFU(
    serialNumber: string,
    filename: string,
    progressCallback: (err: JProgError) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to push a DFU update to the modem coprocessor of the device.
   *
   * @param serialNumber The serial number of the device to program.
   * @param filename Filename of the .hex file containing the mcuboot update.
   * @param uart The connected device UART.
   * @param timeout Timeout in milliseconds. For DFU, it must be more than 11000 because of the response time when programming starts.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function programMcuBootDFU(
    serialNumber: string,
    filename: string,
    uart: string,
    timeout: number,
    progressCallback: (err: JProgError) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to read a chunk of memory.
   *
   * The data received by the callback are an array of integers,
   * each of them representing a single byte (with values from`0` to `255`).
   *
   * The read operation happens without verifying that the addresses
   * are accessible or even exist. Note that if the target address is
   * in unpowered RAM, the operation will fail.
   *
   * Please note that the data is an array of numbers - it is not a
   * `UInt8Array`, and it is not a `Buffer`.
   *
   * This is the same functionality as running `"nrfjprog --memrd"`
   * in the command-line tools.
   *
   * @param serialNumber The serial number of the device to program.
   * @param address The start address of the block of memory to be read.
   * @param length The amount of bytes to be read.
   * @param callback A callback function to handle the async response.
   */
  export function read(
    serialNumber: string,
    address: number,
    length: number,
    callback: (err: JProgError, bytes: number[]) => void
  ): void;

  /**
   * Async function to read memory from the device and write the
   * results into a file.
   *
   * The read operation happens without verifying that the addresses
   * are accessible or even exist. Note that if the target address is
   * in unpowered RAM, the operation will fail.
   *
   * This is the same functionality as running `"nrfjprog --readcode"`
   * in the command-line tools.
   *
   * @param serialNumber The serial number of the device to program.
   * @param fileName The filename of the .hex file where the content of the device should be stored.
   * @param options Options about how to read the program.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function readToFile(
    serialNumber: string,
    filename: string,
    options: ReadToFileOptions,
    progressCallback: (err: JProgError) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to read a single 4-byte word from memory.
   *
   * The read operation happens without verifying that the addresses
   * are accessible or even exist. The address parameter needs to be
   * 32-bit aligned (a multiple of 4). Note that if the target address
   * is in unpowered RAM, the operation will fail.
   *
   * This is the same functionality as running `"nrfjprog --readcode"`
   * in the command-line tools.
   *
   * @param serialNumber The serial number of the device to program.
   * @param address The address of the word to be read
   * @param callback A callback function to handle the async response.
   */
  export function readU32(
    serialNumber: string,
    address: number,
    options: ReadToFileOptions,
    callback: (err: JProgError, word: number) => void
  ): void;

  /**
   * Async function to recover a device.
   *
   * This operation attempts to recover the device and leave it
   * as it was when it left Nordic factory.
   *
   * It will attempt to connect, erase all user available flash,
   * halt and eliminate any protection. Note that this operation
   * may take up to 30 s if the device was readback protected.
   *
   * Note as well that this function only affects internal flash
   * and CPU, but does not erase, reset or stop any peripheral,
   * oscillator source nor extarnally QSPI-connected flash. The
   * operation will therefore leave the watchdog still operational
   * if it was running.
   *
   * This is the same functionality as running `"nrfjprog --recover"`
   * in the command-line tools.
   *
   * @param serialNumber The serial number of the device to program.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function readToFile(
    serialNumber: string,
    progressCallback: (err: JProgError) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to veify the program in the device.
   *
   * Compares the contents of the provided .hex file against the
   * contents of the memory of the device connected.
   *
   * This is the same functionality as running `"nrfjprog --verify"`
   * in the command-line tools.
   *
   * @param serialNumber The serial number of the device to program.
   * @param fileName The filename of the .hex file containing the program.
   * @param options Reserved for future use; an empty object by default.
   * @param progressCallback Optional parameter for getting progress callbacks.
   * @param callback A callback function to handle the async response.
   */
  export function verify(
    serialNumber: string,
    filename: string,
    options: object,
    progressCallback: (err: JProgError) => void,
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to write data to a device's memory, given an
   * array of byte values.
   *
   * Be sure to use an array of numbers - a `UInt8Array` might work
   * due to type castiing, but a `Buffer` will most likely fail.
   *
   * @param serialNumber The serial number of the device to program.
   * @param address The start address of the block of memory to be written.
   * @param data Array of byte values to be written.
   * @param callback A callback function to handle the async response.
   */
  export function write(
    serialNumber: string,
    address: number,
    data: number[],
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to write data to a device's memory, given the
   * value for a single 4-byte word.
   *
   * Be sure to use an array of numbers - neither a `UInt8Array` or
   * `Buffer` will work.
   *
   * @param serialNumber The serial number of the device to program.
   * @param address The start address of the block of memory to be written.
   * @param data Value to be written.
   * @param callback A callback function to handle the async response.
   */
  export function writeU32(
    serialNumber: string,
    address: number,
    data: number[],
    callback: (err: JProgError) => void
  ): void;

  /**
   * Async function to read RTT contents from an up channel on
   * the device. You read on the up channel specified by the
   * `channelIndex`.
   *
   * The callback function can access a UTF-8 string representation
   * of the RTT message (`stringData` in the example) if UTF-8
   * encoding is possible, as well as an array (`rawData` in the example)
   * containing the byte values (as integers between 0 and 255),
   * plus the time elapsed since RTT was started, in microseconds.
   *
   * This function will read up to length number of bytes and
   * return them as both String and an array of the raw bytes. If
   * the content of the channel is empty, the returned string and
   * array will be empty.
   *
   * @param serialNumber The serial number of the device to read RTT on.
   * @param channelIndex The RTT up channel index to read from.
   * @param length The max number of bytes to read.
   * @param callback A callback function to handle the async responsex
   */
  export function rttRead(
    serialNumber: string,
    channelIndex: number,
    length: number,
    callback: (
      err: JProgError,
      stringData: string,
      rawData: number[],
      timeSinceRTTStartInUs: number
    ) => void
  ): void;

  /**
   * This function will attempt to open an RTT connection to the
   * device with `serialNumber`. It will return an `JProgError` if
   * the device does not exist or if its firmware doesn't support RTT.
   *
   * The RTT protocol uses down channels to write to the device and
   * up channels to read from the device.
   *
   * You can only open RTT on one device at any given time.
   *
   * When you have an open RTT session, you should not call any
   * functions in `pc-nrfjprog-js`, as these will reset the device.
   *
   * When you are done with the RTT session, you should call `stop()`.
   *
   * @param serialNumber The serial number of the device to start RTT on.
   * @param startOptions Options about how to start RTT.
   * @param callback A callback function to handle the async response.
   */
  export function rttStart(
    serialNumber: string,
    startOptions: StartOptions,
    callback: (err: JProgError, down: ChannelInfo[], up: ChannelInfo[]) => void
  ): void;

  /**
   *  Async function to stop RTT.
   *
   * @param serialNumber The serial number of the device to stop RTT on.
   * @param callback A callback function to handle the async response.
   */
  export function rttStop(
    serialNumber: string,
    callback: (e: JProgError) => void
  ): void;

  /**
   * Async function to write data to a down channel on the device.
   *
   * You write on the down channel specified by the `channelIndex`.
   *
   * The `data` written may be either be a string or an array of
   * integers. String data will be UTF8 encoded.
   *
   * @param serialNumber The serial number of the device to write RTT on.
   * @param channelIndex The RTT down channel iindex to write to.
   * @param data The data to send.
   * @param callback A callback function to handle the async response.
   */
  export function rttWrite(
    serialNumber: string,
    channelIndex: number,
    data: string | number[],
    callback: (
      err: JProgError,
      length: number,
      timeSinceRTTStartInUs: number
    ) => void
  ): void;

  // Type definitions

  /**
   * How much of the memory should be erased.
   */
  enum EraseMode {
    ERASE_NONE = 'ERASE_NONE',
    ERASE_ALL = 'ERASE_ALL',
    ERASE_PAGES = 'ERASE_PAGES',
    ERASE_PAGES_INCLUDING_UICR = 'ERASE_PAGES_INCLUDING_UICR',
  }

  /**
   * Flags to be used when erasing a device.
   */
  interface EraseOptions {
    /**
     * How much of the memory should be erased.
     */
    erase_mode: EraseMode;
    /**
     * Start erasing from this address. Only relevant when using
     * `ERASE_PAGES` or `ERASE_PAGES_INCLUDING_UICR` modes.
     */
    start_address: number;
    /**
     * Erase up to this address. Only relevant when using
     * `ERASE_PAGES` or `ERASE_PAGES_INCLUDING_UICR` modes.
     */
    end_address: number;
  }

  enum JProgErrorNo {
    CouldNotFindJlinkDLL,
    CouldNotFindJProgDLL,
    CouldNotOpenDevice,
    CouldNotOpenDLL,
    CouldNotConnectToDevice,
    CouldNotCallFunction,
    CouldNotErase,
    CouldNotProgram,
    CouldNotRead,
    CouldNotOpenHexFile,
  }

  /**
   * Possible error. If an operation completed sucessfully, the error
   * passed to the callback function will be undefined (and thus, falsy).
   *
   * This will be an instance of the built-in Error class,
   * with some extra properties.
   */
  interface JProgError {
    errno: JProgErrorNo;
    /**
     * A human-readable version of the error code.
     */
    errcode: string;
    /**
     * The internal function that caused the error.
     */
    erroroperation: string;
    /**
     * Error string. The value will be equal to that of the
     * built-in `message` property.
     */
    errmsg: string;
    /**
     * The low-level error code, if applicable.
     */
    lowlevelErrorNo: number;
    /**
     * A human-readable version of the low-level error code.
     */
    lowlevelError: string;
    /**
     * The complete log from the internal functions.
     */
    log: string;
  }

  /**
   * Represents the information about the J-link ARM interface library.
   */
  interface LibraryInformation {
    /**
     * The version of the interface library.
     */
    version: Version;
    /**
     * The major version of the interface library.
     */
    major: number;
    /**
     * The minor version of the interface library.
     */
    minor: number;
    /**
     * The revision version of the interface library.
     */
    revision: string;
    /**
     * The path to the interface library.
     */
    path: string;
  }

  /**
   * Represents the device information of the debug probe.
   */
  interface ProbeInformation {
    /**
     * The serial number of the probe.
     */
    serialNumber: string;
    /**
     * The clock speed of the probe interface.
     */
    clockSpeedkHz: number;
    /**
     * The version infomation about the J-Link firmware.
     */
    firmwareString: string;
  }

  enum InputFormat {
    /**
     * The string represents a filename for a .hex file.
     */
    INPUT_FORMAT_HEX_FILE,
    /**
     * The string represents the contents of a .hex file.
     */
    INPUT_FORMAT_HEX_STRING,
  }

  /**
   * Option flags to be used when sending a program to the device.
   */
  interface ProgramOptions {
    /**
     * How the filename string passed to `program()` shall be interpreted.
     *
     * @defaultValue `InputFormat.INPUT_FORMAT_HEX_FILE`
     */
    inputFormat: InputFormat;
    /**
     * Whether verification should be performed as part of the programming.
     *
     * Akin to running `"nrfjprog --program --verify"` in the command-line tools.
     *
     * @defaultValue `true`
     */
    verify: boolean;
    /**
     * How much of the flash memory should be erased.
     *
     * @defaultValue `EraseMode.ERASE_ALL`
     */
    chip_erase_mode: EraseMode;
    /**
     * How much of the QSPI memory should be erased.
     *
     * @defaultValue `EraseMode.ERASE_NONE`
     */
    qspi_erase_mode: EraseMode;
    /**
     * Whether the device should be reset after programming.
     *
     * @defaultValue `true`
     */
    reset: boolean;
  }

  enum DeviceFamily {
    NRF51_FAMILY,
    NRF52_FAMILY,
    UNKNOWN_FAMILY,
  }

  enum DeviceType {
    NRF51xxx_xxAA_REV1,
    NRF51xxx_xxAA_REV2,
    NRF51xxx_xxAA_REV3,
    NRF51xxx_xxAB_REV3,
    NRF51xxx_xxAC_REV3,
    NRF51802_xxAA_REV3,
    NRF51801_xxAB_REV3,
    NRF52805_xxAA_REV1,
    NRF52805_xxAA_FUTURE,
    NRF52810_xxAA_REV1,
    NRF52810_xxAA_REV2,
    NRF52810_xxAA_FUTURE,
    NRF52811_xxAA_REV1,
    NRF52811_xxAA_FUTURE,
    NRF52832_xxAA_ENGA,
    NRF52832_xxAA_ENGB,
    NRF52832_xxAA_REV1,
    NRF52832_xxAA_REV2,
    NRF52832_xxAA_FUTURE,
    NRF52832_xxAB_REV1,
    NRF52832_xxAB_REV2,
    NRF52832_xxAB_FUTURE,
    NRF52833_xxAA_REV1,
    NRF52833_xxAA_FUTURE,
    NRF52840_xxAA_ENGA,
    NRF52840_xxAA_ENGB,
    NRF52840_xxAA_REV1,
    NRF52840_xxAA_REV2,
    NRF52840_xxAA_FUTURE,
    NRF9160_xxAA_REV1,
    NRF9160_xxAA_FUTURE,
  }

  interface DeviceInformation {
    family: DeviceFamily;
    deviceType: DeviceType;
    /**
     * Memory address for the start of the non-volatile (flash)
     * memory block. Typically `0x0000 0000`.
     */
    codeAddress: number;
    /**
     * Size of each page of non-volatile (flash) memory.
     */
    codePageSize: number;
    /**
     * Total size of the non-volatile (flash) memory.
     */
    codeSize: number;
    /**
     * Memory address for the start of the UICR (User Information Configuration Registers).
     * Typically `0x1000 1000`.
     */
    uicrAddress: number;
    /**
     * Size of the FICR/UICR. Typically 4KiB.
     */
    infoPageSize: number;
    /**
     * Memory address for the start of the volatile RAM.
     * Typically `0x2000 0000`, in the SRAM memory region.
     */
    dataRamAddress: number;
    /**
     * Size of the volatile RAM, in bytes.
     */
    ramSize: number;
    /**
     * Whether the volatile RAM is also mapped to an executable
     * memory region or not.
     */
    codeRamPresent: boolean;
    /**
     * Memory address for the volatile RAM, in the code memory region.
     *
     * When `codeRamPresent` is `true`, both `codeRamAddress` and
     * `dataRamAddress` point to the same volatile RAM, but the
     * hardware uses a different data bus in each case.
     */
    codeRamAddress: number;
    /**
     * Whether QSPI (Quad Serial Peripheral Interface) is present or not.
     */
    qspiPresent: boolean;
    /**
     * When `qspiPresent` is `true`, the memory address for the
     * XIP (eXecute In Place) feature.
     *
     * This memory address maps to the external flash memory
     * connected through QSPI.
     */
    xipAddress: number;
    /**
     * Size of the XIP memory region.
     */
    xipSize: number;
    /**
     * Which pin acts as the reset pin, e.g. a value of `21` means
     * that the pin marked as "P0.21" acts as the reset pin.
     */
    pinResetPin: number;
  }

  /**
   * Progress information.
   *
   * Long running operations can indicate progress. If the optional
   * progress callback is used, this object will be sent when progress
   * is made.
   */
  interface Progress {
    /**
     * An indication of what subprocess is performed.
     */
    process: string;
  }

  /**
   * Option flags to be used when reading the content of the device.
   */
  interface ReadToFileOptions {
    /**
     * Whether or not to read the contents of the RAM.
     *
     * @defaultValue `false`
     */
    readram: boolean;
    /**
     * Whether or not to read the contents of the flash.
     *
     * @defaultValue `true`
     */
    readacode: boolean;
    /**
     * Whether or not to read the contents of the UICR.
     *
     * @defaultValue `false`
     */
    readauicr: boolean;
    /**
     * Whether or not to read the contents of the QSPI.
     *
     * @defaultValue `false`
     */
    readqspi: boolean;
  }

  interface SerialNumberAndDeviceInformation {
    serialNumber: string;
    deviceInfo: object;
    probeInfo: ProbeInformation;
    libraryInformation: LibraryInformation;
  }

  /**
   * Represents a semver-like version number, e.g. 9.6.0 as
   * an object of the form `{ major: 9, minor: 6, revision: 0 }`
   */
  interface Version {
    /**
     * The major version number.
     */
    major: number;
    /**
     * The minor version number.
     */
    minor: number;
    /**
     * The revision number.
     */
    revision: number;
  }

  enum ChannelDirection {
    UP_DIRECTION,
    DOWN_DIRECTION,
  }

  /**
   * Information about the different up and down channels available
   * on the device.
   *
   * A down channel is a channel from the computer to the device.
   *
   * An up channel is a channel from the device to the computer.
   */
  interface ChannelInfo {
    /**
     * The index used to address this channel.
     */
    channelIndex: number;
    /**
     * The direction of the channel.
     */
    direction: ChannelDirection;
    /**
     * The name of the channel.
     */
    name: string;
    /**
     * The size of the channel.
     */
    size: number;
  }

  /**
   * Option flags to be used when starting RTT.
   *
   * This may speed up the process of locating the control block,
   * and the RTT Start. If `controlBlockLocation` is specified,
   * only that location will be searched for the RTT control block,
   * and an error will be returned if no control block was found.
   *
   * If no value is specified for `controlBlockLocation`, the RAM
   * will be searched for the location of the RTT control block.
   */
  interface StartOptions {
    /**
     * The location of the control block.
     *
     * If this location is not the start of the RTT control block,
     * start will fail.
     */
    controlBlockLocation?: number;
  }
}
