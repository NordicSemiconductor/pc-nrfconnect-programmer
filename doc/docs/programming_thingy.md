# Programming Nordic Thingy prototyping platforms

You can program the Nordic Thingy application and network core firmware over USB by using MCUboot, which is a secure bootloader that you can use to update applications without an external debugger. MCUboot bootloader is enabled by default for the Nordic Thingy prototyping platforms in the `Kconfig.defconfig` files of the board, available in either the [nRF Connect SDK](https://github.com/nrfconnect/sdk-nrf/tree/main/boards/nordic) or [Zephyr](https://github.com/zephyrproject-rtos/zephyr/tree/main/boards/nordic).

You can follow this procedure to update the preloaded firmware on the Nordic Thingy prototyping platforms using the precompiled application firmware available from the [Nordic Semiconductor website](https://www.nordicsemi.com/):

- [Nordic Thingy:91 Downloads](https://www.nordicsemi.com/Software-and-tools/Prototyping-platforms/Nordic-Thingy-91/Download#infotabs)
- [Nordic Thingy:53 Downloads](https://www.nordicsemi.com/Products/Development-hardware/Nordic-Thingy-53/Downloads?lang=en#infotabs)

The downloaded ZIP archive contains the following firmware:

=== "Nordic Thingy:91"

     | File or Folder                                   | Description                                                                                                                                                                                                                      |
     |--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
     | `img_app_bl`                                     | Contains full application firmware images for different applications. Used for programming through an external debug probe.                                                                |
     | `img_fota_dfu_bin`, `img_fota_dfu_hex`           | Contain firmware images for Device Firmware Update (DFU). The `img_fota_dfu_hex` folder is used for programming through USB.                                                              |
     | Modem firmware ZIP (`mfw_nrf9160_...`)           | The modem firmware is provided as a ZIP archive named `mfw_nrf9160_` followed by the firmware version number. Do not unzip this file.                                                     |
     | `CONTENTS.txt`                                   | Lists the location and names of the different firmware images included in the extracted folder.                                                                                            |

=== "Nordic Thingy:53"

     | File or Folder         | Description                                                                                                 |
     |------------------------|-------------------------------------------------------------------------------------------------------------|
     | Application folders    | Contain the application firmware for the Thingy:53, including firmware for Device Firmware Update (DFU).     |
     | `CONTENTS.txt`         | Lists the location and names of the different firmware images included in the extracted folder.              |

To program the Nordic Thingy prototyping platforms, you can use one of the following options:

* Using a USB cable
* Using an external debug probe

!!! note "Note"

      Do not unplug the Nordic Thingy prototyping platform during the programming process.

## Programming using a USB cable

See the following sections for programming Nordic Thingy prototyping platforms using a USB cable.

### Nordic Thingy:91

=== "Updating nRF52840 SoC firmware"

    To program Nordic Thingy using the USB connection, complete the following steps:

    !!! note "Note"
        To update the Thingy:91 through USB, the nRF9160 SiP and nRF52840 SoC bootloaders must be factory-compatible.
        The bootloaders might not be factory-compatible if the nRF9160 SiP or nRF52840 SoC has been updated with an external debug probe.
        To restore the bootloaders, program the nRF9160 SiP or nRF52840 SoC with factory-compatible Thingy:91 firmware files through an external debug probe.

      1. Start the Thingy:91 in the bootloader mode for thenRF52840 SoC:

          1. Take off the top cover of the Nordic Thingy:91 so you can access the **SW4** button.

              ![Thingy:91 - SW1 SW4 switch](./screenshots/thingy91_sw1_sw4.webp "Thingy:91 - SW1 switch and SW4 button")

          1. Connect the Thingy:91 to your computer with a USB cable.
          1. Locate the **SW1** power switch.
          1. Press and hold **SW4**.
          1. While holding **SW4** pressed, move the **SW1** power switch to **ON** to power the Thingy:91.<br/>
             The device turns on in the bootloader mode for the nRF52840 SoC.

      1. Open nRF Connect for Desktop and launch the {{app_name}}.
      1. Click **Select device**.<br/>

          ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

          A drop-down menu appears.
      1. In the menu, select the entry corresponding to your device (**MCUBOOT**).

        !!! note "Note"
            The device entry might not be the same in all cases and can vary depending on the application version and the operating system.

          ![MCUBOOT device in Select device](./screenshots/programmer_select_device_mcuboot.png "MCUBOOT device in Select device")

      1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
         A file explorer window appears.
      1. Navigate to where you extracted the firmware.
      1. Open the folder `img_fota_dfu_hex` that contains the HEX files for updating over USB.<br/>
         See the `CONTENTS.txt` file for information on which file you need.
      1. Select the `thingy91_nrf52_connectivity_bridge_*.hex` file.
      1. Click **Open**.
      1. In the [**Device** section](overview.md#device), click **Write**.<br/>
         The **MCUboot DFU** window appears.

         ![Programmer - MCUboot DFU](./screenshots/thingy91_mcuboot_dfu.png "Programmer - MCUboot DFU")

      1. In the **MCUboot DFU** window, click **Write**.<br/>
         When the update is complete, a "Completed successfully" message appears.
      1. In the [**File** section](overview.md#file), click **Clear files**.

    You can now disconnect the Nordic Thingy:91 from the computer and put the top cover back on.

=== "Updating nRF9160 SiP modem firmware"

    To update the modem firmware using USB, complete the following steps:

      1. Start the Thingy:91 in the bootloader mode for the nRF9160 SiP:

          1. Take off the top cover of the Nordic Thingy:91 so you can access the **SW3** button.

              ![Thingy:91 - SW1 SW4 switch](./screenshots/thingy91_sw1_sw3.webp "Thingy:91 - SW1 switch and SW3 button")

          1. Connect the Thingy:91 to your computer with a USB cable.
          1. Locate the **SW1** power switch.
          1. Press and hold **SW3**.
          1. While holding **SW3** pressed, move the **SW1** power switch to **ON** to power the Thingy:91.<br/>
             The device turns on in the bootloader mode for the nRF9160 SiP.

      1. Open nRF Connect for Desktop and launch the {{app_name}} if it is not already open.
      1. Click **Select device**.<br/>

          ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

          A drop-down menu appears.
      1. In the menu, select the entry corresponding to your device (**Nordic Thingy:91**).<br/>

          ![Nordic Thingy:91 device in Select device](./screenshots/programmer_select_device_thingy91.png "Nordic Thingy:91 device in Select device")

      1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
         A file explorer window appears.

      1. Navigate to where you extracted the firmware.
      1. Find the modem firmware ZIP file with a name similar to `mfw_nrf9160_*.zip` and the number of the latest version.

        !!! note "Note"
            Do not extract the modem firmware ZIP file.

      1. Select the ZIP file and click **Open**.
      1. In the [**Device** section](overview.md#device), click **Write**.<br/>
         The **Modem DFU via MCUboot** window appears.

         ![Programmer - Modem DFU via MCUboot](./screenshots/thingy91_modemdfu_mcuboot.png "Programmer - Modem DFU via MCUboot")

      1. In the **Modem DFU via MCUboot** window, click **Write**.<br/>
         When the update is complete, a **Completed successfully** message appears.
      1. In the [**File** section](overview.md#file), click **Clear files**.

    You can now disconnect the Nordic Thingy:91 from the computer and put the top cover back on.

=== "Updating nRF9160 SiP application"

    To update the modem firmware using USB, complete the following steps:

    1. Start the Thingy:91 in the bootloader mode for the nRF9160 SiP:

        1. Take off the top cover of the Nordic Thingy:91 so you can access the **SW3** button.

            ![Thingy:91 - SW1 SW4 switch](./screenshots/thingy91_sw1_sw3.webp "Thingy:91 - SW1 switch and SW3 button")

        1. Connect the Thingy:91 to your computer with a USB cable.
        1. Locate the **SW1** power switch.
        1. Press and hold **SW3**.
        1. While holding **SW3** pressed, move the **SW1** power switch to **ON** to power the Thingy:91.<br/>
           The device turns on in the bootloader mode for the nRF9160 SiP.

    1. Open nRF Connect for Desktop and launch the {{app_name}} if it is not already open.
    1. Click **Select device**.<br/>

        ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

        A drop-down menu appears.

    1. In the menu, select the entry corresponding to your device (**Nordic Thingy:91**).<br/>

        ![Nordic Thingy:91 device in Select device](./screenshots/programmer_select_device_thingy91.png "Nordic Thingy:91 device in Select device")

    1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
       A file explorer window appears.

    1. Navigate to where you extracted the firmware.
    1. Find the modem firmware ZIP file with a name similar to `mfw_nrf9160_*.zip` and the number of the latest version.

        !!! note "Note"
            Do not extract the modem firmware ZIP file.

    1. Select the ZIP file and click **Open**.
    1. In the [**Device** section](overview.md#device), click **Write**.<br/>
        The **Modem DFU via MCUboot** window appears.

        ![Programmer - Modem DFU via MCUboot](./screenshots/thingy91_modemdfu_mcuboot.png "Programmer - Modem DFU via MCUboot")

    1. In the **Modem DFU via MCUboot** window, click **Write**.<br/>
       When the update is complete, a **Completed successfully** message appears.
    1. In the [**File** section](overview.md#file), click **Clear files**.

    You can now disconnect the Nordic Thingy:91 from the computer and put the top cover back on.

### Nordic Thingy:53

To program Nordic Thingy using the USB connection, complete the following steps:

1. Start the Thingy:53 in the bootloader mode:

    1. Take off the top cover of the Nordic Thingy:53 so you can access the **SW2** button.<br/>

        ![The Nordic Thingy:53 schematic - SW1 switch and SW2 button](./screenshots/thingy53_sw1_sw2.svg "The Nordic Thingy:53 schematic - SW1 switch and SW2 button")

    1. Connect the Thingy:53 to your computer with a USB cable.
    1. Locate the **SW1** power switch.
    1. Press and hold **SW2**.
    1. While holding **SW2** pressed, move the **SW1** power switch to **ON** to power the Thingy:53.<br/>
       The device turns on in the bootloader mode.

1. Open nRF Connect for Desktop and launch the {{app_name}} if it is not already open.
1. Click **Select device**.<br/>

    ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

    A drop-down menu appears.

1. In the menu, select the entry corresponding to your device (**Bootloader Thingy:53**).<br/>

    ![Bootloader Thingy:53 device in Select device](./screenshots/programmer_select_device_thingy53boot.png "Bootloader Thingy:53 device in Select device")

1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
   A file explorer window appears.

1. Navigate to the folder with the application firmware.<br/>
   If you are programming the precompiled application firmware from the [Nordic Thingy:53 Downloads](https://www.nordicsemi.com/Products/Development-hardware/Nordic-Thingy-53/Downloads?lang=en#infotabs), open the folder where you extracted the archive. For example, the ``Peripheral_LBS`` folder.
1. Select the update file and click **Open**.<br/>
   If you are programming the precompiled application firmware, the update file mentions the nRF Connect SDK version, for example ``peripheral_lbs_<version-number>_thingy53_nrf5340.zip``.
1. In the [**Device** section](overview.md#device), click **Write**.<br/>
   The **MCUboot DFU** window appears.

    ![Programmer - MCUboot DFU window](./screenshots/thingy53_mcuboot_dfu.png "Programmer - MCUboot DFU window")

1. Keep the **Keep default delay after image upload** option enabled.
1. In the **MCUboot DFU** window, click **Write**.<br/>
   The flash slot is erased. When the flash slot has been erased, image transfer starts and a progress bar appears. When the image transfer has been completed, the network core part of the image is transferred from RAM to the network core flash. This can take up to 20 seconds.<br/>
   When the update is complete, a **Completed successfully** message appears.
1. In the [**File** section](overview.md#file), click **Clear files**.

You can now disconnect the Nordic Thingy:53 from the computer and put the top cover back on.

## Programming using an external debug probe

You can update the Nordic Thingy application and network core firmware by using an external debug probe.

Make sure you have the following hardware:

- An external debug probe that supports Arm Cortex-M33 processors.
- A 10-pin 2x5 socket-socket 1.27 mm IDC (Serial Wire Debug - SWD) JTAG cable to connect to the external debug probe.

### Nordic Thingy:91

!!! note "Note"
    Make sure to check the partition layout configuration when programming the Nordic Thingy:91 firmware.
    See [Updating the Thingy:91 firmware using nRF Connect for Desktop apps](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/app_dev/device_guides/thingy91/thingy91_updating_fw_celmon.html) for more information.

=== "Updating nRF52840 SoC firmware"

    To update the nRF52840 SoC firmware on the Thingy:91 using the nRF9160 DK as an external debug probe, complete the following steps:

     1. Open nRF Connect for Desktop and launch the {{app_name}}.
     1. Prepare the hardware:

        a. Connect the Thingy:91 to the debug out port on a 10-pin external debug probe using a JTAG cable.

         ![Thingy:91 - Connecting the external debug probe](./screenshots/programmer_thingy91_connect_dk_swd_vddio.webp "Thingy:91 - Connecting the external debug probe")

        !!! note "Note"
            When using the nRF9160 DK as the debug probe, make sure that VDD_IO (SW11) is set to 1.8 V on the nRF9160 DK.

        b. Make sure that both the Thingy:91 and the external debug probe are powered on.

        !!! note "Note"
            Do not unplug or power off the devices during this process.

        c. Connect the external debug probe to the computer with a USB cable.

     1. Click **Select device**.<br/>

          ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

          A drop-down menu appears.

     1. Select the appropriate debug probe entry from the drop-down list.<br/>
        Select the nRF9160 DK from the list.<br/>
        The button text changes to the SEGGER ID of the selected device, and the **Device memory layout** window indicates that the device is connected.

     1. Set the **SWD** selection switch **SW2** to **nRF52** on the Thingy:91.
     1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
        A file explorer window appears.

     1. Navigate to where you extracted the firmware.
     1. Open the `img_app_bl` folder that contains the HEX files for flashing with a debugger.<br/>
        See the `CONTENTS.txt` file for information on which file you need.
     1. Select the `thingy91_nrf52_connectivity_bridge_*.hex` file and click **Open**.
     1. In the [**Device** section](overview.md#device), click **Erase & write**.<br/>
        The update is complete when the animation in the {{app_name}}'s **Device memory layout** window ends.
     1. In the [**File** section](overview.md#file), click **Clear files**.

    You can now disconnect the external debug probe from Nordic Thingy:91, disconnect Nordic Thingy:91 from the computer, and put the cover back on.

=== "Updating nRF9160 SiP modem firmware"

    To update the modem firmware on the Thingy:91 using an external debug probe, complete the following steps:

     1. Open nRF Connect for Desktop and launch the {{app_name}}.
     1. Prepare the hardware:

        a. Connect the Thingy:91 to the debug out port on a 10-pin external debug probe using a JTAG cable.

         ![Thingy:91 - Connecting the external debug probe](./screenshots/programmer_thingy91_connect_dk_swd_vddio.webp "Thingy:91 - Connecting the external debug probe")

        !!! note "Note"
            When using the nRF9160 DK as the debug probe, make sure that VDD_IO (SW11) is set to 1.8 V on the nRF9160 DK.

        b. Make sure that both the Thingy:91 and the external debug probe are powered on.

        !!! note "Note"
            Do not unplug or power off the devices during this process.

        c. Connect the external debug probe to the computer with a USB cable.

     1. Click **Select device**.<br/>

          ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

          A drop-down menu appears.

     1. Select the appropriate debug probe entry from the drop-down list.<br/>
        Select the nRF9160 DK from the list.<br/>
        The button text changes to the SEGGER ID of the selected device, and the **Device memory layout** window indicates that the device is connected.
     1. Set the **SWD** selection switch **SW2** to **nRF91** on the Thingy:91.
     1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
        A file explorer window appears.

     1. Navigate to where you extracted the firmware.
     1. Find the modem firmware ZIP file with a name similar to `mfw_nrf9160_*.zip` (with the latest version number) and click **Open**.

        !!! note "Note"
            Do not extract the modem firmware ZIP file.

     1. Select the ZIP file and click **Open**.
     1. In the [**Device** section](overview.md#device), click **Write**.<br/>
         The **Modem DFU** window appears.

         ![Programmer - Modem DFU](./screenshots/programmer_modemdfu.png "Programmer - Modem DFU")

     1. In the **Modem DFU** window, click **Write**.<br/>
        When the update is complete, a "Completed successfully" message appears.
     1. In the [**File** section](overview.md#file), click **Clear files**.

     You can now disconnect the external debug probe from Nordic Thingy:91, disconnect Nordic Thingy:91 from the computer, and put the cover back on.

    !!! note "Note"
         Before trying to update the modem again, click the **Erase all** button. This deletes the contents of the flash memory and the applications must be reprogrammed.


=== "Updating nRF9160 SiP application"

    To program the nRF9160 SiP application firmware on the Thingy:91 using an external debug probe, complete the following steps:

     1. Open nRF Connect for Desktop and launch the {{app_name}}.
     1. Prepare the hardware:

        a. Connect the Thingy:91 to the debug out port on a 10-pin external debug probe using a JTAG cable.

         ![Thingy:91 - Connecting the external debug probe](./screenshots/programmer_thingy91_connect_dk_swd_vddio.webp "Thingy:91 - Connecting the external debug probe")

        !!! note "Note"
            When using the nRF9160 DK as the debug probe, make sure that VDD_IO (SW11) is set to 1.8 V on the nRF9160 DK.

        b. Make sure that both the Thingy:91 and the external debug probe are powered on.

        c. Connect the external debug probe to the computer with a USB cable.

     1. Click **Select device**.<br/>

         ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

         A drop-down menu appears.

     1. Select the appropriate debug probe entry from the drop-down list.<br/>
        Select the nRF9160 DK from the list.<br/>
        The button text changes to the SEGGER ID of the selected device, and the **Device memory layout** window indicates that the device is connected.

     1. Make sure the **SWD** selection switch **SW2** is set to **nRF91** on the Thingy:91.
     1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
        A file explorer window appears.

     1. Navigate to where you extracted the firmware.
     1. Open the `img_app_bl` folder that contains the HEX files for updating using a debugger.
     1. Select the `thingy91_at_client_*.hex` file and click **Open**.
     1. In the [**Device** section](overview.md#device), click **Erase & write**.<br/>
         The update is complete when the animation in the {{app_name}}'s **Device memory layout** window ends.

     1. In the [**File** section](overview.md#file), click **Clear files**.

     You can now disconnect the external debug probe from Nordic Thingy:91, disconnect Nordic Thingy:91 from the computer, and put the cover back on.

### Nordic Thingy:53

To program Nordic Thingy:53 using an external debug probe, complete the following steps:

1. Open nRF Connect for Desktop and launch the {{app_name}}.
1. Prepare the hardware:

    a. Open the connector cover on the side of Nordic Thingy:53.

    b. Use a JTAG cable to connect Nordic Thingy:53 to the debug out port on a 10-pin external debug probe.

       ![Nordic Thingy:53 connected to the debug port on a 10-pin external debug probe](./screenshots/thingy53_nrf5340_dk.svg "Nordic Thingy:53 connected to the debug port on a 10-pin external debug probe")

    c. Power on the Nordic Thingy:53; move the power switch **SW1** to the **ON** position.

    d. Power on the external debug probe.

    e. Connect the external debug probe to the computer with a USB cable.

1. Click **Select device**.<br/>

    ![Programmer - Select device](./screenshots/programmer_click_select_device.png "Programmer - Select device")

    A drop-down menu appears.

1. Select the appropriate debug probe entry from the drop-down list.<br/>
   The icon text changes to board name and the ID of the selected device, and the **Device memory layout** section indicates that the device is connected.<br/>
   You can identify the nRF5340 DK by its PCA number PCA10095 and its ID that is printed on the label sticker on the DK.

    !!! note "Note"
        If the nRF5340 DK does not show up in the drop-down list, press Ctrl-R in Windows or command-R in macOS to restart the {{app_name}}.

1. In the [**File** section](overview.md#file), click **Add file** and select **Browse**.<br/>
   A file explorer window appears.
1. Navigate to the folder with the application firmware.<br/>
   If you are programming the precompiled application firmware from the [Nordic Thingy:53 Downloads](https://www.nordicsemi.com/Products/Development-hardware/Nordic-Thingy-53/Downloads?lang=en#infotabs), open the folder where you extracted the archive.
1. Open the folder for the application that you want to transfer to the Nordic Thingy:53.
1. Select the corresponding HEX file to be used with the debug probe and click **Open**.<br/>
   The HEX file appears in the **File memory layout** section.
1. In the [**Device** section](overview.md#device), click **Erase & write**.<br/>
   The update is complete when the animation in the {{app_name}}'s **Device memory layout** window ends.
1. In the [**File** section](overview.md#file), click **Clear files**.

You can now disconnect the external debug probe from Nordic Thingy:53, disconnect Nordic Thingy:53 from the computer, and put the connector cover back on.
