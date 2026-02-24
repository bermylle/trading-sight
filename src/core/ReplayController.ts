import { OHLC, ReplayState } from './types';

/**
 * Manages the temporal state for market replay functionality
 * Handles playback, seeking, and tick-based navigation
 */
export class ReplayController {
  private data: OHLC[];
  private state: ReplayState;
  private animationFrameId: number | null = null;
  private lastUpdate: number = 0;
  private onTickChange?: (tickIndex: number) => void;

  /**
   * Create a new ReplayController
   * @param data OHLC data array
   * @param initialState Initial replay state
   * @param onTickChange Callback for tick changes
   */
  constructor(
    data: OHLC[],
    initialState: Partial<ReplayState> = {},
    onTickChange?: (tickIndex: number) => void
  ) {
    this.data = data;
    this.state = {
      currentTickIndex: 0,
      playbackSpeed: 1000, // 1 second between updates
      isPaused: true,
      ...initialState
    };
    this.onTickChange = onTickChange;
  }

  /**
   * Start playback
   */
  play(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.lastUpdate = performance.now();
      this.startPlaybackLoop();
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.state.isPaused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Toggle playback state
   */
  togglePlayPause(): void {
    if (this.state.isPaused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Step forward or backward by one candle
   * @param direction 'forward' or 'backward'
   */
  step(direction: 'forward' | 'backward'): void {
    const step = direction === 'forward' ? 1 : -1;
    const newIndex = this.state.currentTickIndex + step;
    
    this.seek(newIndex);
  }

  /**
   * Jump to a specific tick index
   * @param index Target tick index
   */
  seek(index: number): void {
    const clampedIndex = Math.max(0, Math.min(index, this.data.length - 1));
    
    if (clampedIndex !== this.state.currentTickIndex) {
      this.state.currentTickIndex = clampedIndex;
      this.onTickChange?.(this.state.currentTickIndex);
    }
  }

  /**
   * Set playback speed
   * @param speed Delay in milliseconds between updates
   */
  setSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(10, speed); // Minimum 10ms
  }

  /**
   * Set current tick index
   * @param index New tick index
   */
  setCurrentTickIndex(index: number): void {
    this.seek(index);
  }

  /**
   * Get current replay state
   */
  getState(): ReplayState {
    return { ...this.state };
  }

  /**
   * Get current tick index
   */
  getCurrentTickIndex(): number {
    return this.state.currentTickIndex;
  }

  /**
   * Get current playback speed
   */
  getPlaybackSpeed(): number {
    return this.state.playbackSpeed;
  }

  /**
   * Check if playback is paused
   */
  isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Check if at the end of the data
   */
  isAtEnd(): boolean {
    return this.state.currentTickIndex >= this.data.length - 1;
  }

  /**
   * Check if at the beginning of the data
   */
  isAtStart(): boolean {
    return this.state.currentTickIndex <= 0;
  }

  /**
   * Get progress as percentage (0-1)
   */
  getProgress(): number {
    if (this.data.length <= 1) return 0;
    return this.state.currentTickIndex / (this.data.length - 1);
  }

  /**
   * Set progress as percentage (0-1)
   * @param progress Progress value between 0 and 1
   */
  setProgress(progress: number): void {
    const index = Math.round(progress * (this.data.length - 1));
    this.seek(index);
  }

  /**
   * Start the playback loop using requestAnimationFrame
   */
  private startPlaybackLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.state.isPaused) {
        if (timestamp - this.lastUpdate >= this.state.playbackSpeed) {
          // Move to next tick
          if (this.state.currentTickIndex < this.data.length - 1) {
            this.state.currentTickIndex++;
            this.onTickChange?.(this.state.currentTickIndex);
            this.lastUpdate = timestamp;
          } else {
            // End of data reached, pause automatically
            this.pause();
          }
        }
        
        // Continue the loop
        if (!this.state.isPaused && this.state.currentTickIndex < this.data.length - 1) {
          this.animationFrameId = requestAnimationFrame(loop);
        } else {
          this.animationFrameId = null;
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Update the data array and reset state if needed
   * @param data New OHLC data array
   * @param resetState Whether to reset replay state
   */
  setData(data: OHLC[], resetState: boolean = false): void {
    this.data = data;
    
    if (resetState) {
      this.state.currentTickIndex = 0;
      this.state.isPaused = true;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    } else {
      // Clamp current index to new data length
      this.seek(this.state.currentTickIndex);
    }
  }

  /**
   * Update the tick change callback
   * @param callback New callback function
   */
  setOnTickChange(callback?: (tickIndex: number) => void): void {
    this.onTickChange = callback;
  }

  /**
   * Destroy the controller and clean up resources
   */
  destroy(): void {
    this.pause();
    this.onTickChange = undefined;
  }
}