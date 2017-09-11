import React from 'react';
import PropTypes from 'prop-types';

// import { overlapBlockSets } from 'nrf-intel-hex';

// Colours from:
// https://github.com/d3/d3-scale-chromatic
// https://github.com/d3/d3-scale-chromatic/blob/master/src/categorical/Dark2.js

// const colours = [
//     "#1b9e77",
//     "#d95f02",
//     "#7570b3",
//     "#e7298a",
//     "#66a61e",
//     "#e6ab02",
//     "#a6761d",
//     "#666666"
// ];

/* eslint no-param-reassign: "off" */
function drawFileLegend(container, fileColours) {
    console.log('drawFileLegend', container, fileColours);

    if (!container) { return; }

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    container.style.width = '15em'; // DEBUG
    container.style.wordBreak = 'break-all';

    for (const [filename, colour] of fileColours) {
        const label = document.createElement('td');
        const legend = document.createElement('tr');
        const colourCell = document.createElement('td');
        const colourSquare = document.createElement('div');

        colourSquare.style.width = '1.5em';
        colourSquare.style.height = '1.5em';
        colourSquare.style.display = 'inline-block';
        colourSquare.style.background = colour;
        colourSquare.style.float = 'left';
        colourSquare.style.marginRight = '0.2em';

        label.innerText = filename.replace(/\.hex$/, '');

        legend.style.borderBottom = '1px #dedede solid';

        colourCell.append(colourSquare);
        legend.append(colourCell);
        legend.append(label);
        container.append(legend);
    }
}


const FileLegend = props => {
    const { fileColours } = props;
/*
    if (fileError) {
        return (
            <div>{ fileError }</div>
        );
    } */

    return (
        <table
            ref={el => { drawFileLegend(el, fileColours); }}
            style={{
                marginTop: '1em',
                marginBottom: '1em',
            }}
        />
    );
};

FileLegend.propTypes = {
    fileColours: PropTypes.instanceOf(Map),
};

FileLegend.defaultProps = {
    fileColours: new Map(),
};

export default FileLegend;
