
/* Copyright (c) 2015 - 2017, Nordic Semiconductor ASA
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
import PropTypes from 'prop-types';
import { Glyphicon, Button, ProgressBar, Panel, Alert } from 'react-bootstrap';


class FantasyView extends React.Component {


    render() {
        return (
            <div className="juhuu">
                <Alert bsStyle="danger hide" className="myWarning">
                    <strong>Holy guacamole!</strong> Your memory is overlapping. Ordering lobotomy.
                </Alert>
                <div className="container">
                    <div className="fantasy-view-layout item">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">Device</h3>
                            </div>
                            <div className="panel-body">
                                <ProgressBar>
                                    <ProgressBar active bsStyle="primary" now={2} key={1} />
                                    <ProgressBar active bsStyle="danger" now={0.2} key={2} />
                                    <ProgressBar active bsStyle="primary" now={2} key={3} />
                                    <ProgressBar active bsStyle="danger" now={0.2} key={4} />     
                                    <ProgressBar active bsStyle="primary" now={2} key={5} />
                                    <ProgressBar active bsStyle="danger" now={0.2} key={6} /> 
                                    <ProgressBar active bsStyle="primary" now={2} key={7} />
                                    <ProgressBar active bsStyle="danger" now={0.2} key={8} /> 
                                    <ProgressBar bsStyle="warning" now={20} key={9} />                               
                                    <ProgressBar active bsStyle="primary" now={20} key={10} />
                                </ProgressBar>
                            </div>
                        </div>
                    </div>
                    <div className="spacer"></div>
                    <div className="fantasy-view-layout item">
                    <div className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">File</h3>
                            </div>
                            <div className="panel-body">
                                <ProgressBar>
                                    <ProgressBar bsStyle="primary" now={2} key={1} />
                                    <ProgressBar bsStyle="danger" now={0.2} key={2} />
                                    <ProgressBar bsStyle="primary" now={2} key={3} />
                                    <ProgressBar bsStyle="danger" now={0.2} key={4} />     
                                    <ProgressBar bsStyle="primary" now={2} key={5} />
                                    <ProgressBar bsStyle="danger" now={0.2} key={6} /> 
                                    <ProgressBar bsStyle="primary" now={2} key={7} />
                                    <ProgressBar bsStyle="danger" now={0.2} key={8} /> 
                                    <ProgressBar bsStyle="warning" now={20} key={9} />                               
                                    <ProgressBar bsStyle="primary" now={20} key={10} />
                                </ProgressBar>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

FantasyView.propTypes = {

};

FantasyView.defaultProps = {

};

export default FantasyView;

