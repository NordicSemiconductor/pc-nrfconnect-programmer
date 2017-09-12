import { readFile } from 'fs';
import { basename } from 'path';
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import { hexToArrays } from 'nrf-intel-hex';
import hexpad from '../hexpad';

export function openFileDialog() {
    return dispatch => {
        electron.remote.dialog.showOpenDialog(/* window */undefined, {
            title: 'Select a .hex file',
            filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
            properties: ['openFile'],
        }, filenames => {
            console.log('Files selected: ', filenames);

            if (filenames && filenames.length) {
                const filename = filenames[0];
                logger.info('Parsing .hex file: ', filename);
                readFile(filename, {}, (err, data) => {
                    if (err) {
                        const error = `Could not open .hex file: ${err}`;
                        logger.error(error);
                        dispatch({
                            type: 'file-error',
                            fileError: error,
                        });
                        return;
                    }

                    let blocks;
                    try {
                        blocks = hexToArrays(data.toString());
                    } catch (ex) {
                        const error = `Could not parse .hex file: ${ex}`;
                        logger.error(error);
                        dispatch({
                            type: 'file-error',
                            fileError: error,
                        });
                        return;
                    }

                    const addresses = Array.from(blocks.keys());
                    for (let i = 0, l = addresses.length; i < l; i += 1) {
                        const address = addresses[i];
                        const size = blocks.get(address).length;
                        const addressFormatted = hexpad(address);
                        const endAddressFormatted = hexpad(address + size);
                        const sizeFormatted = hexpad(size);

                        logger.info(`Data block: ${addressFormatted}-${endAddressFormatted} (${sizeFormatted}`, ' bytes long)');
                    }

                    dispatch({
                        type: 'file-parse',
                        filename: basename(filename),
                        blocks,
                    });
                });
            }
        });
    };
}

export function loadMRU(dispatch) {
    return function loadMRUClosure(serialNumber) {
        // / FIXME: Should return a Set of filenames
        dispatch({
            type: 'FIXME',
            serialNumber,
        });
    };
}

