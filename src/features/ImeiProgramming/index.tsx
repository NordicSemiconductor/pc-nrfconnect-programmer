/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Button,
    Device,
    DialogButton,
    GenericDialog,
    getAppFile,
    getPersistedApiKey,
    isDevelopment,
    logger,
    persistApiKey,
    selectedDevice,
    selectedDeviceInfo,
    setSelectedDeviceInfo,
} from '@nordicsemiconductor/pc-nrfconnect-shared';
import {
    DeviceInfo,
    NrfutilDeviceLib,
} from '@nordicsemiconductor/pc-nrfconnect-shared/nrfutil/device';
import { clipboard } from 'electron';
import path from 'path';

import { readIMEI, writeIMEI } from '../nrfutil91';
import fetchIMEI from './fetchIMEI';

const PasswordComponent = ({
    onChanging,
    value,
}: {
    onChanging: (value: string) => void;
    value: string;
}) => {
    const [show, setShow] = useState(false);
    return (
        <div className="tw-flex tw-flex-row">
            <input
                className="tw-w-28 tw-border tw-border-r-0 tw-border-gray-400 tw-px-2 tw-py-1 tw-leading-none"
                type={show ? 'text' : 'password'}
                value={value}
                onChange={event => {
                    onChanging(event.target.value);
                }}
            />
            <button
                onClick={() => setShow(!show)}
                className="tw-border tw-border-l-0 tw-border-gray-400"
                type="button"
            >
                <span
                    className={`mdi tw-leading-none ${
                        !show ? ' mdi-eye-off' : ' mdi-eye'
                    }`}
                />
            </button>
        </div>
    );
};

const isSupportedDevice = (deviceInfo?: DeviceInfo) =>
    deviceInfo?.jlink?.protectionStatus === 'NRFDL_PROTECTION_STATUS_NONE' &&
    deviceInfo?.jlink?.deviceVersion?.toLocaleUpperCase().match(/NRF91\d1/);
const isMaybeSupportedDevice = (deviceInfo?: DeviceInfo) =>
    deviceInfo?.jlink?.protectionStatus === 'NRFDL_PROTECTION_STATUS_NONE'
        ? deviceInfo?.jlink?.deviceVersion
              ?.toLocaleUpperCase()
              .match(/NRF91\d1/)
        : deviceInfo?.jlink?.deviceFamily !== 'NRF91_FAMILY';

const getStatus = async (device?: Device, deviceInfo?: DeviceInfo) => {
    if (!device || !deviceInfo) return 'NONE';
    if (deviceInfo.jlink?.protectionStatus !== 'NRFDL_PROTECTION_STATUS_NONE')
        return 'PROTECTED';

    if (!device.serialNumber || !isSupportedDevice(deviceInfo))
        return 'UNSUPPORTED';

    const defaultImeiNumber = 'FFFFFFFFFFFFFFF';
    try {
        const res = await readIMEI(device.serialNumber);
        if (res !== defaultImeiNumber) {
            return 'IMEI_SET';
        }
        return 'IMEI_NOT_SET';
    } catch (e) {
        return 'FIRMWARE';
    }
};

const updateDeviceInfo = async (device: Device) => {
    const deviceInfo = await NrfutilDeviceLib.deviceInfo(device);
    setSelectedDeviceInfo(deviceInfo);
    return deviceInfo;
};

const recover = async (device: Device) => {
    await NrfutilDeviceLib.batch()
        .recover('Application')
        .reset('Application')
        .run(device);
    return getStatus(device, await updateDeviceInfo(device));
};

const CopyImeiNotice = ({ imei }: { imei: string }) => (
    <>
        The IMEI has been consumed in the cloud. Copy and store it.
        <br />
        {imei}
        <button
            type="button"
            className="tw-preflight tw-inline tw-h-min tw-p-0 tw-text-lg/tight"
            onClick={() => clipboard.writeText(imei)}
        >
            <span className="mdi mdi-content-copy tw-inline tw-leading-none active:tw-text-primary" />
        </button>
    </>
);

const formatDeviceVersionToProduct = (deviceVersion: string) => {
    switch (deviceVersion.toLocaleUpperCase().slice(0, 7)) {
        case 'NRF9161':
            return 'nRF9161';
        case 'NRF9151':
            return 'nRF9151';
        case 'NRF9131':
            return 'nRF9131';
        default:
            throw new Error(`Unknown device version: ${deviceVersion}`);
    }
};

type Status =
    | 'NONE'
    | 'INIT'
    | 'IMEI_NOT_SET'
    | 'IMEI_SET'
    | 'FIRMWARE'
    | 'PROTECTED'
    | 'UNSUPPORTED'
    | 'FINISHED';

export default () => {
    const device = useSelector(selectedDevice);
    const deviceInfo = useSelector(selectedDeviceInfo);
    const [status, setStatus] = useState<Status>('NONE');
    const [showSpinner, setShowSpinner] = useState(false);
    const [useCloud, setUseCloud] = useState(false);
    const [apiKey, setAPIKey] = useState('');
    const [manualIMEI, setManualIMEI] = useState('');
    const [cloudIMEI, setCloudIMEI] = useState('');
    const [hasProgrammedFirmware, setHasProgrammedFirmware] = useState(false);
    const [error, setError] = useState<string>();

    const waitForAction = async (action: () => Promise<void>) => {
        setShowSpinner(true);
        setError(undefined);
        await action().finally(() => {
            setShowSpinner(false);
        });
    };

    useEffect(() => {
        // if device disconnects
        if (!device && status !== 'NONE') {
            setStatus('NONE');
        }
    }, [device, status]);

    return (
        <>
            <GenericDialog
                isVisible={status !== 'NONE'}
                onHide={() => setStatus('NONE')}
                title="Program IMEI"
                showSpinner={showSpinner}
                footer={
                    <>
                        {status === 'PROTECTED' && (
                            <DialogButton
                                variant="primary"
                                disabled={showSpinner}
                                onClick={() => {
                                    if (!device) return;

                                    waitForAction(async () =>
                                        setStatus(await recover(device))
                                    ).catch(() =>
                                        setError(
                                            'Failed to recover. Please try again.'
                                        )
                                    );
                                }}
                            >
                                Recover
                            </DialogButton>
                        )}
                        {status === 'FIRMWARE' && (
                            <DialogButton
                                variant="primary"
                                disabled={showSpinner}
                                onClick={() => {
                                    if (!device) return;

                                    waitForAction(async () => {
                                        const mfw = '';
                                        await NrfutilDeviceLib.program(
                                            device,
                                            mfw,
                                            () => {},
                                            'Modem',
                                            {
                                                reset: 'RESET_SYSTEM',
                                            }
                                        );

                                        const newStatus = await getStatus(
                                            device,
                                            await updateDeviceInfo(device)
                                        );
                                        if (newStatus === 'FIRMWARE') {
                                            setError(
                                                'Unable to communicate with the device.'
                                            );
                                            setStatus('UNSUPPORTED');
                                        } else {
                                            setStatus(newStatus);
                                        }
                                        setHasProgrammedFirmware(true);
                                    }).catch(() =>
                                        setError(
                                            'Failed to program firmware. Please try again.'
                                        )
                                    );
                                }}
                            >
                                Program firmware
                            </DialogButton>
                        )}
                        {status === 'IMEI_NOT_SET' && (
                            <DialogButton
                                variant="primary"
                                disabled={
                                    showSpinner ||
                                    /\d{15}/.test(manualIMEI) ||
                                    apiKey === ''
                                }
                                onClick={() => {
                                    waitForAction(async () => {
                                        if (
                                            !device?.serialNumber ||
                                            !deviceInfo?.jlink?.deviceVersion
                                        )
                                            return;
                                        let imei = '';
                                        if (useCloud && !cloudIMEI) {
                                            try {
                                                imei = await fetchIMEI(
                                                    formatDeviceVersionToProduct(
                                                        deviceInfo?.jlink
                                                            ?.deviceVersion
                                                    ),
                                                    isDevelopment
                                                        ? 'DEVELOPMENT'
                                                        : 'PRODUCTION',
                                                    apiKey
                                                );
                                                logger.info(
                                                    `Fetched IMEI: ${imei}`
                                                );
                                                setCloudIMEI(imei);
                                            } catch (e) {
                                                setError(
                                                    'Failed to fetch IMEI. Before trying again, check your internet connection and your API key.'
                                                );
                                                return;
                                            }
                                        }

                                        await writeIMEI(
                                            device.serialNumber,
                                            useCloud ? cloudIMEI : manualIMEI
                                        )
                                            .then(() => {
                                                setStatus('FINISHED');
                                            })
                                            .catch(() => {
                                                setError(
                                                    'Failed to write IMEI.'
                                                );
                                                if (!hasProgrammedFirmware) {
                                                    setStatus('FIRMWARE');
                                                } else {
                                                    setStatus('UNSUPPORTED');
                                                }
                                            });
                                    });
                                }}
                            >
                                Write IMEI
                            </DialogButton>
                        )}
                        <DialogButton
                            variant="secondary"
                            disabled={showSpinner}
                            onClick={() => setStatus('NONE')}
                        >
                            Close
                        </DialogButton>
                    </>
                }
            >
                {error && (
                    <div className="tw-mb-4">
                        <div className="tw-text-gray-70 tw-flex tw-flex-row tw-items-center tw-gap-4 tw-bg-gray-50 tw-p-4">
                            <span className="mdi mdi-alert tw-align-middle tw-text-2xl/6 tw-text-red" />
                            <div>{error}</div>
                        </div>
                    </div>
                )}
                {status === 'INIT' && (
                    <div>Checking that IMEI can be written to device.</div>
                )}
                {status === 'PROTECTED' && (
                    <div>
                        Recover the device in order to check whether programming
                        IMEI is supported.
                    </div>
                )}
                {status === 'UNSUPPORTED' && (
                    <div>
                        Programming IMEI is not supported for this device.
                        {cloudIMEI && <CopyImeiNotice imei={cloudIMEI} />}
                    </div>
                )}
                {status === 'FIRMWARE' && (
                    <>
                        <div>
                            Unable to communicate with the device. Do you want
                            to program PTI firmware?
                        </div>
                        {cloudIMEI && <CopyImeiNotice imei={cloudIMEI} />}
                    </>
                )}
                {status === 'IMEI_NOT_SET' && (
                    <>
                        {useCloud && (
                            <>
                                <span>Cloud API key</span>
                                <br />
                                <PasswordComponent
                                    onChanging={key => {
                                        persistApiKey('nrfcloud', key);
                                        setAPIKey(key);
                                    }}
                                    value={apiKey}
                                />
                                <button
                                    type="button"
                                    className="tw-preflight tw-mt-1 tw-inline tw-h-min tw-p-0 tw-text-primary"
                                    onClick={() => setUseCloud(false)}
                                >
                                    Enter IMEI manually
                                </button>
                                {cloudIMEI && (
                                    <CopyImeiNotice imei={cloudIMEI} />
                                )}
                            </>
                        )}
                        {!useCloud && (
                            <>
                                <span>IMEI number</span>
                                <br />
                                <input
                                    className="tw-w-48 tw-border tw-border-gray-700 tw-px-2 tw-py-1 tw-leading-none"
                                    value={manualIMEI}
                                    onChange={event =>
                                        setManualIMEI(event.target.value)
                                    }
                                />
                                <br />
                                <button
                                    type="button"
                                    className="tw-preflight tw-mt-1 tw-inline tw-h-min tw-p-0 tw-text-primary"
                                    onClick={() => setUseCloud(true)}
                                >
                                    Fetch IMEI from cloud
                                </button>
                            </>
                        )}
                    </>
                )}
                {status === 'IMEI_SET' && (
                    <div>The device already has an IMEI programmed.</div>
                )}
                {status === 'FINISHED' && <div>Finished.</div>}
            </GenericDialog>
            <Button
                variant="secondary"
                className="tw-w-full"
                onClick={() => {
                    if (!device) return;
                    setCloudIMEI('');
                    setManualIMEI('');
                    // fetch api key
                    getPersistedApiKey('nrfcloud')
                        .then(setAPIKey)
                        .catch(() => setAPIKey(''));
                    setHasProgrammedFirmware(false);
                    setError('');
                    setStatus('INIT');
                    waitForAction(async () =>
                        setStatus(await getStatus(device, deviceInfo))
                    );
                }}
                disabled={!isMaybeSupportedDevice(deviceInfo)}
                title={
                    !isMaybeSupportedDevice(deviceInfo)
                        ? 'Device not supported'
                        : ''
                }
            >
                <span className="mdi mdi-flash" />
                Program IMEI
            </Button>
        </>
    );
};
