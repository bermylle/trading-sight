import { OHLC, CanvasDimensions } from './types';
import { CoordinateManager } from './CoordinateManager';

/**
 * Advanced candle painter with Fog of War and Ghost Candles support
 * Renders only revealed candles and shows future candles as ghosts
 */
export class CandlePainter {
  private coordinateManager: CoordinateManager;
  private context: CanvasRenderingContext2D;
  private currentTickIndex: number = 0;

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
   * Draw all visible candles with Fog of War support
   * @param currentTickIndex The current replay tick index
   */
  drawCandles(currentTickIndex?: number): void {
    if (currentTickIndex !== undefined) {
      this.currentTickIndex = currentTickIndex;
    }

    const { startIndex, endIndex } = this.coordinateManager.getVisibleRange();
    
    // Clear previous drawings
    this.clear();
    
    // Draw each visible candle
    for (let i = startIndex; i <= endIndex; i++) {
      if (i <= this.currentTickIndex) {
        // Render normal candle (Fog of War: revealed)
        this.drawNormalCandle(i);
      } else {
        // Render ghost candle (Fog of War: hidden)
        this.drawGhostCandle(i);
      }
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
   * @param opacity Opacity level for the candle (0.0 to 1.0)
   */
  private drawBody(x: number, openY: number, closeY: number, candle: OHLC, opacity: number = 1.0): void {
    const bodyHeight = Math.abs(closeY - openY);
    const bodyY = Math.min(openY, closeY);
    const isBullish = candle.close >= candle.open;

    // Set fill color based on candle direction with opacity
    const baseColor = isBullish ? '#00ff00' : '#ff0000';
    this.context.fillStyle = this.setOpacity(baseColor, opacity);

    // Draw the body rectangle
    // Minimum height of 1 pixel for very small price differences
    this.context.fillRect(x - 3, bodyY, 6, Math.max(bodyHeight, 1));
  }

  /**
   * Draw a normal candle (fully revealed)
   * @param index Data index of the candle to draw
   */
  private drawNormalCandle(index: number): void {
    const candle = this.coordinateManager.getDataAtX(this.coordinateManager.timeToX(index));
    if (!candle) return;

    const x = this.coordinateManager.timeToX(index);
    const openY = this.coordinateManager.priceToY(candle.open);
    const closeY = this.coordinateManager.priceToY(candle.close);
    const highY = this.coordinateManager.priceToY(candle.high);
    const lowY = this.coordinateManager.priceToY(candle.low);

    // Draw wick with full opacity
    this.context.globalAlpha = 1.0;
    this.drawWick(x, highY, lowY);

    // Draw body with full opacity
    this.drawBody(x, openY, closeY, candle, 1.0);
  }

  /**
   * Draw a ghost candle (hidden/future)
   * @param index Data index of the candle to draw
   */
  private drawGhostCandle(index: number): void {
    const candle = this.coordinateManager.getDataAtX(this.coordinateManager.timeToX(index));
    if (!candle) return;

    const x = this.coordinateManager.timeToX(index);
    const openY = this.coordinateManager.priceToY(candle.open);
    const closeY = this.coordinateManager.priceToY(candle.close);
    const highY = this.coordinateManager.priceToY(candle.high);
    const lowY = this.coordinateManager.priceToY(candle.low);

    // Draw wick with low opacity
    this.context.globalAlpha = 0.1;
    this.drawWick(x, highY, lowY);

    // Draw body with low opacity
    this.drawBody(x, openY, closeY, candle, 0.1);

    // Reset global alpha
    this.context.globalAlpha = 1.0;
  }

  /**
   * Set opacity for a color
   * @param color Color in hex format (#rrggbb)
   * @param opacity Opacity level (0.0 to 1.0)
   * @returns Color with opacity applied
   */
  private setOpacity(color: string, opacity: number): string {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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