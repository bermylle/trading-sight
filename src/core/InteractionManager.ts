import { CoordinateManager } from './CoordinateManager';
import { InteractionState } from './types';

/**
 * Manages DOM interactions with the chart canvas
 * Handles panning, zooming, and zoom-to-cursor logic
 */
export class InteractionManager {
  private canvas: HTMLCanvasElement;
  private coordinateManager: CoordinateManager;
  private state: InteractionState;
  private isDestroyed: boolean = false;

  // Event handlers bound to this instance
  private handleMouseDown = this.onMouseDown.bind(this);
  private handleMouseMove = this.onMouseMove.bind(this);
  private handleMouseUp = this.onMouseUp.bind(this);
  private handleWheel = this.onWheel.bind(this);
  private handleDoubleClick = this.onDoubleClick.bind(this);

  /**
   * Create a new InteractionManager
   * @param canvas The HTML5 Canvas element
   * @param coordinateManager The coordinate manager to control
   */
  constructor(canvas: HTMLCanvasElement, coordinateManager: CoordinateManager) {
    this.canvas = canvas;
    this.coordinateManager = coordinateManager;
    this.state = {
      isPanning: false,
      isZooming: false,
      lastMouseX: 0,
      lastMouseY: 0,
      zoomAnchorX: 0
    };

    this.setupEventListeners();
  }

  /**
   * Set up all event listeners
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.handleDoubleClick);
    
    // Add global mouse up listener to handle drag outside canvas
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * Handle mouse down event for panning
   */
  private onMouseDown(event: MouseEvent): void {
    if (this.isDestroyed) return;

    // Only start panning on left click
    if (event.button !== 0) return;

    // Prevent text selection and other default behaviors
    event.preventDefault();

    this.state.isPanning = true;
    this.state.lastMouseX = event.clientX;
    this.state.lastMouseY = event.clientY;
    
    // Set cursor to grabbing
    this.canvas.style.cursor = 'grabbing';
    
    // Store zoom anchor for zoom-to-cursor logic
    this.state.zoomAnchorX = event.clientX;
  }

  /**
   * Handle mouse move event for panning
   */
  private onMouseMove(event: MouseEvent): void {
    if (this.isDestroyed || !this.state.isPanning) return;

    const deltaX = event.clientX - this.state.lastMouseX;
    const deltaY = event.clientY - this.state.lastMouseY;

    // Horizontal panning (time axis)
    const currentOffset = this.coordinateManager.getState().offset;
    this.coordinateManager.setOffset(currentOffset - deltaX);

    // Vertical panning (price axis) - Alt key + drag
    if (event.altKey) {
      const currentPriceOffset = this.coordinateManager.getState().priceOffset;
      this.coordinateManager.setPriceOffset(currentPriceOffset + deltaY);
    }

    this.state.lastMouseX = event.clientX;
    this.state.lastMouseY = event.clientY;
  }

  /**
   * Handle mouse up event to stop panning
   */
  private onMouseUp(event: MouseEvent): void {
    if (this.isDestroyed) return;

    if (this.state.isPanning) {
      this.state.isPanning = false;
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle wheel event for zooming with zoom-to-cursor logic
   */
  private onWheel(event: WheelEvent): void {
    if (this.isDestroyed) return;

    event.preventDefault();

    const mouseX = event.clientX;
    const deltaY = event.deltaY;
    
    // Calculate new zoom level
    const currentZoom = this.coordinateManager.getState().zoom;
    const zoomFactor = 1.001; // Fine-grained zoom control
    const newZoom = deltaY > 0 
      ? Math.max(1, currentZoom / zoomFactor)
      : Math.min(100, currentZoom * zoomFactor);

    if (newZoom !== currentZoom) {
      // Apply zoom-to-cursor logic
      this.applyZoomToCursor(newZoom, mouseX);
    }
  }

  /**
   * Apply zoom with cursor anchoring to keep the candle under cursor stable
   */
  private applyZoomToCursor(newZoom: number, mouseX: number): void {
    const currentZoom = this.coordinateManager.getState().zoom;
    const currentOffset = this.coordinateManager.getState().offset;
    
    // Calculate the candle index under the cursor
    const candleIndex = this.coordinateManager.getIndexAtX(mouseX);
    if (candleIndex === -1) {
      // Fallback to simple zoom if no candle found
      this.coordinateManager.setZoom(newZoom);
      return;
    }

    // Calculate the X position of the candle
    const candleX = this.coordinateManager.timeToX(candleIndex);
    
    // Calculate how much the offset needs to change to keep the candle under the cursor
    // The formula ensures the candle stays at the same screen position
    const offsetAdjustment = (newZoom - currentZoom) * candleIndex;
    
    // Apply the changes
    this.coordinateManager.setZoom(newZoom);
    this.coordinateManager.setOffset(currentOffset + offsetAdjustment);
  }

  /**
   * Handle double click to reset zoom and pan
   */
  private onDoubleClick(event: MouseEvent): void {
    if (this.isDestroyed) return;

    event.preventDefault();
    
    // Reset to default values
    this.coordinateManager.setZoom(10);
    this.coordinateManager.setOffset(0);
    this.coordinateManager.setPriceOffset(0);
  }

  /**
   * Enable or disable interaction manager
   * @param enabled Whether interactions should be enabled
   */
  setEnabled(enabled: boolean): void {
    if (this.isDestroyed) return;

    if (!enabled && this.state.isPanning) {
      this.state.isPanning = false;
      this.canvas.style.cursor = 'default';
    }

    this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  /**
   * Get current interaction state
   */
  getState(): InteractionState {
    return { ...this.state };
  }

  /**
   * Check if currently panning
   */
  isPanning(): boolean {
    return this.state.isPanning;
  }

  /**
   * Check if currently zooming
   */
  isZooming(): boolean {
    return this.state.isZooming;
  }

  /**
   * Manually set zoom level
   * @param zoom New zoom level
   * @param anchorX X coordinate to anchor the zoom (optional)
   */
  setZoom(zoom: number, anchorX?: number): void {
    if (this.isDestroyed) return;

    const clampedZoom = Math.max(1, Math.min(100, zoom));
    const mouseX = anchorX ?? this.state.zoomAnchorX;
    
    this.applyZoomToCursor(clampedZoom, mouseX);
  }

  /**
   * Manually set offset
   * @param offset New horizontal offset
   */
  setOffset(offset: number): void {
    if (this.isDestroyed) return;
    this.coordinateManager.setOffset(offset);
  }

  /**
   * Manually set price offset
   * @param priceOffset New vertical price offset
   */
  setPriceOffset(priceOffset: number): void {
    if (this.isDestroyed) return;
    this.coordinateManager.setPriceOffset(priceOffset);
  }

  /**
   * Get the coordinate manager instance
   */
  getCoordinateManager(): CoordinateManager {
    return this.coordinateManager;
  }

  /**
   * Destroy the interaction manager and clean up event listeners
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick);
    window.removeEventListener('mouseup', this.handleMouseUp);

    // Reset cursor
    this.canvas.style.cursor = 'default';
    this.canvas.style.pointerEvents = 'auto';
  }
}