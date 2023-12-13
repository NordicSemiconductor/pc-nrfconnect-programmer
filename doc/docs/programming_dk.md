# Programming a Development Kit or the nRF51 Dongle

In nRF Connect Programmer, you can program nRF91, nRF52, and nRF51 development kits, nRF51 Dongle, or a custom board with a supported chip that allows for communication with J-Link.

!!! note "Note"
      When programming a custom board with a supported chip, make sure that the J-Link supports the relevant Arm® CPU. For example, an nRF52 Series DK cannot be used to program a Nordic Thingy:91™ since the J-Link on an nRF52 Series DK does not support the programming of the Arm Cortex®-M33 CPU of Nordic Thingy:91. Also, a Nordic Thingy:52™ can be programmed only via J-Link and a 10-pin programming cable.

To program the nRF52840 Dongle, see [Programming the nRF52840 Dongle](./programming_dongle.md). To program the nRF9160 DK, see [Programming the nRF9160 DK](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/device_guides/working_with_nrf/nrf91/nrf9160.html#building_and_programming). To program any other development kit, the nRF51 dongle, or a custom board, see the following procedure.

1. Open nRF Connect for Desktop and launch **nRF Connect Programmer**.
2. Connect a development kit to the computer with a micro-USB cable and turn it on.
3. Click **Select device** and choose the device from the drop-down list.</br>
   The button text changes to the name and serial number of the selected device, and the **Device Memory Layout** section indicates that the device is connected.
4. If you have not selected the **Auto read memory** option under the **Device** menu and wish to visually see the memory layout before you program, click **Read** in the menu. If you have selected it, the memory layout will update automatically.
5. Drag and drop the HEX file into the **File Memory Layout** section. Alternatively, click **Add file** to add the files you want to program, using one of the following options:

    - Select the files you used recently.
    - If there are no recently used files, click **Browse** from the drop-down list.

6. Select the firmware image file (with the extension `.hex`) from the file browser that opens up.
7. Click **Erase & write** in the **Device** pane to program the device.