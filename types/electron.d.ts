/*
 * Copyright (c) 2021 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

declare module 'electron';

declare namespace Electron {
    interface SaveDialogReturnValue {
        /**
         * whether or not the dialog was canceled.
         */
        canceled: boolean;
        /**
         * If the dialog is canceled, this will be `undefined`.
         */
        filePath?: string;
        /**
         * Base64 encoded string which contains the security scoped bookmark data for the
         * saved file. `securityScopedBookmarks` must be enabled for this to be present.
         * (For return values, see table here.)
         *
         * @platform darwin,mas
         */
        bookmark?: string;
    }
}
