import { useState, useEffect, useCallback, useRef } from 'react';
import { BrokerEngine } from '../core/BrokerEngine';
import { Trade, TradeEvent, TradeEventType, BrokerConfig } from '../core/types';

/**
 * Hook for managing virtual brokerage state in React components
 * Provides access to broker data and trading operations
 */
export const useBroker = (config: BrokerConfig) => {
  const [brokerEngine] = useState(() => new BrokerEngine(config));
  const [balance, setBalance] = useState(config.initialBalance);
  const [equity, setEquity] = useState(config.initialBalance);
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [closedPositions, setClosedPositions] = useState<Trade[]>([]);
  const [marginUsed, setMarginUsed] = useState(0);
  const [profitFactor, setProfitFactor] = useState(1);
  const [winRate, setWinRate] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Ref to store the latest state for event callbacks
  const stateRef = useRef({
    balance,
    equity,
    openPositions,
    closedPositions,
    marginUsed,
    profitFactor,
    winRate
  });

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = {
      balance,
      equity,
      openPositions,
      closedPositions,
      marginUsed,
      profitFactor,
      winRate
    };
  }, [balance, equity, openPositions, closedPositions, marginUsed, profitFactor, winRate]);

  // Set up event listeners for broker updates
  useEffect(() => {
    const handleTradeEvent = (event: TradeEvent) => {
      // Update state based on trade events
      setBalance(brokerEngine.getBalance());
      setEquity(brokerEngine.getEquity());
      setOpenPositions(brokerEngine.getOpenPositions());
      setClosedPositions(brokerEngine.getClosedPositions());
      setMarginUsed(brokerEngine.getMarginUsed());
      setProfitFactor(brokerEngine.getProfitFactor());
      setWinRate(brokerEngine.getWinRate());
    };

    brokerEngine.onTradeEvent(handleTradeEvent);
    setIsInitialized(true);

    // Initial state update
    setBalance(brokerEngine.getBalance());
    setEquity(brokerEngine.getEquity());
    setOpenPositions(brokerEngine.getOpenPositions());
    setClosedPositions(brokerEngine.getClosedPositions());
    setMarginUsed(brokerEngine.getMarginUsed());
    setProfitFactor(brokerEngine.getProfitFactor());
    setWinRate(brokerEngine.getWinRate());

    return () => {
      brokerEngine.offTradeEvent(handleTradeEvent);
    };
  }, [brokerEngine]);

  // Place a new order
  const placeOrder = useCallback((
    type: 'buy' | 'sell',
    price: number,
    sl: number,
    tp: number,
    size?: number
  ): Trade | null => {
    const trade = brokerEngine.placeOrder(type, price, sl, tp, size);
    if (trade) {
      // Trigger state update
      setBalance(brokerEngine.getBalance());
      setEquity(brokerEngine.getEquity());
      setOpenPositions(brokerEngine.getOpenPositions());
      setClosedPositions(brokerEngine.getClosedPositions());
      setMarginUsed(brokerEngine.getMarginUsed());
      setProfitFactor(brokerEngine.getProfitFactor());
      setWinRate(brokerEngine.getWinRate());
    }
    return trade;
  }, [brokerEngine]);

  // Close a specific trade
  const closeTrade = useCallback((tradeId: string, exitPrice?: number): Trade | null => {
    const trade = brokerEngine.closeTrade(tradeId, exitPrice);
    if (trade) {
      // Trigger state update
      setBalance(brokerEngine.getBalance());
      setEquity(brokerEngine.getEquity());
      setOpenPositions(brokerEngine.getOpenPositions());
      setClosedPositions(brokerEngine.getClosedPositions());
      setMarginUsed(brokerEngine.getMarginUsed());
      setProfitFactor(brokerEngine.getProfitFactor());
      setWinRate(brokerEngine.getWinRate());
    }
    return trade;
  }, [brokerEngine]);

  // Close all open positions
  const closeAllPositions = useCallback(() => {
    brokerEngine.closeAllPositions();
    // Trigger state update
    setBalance(brokerEngine.getBalance());
    setEquity(brokerEngine.getEquity());
    setOpenPositions(brokerEngine.getOpenPositions());
    setClosedPositions(brokerEngine.getClosedPositions());
    setMarginUsed(brokerEngine.getMarginUsed());
    setProfitFactor(brokerEngine.getProfitFactor());
    setWinRate(brokerEngine.getWinRate());
  }, [brokerEngine]);

  // Reset broker to initial state
  const reset = useCallback(() => {
    brokerEngine.reset();
    // Trigger state update
    setBalance(brokerEngine.getBalance());
    setEquity(brokerEngine.getEquity());
    setOpenPositions(brokerEngine.getOpenPositions());
    setClosedPositions(brokerEngine.getClosedPositions());
    setMarginUsed(brokerEngine.getMarginUsed());
    setProfitFactor(brokerEngine.getProfitFactor());
    setWinRate(brokerEngine.getWinRate());
  }, [brokerEngine]);

  // Update broker with current market price (for P&L calculations)
  const updatePrice = useCallback((currentPrice: number) => {
    brokerEngine.update(currentPrice);
  }, [brokerEngine]);

  // Get current broker statistics
  const getStats = useCallback(() => ({
    balance: brokerEngine.getBalance(),
    equity: brokerEngine.getEquity(),
    marginUsed: brokerEngine.getMarginUsed(),
    profitFactor: brokerEngine.getProfitFactor(),
    winRate: brokerEngine.getWinRate(),
    openPositionsCount: brokerEngine.getOpenPositions().length,
    closedPositionsCount: brokerEngine.getClosedPositions().length
  }), [brokerEngine]);

  // Get broker engine instance (for advanced usage)
  const getBrokerEngine = useCallback(() => brokerEngine, [brokerEngine]);

  return {
    // State
    balance,
    equity,
    openPositions,
    closedPositions,
    marginUsed,
    profitFactor,
    winRate,
    isInitialized,

    // Actions
    placeOrder,
    closeTrade,
    closeAllPositions,
    reset,
    updatePrice,
    getStats,
    getBrokerEngine,

    // Derived state
    totalUnrealizedPnL: equity - balance,
    marginLevel: balance > 0 ? (equity / balance) * 100 : 0,
    hasOpenPositions: openPositions.length > 0,
    hasClosedPositions: closedPositions.length > 0
  };
};

export default useBroker;