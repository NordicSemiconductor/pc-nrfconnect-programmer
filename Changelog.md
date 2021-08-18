## 1.4.11 - 2021-06-11
### Fixes
* Fixed programming with external debugger.
Note, programming a protected SoC via external debugger is not supported.

## 1.4.10 - 2021-06-11
### Updates
* Updated firmware to support modem DFU for Thingy:91 v1.6.0
* Updated firmware to enhance APPPROTECT feature

## 1.4.9 - 2021-06-11
### Updates
* Added APPPROTECT support for nRF52 family

## 1.4.8 - 2020-12-07
### Updates
* Added APPPROTECT support

## 1.4.7 - 2020-10-30
### Updates
* Added USB PID of OpenThread devices

## 1.4.6 - 2020-10-21
## Updates
* Updated according to changes of Electron dialog API

## 1.4.5 - 2020-10-21
## Updates
* Updated logic behind enabling of write button
* Added warning for Thingy:91 DFU when invalid file is detected

## 1.4.4 - 2020-09-02
## Bugfixes
* Fixed modem DFU for Thingy91 by increasing timeout between MCUboot DFU and modem UART DFU

## 1.4.3 - 2020-07-08
## Updates
* Added support for nRF52805
## Bugfixes
* Fixed MCUboot DFU for nRF52840 on Thingy91 for Linux and macOS
* Fixed MCUboot DFU for nRF52840 on Thingy91 for Windows.
Note, the fix is valid for Thingy91 v1.0.2 and newer.
For older versions, please use a debugger to program.
* Fixed communication failure for nRF5340 development kit
* Removed warning for nRF9160 communication failure

## 1.4.2 - 2020-07-08
## Bugfixes
* Added warning for nRF9160 communication failure

## 1.4.1 - 2020-07-08
## Bugfixes
* Fixed modem dfu hex file not committed in resources

## 1.4.0 - 2020-07-08
## New feature
* Added support for nRF52820
* Added support for modem UART DFU

## Bugfixes
* Fixed end address for regions displayed

## 1.3.1 - 2019-11-18
## Bugfixes
* Fixed programming of nRF51 devices with UICR #156

## 1.3.0 - 2019-11-14
### New features
* Supported nRF53 series
* Supported nRF52833
* Supported MCUboot DFU

## 1.2.3 - 2019-08-30
### Bugfixes
* Fixed cropping of most recently used files dropdown #142

## 1.2.2 - 2019-08-30
### Bugfixes
* Fixed UICR handling that caused double reset failure #133

## 1.2.0 - 2019-07-03
### Updates
* Updated to React Bootstrap 4

## 1.1.0 - 2019-06-17
### New features
* Added modem DFU support
* Added list of devices and details of current device to system report
### Updates
* Updated algorithm of detecting application regions
* Added support for nRF52810
* Added SdReq for SoftDevice S140 v6.1.0
### Bugfixes
* Fixed logic of reloading files
