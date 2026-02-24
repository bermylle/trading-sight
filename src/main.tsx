import React from 'react';
import ReactDOM from 'react-dom/client';
import { TradingSight } from './react';
import type { OHLC } from './core';

// Generate sample OHLC data for testing
const generateSampleData = (count: number = 1000): OHLC[] => {
  const data: OHLC[] = [];
  let price = 100;
  
  for (let i = 0; i < count; i++) {
    const time = Date.now() - (count - i) * 60000; // 1 minute intervals
    const volatility = 0.5 + Math.random() * 1.5;
    
    // Random walk for price
    const change = (Math.random() - 0.5) * volatility;
    price += change;
    
    const open = price;
    const close = price + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    data.push({
      time,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100
    });
  }
  
  return data;
};

const App: React.FC = () => {
  const [data] = React.useState<OHLC[]>(generateSampleData(2000));
  const [zoom, setZoom] = React.useState(10);
  const [offset, setOffset] = React.useState(0);

  const handleZoom = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handlePan = (newOffset: number) => {
    setOffset(newOffset);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Trading Sight - Charting Engine Demo</h1>
      <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        <p>Controls: Scroll to zoom, Click and drag to pan</p>
        <p>Current Zoom: {zoom.toFixed(2)} | Offset: {offset.toFixed(0)}</p>
      </div>
      
      <TradingSight
        data={data}
        width={1000}
        height={500}
        initialZoom={10}
        initialOffset={0}
        onZoom={handleZoom}
        onPan={handlePan}
      />
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        <p>Performance: Canvas-based rendering with 60 FPS target</p>
        <p>Data Points: {data.length} OHLC candles</p>
        <p>Architecture: Pure TypeScript + Canvas 2D API (no React in core rendering)</p>
      </div>
    </div>
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);