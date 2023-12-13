# Programming the nRF52840 Dongle

Programming the nRF52840 Dongle in nRF Connect Programmer requires a different approach than programming the nRF51 Dongle.

To program the nRF52840 Dongle:

1. Open nRF Connect for Desktop and launch nRF Connect Programmer.
2. Insert the nRF52840 Dongle into a USB port on the computer.
3. Put the dongle into bootloader mode by pressing the **RESET** button.

    ![nRF52840 Dongle overview](./screenshots/nRF52840_dongle_press_reset.svg "Pressing the RESET button")

    !!! note "Note"
         - This step is not needed if the currently running application uses the DFU trigger library.
         - If this is the first time the dongle is connected, a driver needed for the nRF52840 USB DFU feature is also installed as part of this step.

4. The status light (**LD2**) will start pulsing red, indicating that the dongle is powered up and in bootloader mode. After a few seconds, the computer recognizes the dongle as a USB composite device.
5. In the navigation bar in the Programmer app, click **Select device** and choose the serial number of the dongle from the drop-down list.
6. Drag and drop the HEX file into the **File Memory Layout** section. Alternatively, click **Add file** to add the files you want to program, using one of the following options:

    - Select the files you used recently.
    - If there are no recently used files, click **Browse** from the drop-down list.

7. Select the firmware image file (with the extension `.hex`) from the file browser that opens up.
8. Click **Write** to program the firmware onto the dongle.

When the writing process completes, the device resets, and – unless the application uses the DFU Trigger Library – the dongle will no longer show up in the Programmer app, as it is no longer in the bootloader mode.