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
    stat(filename, (err, stats) => {
        if (err) {
            displayFileError(err, dispatch);
            return;
        }

//         const fileModTime = stats.fileModTime;

        readFile(filename, {}, (err2, data) => {
            logger.info('Parsing .hex file: ', filename);
            logger.info('File was last modified at ', stats.mtime.toLocaleString());
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
//             console.log('Files selected: ', filenames);

            for (const filename of filenames) {
                parseOneFile(filename, dispatch);
            }
        });
    };
}

export function openFile(filename) {
    return dispatch => {
        parseOneFile(filename, dispatch);
    };
}


export function refreshAllFiles(fileLoadTimes) {
    return dispatch => Promise.all(Array.from(fileLoadTimes.entries()).map(([filename, loadTime]) => new Promise((res, rej) => {
        stat(filename, (err, stats) => {
            if (err) {
                displayFileError(err, dispatch);
                return rej();
            }

            if (loadTime.getTime() < stats.mtime) {
                logger.info('Reloading: ', filename);
                parseOneFile(filename, (...args) => { dispatch(...args); res(); });
            } else {
                logger.info('Does not need to be reloaded: ', filename);
                res();
            }
        });
    })));
}


// Checks if the files have changed since they were loaded into the programmer UI.
// Will display a message box dialog.
// Expects a Map of filenames to instances of Date when the file was loaded into the UI.
// Returns a promise: it will resolve when the state of the files is known, or reject
// if the user wanted to cancel to manually check the status.
export function checkUpToDateFiles(fileLoadTimes, dispatch) {
    let newestFileTimestamp = -Infinity;

    // Check if files have changed since they were loaded
    return Promise.all(Array.from(fileLoadTimes.entries()).map(([filename, loadTime]) => new Promise((res) => {
        stat(filename, (err, stats) => {
            if (loadTime.getTime() < stats.mtime) {
                newestFileTimestamp = Math.max(newestFileTimestamp, stats.mtime);
                res(filename);
            } else {
                res();
            }
        });
    }))).then(filenames => filenames.filter(i => !!i)).then(filenames =>
        if (filenames.length === 0) {
            // Resolve inmediately: no files were changed
            return;
        }

         new Promise((res, rej) => {
             const lastLoaded = (new Date(newestFileTimestamp)).toLocaleString();

             electron.remote.dialog.showMessageBox({
                 type: 'warning',
                 buttons: [
                     `Use old version (prior to ${lastLoaded})`,
                     'Reload all files and proceed',
                     'Cancel',
                 ],
                 message: `The following files have changed on disk since they were last loaded:\n${
                    filenames.join('\n')}`,
             }, button => {
                 if (button === 0) { // Use old version
                     return res();
                 } else if (button === 1) { // Reload
                     return refreshAllFiles(fileLoadTimes)(dispatch).then(res);
                 } else if (button === 2) { // Cancel
                     return rej();
                 }
             });
         }));
}

