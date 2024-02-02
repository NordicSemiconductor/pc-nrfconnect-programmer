# Programming devices

In nRF Connect Programmer, you can program [supported devices](index.md#supported-devices) or a custom board with a supported chip that allows for communication with J-Link, Nordic USB devices, and MCUboot devices.

!!! tip "Tip"
      If you experience any problems during the programming process, press Ctrl-R (command-R on macOS) to restart the nRF Connect Programmer app, and try programming again.

## Device-specific procedures

The following devices have specific programming requirements or procedures:

| Device                            | Description                                                                                                          |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Nordic Thingy:91      | To program Nordic Thingy:91, see [Updating the Thingy:91 firmware using Programmer](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/device_guides/working_with_nrf/nrf91/thingy91.html#updating_the_thingy91_firmware_using_programmer).
| nRF9160 DK            | To program the nRF9160 DK, see [Updating the nRF9160 DK firmware using Programmer](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/device_guides/working_with_nrf/nrf91/nrf9160.html#updating_the_dk_firmware_using_programmer). |
| Nordic Thingy:52      | Nordic Thingy:52 can be programmed using the [general programming procedure](#general-programming-procedure), but only through J-Link and a 10-pin programming cable. |
| nRF52840 Dongle       | To program the nRF52840 Dongle, use the steps from the [Programming the nRF52840 Dongle](#programming-the-nrf52840-dongle) section. |
| Custom board          | When programming a custom board with a supported chip, use the [general programming procedure](#general-programming-procedure), but make sure that the J-Link version is compatible with the relevant Arm® CPU. For example, an nRF52 Series DK cannot be used to program a Nordic Thingy:91 since the J-Link on an nRF52 Series DK does not support the programming of the Arm Cortex®-M33 CPU of Nordic Thingy:91. |

## General programming procedure

To program a supported development kit, complete the following procedure:

1. Open nRF Connect for Desktop and launch **nRF Connect Programmer**.
2. Connect a development kit to the computer with a USB cable and turn it on.
3. Click **Select device** and choose the device from the drop-down list.</br>
   The button text changes to the name and serial number of the selected device, and the **Device Memory Layout** section indicates that the device is connected.
4. If you have not selected the **Auto read memory** option under the **Device** menu and wish to visually see the memory layout before you program, click **Read** in the menu. If you have selected it, the memory layout will update automatically.
5. Drag and drop the HEX file into the **File Memory Layout** section. Alternatively, click **Add file** to add the files you want to program, using one of the following options:

    - Select the files you used recently.
    - If there are no recently used files, click **Browse** from the drop-down list.

6. Select the firmware image file from the file browser that opens up; either a HEX file (in most cases) or a ZIP (when programming cellular modem firmware or multi-image programming with MCUboot).
7. Depending on the device type and the programming method, use one of the following programming options in the **Device** panel:

   - **Erase & write** for J-Link
   - **Write** for MCUboot, Nordic Secure DFU, or modem firmware

   When programming starts, a progress bar appears. Do not unplug or turn off the device during programming.

## Programming the nRF52840 Dongle

To program the nRF52840 Dongle, complete the following steps:

1. Open nRF Connect for Desktop and launch nRF Connect Programmer.
2. Insert the nRF52840 Dongle into a USB port on the computer.
3. Put the dongle into bootloader mode by pressing the **RESET** button.

    ![nRF52840 Dongle overview](./screenshots/nRF52840_dongle_press_reset.svg "Pressing the RESET button")

    !!! note "Note"
         - This step is not needed if the currently running application uses the [DFU trigger library](https://infocenter.nordicsemi.com/index.jsp?topic=%2Fsdk_nrf5_v17.1.0%2Flib_dfu_trigger_usb.html), part of the nRF5 SDK v17.1.0.
         - If this is the first time the dongle is connected, a driver needed for the nRF52840 Nordic Secure DFU feature is also installed as part of this step.

    The status light (**LD2**) will start pulsing red, indicating that the dongle is powered up and in bootloader mode. After a few seconds, the computer recognizes the dongle as a USB composite device.

5. In the navigation bar in the Programmer app, click **Select device** and choose the serial number of the dongle from the drop-down list.
6. Drag and drop the HEX file into the **File Memory Layout** section. Alternatively, click **Add file** to add the files you want to program, using one of the following options:

    - Select the files you used recently.
    - If there are no recently used files, click **Browse** from the drop-down list.

7. Select the firmware image file (with the extension HEX) from the file browser that opens up.
8. Click **Write** to program the firmware onto the dongle.

When the writing process completes, the device resets, and – unless the application uses the [DFU trigger library](https://infocenter.nordicsemi.com/index.jsp?topic=%2Fsdk_nrf5_v17.1.0%2Flib_dfu_trigger_usb.html) of the nRF5 SDK v17.1.0 – the dongle will no longer show up in the Programmer app, as it is no longer in the bootloader mode.
