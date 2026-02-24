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