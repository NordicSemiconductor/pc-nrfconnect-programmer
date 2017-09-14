import { readFile, stat } from 'fs';
import { basename } from 'path';
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import { hexToArrays } from 'nrf-intel-hex';
import hexpad from '../hexpad';

function displayFileError(err) {
    const error = `Could not open .hex file: ${err}`;
    logger.error(error);
    dispatch({
        type: 'file-error',
        fileError: error,
    });
}

function parseOneFile(filename, dispatch) {
    stat(filename, (err, stats)=>{
        if (err) {
            displayFileError(err);
            return;
        }

//         const fileModTime = stats.fileModTime;

        readFile(filename, {}, (err2, data) => {
            logger.info('Parsing .hex file: ', filename);
            logger.info('File was last modified at ', stats.mtime.toLocaleString() );
            if (err2) {
                displayFileError(err2);
                return;
            }

            let blocks;
            try {
                blocks = hexToArrays(data.toString());
            } catch (ex) {
                displayFileError(ex);
                return;
            }

            // Display some info in the log.
            for (const [address, block] of blocks) {
                const size = block.length;

                logger.info(`Data block: ${hexpad(address)}-${hexpad(address + size)} (${hexpad(size)}`, ' bytes long)');
            }

            dispatch({
                type: 'file-parse',
                filename: basename(filename),
                fullFilename: filename,
                fileModTime: stats.mtime,
                blocks,
            });
        });
    });
}

export function openFileDialog() {
    return dispatch => {
        electron.remote.dialog.showOpenDialog(/* window */undefined, {
            title: 'Select a .hex file',
            filters: [{ name: 'Intel HEX files', extensions: ['hex', 'ihex'] }],
            properties: ['openFile', 'multiSelections'],
        }, filenames => {
            console.log('Files selected: ', filenames);

            for (const filename of filenames) {
                parseOneFile(filename, dispatch);
            }
        });
    };
}

export function openFile(filename) {
    return dispatch=>{
        parseOneFile(filename, dispatch);
    }
}

// export function loadMRU(dispatch) {
//     return function loadMRUClosure(serialNumber) {
//         // / FIXME: Should return a Set of filenames
//         dispatch({
//             type: 'FIXME',
//             serialNumber,
//         });
//     };
// }

