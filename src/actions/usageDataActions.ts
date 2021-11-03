/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

// The actions in this file are handled by the reducers in pc-nrfconnect-launcher or
// pc-nrfconnect-shared, so we instead of defining them here, we really should import
// them from there. But before we can correct this, we need to upgrade to a new version.

enum EventAction {
    OPEN_DEVICE = 'Open device',
    CLOSE_DEVICE = 'Close device',
    OPEN_DEVICE_JLINK_OB = 'Open jlink OB version',
    OPEN_DEVICE_FAMILY = 'Open jlink device family',
    OPEN_DEVICE_VERSION = 'Open jlink device version',
    OPEN_DEVICE_BOARD_VERSION = 'Open jlink device board version',
}

export default EventAction;
