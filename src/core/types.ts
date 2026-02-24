/**
 * OHLC data point for financial charting
 */
export interface OHLC {
  /** Timestamp in milliseconds since epoch */
  time: number;
  /** Opening price */
  open: number;
  /** Highest price during the period */
  high: number;
  /** Lowest price during the period */
  low: number;
  /** Closing price */
  close: number;
}

/**
 * Canvas dimensions
 */
export interface CanvasDimensions {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
}

/**
 * Visible range of data indices
 */
export interface VisibleRange {
  /** Starting index of visible data */
  startIndex: number;
  /** Ending index of visible data */
  endIndex: number;
}

/**
 * Price range for visible data
 */
export interface PriceRange {
  /** Minimum price in visible range */
  min: number;
  /** Maximum price in visible range */
  max: number;
}

/**
 * Chart state for zoom and pan
 */
export interface ChartState {
  /** Zoom level in pixels per candle */
  zoom: number;
  /** Horizontal offset in pixels */
  offset: number;
  /** Vertical offset in pixels (for price panning) */
  priceOffset: number;
  /** Canvas dimensions */
  canvasDimensions: CanvasDimensions;
}

/**
 * Replay state for market replay functionality
 */
export interface ReplayState {
  /** Current tick index (playhead position) */
  currentTickIndex: number;
  /** Playback speed in milliseconds between updates */
  playbackSpeed: number;
  /** Whether playback is paused */
  isPaused: boolean;
}

/**
 * Interaction state for mouse events
 */
export interface InteractionState {
  /** Whether panning is active */
  isPanning: boolean;
  /** Whether zooming is active */
  isZooming: boolean;
  /** Last mouse X position */
  lastMouseX: number;
  /** Last mouse Y position */
  lastMouseY: number;
  /** X coordinate of zoom anchor point */
  zoomAnchorX: number;
}

/**
 * Trade interface representing a single position
 */
export interface Trade {
  /** Unique identifier for the trade */
  id: string;
  /** Trade type: buy or sell */
  type: 'buy' | 'sell';
  /** Entry price */
  entryPrice: number;
  /** Stop loss price */
  sl: number;
  /** Take profit price */
  tp: number;
  /** Trade size/lot size */
  size: number;
  /** Entry timestamp */
  entryTime: number;
  /** Exit timestamp (if closed) */
  exitTime?: number;
  /** Exit price (if closed) */
  exitPrice?: number;
  /** Trade status */
  status: 'open' | 'stopped' | 'taken';
  /** Current unrealized P&L */
  unrealizedPnL: number;
  /** Realized P&L (if closed) */
  realizedPnL?: number;
}

/**
 * Trade event types for event emission
 */
export enum TradeEventType {
  TRADE_OPENED = 'TRADE_OPENED',
  TRADE_CLOSED = 'TRADE_CLOSED',
  PNL_UPDATED = 'PNL_UPDATED'
}

/**
 * Trade event interface for event emission
 */
export interface TradeEvent {
  type: TradeEventType;
  trade: Trade;
  timestamp: number;
}

/**
 * Callback function type for trade events
 */
export type TradeEventCallback = (event: TradeEvent) => void;

/**
 * Configuration for the BrokerEngine
 */
export interface BrokerConfig {
  /** Starting capital */
  initialBalance: number;
  /** Risk per trade as percentage of balance */
  riskPerTrade?: number;
  /** Default lot size */
  defaultLotSize?: number;
  /** Minimum stop loss distance in points */
  minSLDistance?: number;
  /** Maximum number of open positions */
  maxOpenPositions?: number;
}
