import { OHLC, CanvasDimensions, VisibleRange, PriceRange, ChartState } from './types';

/**
 * The brain of the charting engine
 * Handles coordinate mapping, zoom, pan, and visible data calculations
 */
export class CoordinateManager {
  private data: OHLC[];
  private state: ChartState;

  /**
   * Create a new CoordinateManager
   * @param data OHLC data array
   * @param canvasDimensions Initial canvas dimensions
   * @param zoom Initial zoom level (pixels per candle)
   * @param offset Initial horizontal offset
   */
  constructor(
    data: OHLC[],
    canvasDimensions: CanvasDimensions,
    zoom: number = 10,
    offset: number = 0,
    priceOffset: number = 0
  ) {
    this.data = data;
    this.state = {
      zoom,
      offset,
      priceOffset,
      canvasDimensions
    };
  }

  /**
   * Update the data array
   */
  setData(data: OHLC[]): void {
    this.data = data;
  }

  /**
   * Update canvas dimensions
   */
  setCanvasDimensions(dimensions: CanvasDimensions): void {
    this.state = { ...this.state, canvasDimensions: dimensions };
  }

  /**
   * Update zoom level
   */
  setZoom(zoom: number): void {
    this.state = { ...this.state, zoom };
  }

  /**
   * Update horizontal offset
   */
  setOffset(offset: number): void {
    this.state = { ...this.state, offset };
  }

  /**
   * Update vertical price offset
   */
  setPriceOffset(priceOffset: number): void {
    this.state = { ...this.state, priceOffset };
  }

  /**
   * Get current state
   */
  getState(): ChartState {
    return { ...this.state };
  }

  /**
   * Calculate the visible range of data indices based on current zoom and offset
   * @returns VisibleRange with start and end indices
   */
  getVisibleRange(): VisibleRange {
    const { zoom, offset, canvasDimensions } = this.state;
    
    // Calculate start index based on offset
    const startIndex = Math.floor(offset / zoom);
    
    // Calculate end index based on canvas width
    const endIndex = Math.min(
      startIndex + Math.ceil(canvasDimensions.width / zoom) + 1,
      this.data.length - 1
    );

    return {
      startIndex: Math.max(0, startIndex),
      endIndex: Math.max(0, Math.min(endIndex, this.data.length - 1))
    };
  }

  /**
   * Calculate min/max prices for the currently visible data range
   * This is performance-critical - only processes visible data
   * @returns PriceRange with min and max prices
   */
  getMinMaxPrice(): PriceRange {
    const { startIndex, endIndex } = this.getVisibleRange();
    
    if (startIndex >= this.data.length || endIndex < 0 || startIndex > endIndex) {
      return { min: 0, max: 100 }; // Fallback range
    }

    let min = Infinity;
    let max = -Infinity;

    // Only iterate through visible data for performance
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.data[i];
      if (candle.low < min) min = candle.low;
      if (candle.high > max) max = candle.high;
    }

    // Handle edge case where min equals max
    if (min === max) {
      min = max - 1;
    }

    return { min, max };
  }

  /**
   * Map a price to a Y pixel coordinate
   * Formula: Y_pixel = Height - ((Price - Min) / (Max - Min)) * Height
   * @param price The price to map
   * @returns Y coordinate in pixels
   */
  priceToY(price: number): number {
    const { min, max } = this.getMinMaxPrice();
    const { height } = this.state.canvasDimensions;
    
    const range = max - min;
    if (range === 0) return height / 2; // Handle zero range
    
    const normalized = (price - min) / range;
    return height - (normalized * height);
  }

  /**
   * Map a data index to an X pixel coordinate
   * @param index The data index to map
   * @returns X coordinate in pixels
   */
  timeToX(index: number): number {
    const { zoom, offset } = this.state;
    return (index * zoom) - offset;
  }

  /**
   * Get the data point at a specific X coordinate
   * @param x X coordinate in pixels
   * @returns OHLC data point or null if not found
   */
  getDataAtX(x: number): OHLC | null {
    const index = Math.floor((x + this.state.offset) / this.state.zoom);
    if (index >= 0 && index < this.data.length) {
      return this.data[index];
    }
    return null;
  }

  /**
   * Get the price at a specific Y coordinate
   * @param y Y coordinate in pixels
   * @returns Price value
   */
  getPriceAtY(y: number): number {
    const { min, max } = this.getMinMaxPrice();
    const { height } = this.state.canvasDimensions;
    
    const normalized = 1 - (y / height);
    return min + (normalized * (max - min));
  }

  /**
   * Get the index of the candle at a specific X coordinate
   * @param x X coordinate in pixels
   * @returns Data index or -1 if not found
   */
  getIndexAtX(x: number): number {
    const index = Math.floor((x + this.state.offset) / this.state.zoom);
    return (index >= 0 && index < this.data.length) ? index : -1;
  }
}