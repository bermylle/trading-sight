# Trading Sight - High-Performance Charting Engine

A modern, Canvas-based charting engine designed for market replay and financial data visualization. Built with TypeScript for maximum performance and maintainability.

## 🚀 Features

- **High Performance**: Canvas 2D API with 60 FPS target rendering
- **Smart Data Processing**: Only processes visible data for optimal performance
- **Coordinate System**: Advanced coordinate mapping with zoom and pan support
- **Modular Architecture**: Clean separation between core engine and React integration
- **TypeScript**: Full type safety and excellent developer experience
- **Vite Build**: Modern tooling with fast development server

## 🏗️ Architecture

### Core Components

1. **CoordinateManager** - The "brain" of the engine
   - Handles coordinate mapping (price ↔ pixel, time ↔ pixel)
   - Manages zoom, pan, and canvas dimensions
   - Calculates visible data ranges and min/max prices
   - Performance optimized for large datasets

2. **Chart** - Canvas renderer with requestAnimationFrame loop
   - Manages the rendering pipeline
   - Handles canvas setup and responsive behavior
   - Draws background, grid, axis labels, and candles
   - Performance monitoring (FPS tracking)

3. **CandlePainter** - Proof of concept candle rendering
   - Demonstrates how to draw candlesticks using CoordinateManager
   - Can be extended for different chart types

4. **React Integration** - Minimal React wrapper
   - Only used for DOM mounting and prop management
   - Core rendering logic remains pure TypeScript + Canvas

## 📊 Coordinate System

The engine implements a sophisticated coordinate system:

### Price to Y Mapping
```typescript
Y_pixel = Height - ((Price - Min) / (Max - Min)) * Height
```

### Time to X Mapping
```typescript
X_pixel = (Index * Zoom) - Offset
```

### Key Features
- **Visible Range Calculation**: Only processes data currently visible on screen
- **Dynamic Min/Max**: Recalculates price range based on visible data only
- **Zoom & Pan**: Smooth interaction with scroll and drag controls

## 🛠️ Installation

Since Node.js/npm is not available in this environment, the project structure is ready for:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
trading-sight/
├── src/
│   ├── core/                 # Core charting engine
│   │   ├── CoordinateManager.ts  # Coordinate mapping logic
│   │   ├── Chart.ts              # Canvas renderer
│   │   ├── CandlePainter.ts      # Candle drawing logic
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── index.ts              # Core exports
│   ├── react/                # React integration
│   │   ├── TradingSight.tsx      # React component
│   │   └── index.ts              # React exports
│   ├── main.tsx              # Demo application
│   └── index.ts              # Main library exports
├── demo/
│   └── index.html            # Standalone demo (no build required)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Usage

### Core Engine (Pure TypeScript)
```typescript
import { CoordinateManager, Chart } from './src/core';

// Create coordinate manager
const coordinateManager = new CoordinateManager(data, { width: 800, height: 400 });

// Create chart renderer
const chart = new Chart(canvasElement, data, { width: 800, height: 400 });

// Start rendering
chart.start();

// Handle interactions
chart.setZoom(15);
chart.setOffset(100);
```

### React Component
```typescript
import { TradingSight } from './src/react';

function App() {
  return (
    <TradingSight
      data={ohlcData}
      width={1000}
      height={500}
      onZoom={(zoom) => console.log('Zoom:', zoom)}
      onPan={(offset) => console.log('Offset:', offset)}
    />
  );
}
```

## 🧪 Demo

Open `demo/index.html` in any modern browser to see the engine in action:

- **Controls**: Scroll to zoom, click and drag to pan
- **Performance**: Real-time FPS monitoring
- **Data**: 2000 sample OHLC candles
- **Features**: Grid lines, axis labels, candlestick rendering

## 📈 Performance Characteristics

- **60 FPS Target**: Optimized rendering loop
- **Visible Data Only**: Never processes more data than what's on screen
- **Efficient Coordinate Mapping**: O(1) price/time to pixel conversion
- **Memory Efficient**: No data duplication, minimal object creation
- **Responsive**: Automatic canvas resizing and DPI handling

## 🔧 Development

### Building the Project
```bash
npm run build
```

### Development Server
```bash
npm run dev
```

### TypeScript Configuration
- Strict mode enabled
- Modern ES2020 target
- JSX support for React components
- Comprehensive type checking

## 🎨 Design Principles

1. **Performance First**: Canvas 2D API over DOM manipulation
2. **Clean Code**: Following established principles and patterns
3. **Type Safety**: Full TypeScript coverage
4. **Modularity**: Clear separation of concerns
5. **Extensibility**: Easy to add new chart types and features

## 🚀 Future Enhancements

- [ ] Multiple chart types (line, area, bar)
- [ ] Technical indicators (MA, RSI, MACD)
- [ ] Drawing tools (trendlines, annotations)
- [ ] Real-time data streaming
- [ ] Export functionality (PNG, SVG)
- [ ] Advanced interactions (crosshairs, tooltips)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Trading Sight** - Powering the next generation of financial charting applications.