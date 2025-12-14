/**
 * Zod validation schemas for PyTrader
 */
import { z } from 'zod';
export declare const IntervalSchema: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
export declare const SignalActionSchema: z.ZodEnum<["buy", "sell", "hold"]>;
export declare const DataProviderSchema: z.ZodEnum<["binance", "coinbase", "mock"]>;
export declare const LogLevelSchema: z.ZodEnum<["debug", "info", "warn", "error"]>;
export declare const OHLCVCandleSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    timestamp: z.ZodNumber;
    open: z.ZodNumber;
    high: z.ZodNumber;
    low: z.ZodNumber;
    close: z.ZodNumber;
    volume: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}>;
export declare const SymbolSchema: z.ZodObject<{
    symbol: z.ZodString;
    exchange: z.ZodString;
    type: z.ZodEnum<["crypto", "stock", "forex"]>;
    baseAsset: z.ZodString;
    quoteAsset: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    type: "crypto" | "stock" | "forex";
    exchange: string;
    baseAsset: string;
    quoteAsset: string;
}, {
    symbol: string;
    type: "crypto" | "stock" | "forex";
    exchange: string;
    baseAsset: string;
    quoteAsset: string;
}>;
export declare const RawCandleSchema: z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodString;
    timestamp: z.ZodNumber;
    open: z.ZodNumber;
    high: z.ZodNumber;
    low: z.ZodNumber;
    close: z.ZodNumber;
    volume: z.ZodNumber;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    symbol: z.ZodString;
    interval: z.ZodString;
    timestamp: z.ZodNumber;
    open: z.ZodNumber;
    high: z.ZodNumber;
    low: z.ZodNumber;
    close: z.ZodNumber;
    volume: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    symbol: z.ZodString;
    interval: z.ZodString;
    timestamp: z.ZodNumber;
    open: z.ZodNumber;
    high: z.ZodNumber;
    low: z.ZodNumber;
    close: z.ZodNumber;
    volume: z.ZodNumber;
}, z.ZodTypeAny, "passthrough">>;
export declare const SignalSchema: z.ZodObject<{
    symbol: z.ZodString;
    timestamp: z.ZodNumber;
    action: z.ZodEnum<["buy", "sell", "hold"]>;
    confidence: z.ZodNumber;
    strategyId: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timestamp: number;
    action: "buy" | "sell" | "hold";
    confidence: number;
    strategyId: string;
    metadata?: Record<string, any> | undefined;
}, {
    symbol: string;
    timestamp: number;
    action: "buy" | "sell" | "hold";
    confidence: number;
    strategyId: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const IndicatorNameSchema: z.ZodEnum<["ema_20", "ema_50", "ema_200", "rsi_14", "macd", "bollinger_bands", "volume_sma"]>;
export declare const IndicatorResultSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
}, "strip", z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, z.objectOutputType<{
    timestamp: z.ZodNumber;
}, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">, z.objectInputType<{
    timestamp: z.ZodNumber;
}, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">>;
export declare const SubscribeCandlesMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"subscribe_candles">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}, {
    type: "subscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}>;
export declare const UnsubscribeCandlesMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe_candles">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}, {
    type: "unsubscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}>;
export declare const SubscribeSignalsMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"subscribe_signals">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodOptional<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>>;
        strategyId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}, {
    type: "subscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}>;
export declare const UnsubscribeSignalsMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe_signals">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodOptional<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>>;
        strategyId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}, {
    type: "unsubscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}>;
export declare const CandleUpdateMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"candle_update">;
    payload: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        timestamp: z.ZodNumber;
        open: z.ZodNumber;
        high: z.ZodNumber;
        low: z.ZodNumber;
        close: z.ZodNumber;
        volume: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "candle_update";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
}, {
    type: "candle_update";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
}>;
export declare const SignalUpdateMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"signal_update">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        timestamp: z.ZodNumber;
        action: z.ZodEnum<["buy", "sell", "hold"]>;
        confidence: z.ZodNumber;
        strategyId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "signal_update";
    payload: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    };
}, {
    type: "signal_update";
    payload: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    };
}>;
export declare const ErrorMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"error">;
    payload: z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | undefined;
    }, {
        message: string;
        code?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "error";
    payload: {
        message: string;
        code?: string | undefined;
    };
}, {
    type: "error";
    payload: {
        message: string;
        code?: string | undefined;
    };
}>;
export declare const ClientMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"subscribe_candles">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}, {
    type: "subscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe_candles">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}, {
    type: "unsubscribe_candles";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"subscribe_signals">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodOptional<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>>;
        strategyId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "subscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}, {
    type: "subscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe_signals">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodOptional<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>>;
        strategyId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }, {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "unsubscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}, {
    type: "unsubscribe_signals";
    payload: {
        symbol: string;
        interval?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w" | undefined;
        strategyId?: string | undefined;
    };
}>]>;
export declare const ProviderSubscriptionSchema: z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
}>;
export declare const ProviderStateChangeMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"provider_state_change">;
    payload: z.ZodObject<{
        provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
        status: z.ZodEnum<["connected", "disconnected", "error"]>;
        activeSubscriptions: z.ZodArray<z.ZodObject<{
            symbol: z.ZodString;
            interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }, {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }>, "many">;
        errorMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    }, {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "provider_state_change";
    payload: {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    };
}, {
    type: "provider_state_change";
    payload: {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    };
}>;
export declare const ServerMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"candle_update">;
    payload: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        timestamp: z.ZodNumber;
        open: z.ZodNumber;
        high: z.ZodNumber;
        low: z.ZodNumber;
        close: z.ZodNumber;
        volume: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "candle_update";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
}, {
    type: "candle_update";
    payload: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"signal_update">;
    payload: z.ZodObject<{
        symbol: z.ZodString;
        timestamp: z.ZodNumber;
        action: z.ZodEnum<["buy", "sell", "hold"]>;
        confidence: z.ZodNumber;
        strategyId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "signal_update";
    payload: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    };
}, {
    type: "signal_update";
    payload: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    payload: z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | undefined;
    }, {
        message: string;
        code?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "error";
    payload: {
        message: string;
        code?: string | undefined;
    };
}, {
    type: "error";
    payload: {
        message: string;
        code?: string | undefined;
    };
}>, z.ZodObject<{
    type: z.ZodLiteral<"provider_state_change">;
    payload: z.ZodObject<{
        provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
        status: z.ZodEnum<["connected", "disconnected", "error"]>;
        activeSubscriptions: z.ZodArray<z.ZodObject<{
            symbol: z.ZodString;
            interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        }, "strip", z.ZodTypeAny, {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }, {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }>, "many">;
        errorMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    }, {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "provider_state_change";
    payload: {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    };
}, {
    type: "provider_state_change";
    payload: {
        provider: "binance" | "coinbase" | "mock";
        status: "error" | "connected" | "disconnected";
        activeSubscriptions: {
            symbol: string;
            interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        }[];
        errorMessage?: string | undefined;
    };
}>]>;
export declare const GetCandlesRequestSchema: z.ZodEffects<z.ZodObject<{
    provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    from: z.ZodNumber;
    to: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from: number;
    to: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from: number;
    to: number;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from: number;
    to: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from: number;
    to: number;
}>;
export declare const GetCandlesResponseSchema: z.ZodObject<{
    candles: z.ZodArray<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        timestamp: z.ZodNumber;
        open: z.ZodNumber;
        high: z.ZodNumber;
        low: z.ZodNumber;
        close: z.ZodNumber;
        volume: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    candles: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
}, {
    candles: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
}>;
export declare const CandlePageDirectionSchema: z.ZodEnum<["forward", "backward"]>;
export declare const PageCandlesRequestSchema: z.ZodObject<{
    provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    cursor: z.ZodNumber;
    direction: z.ZodDefault<z.ZodEnum<["forward", "backward"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    cursor: number;
    direction: "forward" | "backward";
    limit: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    cursor: number;
    direction?: "forward" | "backward" | undefined;
    limit?: number | undefined;
}>;
export declare const PageCandlesResponseSchema: z.ZodObject<{
    candles: z.ZodArray<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
        timestamp: z.ZodNumber;
        open: z.ZodNumber;
        high: z.ZodNumber;
        low: z.ZodNumber;
        close: z.ZodNumber;
        volume: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>, "many">;
    nextCursor: z.ZodNullable<z.ZodNumber>;
    prevCursor: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    candles: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
    nextCursor: number | null;
    prevCursor: number | null;
}, {
    candles: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
        timestamp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
    nextCursor: number | null;
    prevCursor: number | null;
}>;
export declare const GetSymbolsResponseSchema: z.ZodObject<{
    symbols: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        exchange: z.ZodString;
        type: z.ZodEnum<["crypto", "stock", "forex"]>;
        baseAsset: z.ZodString;
        quoteAsset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        type: "crypto" | "stock" | "forex";
        exchange: string;
        baseAsset: string;
        quoteAsset: string;
    }, {
        symbol: string;
        type: "crypto" | "stock" | "forex";
        exchange: string;
        baseAsset: string;
        quoteAsset: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    symbols: {
        symbol: string;
        type: "crypto" | "stock" | "forex";
        exchange: string;
        baseAsset: string;
        quoteAsset: string;
    }[];
}, {
    symbols: {
        symbol: string;
        type: "crypto" | "stock" | "forex";
        exchange: string;
        baseAsset: string;
        quoteAsset: string;
    }[];
}>;
export declare const CalculateIndicatorsRequestSchema: z.ZodEffects<z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    from: z.ZodNumber;
    to: z.ZodNumber;
    indicators: z.ZodArray<z.ZodEnum<["ema_20", "ema_50", "ema_200", "rsi_14", "macd", "bollinger_bands", "volume_sma"]>, "many">;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    indicators: ("ema_20" | "ema_50" | "ema_200" | "rsi_14" | "macd" | "bollinger_bands" | "volume_sma")[];
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    indicators: ("ema_20" | "ema_50" | "ema_200" | "rsi_14" | "macd" | "bollinger_bands" | "volume_sma")[];
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    indicators: ("ema_20" | "ema_50" | "ema_200" | "rsi_14" | "macd" | "bollinger_bands" | "volume_sma")[];
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    indicators: ("ema_20" | "ema_50" | "ema_200" | "rsi_14" | "macd" | "bollinger_bands" | "volume_sma")[];
}>;
export declare const CalculateIndicatorsResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
    }, "strip", z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, z.objectOutputType<{
        timestamp: z.ZodNumber;
    }, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">, z.objectInputType<{
        timestamp: z.ZodNumber;
    }, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">>, "many">;
}, "strip", z.ZodTypeAny, {
    results: z.objectOutputType<{
        timestamp: z.ZodNumber;
    }, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">[];
}, {
    results: z.objectInputType<{
        timestamp: z.ZodNumber;
    }, z.ZodUnion<[z.ZodNumber, z.ZodUndefined]>, "strip">[];
}>;
export declare const GenerateSignalsRequestSchema: z.ZodEffects<z.ZodObject<{
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    from: z.ZodNumber;
    to: z.ZodNumber;
    strategyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    strategyId: string;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    strategyId: string;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    strategyId: string;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    from: number;
    to: number;
    strategyId: string;
}>;
export declare const GenerateSignalsResponseSchema: z.ZodObject<{
    signals: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        timestamp: z.ZodNumber;
        action: z.ZodEnum<["buy", "sell", "hold"]>;
        confidence: z.ZodNumber;
        strategyId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }, {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    signals: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }[];
}, {
    signals: {
        symbol: string;
        timestamp: number;
        action: "buy" | "sell" | "hold";
        confidence: number;
        strategyId: string;
        metadata?: Record<string, any> | undefined;
    }[];
}>;
export declare const MarketDataConfigSchema: z.ZodObject<{
    port: z.ZodNumber;
    provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
    sqlitePath: z.ZodString;
    symbols: z.ZodArray<z.ZodString, "many">;
    logLevel: z.ZodEnum<["debug", "info", "warn", "error"]>;
}, "strip", z.ZodTypeAny, {
    provider: "binance" | "coinbase" | "mock";
    logLevel: "error" | "debug" | "info" | "warn";
    symbols: string[];
    port: number;
    sqlitePath: string;
}, {
    provider: "binance" | "coinbase" | "mock";
    logLevel: "error" | "debug" | "info" | "warn";
    symbols: string[];
    port: number;
    sqlitePath: string;
}>;
export declare const ProviderConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    symbols: z.ZodArray<z.ZodString, "many">;
    intervals: z.ZodArray<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>, "many">;
    backfillOnStartup: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
    enabled: boolean;
    symbols: string[];
    backfillOnStartup: boolean;
}, {
    intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
    enabled: boolean;
    symbols: string[];
    backfillOnStartup: boolean;
}>;
export declare const MultiProviderConfigSchema: z.ZodObject<{
    version: z.ZodString;
    defaultBackfillHours: z.ZodNumber;
    providers: z.ZodObject<{
        binance: z.ZodObject<{
            enabled: z.ZodBoolean;
            symbols: z.ZodArray<z.ZodString, "many">;
            intervals: z.ZodArray<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>, "many">;
            backfillOnStartup: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }>;
        coinbase: z.ZodObject<{
            enabled: z.ZodBoolean;
            symbols: z.ZodArray<z.ZodString, "many">;
            intervals: z.ZodArray<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>, "many">;
            backfillOnStartup: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }>;
        mock: z.ZodObject<{
            enabled: z.ZodBoolean;
            symbols: z.ZodArray<z.ZodString, "many">;
            intervals: z.ZodArray<z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>, "many">;
            backfillOnStartup: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }, {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        binance: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        coinbase: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        mock: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
    }, {
        binance: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        coinbase: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        mock: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    version: string;
    defaultBackfillHours: number;
    providers: {
        binance: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        coinbase: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        mock: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
    };
}, {
    version: string;
    defaultBackfillHours: number;
    providers: {
        binance: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        coinbase: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
        mock: {
            intervals: ("1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w")[];
            enabled: boolean;
            symbols: string[];
            backfillOnStartup: boolean;
        };
    };
}>;
export declare const ProviderStatusSchema: z.ZodObject<{
    name: z.ZodEnum<["binance", "coinbase", "mock"]>;
    enabled: z.ZodBoolean;
    connected: z.ZodBoolean;
    subscriptions: z.ZodArray<z.ZodObject<{
        symbol: z.ZodString;
        interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }, {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }>, "many">;
    errorState: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    connected: boolean;
    name: "binance" | "coinbase" | "mock";
    enabled: boolean;
    subscriptions: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }[];
    errorState: string | null;
}, {
    connected: boolean;
    name: "binance" | "coinbase" | "mock";
    enabled: boolean;
    subscriptions: {
        symbol: string;
        interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    }[];
    errorState: string | null;
}>;
export declare const BackfillRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    from: z.ZodOptional<z.ZodNumber>;
    to: z.ZodOptional<z.ZodNumber>;
    hours: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}>, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    from?: number | undefined;
    to?: number | undefined;
    hours?: number | undefined;
}>;
export declare const BackfillResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    provider: z.ZodEnum<["binance", "coinbase", "mock"]>;
    symbol: z.ZodString;
    interval: z.ZodEnum<["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]>;
    candlesInserted: z.ZodNumber;
    candlesFetched: z.ZodNumber;
    timeRange: z.ZodObject<{
        from: z.ZodNumber;
        to: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        from: number;
        to: number;
    }, {
        from: number;
        to: number;
    }>;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    success: boolean;
    candlesInserted: number;
    candlesFetched: number;
    timeRange: {
        from: number;
        to: number;
    };
    duration: number;
}, {
    symbol: string;
    interval: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";
    provider: "binance" | "coinbase" | "mock";
    success: boolean;
    candlesInserted: number;
    candlesFetched: number;
    timeRange: {
        from: number;
        to: number;
    };
    duration: number;
}>;
export declare const GatewayConfigSchema: z.ZodObject<{
    port: z.ZodNumber;
    marketDataUrl: z.ZodString;
    analyticsUrl: z.ZodString;
    wsMaxConnections: z.ZodNumber;
    logLevel: z.ZodEnum<["debug", "info", "warn", "error"]>;
}, "strip", z.ZodTypeAny, {
    logLevel: "error" | "debug" | "info" | "warn";
    port: number;
    marketDataUrl: string;
    analyticsUrl: string;
    wsMaxConnections: number;
}, {
    logLevel: "error" | "debug" | "info" | "warn";
    port: number;
    marketDataUrl: string;
    analyticsUrl: string;
    wsMaxConnections: number;
}>;
export declare const AnalyticsConfigSchema: z.ZodObject<{
    port: z.ZodNumber;
    marketDataUrl: z.ZodString;
    logLevel: z.ZodEnum<["debug", "info", "warn", "error"]>;
}, "strip", z.ZodTypeAny, {
    logLevel: "error" | "debug" | "info" | "warn";
    port: number;
    marketDataUrl: string;
}, {
    logLevel: "error" | "debug" | "info" | "warn";
    port: number;
    marketDataUrl: string;
}>;
export declare const HealthResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["ok", "degraded", "down"]>;
    service: z.ZodString;
    timestamp: z.ZodNumber;
    version: z.ZodOptional<z.ZodString>;
    uptime: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    status: "ok" | "degraded" | "down";
    service: string;
    version?: string | undefined;
    uptime?: number | undefined;
}, {
    timestamp: number;
    status: "ok" | "degraded" | "down";
    service: string;
    version?: string | undefined;
    uptime?: number | undefined;
}>;
/**
 * Validate and parse data with a Zod schema
 */
export declare function validateAndParse<T>(schema: z.ZodType<T>, data: unknown): T;
/**
 * Safely validate data and return result with success/error
 */
export declare function safeValidate<T>(schema: z.ZodType<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
//# sourceMappingURL=index.d.ts.map