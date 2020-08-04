## Version 1.4.4
## Bugfixes
* Fixed modem DFU for Thingy91 by increasing timeout between MCUboot DFU and modem UART DFU

## Version 1.4.3
## Updates
* Added support for nRF52805
## Bugfixes
* Fixed MCUboot DFU for nRF52840 on Thingy91 for Linux and macOS
* Fixed MCUboot DFU for nRF52840 on Thingy91 for Windows.
Note, the fix is valid for Thingy91 v1.0.2 and newer.
For older versions, please use a debugger to program.
* Fixed communication failure for nRF5340 development kit
* Removed warning for nRF9160 communication failure

## Version 1.4.2
## Bugfixes
* Added warning for nRF9160 communication failure

## Version 1.4.1
## Bugfixes
* Fixed modem dfu hex file not committed in resources

## Version 1.4.0
## New feature
* Added support for nRF52820
* Added support for modem UART DFU

## Bugfixes
* Fixed end address for regions displayed

## Version 1.3.1
## Bugfixes
* Fixed programming of nRF51 devices with UICR #156

## Version 1.3.0
### New features
* Supported nRF53 series
* Supported nRF52833
* Supported MCUboot DFU

## Version 1.2.3
### Bugfixes
* Fixed cropping of most recently used files dropdown #142

## Version 1.2.2
### Bugfixes
* Fixed UICR handling that caused double reset failure #133

## Version 1.2.0
### Updates
* Updated to React Bootstrap 4

## Version 1.1.0
### New features
* Added modem DFU support
* Added list of devices and details of current device to system report
### Updates
* Updated algorithm of detecting application regions
* Added support for nRF52810
* Added SdReq for SoftDevice S140 v6.1.0
### Bugfixes
* Fixed logic of reloading files
