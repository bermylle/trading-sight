import { OHLC, Trade, TradeEventType, TradeEvent, TradeEventCallback, BrokerConfig } from './types';

/**
 * Virtual brokerage engine for managing trades during market replay
 * Handles order execution, P&L calculation, and SL/TP management
 */
export class BrokerEngine {
  private config: BrokerConfig;
  private positions: Trade[] = [];
  private balance: number;
  private equity: number;
  private currentPrice: number = 0;
  private eventCallbacks: TradeEventCallback[] = [];
  private tradeCounter: number = 0;

  /**
   * Create a new BrokerEngine instance
   * @param config Broker configuration
   */
  constructor(config: BrokerConfig) {
    this.config = {
      riskPerTrade: 0.01, // 1% risk per trade
      defaultLotSize: 0.1,
      minSLDistance: 10, // 10 points minimum
      maxOpenPositions: 10,
      ...config
    };
    this.balance = config.initialBalance;
    this.equity = config.initialBalance;
  }

  /**
   * Place a new order at the current market price
   * @param type Trade type (buy or sell)
   * @param price Entry price
   * @param sl Stop loss price
   * @param tp Take profit price
   * @param size Trade size (optional, uses default if not provided)
   * @returns The created trade or null if order was rejected
   */
  placeOrder(type: 'buy' | 'sell', price: number, sl: number, tp: number, size?: number): Trade | null {
    // Validate order parameters
    if (!this.validateOrder(type, price, sl, tp, size)) {
      return null;
    }

    // Check maximum open positions limit
    const openPositions = this.getOpenPositions().length;
    if (openPositions >= (this.config.maxOpenPositions || Infinity)) {
      return null;
    }

    // Calculate position size based on risk management
    const positionSize = size || this.calculatePositionSize(type, price, sl);

    // Create new trade
    const trade: Trade = {
      id: `trade_${++this.tradeCounter}`,
      type,
      entryPrice: price,
      sl,
      tp,
      size: positionSize,
      entryTime: Date.now(),
      status: 'open',
      unrealizedPnL: 0
    };

    this.positions.push(trade);
    this.updateEquity();

    // Emit trade opened event
    this.emitEvent({
      type: TradeEventType.TRADE_OPENED,
      trade,
      timestamp: Date.now()
    });

    return trade;
  }

  /**
   * Update the broker with current market price
   * This method is called on every replay tick to check for SL/TP hits
   * @param currentPrice Current market price
   */
  update(currentPrice: number): void {
    this.currentPrice = currentPrice;
    this.updateAllPositions();
    this.updateEquity();
  }

  /**
   * Close a specific trade by ID
   * @param tradeId Trade identifier
   * @param exitPrice Exit price (optional, uses current price if not provided)
   * @returns The closed trade or null if not found
   */
  closeTrade(tradeId: string, exitPrice?: number): Trade | null {
    const trade = this.positions.find(t => t.id === tradeId && t.status === 'open');
    if (!trade) return null;

    const closePrice = exitPrice ?? this.currentPrice;
    trade.exitPrice = closePrice;
    trade.exitTime = Date.now();
    trade.status = 'stopped'; // Default to stopped, will be updated if it hit TP
    trade.realizedPnL = this.calculatePnL(trade.type, trade.entryPrice, closePrice, trade.size);

    // Update balance with realized P&L
    this.balance += trade.realizedPnL;

    this.updateEquity();

    // Emit trade closed event
    this.emitEvent({
      type: TradeEventType.TRADE_CLOSED,
      trade,
      timestamp: Date.now()
    });

    return trade;
  }

  /**
   * Close all open positions at current market price
   */
  closeAllPositions(): void {
    const openPositions = this.getOpenPositions();
    openPositions.forEach(trade => this.closeTrade(trade.id));
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): Trade[] {
    return this.positions.filter(t => t.status === 'open');
  }

  /**
   * Get all closed positions
   */
  getClosedPositions(): Trade[] {
    return this.positions.filter(t => t.status !== 'open');
  }

  /**
   * Get current balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Get current equity (balance + unrealized P&L of open positions)
   */
  getEquity(): number {
    return this.equity;
  }

  /**
   * Get current margin used (sum of position sizes)
   */
  getMarginUsed(): number {
    return this.getOpenPositions().reduce((total, trade) => total + trade.size, 0);
  }

  /**
   * Get profit factor (gross profit / gross loss)
   */
  getProfitFactor(): number {
    const closedPositions = this.getClosedPositions();
    const grossProfit = closedPositions
      .filter(t => (t.realizedPnL ?? 0) > 0)
      .reduce((total, t) => total + (t.realizedPnL ?? 0), 0);
    const grossLoss = closedPositions
      .filter(t => (t.realizedPnL ?? 0) < 0)
      .reduce((total, t) => total + Math.abs(t.realizedPnL ?? 0), 0);

    return grossLoss === 0 ? (grossProfit > 0 ? Infinity : 1) : grossProfit / grossLoss;
  }

  /**
   * Get win rate percentage
   */
  getWinRate(): number {
    const closedPositions = this.getClosedPositions();
    if (closedPositions.length === 0) return 0;

    const wins = closedPositions.filter(t => (t.realizedPnL ?? 0) > 0).length;
    return (wins / closedPositions.length) * 100;
  }

  /**
   * Add event listener for trade events
   * @param callback Event callback function
   */
  onTradeEvent(callback: TradeEventCallback): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Remove event listener
   * @param callback Event callback function to remove
   */
  offTradeEvent(callback: TradeEventCallback): void {
    this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
  }

  /**
   * Reset the broker to initial state
   */
  reset(): void {
    this.positions = [];
    this.balance = this.config.initialBalance;
    this.equity = this.config.initialBalance;
    this.tradeCounter = 0;
  }

  /**
   * Validate order parameters
   */
  private validateOrder(type: 'buy' | 'sell', price: number, sl: number, tp: number, size?: number): boolean {
    // Check price validity
    if (!isFinite(price) || price <= 0) return false;
    if (!isFinite(sl) || sl <= 0) return false;
    if (!isFinite(tp) || tp <= 0) return false;

    // Validate SL/TP placement based on trade type
    if (type === 'buy') {
      if (sl >= price) return false; // SL must be below entry for buy
      if (tp <= price) return false; // TP must be above entry for buy
    } else {
      if (sl <= price) return false; // SL must be above entry for sell
      if (tp >= price) return false; // TP must be below entry for sell
    }

    // Check minimum SL distance
    const slDistance = Math.abs(price - sl);
    if (slDistance < (this.config.minSLDistance || 0)) return false;

    // Validate position size
    if (size !== undefined) {
      if (!isFinite(size) || size <= 0) return false;
    }

    return true;
  }

  /**
   * Calculate optimal position size based on risk management
   */
  private calculatePositionSize(type: 'buy' | 'sell', entryPrice: number, sl: number): number {
    const riskPerTrade = this.config.riskPerTrade || 0.01;
    const riskAmount = this.balance * riskPerTrade;
    const slDistance = Math.abs(entryPrice - sl);
    const positionSize = riskAmount / slDistance;

    return Math.min(positionSize, this.config.defaultLotSize || 0.1);
  }

  /**
   * Update all open positions with current market price
   */
  private updateAllPositions(): void {
    const openPositions = this.getOpenPositions();

    openPositions.forEach(trade => {
      // Update unrealized P&L
      trade.unrealizedPnL = this.calculatePnL(trade.type, trade.entryPrice, this.currentPrice, trade.size);

      // Check for SL/TP hits
      if (trade.type === 'buy') {
        if (this.currentPrice <= trade.sl) {
          // Stop loss hit
          this.closeTrade(trade.id, trade.sl);
        } else if (this.currentPrice >= trade.tp) {
          // Take profit hit
          trade.status = 'taken';
          this.closeTrade(trade.id, trade.tp);
        }
      } else {
        if (this.currentPrice >= trade.sl) {
          // Stop loss hit
          this.closeTrade(trade.id, trade.sl);
        } else if (this.currentPrice <= trade.tp) {
          // Take profit hit
          trade.status = 'taken';
          this.closeTrade(trade.id, trade.tp);
        }
      }
    });
  }

  /**
   * Calculate P&L for a trade
   */
  private calculatePnL(type: 'buy' | 'sell', entryPrice: number, exitPrice: number, size: number): number {
    if (type === 'buy') {
      return (exitPrice - entryPrice) * size;
    } else {
      return (entryPrice - exitPrice) * size;
    }
  }

  /**
   * Update equity based on current balance and unrealized P&L
   */
  private updateEquity(): void {
    const openPositions = this.getOpenPositions();
    const unrealizedPnL = openPositions.reduce((total, trade) => total + trade.unrealizedPnL, 0);
    this.equity = this.balance + unrealizedPnL;
  }

  /**
   * Emit trade event to all registered callbacks
   */
  private emitEvent(event: TradeEvent): void {
    this.eventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in trade event callback:', error);
      }
    });
  }
}