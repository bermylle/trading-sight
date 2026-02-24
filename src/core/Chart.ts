import { OHLC, CanvasDimensions } from './types';
import { CoordinateManager } from './CoordinateManager';
import { ReplayController } from './ReplayController';

/**
 * High-performance Canvas-based chart renderer
 * Manages the rendering loop and coordinates with CoordinateManager
 * Implements dirty flag pattern for optimal performance
 */
export class Chart {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private coordinateManager: CoordinateManager;
  private replayController: ReplayController | null = null;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  
  // Performance monitoring
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  
  // Dirty flag optimization
  private lastOffset: number = 0;
  private lastZoom: number = 0;
  private lastPriceOffset: number = 0;
  private lastTickIndex: number = -1;
  private shouldRedraw: boolean = true;

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
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Set up resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.canvas) {
          this.resizeCanvas();
        }
      }
    });
    
    this.resizeObserver.observe(this.canvas);
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
    this.animationId = requestAnimationFrame(this.animate.bind(this));
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
   * Main animation loop with dirty flag optimization
   */
  private animate(timestamp: number): void {
    if (!this.isRunning) return;

    // Check if we need to redraw
    if (this.shouldRedraw) {
      // Calculate FPS
      this.updateFPS(timestamp);

      // Clear canvas
      this.clear();

      // Draw chart
      this.draw();
      
      // Update dirty flags
      this.updateDirtyFlags();
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * Update dirty flags to track changes
   */
  private updateDirtyFlags(): void {
    const currentState = this.coordinateManager.getState();
    const currentTickIndex = this.replayController ? this.replayController.getCurrentTickIndex() : 0;
    
    this.lastOffset = currentState.offset;
    this.lastZoom = currentState.zoom;
    this.lastPriceOffset = currentState.priceOffset;
    this.lastTickIndex = currentTickIndex;
    this.shouldRedraw = false;
  }

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
   * Draw candlesticks with optimized rendering
   */
  private drawCandles(): void {
    const { startIndex, endIndex } = this.coordinateManager.getVisibleRange();
    
    // Pre-calculate common values for performance
    const { min: priceMin, max: priceMax } = this.coordinateManager.getMinMaxPrice();
    const { height: canvasHeight } = this.coordinateManager.getState().canvasDimensions;
    
    for (let i = startIndex; i <= endIndex; i++) {
      // Direct array access is faster than coordinate conversion
      const candle = this.coordinateManager.getDataAtX(this.coordinateManager.timeToX(i));
      if (!candle) continue;
      
      // Calculate coordinates once
      const x = this.coordinateManager.timeToX(i);
      const xRounded = Math.round(x);
      
      // Optimized price-to-Y conversion
      const range = priceMax - priceMin;
      const normalizedOpen = (candle.open - priceMin) / range;
      const normalizedClose = (candle.close - priceMin) / range;
      const normalizedHigh = (candle.high - priceMin) / range;
      const normalizedLow = (candle.low - priceMin) / range;
      
      const openY = canvasHeight - (normalizedOpen * canvasHeight);
      const closeY = canvasHeight - (normalizedClose * canvasHeight);
      const highY = canvasHeight - (normalizedHigh * canvasHeight);
      const lowY = canvasHeight - (normalizedLow * canvasHeight);
      
      // Draw wick with pixel-perfect coordinates
      const wickHighY = Math.round(highY);
      const wickLowY = Math.round(lowY);
      
      this.context.strokeStyle = '#fff';
      this.context.lineWidth = 1;
      this.context.beginPath();
      this.context.moveTo(xRounded, wickHighY);
      this.context.lineTo(xRounded, wickLowY);
      this.context.stroke();
      
      // Draw body with pixel-perfect coordinates
      const bodyY = Math.round(Math.min(openY, closeY));
      const bodyHeight = Math.max(Math.abs(Math.round(closeY) - Math.round(openY)), 1);
      const isBullish = candle.close >= candle.open;
      
      this.context.fillStyle = isBullish ? '#00ff00' : '#ff0000';
      this.context.fillRect(xRounded - 3, bodyY, 6, bodyHeight);
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
   * Set the replay controller for integration
   */
  setReplayController(replayController: ReplayController): void {
    this.replayController = replayController;
    this.replayController.setOnTickChange(() => {
      this.shouldRedraw = true;
    });
  }

  /**
   * Update data and trigger re-render
   */
  setData(data: OHLC[]): void {
    this.coordinateManager.setData(data);
    this.shouldRedraw = true;
  }

  /**
   * Update zoom level
   */
  setZoom(zoom: number): void {
    this.coordinateManager.setZoom(zoom);
    this.shouldRedraw = true;
  }

  /**
   * Update horizontal offset
   */
  setOffset(offset: number): void {
    this.coordinateManager.setOffset(offset);
    this.shouldRedraw = true;
  }

  /**
   * Update vertical price offset
   */
  setPriceOffset(priceOffset: number): void {
    this.coordinateManager.setPriceOffset(priceOffset);
    this.shouldRedraw = true;
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
   * Get the index of the candle at a specific X coordinate
   * @param x X coordinate in pixels
   * @returns Data index or -1 if not found
   */
  getIndexAtX(x: number): number {
    return this.coordinateManager.getIndexAtX(x);
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
    
    // Clean up resize observer to prevent memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Reset canvas dimensions
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}