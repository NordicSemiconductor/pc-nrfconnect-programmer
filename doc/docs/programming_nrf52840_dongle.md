# Programming the nRF52840 Dongle

To program the nRF52840 Dongle, complete the following steps:

1. Open nRF Connect for Desktop and launch the {{app_name}}.
2. Insert the nRF52840 Dongle into a USB port on the computer.<br/>
   The status light **LD2** turns on solid green, indicating that the dongle is powered up.
3. Put the dongle into bootloader mode by pressing the **RESET** button.<br/>

    ![nRF52840 Dongle overview](./screenshots/nRF52840_dongle_press_reset.svg "Pressing the RESET button")

    **LD2** starts pulsing red, indicating that the dongle is powered up and in the bootloader mode. After a few seconds, the computer recognizes the dongle as a USB composite device.

    !!! note "Note"
         - This step is not needed if the currently running application uses the [DFU trigger library](https://docs.nordicsemi.com/bundle/sdk_nrf5_v17.1.0/page/lib_dfu_trigger_usb.html), part of the nRF5 SDK v17.1.0.
         - If this is the first time the dongle is connected, a driver needed for the nRF52840 Nordic Secure DFU feature is also installed as part of this step.

5. In the navigation bar in the {{app_name}}, click **Select device** and choose the serial number of the dongle from the drop-down list.
6. Drag and drop the HEX file into the **File Memory Layout** section. Alternatively, click **Add file** to add the files you want to program, using one of the following options:

    - Select the files you used recently.
    - If there are no recently used files, click **Browse** from the drop-down list.

7. Select the firmware image file (with the extension HEX) from the file browser that opens up.
8. Click **Write** to program the firmware onto the dongle.

When the writing process completes, the device resets, and – unless the application uses the [DFU trigger library](https://docs.nordicsemi.com/bundle/sdk_nrf5_v17.1.0/page/lib_dfu_trigger_usb.html) of the nRF5 SDK v17.1.0 – the dongle will no longer show up in the {{app_name}}, as it is no longer in the bootloader mode.
