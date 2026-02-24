import { OHLC, CanvasDimensions } from './types';
import { CoordinateManager } from './CoordinateManager';

/**
 * Proof of concept candle painter
 * Demonstrates how to draw basic candlesticks using the CoordinateManager
 */
export class CandlePainter {
  private coordinateManager: CoordinateManager;
  private context: CanvasRenderingContext2D;

  /**
   * Create a new CandlePainter
   * @param coordinateManager The coordinate manager for mapping
   * @param context The canvas 2D rendering context
   */
  constructor(coordinateManager: CoordinateManager, context: CanvasRenderingContext2D) {
    this.coordinateManager = coordinateManager;
    this.context = context;
  }

  /**
   * Draw all visible candles
   */
  drawCandles(): void {
    const { startIndex, endIndex } = this.coordinateManager.getVisibleRange();
    
    // Clear previous drawings
    this.clear();
    
    // Draw each visible candle
    for (let i = startIndex; i <= endIndex; i++) {
      this.drawCandle(i);
    }
  }

  /**
   * Draw a single candle at the specified index
   * @param index Data index of the candle to draw
   */
  private drawCandle(index: number): void {
    const candle = this.coordinateManager.getDataAtX(this.coordinateManager.timeToX(index));
    if (!candle) return;

    const x = this.coordinateManager.timeToX(index);
    const openY = this.coordinateManager.priceToY(candle.open);
    const closeY = this.coordinateManager.priceToY(candle.close);
    const highY = this.coordinateManager.priceToY(candle.high);
    const lowY = this.coordinateManager.priceToY(candle.low);

    // Draw wick (high-low line)
    this.drawWick(x, highY, lowY);

    // Draw body
    this.drawBody(x, openY, closeY, candle);
  }

  /**
   * Draw the wick (high-low line) of a candle
   * @param x X coordinate of the candle
   * @param highY Y coordinate of the high price
   * @param lowY Y coordinate of the low price
   */
  private drawWick(x: number, highY: number, lowY: number): void {
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(x, highY);
    this.context.lineTo(x, lowY);
    this.context.stroke();
  }

  /**
   * Draw the body of a candle
   * @param x X coordinate of the candle
   * @param openY Y coordinate of the open price
   * @param closeY Y coordinate of the close price
   * @param candle OHLC data for the candle
   */
  private drawBody(x: number, openY: number, closeY: number, candle: OHLC): void {
    const bodyHeight = Math.abs(closeY - openY);
    const bodyY = Math.min(openY, closeY);
    const isBullish = candle.close >= candle.open;

    // Set fill color based on candle direction
    this.context.fillStyle = isBullish ? '#00ff00' : '#ff0000';

    // Draw the body rectangle
    // Minimum height of 1 pixel for very small price differences
    this.context.fillRect(x - 3, bodyY, 6, Math.max(bodyHeight, 1));
  }

  /**
   * Clear the canvas area where candles are drawn
   */
  private clear(): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    this.context.clearRect(0, 0, width, height);
  }

  /**
   * Update the coordinate manager reference
   */
  setCoordinateManager(coordinateManager: CoordinateManager): void {
    this.coordinateManager = coordinateManager;
  }

  /**
   * Update the canvas context
   */
  setContext(context: CanvasRenderingContext2D): void {
    this.context = context;
  }

  /**
   * Draw a single candle at a specific price level for testing
   * @param price The price level to draw the candle at
   * @param x The X coordinate to draw at
   */
  drawTestCandle(price: number, x: number): void {
    const y = this.coordinateManager.priceToY(price);
    
    // Draw a simple test candle
    this.context.fillStyle = '#00ff00';
    this.context.fillRect(x - 3, y - 10, 6, 20);
    
    this.context.strokeStyle = '#ffffff';
    this.context.beginPath();
    this.context.moveTo(x, y - 15);
    this.context.lineTo(x, y + 15);
    this.context.stroke();
  }
}