# Virtual Brokerage and Order Execution Layer

This document describes the implementation of the Virtual Brokerage and Order Execution layer for Trading Sight, which provides a complete virtual trading system for market replay scenarios.

## Overview

The Virtual Brokerage system consists of several key components that work together to provide a realistic trading experience during market replay:

- **BrokerEngine**: Core virtual brokerage engine for managing trades
- **TradePainter**: Canvas-based renderer for trade visualization
- **useBroker**: React hook for state management
- **ReplayController Integration**: Event-driven integration with market replay

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ReplayController   │    │   TradePainter   │    │   useBroker     │
│                     │    │                  │    │                 │
│ - Emits tick events │    │ - Renders trades │    │ - State mgmt    │
│ - Trade events      │    │ - P&L labels     │    │ - Event handling│
└─────────┬───────────┘    └─────────┬────────┘    └─────────┬───────┘
          │                          │                       │
          │                          │                       │
          ▼                          ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BrokerEngine                                 │
│                                                                 │
│ - Order execution      │ - P&L calculations   │ - SL/TP logic  │
│ - Risk management      │ - Trade lifecycle    │ - Event system │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. BrokerEngine (`src/core/BrokerEngine.ts`)

The core virtual brokerage engine that manages all trading operations.

#### Key Features:
- **Order Management**: Place, close, and manage trades
- **Risk Management**: Position sizing based on risk parameters
- **P&L Calculations**: Real-time and realized P&L tracking
- **SL/TP Logic**: Automatic trade closure on stop loss/take profit
- **Event System**: Trade lifecycle event emission

#### Configuration:
```typescript
interface BrokerConfig {
  initialBalance: number;        // Starting capital
  riskPerTrade?: number;         // Risk per trade (default: 1%)
  defaultLotSize?: number;       // Default position size
  minSLDistance?: number;        // Minimum SL distance
  maxOpenPositions?: number;     // Maximum concurrent positions
}
```

#### Usage:
```typescript
const broker = new BrokerEngine({
  initialBalance: 10000,
  riskPerTrade: 0.01,  // 1% risk per trade
  defaultLotSize: 0.1
});

// Place a new order
const trade = broker.placeOrder('buy', 100.0, 99.5, 101.0, 0.1);

// Update with current market price
broker.update(currentPrice);

// Get current state
const balance = broker.getBalance();
const equity = broker.getEquity();
const openPositions = broker.getOpenPositions();
```

### 2. TradePainter (`src/layers/TradePainter.ts`)

Canvas-based renderer for visualizing trades on the chart.

#### Features:
- **Entry Price Lines**: Solid horizontal lines for entry prices
- **SL/TP Lines**: Dashed lines for stop loss and take profit levels
- **P&L Labels**: Real-time P&L display with pips and currency values
- **Trade Status**: Visual indicators for open/closed trades
- **Summary Panel**: Total unrealized P&L at chart edge

#### Configuration:
```typescript
interface TradePainterConfig {
  entryColor?: string;           // Entry line color (default: white)
  slColor?: string;              // SL line color (default: red)
  tpColor?: string;              // TP line color (default: green)
  labelBackgroundColor?: string; // Label background
  labelTextColor?: string;       // Label text color
  font?: string;                 // Font settings
  lineWidth?: number;            // Line width
  dashPattern?: number[];        // Dash pattern for SL/TP
}
```

#### Usage:
```typescript
const tradePainter = new TradePainter(
  canvas.getContext('2d'),
  coordinateManager,
  {
    entryColor: '#ffffff',
    slColor: '#ff4444',
    tpColor: '#44ff44'
  }
);

// Update and render trades
tradePainter.setCurrentPrice(currentPrice);
tradePainter.draw(trades);
```

### 3. useBroker Hook (`src/hooks/useBroker.ts`)

React hook for integrating the BrokerEngine with React components.

#### Features:
- **State Management**: Automatic state updates via events
- **Derived State**: Calculated values like P&L, margin level
- **Event Handling**: Automatic subscription to trade events
- **Performance Optimized**: Uses refs to prevent stale closures

#### Usage:
```typescript
import { useBroker } from './hooks/useBroker';

function TradingComponent() {
  const {
    balance,
    equity,
    openPositions,
    closedPositions,
    placeOrder,
    closeTrade,
    updatePrice,
    totalUnrealizedPnL,
    marginLevel
  } = useBroker({
    initialBalance: 10000,
    riskPerTrade: 0.01
  });

  const handlePlaceOrder = () => {
    placeOrder('buy', 100.0, 99.5, 101.0, 0.1);
  };

  return (
    <div>
      <div>Balance: ${balance}</div>
      <div>Equity: ${equity}</div>
      <div>Unrealized P&L: ${totalUnrealizedPnL}</div>
      <button onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
}
```

### 4. ReplayController Integration

The ReplayController has been enhanced to emit trade events during market replay.

#### New Methods:
```typescript
// Add trade event listener
replayController.onTradeEvent((event) => {
  console.log('Trade event:', event.type, event.trade);
});

// Emit trade events
replayController.emitTradeEvent({
  type: 'TRADE_CLOSED',
  trade: tradeData,
  timestamp: Date.now()
});
```

## Integration with Chart

The Chart class has been updated to support TradePainter integration:

```typescript
// Set up trade painter
const tradePainter = new TradePainter(context, coordinateManager);
chart.setTradePainter(tradePainter);

// Update trades during replay
chart.updateTrades(openPositions, currentPrice);
```

## Event Flow

1. **Market Replay**: ReplayController ticks through OHLC data
2. **Price Update**: Current price is passed to BrokerEngine
3. **Trade Updates**: BrokerEngine checks SL/TP and updates P&L
4. **Event Emission**: Trade events are emitted for state changes
5. **UI Updates**: React components update via useBroker hook
6. **Visual Updates**: TradePainter renders updated trade positions

## Trade Lifecycle

1. **Order Placement**: `placeOrder()` creates new trade
2. **Price Updates**: `update()` checks SL/TP and calculates P&L
3. **Event Emission**: Trade events notify listeners of changes
4. **Visual Rendering**: TradePainter updates chart display
5. **State Management**: React components update UI

## Risk Management

The BrokerEngine includes built-in risk management:

- **Position Sizing**: Automatically calculates position size based on risk
- **SL Distance**: Validates minimum stop loss distance
- **Position Limits**: Enforces maximum concurrent positions
- **Risk Per Trade**: Configurable risk percentage per trade

## Performance Considerations

- **Dirty Flag Optimization**: TradePainter only re-renders when necessary
- **Event-Driven Updates**: State updates only occur on trade events
- **Canvas Optimization**: Pixel-perfect rendering with minimal redraws
- **Memory Management**: Proper cleanup of event listeners and resources

## Usage Examples

### Basic Setup
```typescript
// 1. Create broker
const broker = new BrokerEngine({ initialBalance: 10000 });

// 2. Create trade painter
const tradePainter = new TradePainter(context, coordinateManager);

// 3. Set up chart integration
chart.setTradePainter(tradePainter);

// 4. Connect replay controller
replayController.onTradeEvent((event) => {
  // Handle trade events
});

// 5. Update during replay
replayController.setOnTickChange((tickIndex) => {
  const currentPrice = data[tickIndex].close;
  broker.update(currentPrice);
  chart.updateTrades(broker.getOpenPositions(), currentPrice);
});
```

### React Integration
```typescript
function TradingChart() {
  const broker = useBroker({ initialBalance: 10000 });
  const [chart, setChart] = useState<Chart | null>(null);

  useEffect(() => {
    if (chart) {
      // Connect broker updates to chart
      broker.getBrokerEngine().onTradeEvent(() => {
        // Chart will auto-update via trade painter
      });
    }
  }, [chart, broker]);

  return <canvas ref={canvasRef} />;
}
```

## Testing

A demo file is provided at `demo/virtual-brokerage-demo.html` that showcases the complete virtual brokerage system in action.

## Future Enhancements

- **Multiple Instruments**: Support for different trading instruments
- **Advanced Order Types**: Limit orders, trailing stops
- **Backtesting**: Historical performance analysis
- **Strategy Integration**: Algorithmic trading strategies
- **Risk Analytics**: Advanced risk metrics and reporting

## Conclusion

The Virtual Brokerage and Order Execution layer provides a complete, realistic trading simulation system that integrates seamlessly with the Trading Sight charting engine. It supports real-time P&L tracking, automatic risk management, and comprehensive event-driven architecture for building sophisticated trading applications.