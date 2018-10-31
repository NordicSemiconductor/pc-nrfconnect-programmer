
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
import { Glyphicon, Button, ProgressBar, Popover, Panel, Alert, OverlayTrigger } from 'react-bootstrap';
import RegionBarView from './RegionBarView';

console.log(RegionBarView);

const popover = (
  <Popover id="popover-top" title="Popover right">
    And here's some <strong>amazing</strong> content. It's very engaging. right?
  </Popover>
);



class FantasyView extends React.Component {
    // componentDidMount() {
    //     const pop = document.getElementById('[data-toggle="popover"]');
    //     pop.popover();
    // }
    render() {       
        return (
            <div className="juhuu">
                <Alert bsStyle="warning" className="myWarning hide">
                    <strong>Holy guacamole!</strong> Your memory is overlapping. Ordering lobotomy.
                </Alert>                                                           
                <div className="container">
                <div className="fantasy-view-layout item">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">Device Memory Layout <span className="pull-right glyphicon glyphicon-flash"></span></h3> 
                            </div>
                            <div className="panel-body">
                                {/* <RegionBarView /> */}
                                <div className="centering-container">
                                    <h1><span className="glyphicon glyphicon-flash"></span></h1>
                                    <p>Connect a device to display memory contents</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="fantasy-view-layout item">
                        <div className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">File Memory Layout <span className="pull-right glyphicon glyphicon-folder-open"></span></h3>
                            </div>
                            <div className="panel-body">
                                {/* <RegionBarView /> */}
                                <div className="centering-container">
                                <h1><span className="glyphicon glyphicon-folder-open"></span></h1>
                                    <p>Drag & Drop one or more .hex files here</p>
                                </div>
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

