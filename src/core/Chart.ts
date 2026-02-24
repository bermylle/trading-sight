import { OHLC, CanvasDimensions } from './types';
import { CoordinateManager } from './CoordinateManager';

/**
 * High-performance Canvas-based chart renderer
 * Manages the rendering loop and coordinates with CoordinateManager
 */
export class Chart {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private coordinateManager: CoordinateManager;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  
  // Performance monitoring
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  /**
   * Create a new Chart instance
   * @param canvas The HTML5 Canvas element
   * @param data OHLC data array
   * @param dimensions Initial canvas dimensions
   */
  constructor(canvas: HTMLCanvasElement, data: OHLC[], dimensions: CanvasDimensions) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d')!;
    this.coordinateManager = new CoordinateManager(data, dimensions);
    
    this.setupCanvas();
    this.setupResizeObserver();
  }

  /**
   * Initialize canvas settings for optimal performance
   */
  private setupCanvas(): void {
    // Set canvas size to match CSS dimensions
    this.resizeCanvas();
    
    // Optimize for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Performance optimizations
    this.context.imageSmoothingEnabled = false;
    this.context.textBaseline = 'middle';
    
    // Pixel-perfect rendering settings
    this.context.imageSmoothingEnabled = false;
    
    // Additional browser-specific settings for pixel-perfect rendering
    if ((this.context as any).mozImageSmoothingEnabled !== undefined) {
      (this.context as any).mozImageSmoothingEnabled = false;
    }
    if ((this.context as any).webkitImageSmoothingEnabled !== undefined) {
      (this.context as any).webkitImageSmoothingEnabled = false;
    }
    if ((this.context as any).msImageSmoothingEnabled !== undefined) {
      (this.context as any).msImageSmoothingEnabled = false;
    }
  }

  /**
   * Set up resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvas) {
          this.resizeCanvas();
        }
      }
    });
    
    resizeObserver.observe(this.canvas);
  }

  /**
   * Resize canvas to match CSS dimensions
   */
  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dimensions: CanvasDimensions = {
      width: rect.width,
      height: rect.height
    };
    
    this.coordinateManager.setCanvasDimensions(dimensions);
    
    // Update canvas pixel dimensions
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Start the rendering loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop the rendering loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   */
  private animate = (timestamp: number): void => {
    if (!this.isRunning) return;

    // Calculate FPS
    this.updateFPS(timestamp);

    // Clear canvas
    this.clear();

    // Draw chart
    this.draw();

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Update FPS counter
   */
  private updateFPS(timestamp: number): void {
    this.frameCount++;
    if (timestamp - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = timestamp;
    }
  }

  /**
   * Clear the canvas
   */
  private clear(): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    this.context.clearRect(0, 0, width, height);
  }

  /**
   * Draw the chart
   */
  private draw(): void {
    // Draw background
    this.drawBackground();
    
    // Draw grid lines
    this.drawGrid();
    
    // Draw price axis labels
    this.drawPriceAxis();
    
    // Draw candles
    this.drawCandles();
    
    // Draw FPS counter (debug)
    this.drawFPS();
  }

  /**
   * Draw chart background
   */
  private drawBackground(): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    
    // Fill background
    this.context.fillStyle = '#1e1e1e';
    this.context.fillRect(0, 0, width, height);
    
    // Draw border
    this.context.strokeStyle = '#333';
    this.context.lineWidth = 1;
    this.context.strokeRect(0, 0, width, height);
  }

  /**
   * Draw grid lines
   */
  private drawGrid(): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    const { min, max } = this.coordinateManager.getMinMaxPrice();
    
    this.context.strokeStyle = '#333';
    this.context.lineWidth = 1;
    this.context.setLineDash([2, 4]);
    
    // Draw horizontal grid lines (price levels)
    const priceSteps = this.calculatePriceSteps(min, max);
    for (const price of priceSteps) {
      const y = this.coordinateManager.priceToY(price);
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }
    
    this.context.setLineDash([]);
  }

  /**
   * Draw price axis labels
   */
  private drawPriceAxis(): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    const { min, max } = this.coordinateManager.getMinMaxPrice();
    
    this.context.fillStyle = '#ccc';
    this.context.font = '12px Arial';
    this.context.textAlign = 'right';
    
    const priceSteps = this.calculatePriceSteps(min, max);
    for (const price of priceSteps) {
      const y = this.coordinateManager.priceToY(price);
      this.context.fillText(price.toFixed(2), width - 10, y);
    }
  }

  /**
   * Draw candlesticks
   */
  private drawCandles(): void {
    const { startIndex, endIndex } = this.coordinateManager.getVisibleRange();
    
    for (let i = startIndex; i <= endIndex; i++) {
      const candle = this.coordinateManager.getDataAtX(this.coordinateManager.timeToX(i));
      if (!candle) continue;
      
      const x = this.coordinateManager.timeToX(i);
      const openY = this.coordinateManager.priceToY(candle.open);
      const closeY = this.coordinateManager.priceToY(candle.close);
      const highY = this.coordinateManager.priceToY(candle.high);
      const lowY = this.coordinateManager.priceToY(candle.low);
      
      // Draw wick with pixel-perfect coordinates
      const wickX = Math.round(x);
      const wickHighY = Math.round(highY);
      const wickLowY = Math.round(lowY);
      
      this.context.strokeStyle = '#fff';
      this.context.lineWidth = 1;
      this.context.beginPath();
      this.context.moveTo(wickX, wickHighY);
      this.context.lineTo(wickX, wickLowY);
      this.context.stroke();
      
      // Draw body with pixel-perfect coordinates
      const bodyX = Math.round(x - 3);
      const bodyY = Math.round(Math.min(openY, closeY));
      const bodyHeight = Math.max(Math.abs(Math.round(closeY) - Math.round(openY)), 1);
      const isBullish = candle.close >= candle.open;
      
      this.context.fillStyle = isBullish ? '#00ff00' : '#ff0000';
      this.context.fillRect(bodyX, bodyY, 6, bodyHeight);
    }
  }

  /**
   * Draw FPS counter for debugging
   */
  private drawFPS(): void {
    this.context.fillStyle = '#fff';
    this.context.font = '12px Arial';
    this.context.textAlign = 'left';
    this.context.fillText(`FPS: ${this.fps}`, 10, 20);
  }

  /**
   * Calculate price steps for grid lines
   */
  private calculatePriceSteps(min: number, max: number): number[] {
    const range = max - min;
    const step = Math.pow(10, Math.floor(Math.log10(range)) - 1);
    const start = Math.floor(min / step) * step;
    const steps: number[] = [];
    
    for (let price = start; price <= max; price += step) {
      if (price >= min) {
        steps.push(price);
      }
    }
    
    return steps;
  }

  /**
   * Update data and trigger re-render
   */
  setData(data: OHLC[]): void {
    this.coordinateManager.setData(data);
  }

  /**
   * Update zoom level
   */
  setZoom(zoom: number): void {
    this.coordinateManager.setZoom(zoom);
  }

  /**
   * Update horizontal offset
   */
  setOffset(offset: number): void {
    this.coordinateManager.setOffset(offset);
  }

  /**
   * Update vertical price offset
   */
  setPriceOffset(priceOffset: number): void {
    this.coordinateManager.setPriceOffset(priceOffset);
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.coordinateManager.getState().zoom;
  }

  /**
   * Get current offset
   */
  getOffset(): number {
    return this.coordinateManager.getState().offset;
  }

  /**
   * Get current visible range
   */
  getVisibleRange(): { startIndex: number; endIndex: number } {
    return this.coordinateManager.getVisibleRange();
  }

  /**
   * Get current min/max prices
   */
  getMinMaxPrice(): { min: number; max: number } {
    return this.coordinateManager.getMinMaxPrice();
  }

  /**
   * Destroy the chart and clean up resources
   */
  destroy(): void {
    this.stop();
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}