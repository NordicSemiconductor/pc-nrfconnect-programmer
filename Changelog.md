## Unreleased

### Added

-   Write support for 91x

## 4.5.0 - 2024-12-17

### Changed

-   Disabled unsupported firmware read for nRF54L Series.

### Fixed

-   Issue with programming firmware on nRF54L15 when it is larger than 1 MB.

## 4.4.2 - 2024-11-11

### Changed

-   Updated `nrfutil device` to v2.6.4.

### Fixed

-   The DECT modem firmware is now correctly detected for nRF91x1 devices.

## 4.4.1 - 2024-09-24

### Fixed

-   The warning "HEX regions are out of device memory size" will not be shown
    anymore for HEX files with UICR.
-   The SoC is now detected before each operation to ensure the app works even
    if the SoC changes between operations.
-   Memory layout and device information now update correctly when quickly
    switching between selected devices.

## 4.4.0 - 2024-06-13

### Added

-   Support for Apple silicon.

### Changed

-   Moved feedback tab to a dialog which can be opened by going to the about tab
    and click **Give Feedback**.

### Fixed

-   The **Enable MCUboot** toggle reflects the MCUboot trait of the connected
    device.

## 4.3.0 - 2024-03-13

### Added

-   Warning about closing the app while programming, which may lead to unwanted
    consequences.

### Changed

-   Update `nrfutil device` to v2.1.1.

### Fixed

-   Valid Modem Firmware for Thingy:91 was previously detected as incorrect.
-   Show the device family in the Memory layout title for MCUboot devices.
-   Windows and Linux: Dragging and dropping a file into the file memory layout
    opened the file in an editor.
-   File related warnings were not always removed when removing file regions.

### Removed

-   `Enable MCUboot` toggle.

## 4.2.0 - 2024-01-04

## Added

-   Persist state of `show log` panel.
-   Feedback tab.

### Fixed

-   Warning message when writing nrf9161 modem firmware.
-   Modem firmware download URL for nrf9161.
-   Unable to press write when programming modem firmware for nrf9160 or nrf9161
    with an external jLink.

## 4.1.0 - 2023-12-07

### Changed

-   Update nrfutil device to v2.0.3.

### Fixed

-   Issue with detecting Thingy:91 Rev: 1.5.0.

## 4.0.1 - 2023-10-17

### Fixed

-   JLink devices sometimes didn't show up because of timeout.

## 4.0.0 - 2023-10-05

### Added

-   Allow reading multi-core devices if one or more cores are not protected.
-   Alert message for a selected device when the programmer app cannot interact
    with it. Alert will be displayed when:
    -   Device is not in MCUBoot mode;
    -   Device is not in bootloader mode;
    -   Device is unknown type.

### Changed

-   Programmer now uses nrfutil device for all device operations.
-   Split settings `Jlink` and `MCUBoot` into different groups.

### Removed

-   Notice in the side panel related to the Cellular modem.

### Fixed

-   Sometimes audio kit did not show up in the device selector.

## 3.0.9 - 2023-06-15

### Added

-   Progress bar to ModemFirmware DFU dialog.

### Changed

-   `OpenFile` and `SaveFile` must be closed before one can interact with the
    app window.
-   Updated MCUBoot Dialog UI look and feel.
-   Updated Modem DFU dialog.

### Fixed

-   Text in MCUBoot Dialog no longer overflow if too long but wraps.
-   `MCUBoot` Dialog show the wrong state if a device reboots/disconnects while
    programming is still ongoing and `Auto Reconnect` is Enabled.
-   Write button will not remain active when device is deselected.

## 3.0.8 - 2023-03-30

### Added

-   Reconnecting status in device selector.
-   Custom control to set net core upload delay.
-   Persist net core upload delay for each device serial number.
-   Progress on net core upload delay.
-   Linux: If a device fails to be identified based on parameters which point to
    a missing nrf-udev installation, recommend user to install nrf-udev.

### Fixed

-   Write button remains clickable in some cases when device is change to
    bootloader.
-   USB DFU memory layout now updates after device reboots due to programming.
-   USB DFU memory layout updates if programming fails.
-   Linux: Apps would crash when identifying certain devices if nrf-udev.
    installation was missing.

### Changed

-   Alert banners related to file memory regions now yellow instead of red.

## 3.0.7 - 2023-02-23

### Fixed

-   Writing Asset Tracker hex file with UICR included to nRF91DK failed.

## 3.0.6 - 2023-02-14

### Added

-   nRF7002 support.

## 3.0.5 - 2023-02-13

### Added

-   Auto reconnect functionality.

### Changed

-   Update for compatibility with nRF Connect for Desktop v4.0.0
-   Invalid MCUboot firmware warning no longer references a specific device (was
    always Thingy91).
-   Warning about unexpected modem firmware filename does not trigger on default
    copy naming.

### Fixed

-   Typo in warning about modem firmware filename.
-   Always save file as a hex file.

## 3.0.4 - 2022-09-05

### Fixed

-   Don't show erronous warning when mcu flashing the Thingy53.
-   Sometimes displayed known devices as `UNKNOWN`.
-   Device loads forever if protection status failed to be read.

## 3.0.3 - 2022-06-17

### Fixed

-   Correctly detect some MCUboot devices (notably Thingy53).

## 3.0.2 - 2022-06-09

### Fixed

-   `Write` when flashing modem firmware files did nothing.
-   Reading a device would freeze the app.

### Known issues

-   Connecting devices on linux sometimes takes several attempts (user has to
    reconnect device).

## 3.0.1 - 2022-06-08

### Fixed

-   Some errors were not displayed correctly.
-   Not able to open device with external JLink debugger.

## 3.0.0 - 2022-04-26

### Changed

-   Update UI.
-   Disable `Write` button for JLink devices and add tooltip.

### Fixed

-   Update file regions when device is selected after hex file has been added.
-   Adding a zip file clears any previously opened files.
-   Did not display all serialport devices.
-   Clicking a file or core region no longer inverts the hover effect.

## 2.3.3 - 2022-02-23

### Fixed

-   Show correct hardware layout of selected device.

## 2.3.2 - 2022-02-18

### Fixed

-   Show correct hardware type of selected device.
-   Modem file name verification.

## 2.3.1 - 2022-02-03

### Fixed

-   Crash when settings are empty.

## 2.3.0 - 2022-01-31

### Changed

-   Use shared code for persisting local settings in app.
-   Detect cores on nRF53 with readback protection.

### Fixed

-   Remove readback protection on nRF53.
-   Dropping several hex files.

## 2.2.0 - 2022-01-13

### Added

-   Auto-reset setting which, if toggled, adds a device reset after read/write
    operations. This setting is enabled by default.
-   Instructions for updating the modem firmware.

### Fixed

-   Issue with programming nRF52 SoC on Thingy91.
-   Reset button is now disabled for USB devices as this operation is currently
    not supported.
-   Reset button now works for JLink devices.

### Changed

-   Device is no longer by default reset after a write operation, if the user
    wants to reset the device after write, use the new `Auto reset` feature.

## 2.1.1 - 2022-01-07

### Fixed

-   Issue with selecting external JLink device.

## 2.1.0 - 2022-01-06

### Added

-   Thingy:53 support.
-   Usage data for general device information.

### Fixed

-   Long file name is not wrapped for file selection view.
-   Not able to program HEX file if part of the regions are outside of the
    device memory size.
-   Previous file regions are removed after write/remove action.
-   `Restore Defaults...` option not resetting stored values. This will however
    cause the currently persisted data to be wiped (such as previously added
    files).
-   Hovering certain areas of the app would cause flickering layout.

### Changed

-   Removed `Update modem` button. To update modem, add modem file with the add
    file dialog, or drag and drop into the file memory layout, and click write.
-   Styling updates to **Add file** dialog window.

## 2.0.1 - 2021-11-04

### Changed

-   Simplify modem DFU progress indicator temporarily

## 2.0.0 - 2021-11-01

### Added

-   Documentation section in `About` pane.

### Changed

-   Establish compatibility with nRF Connect for Desktop 3.8
-   Use new nRF Connect for Desktop look & feel.

## 1.4.11 - 2021-06-11

### Fixed

-   Programming with external debugger. Note: programming a protected SoC via
    external debugger is not supported.

## 1.4.10 - 2021-06-11

### Changed

-   Updated firmware to support modem DFU for Thingy:91 v1.6.0.
-   Updated firmware to enhance APPPROTECT feature.

## 1.4.9 - 2021-06-11

### Added

-   APPPROTECT support for nRF52 family.

## 1.4.8 - 2020-12-07

### Added

-   APPPROTECT support.

## 1.4.7 - 2020-10-30

### Added

-   USB PID of OpenThread devices.

## 1.4.6 - 2020-10-21

### Changed

-   Updated according to changes of Electron dialog API.

## 1.4.5 - 2020-10-21

### Changed

-   Updated logic behind enabling of write button.

### Added

-   Warning for Thingy:91 DFU when invalid file is detected.

## 1.4.4 - 2020-09-02

### Fixed

-   Modem DFU for Thingy91 by increasing timeout between MCUboot DFU and modem
    UART DFU.

## 1.4.3 - 2020-07-08

### Added

-   Support nRF52805.

### Removed

-   Warning for nRF9160 communication failure.

### Fixed

-   MCUboot DFU for nRF52840 on Thingy91 for Linux and macOS.
-   MCUboot DFU for nRF52840 on Thingy91 for Windows. Note: the fix is valid for
    Thingy91 v1.0.2 and newer. For older versions, please use a debugger to
    program.
-   Communication failure for nRF5340 development kit.

## 1.4.2 - 2020-07-08

### Added

-   Warning for nRF9160 communication failure.

## 1.4.1 - 2020-07-08

### Fixed

-   Modem dfu hex file not committed in resources.

## 1.4.0 - 2020-07-08

### Added

-   Support nRF52820.
-   Support modem UART DFU.

### Fixed

-   End address for regions displayed.

## 1.3.1 - 2019-11-18

### Fixed

-   Programm nRF51 devices with UICR.

## 1.3.0 - 2019-11-14

### Added

-   Support nRF53 series.
-   Support nRF52833.
-   Support MCUboot DFU.

## 1.2.3 - 2019-08-30

### Fixed

-   Cropping of most recently used files dropdown.

## 1.2.2 - 2019-08-30

### Fixed

-   UICR handling that caused double reset failure.

## 1.2.0 - 2019-07-03

### Changed

-   Updated to React Bootstrap 4.

## 1.1.0 - 2019-06-17

### Added

-   Modem DFU support.
-   List of devices and details of current device to system report.
-   SdReq for SoftDevice S140 v6.1.0.
-   Support for nRF52810.

### Changed

-   Updated algorithm of detecting application regions.

### Fixed

-   Logic of reloading files.
