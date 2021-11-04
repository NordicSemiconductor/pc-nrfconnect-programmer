## 2.0.1 - 2021-11-04
### Changed
- Moved region info to left side of region.

## 2.0.0 - 2021-11-01
### Added
- Documentation section in `About` pane.

### Changed
- Establish compatibility with nRF Connect for Desktop 3.8
- Use new nRF Connect for Desktop look & feel.

## 1.4.11 - 2021-06-11
### Fixed
- Programming with external debugger. Note: programming a protected SoC via external debugger is not supported.

## 1.4.10 - 2021-06-11
### Changed
- Updated firmware to support modem DFU for Thingy:91 v1.6.0.
- Updated firmware to enhance APPPROTECT feature.

## 1.4.9 - 2021-06-11
### Added
- APPPROTECT support for nRF52 family.

## 1.4.8 - 2020-12-07
### Added
- APPPROTECT support.

## 1.4.7 - 2020-10-30
### Added
- USB PID of OpenThread devices.

## 1.4.6 - 2020-10-21
### Changed
- Updated according to changes of Electron dialog API.

## 1.4.5 - 2020-10-21
### Changed
- Updated logic behind enabling of write button.
### Added
- Warning for Thingy:91 DFU when invalid file is detected.

## 1.4.4 - 2020-09-02
### Fixed
- Modem DFU for Thingy91 by increasing timeout between MCUboot DFU and modem UART DFU.

## 1.4.3 - 2020-07-08
### Added
- Support nRF52805.
### Removed
- Warning for nRF9160 communication failure.
### Fixed
- MCUboot DFU for nRF52840 on Thingy91 for Linux and macOS.
- MCUboot DFU for nRF52840 on Thingy91 for Windows.
  Note: the fix is valid for Thingy91 v1.0.2 and newer.
  For older versions, please use a debugger to program.
- Communication failure for nRF5340 development kit.

## 1.4.2 - 2020-07-08
### Added
- Warning for nRF9160 communication failure.

## 1.4.1 - 2020-07-08
### Fixed
- Modem dfu hex file not committed in resources.

## 1.4.0 - 2020-07-08
### Added
- Support nRF52820.
- Support modem UART DFU.
### Fixed
- End address for regions displayed.

## 1.3.1 - 2019-11-18
### Fixed
- Programm nRF51 devices with UICR.

## 1.3.0 - 2019-11-14
### Added
- Support nRF53 series.
- Support nRF52833.
- Support MCUboot DFU.

## 1.2.3 - 2019-08-30
### Fixed
- Cropping of most recently used files dropdown.

## 1.2.2 - 2019-08-30
### Fixed
- UICR handling that caused double reset failure.

## 1.2.0 - 2019-07-03
### Changed
- Updated to React Bootstrap 4.

## 1.1.0 - 2019-06-17
### Added
- Modem DFU support.
- List of devices and details of current device to system report.
- SdReq for SoftDevice S140 v6.1.0.
- Support for nRF52810.
### Changed
- Updated algorithm of detecting application regions.
### Fixed
- Logic of reloading files.
