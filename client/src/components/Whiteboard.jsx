import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { HiTrash, HiPencil, HiXMark, HiArrowDownTray } from 'react-icons/hi2';

const COLORS = [
    '#000000', // Black
    '#ef4444', // Red
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#a855f7', // Purple
];

const Whiteboard = ({ socket, roomId, onClose, isGuest }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);

    // Setup canvas size
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Save current content
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvasRef.current.width;
                tempCanvas.height = canvasRef.current.height;
                tempCtx.drawImage(canvasRef.current, 0, 0);

                // Resize
                canvasRef.current.width = width;
                canvasRef.current.height = height;

                // Restore content
                const ctx = canvasRef.current.getContext('2d');
                ctx.drawImage(tempCanvas, 0, 0, width, height); // Stretch to fit new size

                // Reset context props
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size

        return () => window.removeEventListener('resize', handleResize);
    }, [color, lineWidth]);

    // Initialize/Update Context
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
        }
    }, [color, lineWidth]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onDraw = ({ x0, y0, x1, y1, color, width }) => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                const w = canvasRef.current.width;
                const h = canvasRef.current.height;

                const prevStyle = ctx.strokeStyle;
                const prevWidth = ctx.lineWidth;

                ctx.strokeStyle = color;
                ctx.lineWidth = width;

                ctx.beginPath();
                ctx.moveTo(x0 * w, y0 * h);
                ctx.lineTo(x1 * w, y1 * h);
                ctx.stroke();
                ctx.closePath();

                // Restore
                ctx.strokeStyle = prevStyle;
                ctx.lineWidth = prevWidth;
            }
        };

        const onClear = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        };

        const onHistory = (history) => {
            if (Array.isArray(history)) {
                history.forEach(action => onDraw(action));
            }
        }

        socket.on('whiteboard:draw', onDraw);
        socket.on('whiteboard:clear', onClear);
        socket.on('whiteboard:history', onHistory);

        // Request history on open
        socket.emit('whiteboard:request-history');

        return () => {
            socket.off('whiteboard:draw', onDraw);
            socket.off('whiteboard:clear', onClear);
            socket.off('whiteboard:history', onHistory);
        };
    }, [socket]);

    const getCoords = (e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) / rect.width, // Normalize 0-1
            y: (clientY - rect.top) / rect.height
        };
    };

    const startDrawing = (e) => {
        if (isGuest) return; // Guests can represent? Maybe view only
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        lastPos.current = { x, y };
    };

    const lastPos = useRef({ x: 0, y: 0 });

    const draw = (e) => {
        if (!isDrawing || isGuest) return;
        e.preventDefault(); // Prevent scrolling on touch

        const { x, y } = getCoords(e);
        const { x: lastX, y: lastY } = lastPos.current;

        // Draw locally
        const ctx = canvasRef.current.getContext('2d');
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;

        ctx.beginPath();
        ctx.moveTo(lastX * w, lastY * h);
        ctx.lineTo(x * w, y * h);
        ctx.stroke();
        ctx.closePath();

        // Emit
        socket?.emit('whiteboard:draw', {
            roomId,
            x0: lastX,
            y0: lastY,
            x1: x,
            y1: y,
            color,
            width: lineWidth
        });

        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearBoard = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        socket?.emit('whiteboard:clear', { roomId });
    };

    const downloadBoard = () => {
        const link = document.createElement('a');
        link.download = `whiteboard-${new Date().toISOString()}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <HiPencil className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-gray-800">Jamboard</h3>
                        {isGuest && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">View Only</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={downloadBoard} title="Save as Image">
                            <HiArrowDownTray className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <HiXMark className="w-6 h-6 text-gray-600" />
                        </Button>
                    </div>
                </div>

                {/* Canvas Container */}
                <div ref={containerRef} className="flex-1 bg-white relative cursor-crosshair touch-none">
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 block w-full h-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                {/* Toolbar */}
                {!isGuest && (
                    <div className="bg-gray-50 border-t p-3 flex flex-wrap items-center justify-center gap-4">
                        {/* Colors */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>

                        {/* Line Width */}
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border shadow-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full bg-gray-800 cursor-pointer ${lineWidth === 3 ? 'opacity-100' : 'opacity-40'}`}
                                    onClick={() => setLineWidth(3)}
                                />
                                <div
                                    className={`w-3 h-3 rounded-full bg-gray-800 cursor-pointer ${lineWidth === 6 ? 'opacity-100' : 'opacity-40'}`}
                                    onClick={() => setLineWidth(6)}
                                />
                                <div
                                    className={`w-4 h-4 rounded-full bg-gray-800 cursor-pointer ${lineWidth === 10 ? 'opacity-100' : 'opacity-40'}`}
                                    onClick={() => setLineWidth(10)}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={clearBoard}
                            className="rounded-full shadow-sm"
                        >
                            <HiTrash className="w-4 h-4 mr-1.5" />
                            Clear
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Whiteboard;
