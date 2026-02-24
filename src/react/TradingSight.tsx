import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { OHLC } from '../core/types';
import { Chart } from '../core/Chart';

/**
 * Props for the TradingSight React component
 */
export interface TradingSightProps {
  /** OHLC data array */
  data: OHLC[];
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Callback for zoom changes */
  onZoom?: (zoom: number) => void;
  /** Callback for pan changes */
  onPan?: (offset: number) => void;
  /** Initial zoom level */
  initialZoom?: number;
  /** Initial horizontal offset */
  initialOffset?: number;
}

/**
 * High-performance React container for the TradingSight charting engine
 * Uses minimal React overhead - only for DOM mounting and prop management
 */
export const TradingSight: React.FC<TradingSightProps> = ({
  data,
  width = 800,
  height = 400,
  onZoom,
  onPan,
  initialZoom = 10,
  initialOffset = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  // Memoize chart creation to avoid recreation on every render
  const chart = useMemo(() => {
    if (!canvasRef.current) return null;
    
    const chartInstance = new Chart(
      canvasRef.current,
      data,
      { width, height }
    );
    
    chartInstance.setZoom(initialZoom);
    chartInstance.setOffset(initialOffset);
    
    return chartInstance;
  }, [width, height, initialZoom, initialOffset]);

  // Initialize chart when component mounts
  useEffect(() => {
    if (chart) {
      chartRef.current = chart;
      chart.start();
    }

    return () => {
      if (chart) {
        chart.destroy();
        chartRef.current = null;
      }
    };
  }, [chart]);

  // Update data when props change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setData(data);
    }
  }, [data, chart]);

  // Handle zoom and pan events
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    
    if (!chartRef.current) return;

    const delta = event.deltaY;
    const currentZoom = chartRef.current.getZoom();
    const newZoom = Math.max(1, Math.min(100, currentZoom + (delta * 0.01)));
    
    chartRef.current.setZoom(newZoom);
    onZoom?.(newZoom);
  }, [onZoom]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current['canvas'].getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Simple panning logic - could be enhanced with drag detection
    const offset = chartRef.current.getOffset();
    const newOffset = offset + (event.movementX || 0);
    
    chartRef.current.setOffset(newOffset);
    onPan?.(newOffset);
  }, [onPan]);

  const handleMouseDown = useCallback(() => {
    // Add mouse down handling if needed for drag-to-pan
    document.addEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleWheel, handleMouseDown, handleMouseUp, handleMouseMove]);

  return (
    <div style={{ width, height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          cursor: 'crosshair'
        }}
        aria-label="Trading chart"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          fontSize: '12px',
          color: '#ccc',
          padding: '5px'
        }}
      >
        {chartRef.current && (
          <div>
            Zoom: {chartRef.current.getZoom().toFixed(2)} | 
            Offset: {chartRef.current.getOffset().toFixed(0)} |
            Visible: {chartRef.current.getVisibleRange().startIndex} - {chartRef.current.getVisibleRange().endIndex}
          </div>
        )}
      </div>
    </div>
  );
};

// Default export for backward compatibility
export default TradingSight;