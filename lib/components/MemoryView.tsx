/* Copyright (c) 2015 - 2019, Nordic Semiconductor ASA
 *
 * All rights reserved.
 *
 * Use in source and binary forms, redistribution in binary form only, with
 * or without modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions in binary form, except as embedded into a Nordic
 *    Semiconductor ASA integrated circuit in a product or a software update for
 *    such product, must reproduce the above copyright notice, this list of
 *    conditions and the following disclaimer in the documentation and/or other
 *    materials provided with the distribution.
 *
 * 2. Neither the name of Nordic Semiconductor ASA nor the names of its
 *    contributors may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * 3. This software, with or without modification, must only be used with a Nordic
 *    Semiconductor ASA integrated circuit.
 *
 * 4. Any software provided in binary form under this license must not be reverse
 *    engineered, decompiled, modified and/or disassembled.
 *
 * THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import React from 'react';
import { useSelector } from 'react-redux';
import nrfdl from '@nordicsemiconductor/nrf-device-lib-js';
import PropTypes from 'prop-types';

import { getIsMcuboot } from '../reducers/mcubootReducer';
import {
    getDeviceInfo,
    getIsErasing,
    getIsLoading,
    getIsWriting,
    getRefreshEnabled,
} from '../reducers/targetReducer';
import { RootState } from '../reducers/types';
import { CoreDefinition } from '../util/devices';
import { Region } from '../util/regions';
import CoreView from './CoreView';

const allocateCores = (cores: CoreDefinition[], regions: Region[]) =>
    cores.map(core => ({
        ...core,
        regions: regions.filter(
            r =>
                r.startAddress >= core.romBaseAddr &&
                r.startAddress + r.regionSize <= core.romBaseAddr + core.romSize
        ),
    }));

const convertCoresToViews = (
    targetCores: CoreDefinition[],
    regions: Region[],
    active: boolean
) =>
    allocateCores(targetCores, regions)
        .sort((a, b) => b.romBaseAddr - a.romBaseAddr)
        .map(c => <CoreView core={c} active={active} />);

interface MemoryViewProps {
    isTarget: boolean;
}

const MemoryView = ({ isTarget }: MemoryViewProps) => {
    const regions = useSelector((state: RootState) =>
        isTarget ? state.app.target.regions : state.app.file.regions
    );
    const isMcuboot = useSelector(getIsMcuboot);
    const isWriting = useSelector(getIsWriting);
    const isErasing = useSelector(getIsErasing);
    const isLoading = useSelector(getIsLoading);
    const isProtected = !!useSelector(getDeviceInfo)?.cores.find(
        c => c.protectionStatus !== nrfdl.NRFDL_PROTECTION_STATUS_NONE
    );
    const refreshEnabled = useSelector(getRefreshEnabled);
    const targetCores = useSelector(getDeviceInfo)?.cores as CoreDefinition[];

    const placeHolder =
        isTarget && isLoading
            ? // When it is target and during loading, show something.
              [<CoreView width={1} striped active core={targetCores[0]} />]
            : // When it is target and during writing, show file regions active.
              // : convertRegionsToViews(regions, targetSize, isTarget && isWriting, targetFicrBaseAddr);
              convertCoresToViews(targetCores, regions, isTarget && isWriting);
    return placeHolder.map((coreView, index) => (
        <React.Fragment key={index.toString()}>
            <div
                className="core-container"
                style={{
                    flex: coreView.props.core.romSize,
                }}
            >
                {coreView}
                {isTarget && isErasing && (
                    <div className="erase-indicator striped active" />
                )}
                {isTarget && refreshEnabled && (
                    <div className="centering-container">
                        {!isProtected && (
                            <div className="read-indicator">
                                <p>Device is connected</p>
                                <p>
                                    Press <strong>READ</strong> button to read
                                    the memory
                                </p>
                            </div>
                        )}
                        {isProtected && (
                            <div className="read-indicator">
                                <p>Device is protected</p>
                                <p>
                                    Press <strong>Erase all</strong> button to
                                    recover the protected memory
                                </p>
                            </div>
                        )}
                    </div>
                )}
                {isTarget && isMcuboot && (
                    <div className="centering-container">
                        <div className="read-indicator">
                            <p>Device is connected</p>
                            <p>Memory layout is not available via MCUboot</p>
                        </div>
                    </div>
                )}
            </div>
        </React.Fragment>
    ));
};

MemoryView.propTypes = {
    isTarget: PropTypes.bool.isRequired,
};

export default MemoryView;
