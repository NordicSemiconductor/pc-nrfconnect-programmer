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

    interface OpenDialogOptions {
        title?: string;
        defaultPath?: string;
        /**
         * Custom label for the confirmation button, when left empty the default label will
         * be used.
         */
        buttonLabel?: string;
        filters?: {
            // Docs: https://electronjs.org/docs/api/structures/file-filter

            extensions: string[];
            name: string;
        }[];
        /**
         * Contains which features the dialog should use. The following values are
         * supported:
         */
        properties?: Array<
            | 'openFile'
            | 'openDirectory'
            | 'multiSelections'
            | 'showHiddenFiles'
            | 'createDirectory'
            | 'promptToCreate'
            | 'noResolveAliases'
            | 'treatPackageAsDirectory'
            | 'dontAddToRecent'
        >;
        /**
         * Message to display above input boxes.
         *
         * @platform darwin
         */
        message?: string;
        /**
         * Create security scoped bookmarks when packaged for the Mac App Store.
         *
         * @platform darwin,mas
         */
        securityScopedBookmarks?: boolean;
    }
}
