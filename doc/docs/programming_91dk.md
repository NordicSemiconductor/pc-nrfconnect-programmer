# Programming nRF91 Series DK firmware

You can program the nRF91 Series DK firmware application and network core firmware over USB.

You can follow this procedure to update the firmware on nRF91 Series DKs using the latest application and modem firmware from the from the [Nordic Semiconductor website](https://www.nordicsemi.com/):

- [nRF9151 DK Downloads](https://www.nordicsemi.com/Products/Development-hardware/nRF9151-DK/Download?lang=en#infotabs)
- [nRF9161 DK Downloads](https://www.nordicsemi.com/Products/Development-hardware/nRF9161-DK/Download?lang=en#infotabs)
- [nRF9160 DK Downloads](https://www.nordicsemi.com/Products/Development-hardware/nRF9160-DK/Download#infotabs)

The downloaded ZIP archive contains the following firmware:

=== "nRF9151 DK"

     | File or Folder                                   | Description                                                                                                                                                                                                                      |
     |--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
     | `img_app_bl`                                     | Contains full firmware images for different applications. The guides in this section use the image for the [nRF Cloud multi-service](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/samples/cellular/nrf_cloud_multi_service/README.html#nrf-cloud-multi-service) sample as an example.<br/><br/>The nRF Cloud multi-service sample simulates sensor data and transmits it to Nordic Semiconductor's cloud solution, [nRF Cloud](https://nrfcloud.com/).<br/><br/>The data is transmitted using either LTE-M or NB-IoT. The nRF Cloud multi-service sample first attempts to use LTE-M, then NB-IoT. Check with your SIM card provider for the mode they support at your location.<br/><br/>- For the Onomondo SIM card, check the [Onomondo LTE-M coverage](https://onomondo.com/product/coverage/lte-m-networks/) and [Onomondo NB-IoT coverage](https://onomondo.com/product/coverage/nb-iot-networks/) to see if your country is supported.<br/>- For the Wireless Logic SIM card, check the [Wireless Logic LTE-M/NB-IoT network coverage](https://www.wirelesslogic.com/simclaim/nsctrial/) to see if your country is supported. |
     | `img_fota_dfu_bin`, `img_fota_dfu_hex`           | Contain firmware images for Device Firmware Update (DFU). These images are not used in the procedure in this page.                                                                                                              |
     | Modem firmware ZIP (`mfw_nrf91x1_...`)          | The modem firmware is provided as a ZIP archive named `mfw_nrf91x1_` followed by the firmware version number. Do not unzip this file.                                                                                         |
     | `CONTENTS.txt`                                   | Lists the location and names of the different firmware images included in the extracted folder.                                                                                                                                |

=== "nRF9161 DK"

     | File or Folder                                   | Description                                                                                                                                                                                                                      |
     |--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
     | `img_app_bl`                                     | Contains full firmware images for different applications. The guides in this section use the image for the [nRF Cloud multi-service](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/samples/cellular/nrf_cloud_multi_service/README.html#nrf-cloud-multi-service) sample as an example.<br/><br/>The nRF Cloud multi-service sample simulates sensor data and transmits it to Nordic Semiconductor's cloud solution, [nRF Cloud](https://nrfcloud.com/).<br/><br/>The data is transmitted using either LTE-M or NB-IoT. The nRF Cloud multi-service sample first attempts to use LTE-M, then NB-IoT. Check with your SIM card provider for the mode they support at your location.<br/><br/>For the Onomondo SIM card, check the [Onomondo LTE-M coverage](https://onomondo.com/product/coverage/lte-m-networks/) and [Onomondo NB-IoT coverage](https://onomondo.com/product/coverage/nb-iot-networks/) to see the network coverage for different countries. |
     | `img_fota_dfu_bin`, `img_fota_dfu_hex`           | Contain firmware images for Device Firmware Update (DFU). These images are not used in the procedure in this page.                                                                                                              |
     | Modem firmware ZIP (`mfw_nrf91x1_...`)          | The modem firmware is provided as a ZIP archive named `mfw_nrf91x1_` followed by the firmware version number. Do not unzip this file.                                                                                         |
     | `CONTENTS.txt`                                   | Lists the location and names of the different firmware images included in the extracted folder.                                                                                                                                |

=== "nRF9160 DK"

     | File or Folder                                   | Description                                                                                                                                                                                                                      |
     |--------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
     | `img_app_bl`                                     | Contains full firmware images for different applications. The guides in this section use the image for the [nRF Cloud multi-service](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/samples/cellular/nrf_cloud_multi_service/README.html#nrf-cloud-multi-service) sample as an example.<br/><br/>The nRF Cloud multi-service sample simulates sensor data and transmits it to Nordic Semiconductor's cloud solution, [nRF Cloud](https://nrfcloud.com/). The data is transmitted using either LTE-M or NB-IoT.<br/><br/>The nRF Cloud multi-service sample first attempts to use LTE-M, then NB-IoT. Check with your SIM card provider for the mode they support at your location.<br/><br/>For the iBasis SIM card provided with the nRF9160 DK, see [iBasis IoT network coverage](https://ibasis.com/solutions/iot-connectivity/network-coverage/). |
     | `img_fota_dfu_bin`, `img_fota_dfu_hex`           | Contain firmware images for Device Firmware Update (DFU). These images are not used in the procedure in this page.                                                                                                              |
     | Modem firmware ZIP (`mfw_nrf9160_...`)          | The modem firmware is provided as a ZIP archive named `mfw_nrf9160_` followed by the firmware version number. Do not unzip this file.                                                                                         |
     | `CONTENTS.txt`                                   | Lists the location and names of the different firmware images included in the extracted folder.                                                                                                                                |

To program the nRF91 Series DK, you will also need the following USB cables:

* nRF91x1 DK - USB-C cable
* nRF9160 DK - micro-USB cable

!!! tip "Tip"

    If you experience any problems during the process, press `Ctrl+R` (`command+R` on macOS) to restart the Programmer app and try again.

## nRF91x1 DK

=== "Updating the nRF91x1 DK modem firmware"

    To update the modem firmware on the nRF91x1 DK, complete the following steps:

      1. Open the {{app_name}}.
      1. Connect the DK to the computer with a USB cable, and then turn the DK on.
      1. Click **SELECT DEVICE** and select the DK from the drop-down list.<br/>

          ![Programmer - Select device (nRF9151 DK shown)](./screenshots/programmer_select_device_nrf9151.png "Programmer - Select device (nRF9151 DK shown)")

         The drop-down text changes to the type of the selected device, with its SEGGER ID below the name.
         The **Device memory layout** section also changes its name to the device name, and indicates that the device is connected.
         If the **Auto read memory** option is selected in the **J-LINK SETTINGS** section of the side panel, the memory layout will update.
         If it is not selected and you wish to see the memory layout, click **Read** in the **DEVICE** section of the side panel.

      1. Click **Add file** in the **FILE** section, and select **Browse**.
      1. Navigate to where you extracted the firmware, and select the `mfw_nrf91x1_<version-number>.zip` file.
      1. Click **Write** in the **DEVICE** section of the side panel.<br/>

          ![Programmer - Write (nRF9151 DK shown)](./screenshots/programmer_hex_write_nrf9151.png "Programmer - Write (nRF9151 DK shown)")

         The **Modem DFU** window appears.<br/>

          ![Modem DFU window (nRF9151 DK shown)](./screenshots/programmerapp_modemdfu_nrf9151.png "Modem DFU window (nRF9151 DK shown)")

      1. Ignore the warning message and click the **Write** button in the **Modem DFU** window to update the firmware.
         Do not unplug or turn off the device during this process.

    When the update is complete, you see a success message.
    If you update the application firmware now, you can skip the initial steps about connecting and selecting the device in the [Updating the application firmware](#nrf91x1-dk) tab.

    !!! note "Note"

        If you experience problems updating the modem firmware, click **Erase all** in the **DEVICE** section of the side panel and try updating again.

=== "Updating the nRF91x1 DK application firmware"

    To update the nRF91x1 DK application firmware, complete the following steps:

      1. Open the {{app_name}}.
      1. Connect the DK to the computer with a USB cable, and then turn the DK on.
      1. Click **SELECT DEVICE** and select the DK from the drop-down list.<br/>

          ![Programmer - Select device (nRF9151 DK shown)](./screenshots/programmer_select_device_nrf9151.png "Programmer - Select device (nRF9151 DK shown)")

         The drop-down text changes to the type of the selected device, with its SEGGER ID below the name.
         The **Device memory layout** section also changes its name to the device name, and indicates that the device is connected.
         If the **Auto read memory** option is selected in the **J-LINK SETTINGS** section, the memory layout will update.
         If it is not selected and you wish to see the memory layout, **Read** in the **DEVICE** section.

      1. Click **Add file** in the **FILE** section, and select **Browse**.
      1. Navigate to where you extracted the firmware, and then to the `img_app_bl` folder there.
      1. Select the `.hex` file for your DK for the application you are programming:

         * nRF9151 DK: `nrf9151dk_nrfcloud_multi_service_coap_<version-number>.hex`
         * nRF9651 DK: `nrf9161dk_nrfcloud_multi_service_coap_<version-number>.hex`

      1. Click the **Erase & write** button in the **DEVICE** section to program the DK.
         Do not unplug or turn off the DK during this process.<br/>

          ![Programmer - Erase & write (nRF9151 DK shown)](./screenshots/programmer_erasewrite_nrf9151dk.png "Programmer - Erase & write (nRF9151 DK shown)")

## nRF9160 DK

=== "Updating the nRF9160 DK modem firmware"

    To update the nRF9160 DK modem firmware, complete the following steps:

      1. Open the {{app_name}}.
      1. Make sure the **PROG/DEBUG SW10** switch on the nRF9160 DK is set to **nRF91**.
         On DK v0.9.0 and earlier, this is the **SW5** switch.
      1. Connect the DK to the computer with a USB cable, and then turn the DK on.
      1. Click **SELECT DEVICE** and select the DK from the drop-down list.<br/>

          ![Programmer - Select device](./screenshots/programmer_selectdevice_nrf9160.png "Programmer - Select device")

         The drop-down text changes to the type of the selected device, with its SEGGER ID below the name.
         The **Device memory layout** section also changes its name to the device name, and indicates that the device is connected.
         If the **Auto read memory** option is selected in the **J-LINK SETTINGS** section of the side panel, the memory layout will update.
         If it is not selected and you wish to see the memory layout, click **Read** in the **DEVICE** section of the side panel.

      1. Click **Add file** in the **FILE** section, and select **Browse**.
      1. Navigate to where you extracted the firmware, and select the `mfw_nrf9160_<version-number>.zip` file.
      1. Click **Write** in the **DEVICE** section of the side panel.<br/>

          ![Programmer - Write](./screenshots/programmer_write_nrf9160dk.png "Programmer - Write")

         The **Modem DFU** window appears.<br/>

          ![Modem DFU window](./screenshots/programmerapp_modemdfu.png "Modem DFU window")

      1. Ignore the warning message and click the **Write** button in the **Modem DFU** window to update the firmware.
         Do not unplug or turn off the device during this process.

    When the update is complete, you see a success message.
    If you update the application firmware now, you can skip the initial steps about connecting and selecting the device in the [Updating the application firmware](#nrf9160-dk) tab.

    !!! note "Note"

        If you experience problems updating the modem firmware, click **Erase all** in the **DEVICE** section of the side panel and try updating again.

=== "Updating the nRF9160 DK application firmware"

    To update the nRF9160 DK application firmware, complete the following steps:

      1. Open the {{app_name}}.
      1. Make sure the **PROG/DEBUG SW10** switch (**SW5** on DK v0.9.0 and earlier) on the nRF9160 DK is set to **nRF91** or **nRF52** as appropriate for the application or sample you are programming.<br/>
         See the [Device programming section in the nRF9160 DK User Guide](https://docs.nordicsemi.com/bundle/ug_nrf9160_dk/page/UG/nrf91_DK/operating_modes/mcu_device_programming.html) for more information.<br/>

         For the [nRF Cloud multi-service](https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/samples/cellular/nrf_cloud_multi_service/README.html#nrf-cloud-multi-service) sample, the switch must be set to **nRF91**.
      1. Connect the DK to the computer with a USB cable, and then turn the DK on.
      1. Click **SELECT DEVICE** and select the DK from the drop-down list.<br/>

          ![Programmer - Select device](./screenshots/programmer_selectdevice_nrf9160.png "Programmer - Select device")

         The drop-down text changes to the type of the selected device, with its SEGGER ID below the name.
         The **Device memory layout** section also changes its name to the device name, and indicates that the device is connected.
         If the **Auto read memory** option is selected in the **J-LINK SETTINGS** section, the memory layout will update.
         If it is not selected and you wish to see the memory layout, **Read** in the **DEVICE** section.

      1. Click **Add file** in the **FILE** section, and select **Browse**.
      1. Navigate to where you extracted the firmware, and then to the `img_app_bl` folder there.
      1. Select the `nrf9160dk_nrfcloud_multi_service_coap_<version-number>.hex` file.
      1. Click the **Erase & write** button in the **DEVICE** section to program the DK.
         Do not unplug or turn off the DK during this process.<br/>

          ![Programmer - Erase & write](./screenshots/programmer_erasewrite_nrf9160dk.png "Programmer - Erase & write")
