# {{app_name}}

The {{app_name}} in [nRF Connect for Desktop](https://docs.nordicsemi.com/bundle/nrf-connect-desktop/page/index.html) lets you program firmware to Nordic devices. The application allows you to see the memory layout for devices that support programming with J-Link, Nordic Secure DFU, and MCUboot. It also allows you to display content of HEX files and write it to the devices.

## Supported hardware

The following table lists the hardware platforms that you can program with the {{app_name}}.

| Hardware platform   | Device   | PCA number | Programming with J-Link  | Programming with Nordic Secure DFU  | Programming with MCUboot |
|---------------------|----------|------------|--------------------------|-------------------------------------|--------------------------|
| nRF9161 DK          | nRF9161  | PCA10153   | Yes                      | No                                  | No                       |
| Nordic Thingy:91 X  | nRF9151  | PCA20065   | *Not yet available*      | No                                  | *Not yet available*      |
| nRF9160 DK          | nRF9160  | PCA10090   | Yes                      | No                                  | No                       |
| Nordic Thingy:91    | nRF9160  | PCA20035   | Yes                      | No                                  | Yes                      |
| nRF9151 DK          | nRF9131  | PCA10171   | Yes                      | No                                  | No                       |
| nRF9131 DK          | nRF9131  | PCA10147   | Yes                      | No                                  | No                       |
| nRF54H20 DK         | nRF54H20 | PCA10175   | *Not yet available*      | No                                  | No                       |
| nRF54LM20A DK       | nRF54L20 | PCA10184   | Yes                      | No                                  | No                       |
| nRF54L15 DK         | nRF54L15 | PCA10156   | Yes                      | No                                  | No                       |
| nRF5340 DK          | nRF5340  | PCA10095   | Yes                      | No                                  | No                       |
| nRF5340 Audio DK    | nRF5340  | PCA10121   | Yes                      | No                                  | No                       |
| Nordic Thingy:53    | nRF5340  | PCA20053   | Yes                      | No                                  | Yes                      |
| nPM1300 EK          | nPM1300  | PCA10152   | Yes                      | No                                  | Yes                      |
| nRF52840 DK         | nRF52840 | PCA10056   | Yes                      | Possible                            | No                       |
| nRF52840 Dongle     | nRF52840 | PCA10059   | No                       | Yes                                 | No                       |
| nRF52833 DK         | nRF52833 | PCA10100   | Yes                      | Possible                            | No                       |
| nRF52832 DK (nRF52) | nRF52832 | PCA10040   | Yes                      | Possible                            | No                       |

Programming with Nordic Secure DFU is **Possible** on some nRF52 Series platforms if you implement a bootloader solution that supports Nordic Secure DFU.

### Support for custom hardware

The following criteria apply to programming custom hardware with the {{app_name}}:

- **Device**: The hardware platform you are programming must use an SoC or SiP from Nordic Semiconductor.
- **Programming with J-Link**: Possible for all custom hardware that features Nordic SoCs supported by [nRF Util](https://docs.nordicsemi.com/bundle/nrfutil/page/README.html).
- **Programming with Nordic Secure DFU**: Possible if you implement a bootloader solution that supports Nordic Secure DFU. The {{app_name}} checks the bootloader for Nordic ID to be able to program using this method.
- **Programming with MCUboot**: Only possible using CLI.

## Deprecated hardware support

The following hardware platforms cannot be programmed with the {{app_name}} anymore.

| Hardware platform   | Device   | PCA number | Programming with J-Link  | Programming with Nordic Secure DFU  | Programming with MCUboot |
|---------------------|----------|------------|--------------------------|-------------------------------------|--------------------------|
| Nordic Thingy:52    | nRF52832 | PCA20020   | No                       | No                                  | No                       |
| All platforms with nRF52820         | nRF52820 | -   | No                       | No                                  | No                       |
| All platforms with nRF52811         | nRF52811 | -   | No                       | No                                  | No                       |
| All platforms with nRF52805         | nRF52805 | -   | No                       | No                                  | No                       |
| All platforms with nRF51 Series' SoC          | All | -   | No                       | No                                  | No                       |

## Application source code

The code of the application is open source and [available on GitHub](https://github.com/NordicSemiconductor/pc-nrfconnect-programmer).
Feel free to fork the repository and clone it for secondary development or feature contributions.