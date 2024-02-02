# Troubleshooting

When troubleshooting, to view more detailed information than shown in the Log panel, use **Open log file** to open the current log file in a text editor.

![Where to open the detailed log file](./screenshots/programmer_app_open_log_file.png "Log window with highlighted Open log file button")

## OS X J-Link Issue

In OS X: An issue with the SEGGER J-Link OB firmware leads to the corruption of long packets over UART. See [www.nordicsemi.com/nRFConnectOSXfix](https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/nrf-connect-v10-release#osxissue) for more information.

## Serial Port Access Permissions on Ubuntu Linux

If you receive errors when trying to open the serial port in the nRF Connect Bluetooth Low Energy app on Ubuntu Linux, you may need to grant serial port access permissions to your user. To do this, run the following command:

```
sudo usermod -a -G dialout <username>
```

## Unable to program with Write

If you are unable to program a device with the **Write** button, verify that:

- You are trying to program a supported device.
- There are no issues with the HEX file, and the addresses mentioned within the file are correct.

## Application returns an error

If the application returns an error, you can restart it by pressing **Ctrl+R** in Windows and **Command+R** in macOS. A restart might be required in the following scenarios:

- A device is reset while it is connected to the Programmer app.
- Other errors.
