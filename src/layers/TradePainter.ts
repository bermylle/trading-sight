import { Trade } from '../core/types';
import { CoordinateManager } from '../core/CoordinateManager';

/**
 * Configuration for TradePainter
 */
export interface TradePainterConfig {
  /** Color for entry price line */
  entryColor?: string;
  /** Color for stop loss line */
  slColor?: string;
  /** Color for take profit line */
  tpColor?: string;
  /** Color for P&L label background */
  labelBackgroundColor?: string;
  /** Color for P&L label text */
  labelTextColor?: string;
  /** Font for labels */
  font?: string;
  /** Line width for trade lines */
  lineWidth?: number;
  /** Dash pattern for SL/TP lines */
  dashPattern?: number[];
}

/**
 * TradePainter class for rendering trade information on the chart
 * Draws entry prices, SL/TP levels, and P&L labels
 */
export class TradePainter {
  private coordinateManager: CoordinateManager;
  private config: TradePainterConfig;
  private context: CanvasRenderingContext2D;
  private currentPrice: number = 0;

  /**
   * Create a new TradePainter instance
   * @param context Canvas rendering context
   * @param coordinateManager Coordinate manager for transformations
   * @param config Painter configuration
   */
  constructor(
    context: CanvasRenderingContext2D,
    coordinateManager: CoordinateManager,
    config: TradePainterConfig = {}
  ) {
    this.context = context;
    this.coordinateManager = coordinateManager;
    this.config = {
      entryColor: '#ffffff',
      slColor: '#ff4444',
      tpColor: '#44ff44',
      labelBackgroundColor: 'rgba(0, 0, 0, 0.8)',
      labelTextColor: '#ffffff',
      font: '12px Arial',
      lineWidth: 1,
      dashPattern: [5, 5],
      ...config
    };
  }

  /**
   * Set the current market price for P&L calculations
   * @param price Current market price
   */
  setCurrentPrice(price: number): void {
    this.currentPrice = price;
  }

  /**
   * Draw all trades on the canvas
   * @param trades Array of trades to render
   */
  draw(trades: Trade[]): void {
    if (!trades.length) return;

    // Save canvas state
    this.context.save();

    // Draw trade lines and labels
    trades.forEach(trade => {
      this.drawTrade(trade);
    });

    // Draw P&L summary label at right edge
    this.drawPnLLabel(trades);

    // Restore canvas state
    this.context.restore();
  }

  /**
   * Draw a single trade
   * @param trade Trade to render
   */
  private drawTrade(trade: Trade): void {
    const { width } = this.coordinateManager.getState().canvasDimensions;

    // Calculate Y coordinates for trade levels
    const entryY = this.coordinateManager.priceToY(trade.entryPrice);
    const slY = this.coordinateManager.priceToY(trade.sl);
    const tpY = this.coordinateManager.priceToY(trade.tp);

    // Calculate P&L for current price
    const currentPnL = this.calculateCurrentPnL(trade);

    // Draw entry price line (solid)
    this.context.strokeStyle = this.config.entryColor!;
    this.context.lineWidth = this.config.lineWidth!;
    this.context.setLineDash([]);
    this.context.beginPath();
    this.context.moveTo(0, entryY);
    this.context.lineTo(width, entryY);
    this.context.stroke();

    // Draw stop loss line (dashed, red)
    this.context.strokeStyle = this.config.slColor!;
    this.context.lineWidth = this.config.lineWidth!;
    this.context.setLineDash(this.config.dashPattern!);
    this.context.beginPath();
    this.context.moveTo(0, slY);
    this.context.lineTo(width, slY);
    this.context.stroke();

    // Draw take profit line (dashed, green)
    this.context.strokeStyle = this.config.tpColor!;
    this.context.lineWidth = this.config.lineWidth!;
    this.context.setLineDash(this.config.dashPattern!);
    this.context.beginPath();
    this.context.moveTo(0, tpY);
    this.context.lineTo(width, tpY);
    this.context.stroke();

    // Draw trade status indicator
    this.drawTradeStatusIndicator(trade, entryY, currentPnL);

    // Draw trade details label near entry line
    this.drawTradeDetailsLabel(trade, entryY, currentPnL);
  }

  /**
   * Draw trade status indicator
   * @param trade Trade information
   * @param entryY Y coordinate of entry price
   * @param currentPnL Current P&L value
   */
  private drawTradeStatusIndicator(trade: Trade, entryY: number, currentPnL: number): void {
    const { width } = this.coordinateManager.getState().canvasDimensions;
    const indicatorX = width - 60;
    const indicatorY = entryY;

    // Draw status background
    this.context.fillStyle = trade.status === 'open' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 0, 0.3)';
    this.context.fillRect(indicatorX, indicatorY - 10, 50, 20);

    // Draw status text
    this.context.fillStyle = '#ffffff';
    this.context.font = this.config.font!;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText(trade.status.toUpperCase(), indicatorX + 25, indicatorY);
  }

  /**
   * Draw trade details label
   * @param trade Trade information
   * @param entryY Y coordinate of entry price
   * @param currentPnL Current P&L value
   */
  private drawTradeDetailsLabel(trade: Trade, entryY: number, currentPnL: number): void {
    const { width } = this.coordinateManager.getState().canvasDimensions;
    const labelX = width - 120;
    const labelY = entryY - 25;

    // Calculate P&L in pips/points
    const pipValue = this.calculatePipValue(trade);
    const pips = currentPnL / pipValue;

    // Draw label background
    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.fillRect(labelX, labelY, 110, 40);

    // Draw label text
    this.context.fillStyle = '#ffffff';
    this.context.font = this.config.font!;
    this.context.textAlign = 'left';
    this.context.textBaseline = 'top';

    const typeText = trade.type.toUpperCase();
    const pipsText = `${pips > 0 ? '+' : ''}${pips.toFixed(1)} pips`;
    const pnlText = `${currentPnL > 0 ? '+' : ''}$${currentPnL.toFixed(2)}`;

    this.context.fillText(`${typeText} | Size: ${trade.size}`, labelX + 5, labelY + 5);
    this.context.fillText(pipsText, labelX + 5, labelY + 20);
    this.context.fillText(pnlText, labelX + 5, labelY + 30);
  }

  /**
   * Draw P&L summary label at the right edge of the chart
   * @param trades Array of trades
   */
  private drawPnLLabel(trades: Trade[]): void {
    const { width, height } = this.coordinateManager.getState().canvasDimensions;
    const openTrades = trades.filter(t => t.status === 'open');

    if (openTrades.length === 0) return;

    // Calculate total unrealized P&L
    const totalUnrealizedPnL = openTrades.reduce((total, trade) => total + trade.unrealizedPnL, 0);
    const totalPips = this.calculateTotalPips(openTrades, totalUnrealizedPnL);

    // Position label at top-right
    const labelX = width - 150;
    const labelY = 10;
    const labelWidth = 140;
    const labelHeight = 60;

    // Draw label background
    this.context.fillStyle = this.config.labelBackgroundColor!;
    this.context.fillRect(labelX, labelY, labelWidth, labelHeight);
    this.context.strokeStyle = '#333';
    this.context.lineWidth = 1;
    this.context.strokeRect(labelX, labelY, labelWidth, labelHeight);

    // Draw label text
    this.context.fillStyle = this.config.labelTextColor!;
    this.context.font = 'bold 14px Arial';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'top';

    this.context.fillText('UNREALIZED P&L', labelX + labelWidth / 2, labelY + 5);

    // P&L value
    this.context.font = 'bold 16px Arial';
    const pnlColor = totalUnrealizedPnL >= 0 ? '#00ff00' : '#ff0000';
    this.context.fillStyle = pnlColor;
    this.context.fillText(
      `${totalUnrealizedPnL >= 0 ? '+' : ''}$${Math.abs(totalUnrealizedPnL).toFixed(2)}`,
      labelX + labelWidth / 2,
      labelY + 25
    );

    // Pips value
    this.context.font = '12px Arial';
    this.context.fillStyle = '#cccccc';
    this.context.fillText(
      `${totalPips >= 0 ? '+' : ''}${Math.abs(totalPips).toFixed(1)} pips`,
      labelX + labelWidth / 2,
      labelY + 45
    );
  }

  /**
   * Calculate current P&L for a trade based on current market price
   * @param trade Trade information
   * @returns Current P&L value
   */
  private calculateCurrentPnL(trade: Trade): number {
    if (trade.status !== 'open') {
      return trade.realizedPnL ?? 0;
    }

    if (trade.type === 'buy') {
      return (this.currentPrice - trade.entryPrice) * trade.size;
    } else {
      return (trade.entryPrice - this.currentPrice) * trade.size;
    }
  }

  /**
   * Calculate pip value for a trade
   * @param trade Trade information
   * @returns Pip value in currency
   */
  private calculatePipValue(trade: Trade): number {
    // For simplicity, assume 1 pip = 0.0001 for most currency pairs
    // This could be made more sophisticated based on the specific instrument
    return 0.0001 * trade.size;
  }

  /**
   * Calculate total pips for multiple trades
   * @param trades Array of trades
   * @param totalPnL Total P&L in currency
   * @returns Total pips
   */
  private calculateTotalPips(trades: Trade[], totalPnL: number): number {
    const totalSize = trades.reduce((total, trade) => total + trade.size, 0);
    if (totalSize === 0) return 0;

    // Calculate average entry price
    const weightedEntry = trades.reduce((total, trade) => total + (trade.entryPrice * trade.size), 0) / totalSize;
    const weightedSL = trades.reduce((total, trade) => total + (trade.sl * trade.size), 0) / totalSize;

    const avgPipValue = Math.abs(weightedEntry - weightedSL) / 10; // Rough approximation
    return totalPnL / avgPipValue;
  }

  /**
   * Update coordinate manager reference (for when chart dimensions change)
   * @param coordinateManager New coordinate manager
   */
  updateCoordinateManager(coordinateManager: CoordinateManager): void {
    this.coordinateManager = coordinateManager;
  }

  /**
   * Update painter configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<TradePainterConfig>): void {
    this.config = { ...this.config, ...config };
  }
}