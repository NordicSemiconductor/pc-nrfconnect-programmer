import './ColorOverview';

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getElf } from '../reducers/fileReducer';
import { getResolution } from '../reducers/userInputReducer';
import { colors } from './Colors';
import SectionInfoView from './SectionInfoView';

import '../../resources/css/canvas.scss';

const Canvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [c, setContext] = useState<CanvasRenderingContext2D | null>(null); // Why could this be |null ?

    const [canvasWidth, setCanvasWidth] = useState(300);
    const [canvasHeight, setCanvasHeight] = useState(300);

    const [mousePos, setMousePos] = useState({ x: -1, y: -1 });
    const [sectionNumber, setSectionNumber] = useState(0);
    const sectionColors = Object.values(colors).slice(1);

    const resolution = useSelector(getResolution); // Exponent of boxMemorySize. Range is all ints from 8 to 16 (inclusive)
    const boxMemorySize = 2 ** resolution; // Ex. 1024 (Bytes)
    const boxDisplaySize = Math.floor(16 * Math.sqrt(2) ** (resolution - 12)); // Box size in px

    const elf = useSelector(getElf); // Gets all info about the elf-file
    const sections = elf.body.sections.slice(1); // First section is null, so it's discarded. This might not be the case for every elf-file...
    const sectionMap: number[][] = initializeSectionMap();

    const numBoxes = getNumBoxes();
    const boxesPerRow = Math.floor(canvasWidth / boxDisplaySize);
    const rows = Math.ceil(numBoxes / boxesPerRow);

    const rowBoxSize: number[] = [];
    initializeRowBoxSize();
    const maxBoxSize = rowBoxSize.reduce((a, b) => Math.max(a, b), 0);

    // Used to align boxes with rightmost border
    function initializeRowBoxSize() {
        if (!canvasWidth) {
            return;
        }

        for (let i = 0; i < boxesPerRow; i += 1) {
            rowBoxSize[i] = boxDisplaySize;
        }

        // Round robin increment box sizes until total size matches element width
        let i = 0;
        while (rowBoxSize.reduce((a, b) => a + b, 0) < canvasWidth + 1) {
            rowBoxSize[i % boxesPerRow] += 1;
            i += 1;
        }
        return -1; // Outside sectionMap
    }

    function getSectionNumberByGridPosition(
        x: number,
        y: number,
        sectionMap: number[][]
    ) {
        if (x >= boxesPerRow || y >= rows) {
            return -1;
        }

        // Keep these two ifs separate to prevent an error if sectionMap[y] already is undefined
        if (sectionMap[y] === undefined) {
            return -1;
        }
        if (sectionMap[y][x] === undefined) {
            return -1;
        }
        return sectionMap[y][x];
    }

    /**
     * Round robin color picker from "Material supplementary colors"
     * as defined in the application design guide.
     * Undefined sections get a white color.
     *
     * @param {number} sectionNumber Color generation seed > 0.
     * @returns {string} Color in form "#rrggbb". Example: "#F44336".
     */
    function getColorBySectionNumber(sectionNumber: number): string {
        if (!(sectionNumber >= 0 && sectionNumber < sections.length)) {
            return '#FFFFFF';
        }
        const index = sectionNumber % sectionColors.length;
        const color = sectionColors[index];

        return color;
    }

    const handleOnMouseMove = (
        event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const rect = canvasRef.current?.getBoundingClientRect();

        if (rect) {
            const yGlobal =
                event.clientY -
                canvasRef.current?.parentElement?.getBoundingClientRect().top;
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            setMousePos({
                x,
                y: yGlobal,
            });
            updateTooltipUpper();
            updateSectionNumber(x, y);
        }
    };

    function updateSectionNumber(x: number, y: number) {
        const gridY = Math.floor(y / maxBoxSize);
        for (let gridX = 0; gridX < rowBoxSize.length; gridX += 1) {
            x -= rowBoxSize[gridX];
            if (x < 0) {
                setSectionNumber(
                    getSectionNumberByGridPosition(gridX, gridY, sectionMap)
                );

                break;
            }
        }
    }

    function getNumBoxes() {
        let numBoxes = 0;
        for (let i = 0; i < sections.length; i += 1) {
            numBoxes += Math.ceil(sections[i].size / boxMemorySize);
        }
        return numBoxes;
    }

    function initializeSectionMap() {
        const numBoxes = getNumBoxes();
        const boxesPerRow = Math.floor(canvasWidth / boxDisplaySize);
        const rows = Math.ceil(numBoxes / boxesPerRow);

        // This makes everything so much easier
        const newSectionMap: number[][] = []; // 2d array for storing section numbers

        let sectionNumber = 0;
        let sectionRemainingSize = sections[sectionNumber].size;

        // Fill the displayBoxes-array with data
        for (let y = 0; y < rows; y += 1) {
            newSectionMap[y] = [];
            for (let x = 0; x < boxesPerRow; x += 1) {
                if (sectionRemainingSize >= 0) {
                    // Here is where the extra "inflated" box memory size comes from
                    sectionRemainingSize -= boxMemorySize;

                    // It's also possible to just draw each box here... 🤔
                    newSectionMap[y].push(sectionNumber);
                }
                if (sectionRemainingSize < 0) {
                    sectionNumber += 1;
                    // Go to next section, if it exists
                    if (!sections[sectionNumber]) {
                        break;
                    }
                    sectionRemainingSize = Math.max(
                        sections[sectionNumber].size,
                        0
                    ); // Set to 1 if empty
                }
            }
        }

        return newSectionMap;
    }

    async function drawBoxes() {
        // Await async is used here because it prevents blinking/flashing when redrawing
        const sectionMap = await initializeSectionMap();

        // Actually draw all the boxes
        if (c) {
            for (let y = 0; y < rows; y += 1) {
                for (let x = 0; x < boxesPerRow; x += 1) {
                    if (sectionMap[y][x] === undefined) {
                        break;
                    }

                    c.fillStyle = getColorBySectionNumber(sectionMap[y][x]);
                    c.fillRect(
                        rowBoxSize.slice(0, x).reduce((a, b) => a + b, 0),
                        y * maxBoxSize,
                        rowBoxSize[x],
                        maxBoxSize
                    );
                    drawBoxBorders(x, y, sectionMap);
                }
            }
        }
    }

    function drawBoxBorders(x: number, y: number, sectionMap: number[][]) {
        if (c) {
            const xPos = rowBoxSize.slice(0, x).reduce((a, b) => a + b, 0);
            const width = rowBoxSize[x];
            const height = maxBoxSize;

            c.beginPath();
            c.save();
            c.translate(-0.5, -0.5);
            c.strokeStyle = 'black';

            if (
                getSectionNumberByGridPosition(x, y, sectionMap) !==
                getSectionNumberByGridPosition(x, y + 1, sectionMap)
            ) {
                // Bottom border
                c.moveTo(xPos, (y + 1) * height);
                c.lineTo(xPos + width, (y + 1) * height);
            }
            if (
                getSectionNumberByGridPosition(x, y, sectionMap) !==
                getSectionNumberByGridPosition(x + 1, y, sectionMap)
            ) {
                // Right border
                c.moveTo(xPos + width, y * height);
                c.lineTo(xPos + width, (y + 1) * height);
            }

            // Leftmost and topmost borders only need to be drawn once, as they are contiguous

            c.restore();
            c.stroke();
        }
    }

    useEffect(() => {
        setCanvasWidth(canvasRef.current?.parentElement?.clientWidth - 2);
        setCanvasHeight(rows * maxBoxSize - 1);
        const resizeListener = () => {
            setCanvasWidth(canvasRef.current?.parentElement?.clientWidth - 2);
            setCanvasHeight(rows * maxBoxSize - 1);
        };
        window.addEventListener('resize', resizeListener);
        return () => {
            window.removeEventListener('resize', resizeListener);
        };
    }, [rows, maxBoxSize]);

    useEffect(() => {
        if (canvasRef.current) {
            const renderCtx = canvasRef.current.getContext('2d');

            if (renderCtx) {
                setContext(renderCtx);
            }
        }
        if (!c || !elf) {
            return;
        }
        if (canvasWidth < maxBoxSize + 1) {
            return;
        }

        // Draws a background
        c.beginPath();
        c.fillStyle = 'rgb(255, 255, 255)';
        c.fillRect(0, 0, canvasWidth, canvasHeight);

        drawBoxes();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [c, elf, resolution, canvasHeight, canvasWidth]);

    const ref = useRef(null);
    const [show, setShow] = useState(false);
    const [tooltipUpper, setTooltipUpper] = useState(false);
    const updateTooltipUpper = () => {
        setTooltipUpper(mousePos.y > window.innerHeight / 3);
    };
    const toggleShow = () => {
        setShow(!show);
    };

    return (
        // This should be in it's own CSS file
        <div className="canvas-container">
            <canvas
                id="canvas"
                onMouseMove={handleOnMouseMove}
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onPointerEnter={toggleShow}
                onPointerLeave={toggleShow}
            />

            {
                // All of this should preferably be in the sectionInfoView component
                sectionNumber >= 0 && show && (
                    <div
                        ref={ref}
                        style={{
                            position: 'absolute',
                            left: mousePos.x + 20,
                            top: tooltipUpper
                                ? mousePos.y -
                                  (ref.current ? ref.current.clientHeight : 0) +
                                  58
                                : mousePos.y + 60,
                            width: 'fit-content',
                            height: 'fit-content',
                            pointerEvents: 'none',
                            backgroundColor: 'white',
                            background: tooltipUpper
                                ? `linear-gradient(45deg, ${
                                      // Top left
                                      getColorBySectionNumber(sectionNumber)
                                  } 20px, #FFFFFF 21px)`
                                : `linear-gradient(135deg, ${
                                      // Top left
                                      getColorBySectionNumber(sectionNumber)
                                  } 20px, #FFFFFF 21px)`,
                            zIndex: 2,
                            padding: '5px 20px',
                            border: '1px solid grey',
                        }}
                    >
                        <SectionInfoView
                            name={sections[sectionNumber].name}
                            type={sections[sectionNumber].type}
                            startAddress={sections[sectionNumber].off}
                            sectionSize={sections[sectionNumber].size}
                            flags={sections[sectionNumber].flags}
                        />
                    </div>
                )
            }
        </div>
    );
};
export default Canvas;
