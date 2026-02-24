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
  const data = React.useMemo(() => generateSampleData(2000), []);
  const [zoom, setZoom] = React.useState(10);
  const [offset, setOffset] = React.useState(0);

  const handleZoom = React.useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handlePan = React.useCallback((newOffset: number) => {
    setOffset(newOffset);
  }, []);

  const handleReplayStateChange = React.useCallback((state: { currentTickIndex: number; playbackSpeed: number; isPaused: boolean }) => {
    // Handle replay state changes
    console.log('Replay state changed:', state);
  }, []);

  return React.createElement('div', 
    { style: { padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', minHeight: '100vh' } },
    React.createElement('h1', 
      { style: { color: '#00ff00', textAlign: 'center', marginBottom: '10px' } },
      'Trading Sight - Charting Engine Demo'
    ),
    React.createElement('div', 
      { style: { marginBottom: '10px', fontSize: '14px', color: '#666', textAlign: 'center' } },
      React.createElement('p', null, 'Controls: Scroll to zoom, Click and drag to pan, Alt + drag for price panning'),
      React.createElement('p', null, `Current Zoom: ${zoom.toFixed(2)} | Offset: ${offset.toFixed(0)}`)
    ),
    React.createElement(TradingSight, {
      data,
      width: 1000,
      height: 500,
      initialZoom: 10,
      initialOffset: 0,
      enableReplay: true,
      initialReplaySpeed: 1000,
      onZoom: handleZoom,
      onPan: handlePan,
      onReplayStateChange: handleReplayStateChange
    }),
    React.createElement('div', 
      { style: { marginTop: '20px', fontSize: '12px', color: '#888', textAlign: 'center' } },
      React.createElement('p', null, 'Performance: Canvas-based rendering with 60 FPS target'),
      React.createElement('p', null, `Data Points: ${data.length} OHLC candles`),
      React.createElement('p', null, 'Architecture: Pure TypeScript + Canvas 2D API (no React in core rendering)'),
      React.createElement('p', null, 'Features: Zoom-to-cursor, Fog of War, Ghost Candles, Dirty Flag Optimization')
    )
  );
};

// Error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', 
        { style: { padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' } },
        React.createElement('h2', { style: { color: '#ff0000' } }, 'Something went wrong'),
        React.createElement('p', null, this.state.error?.message),
        React.createElement('button', 
          { 
            onClick: () => window.location.reload(),
            style: {
              padding: '10px 20px',
              backgroundColor: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          },
          'Reload Page'
        )
      );
    }

    return this.props.children;
  }
}

// Render the app with error boundary
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(ErrorBoundary, null,
      React.createElement(App, null)
    )
  );
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback UI
  const fallbackElement = document.createElement('div');
  fallbackElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; text-align: center;">
      <h2 style="color: #ff0000;">Application Error</h2>
      <p>Failed to load the Trading Sight application.</p>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #00ff00; color: #000; border: none; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
  document.body.appendChild(fallbackElement);
}
