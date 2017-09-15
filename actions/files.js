import { readFile, stat } from 'fs';
import { basename } from 'path';
import electron from 'electron';
import { logger } from 'nrfconnect/core';
import { hexToArrays } from 'nrf-intel-hex';
import hexpad from '../hexpad';

function displayFileError(err, dispatch) {
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
            displayFileError(err, dispatch);
            return;
        }

//         const fileModTime = stats.fileModTime;

        readFile(filename, {}, (err2, data) => {
            logger.info('Parsing .hex file: ', filename);
            logger.info('File was last modified at ', stats.mtime.toLocaleString() );
            if (err2) {
                displayFileError(err2, dispatch);
                return;
            }

            let blocks;
            try {
                blocks = hexToArrays(data.toString());
            } catch (ex) {
                displayFileError(ex, dispatch);
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
                fileLoadTime: new Date(),
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


export function refreshAllFiles(fileLoadTimes) {
    return dispatch=>{

        Array.from(fileLoadTimes.entries()).forEach(([filename, loadTime])=>{

            stat(filename, (err, stats)=>{
                if (err) {
                    displayFileError(err, dispatch);
                    return;
                }

                if (loadTime.getTime() < stats.mtime) {
                    console.log('Reloading: ', filename);
                    parseOneFile(filename, dispatch);
                } else {
                    console.log('Does not need to be reloaded: ', filename);
                }
            });
        });

        if (false) {
            parseOneFile(filename, dispatch);
        }



    }
}

