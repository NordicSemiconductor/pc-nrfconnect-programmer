/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    isValidNrf91x1FirmwareName,
    isValidNrf9160FirmwareName,
} from '../ModemUpdateDialogView';

describe('Modem firmware filename validation', () => {
    describe('nRF9160 firmware names', () => {
        it('accepts names from https://www.nordicsemi.com/Products/nRF9160/Download', () => {
            expect(isValidNrf9160FirmwareName('mfw_nrf9160_1.1.0.zip')).toBe(
                true,
            );
            expect(isValidNrf9160FirmwareName('mfw_nrf9160_1.3.7.zip')).toBe(
                true,
            );
        });

        it('accepts undefined as valid (no file selected)', () => {
            expect(isValidNrf9160FirmwareName(undefined)).toBe(true);
        });

        describe('invalid names', () => {
            it('rejects wrong prefix', () => {
                expect(isValidNrf9160FirmwareName('fw_nrf9160_1.0.0.zip')).toBe(
                    false,
                );
            });

            it('rejects non-zip file', () => {
                expect(
                    isValidNrf9160FirmwareName('mfw_nrf9160_1.1.0.tar'),
                ).toBe(false);
            });

            it('rejects nRF91x1 firmware names', () => {
                expect(
                    isValidNrf9160FirmwareName('mfw_nrf91x1_2.0.4.zip'),
                ).toBe(false);
                expect(
                    isValidNrf9160FirmwareName('mfw-pti_nrf91x1_2.3.8.zip'),
                ).toBe(false);
            });
        });
    });

    describe('nRF91x1 firmware names', () => {
        it('accepts names from https://www.nordicsemi.com/Products/nRF9161/Download', () => {
            expect(isValidNrf91x1FirmwareName('mfw_nrf91x1_2.0.0.zip')).toBe(
                true,
            );
            expect(isValidNrf91x1FirmwareName('mfw_nrf91x1_2.0.4.zip')).toBe(
                true,
            );
            expect(
                isValidNrf91x1FirmwareName('mfw-pti_nrf91x1_2.3.1.zip'),
            ).toBe(true);
            expect(
                isValidNrf91x1FirmwareName('mfw-pti_nrf91x1_2.3.8.zip'),
            ).toBe(true);
        });

        it('DECT names from https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/getting-started-with-nr-phy', () => {
            expect(
                isValidNrf91x1FirmwareName('mfw-nr+_nrf91x1_1.0.0.zip'),
            ).toBe(true);
        });

        it('accepts names from https://www.nordicsemi.com/Products/nRF9151/Download', () => {
            expect(
                isValidNrf91x1FirmwareName('mfw_nrf9151-ntn_1.0.0-1.alpha.zip'),
            ).toBe(true);
        });

        it('accepts undefined as valid (no file selected)', () => {
            expect(isValidNrf91x1FirmwareName(undefined)).toBe(true);
        });

        describe('invalid names', () => {
            it('rejects wrong prefix', () => {
                expect(isValidNrf91x1FirmwareName('fw_nrf91x1_2.0.0.zip')).toBe(
                    false,
                );
            });

            it('rejects non-zip file', () => {
                expect(
                    isValidNrf91x1FirmwareName('mfw_nrf91x1_2.0.0.tar'),
                ).toBe(false);
            });

            it('rejects nRF9160 firmware names', () => {
                expect(
                    isValidNrf91x1FirmwareName('mfw_nrf9160_1.1.0.zip'),
                ).toBe(false);
            });
        });
    });
});
