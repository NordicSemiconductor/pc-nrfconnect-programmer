/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { combineReducers } from 'redux';

import deviceDefinition from './deviceDefinitionReducer';
import file from './fileReducer';
import mcuboot from './mcubootReducer';
import modem from './modemReducer';
import settings from './settingsReducer';
import target from './targetReducer';
import userInput from './userInputReducer';
import warning from './warningReducer';

const rootReducer = combineReducers({
    file,
    modem,
    mcuboot,
    settings,
    deviceDefinition,
    target,
    userInput,
    warning,
});

export default rootReducer;
