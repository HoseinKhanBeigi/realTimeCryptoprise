"use client";

import { useEffect, useState } from "react";

// Helper function to format prices to integers
function formatToInteger(price) {
  if (price >= 1) {
    return price;
  } else if (price > 0.0001) {
    return Math.round(price * 1_000_0);
  } else {
    return Math.round(price * 100_000_000);
  }
}

const calculateMetrics = (data) => {
  if (data.length < 2) {
    return { velocities: [], totalChange: 0, avgVelocity: 0 };
  }

  const velocities = [];
  let totalChange = 0;

  for (let i = 0; i < data.length - 1; i++) {
    const change = data[i + 1] - data[i];
    velocities.push(change);
    totalChange += change;
  }

  const totalTime = data.length - 1;
  const avgVelocity = totalTime > 0 ? totalChange / totalTime : 0;

  return { velocities, totalChange, avgVelocity };
};

export default function CryptoWebSocket() {
  const [prices, setPrices] = useState({});
  const [metrics, setMetrics] = useState({});
  const [symbols, setSymbols] = useState([]);

  const alwaysIncludedSymbols = [
    "adausdt",
    "bonkusdt",
    "pepeusdt",
    "babydogeusdt",
    "bobusdt",
  ];

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const fetchSymbols = async () => {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/price"
      );
      const data = await response.json();
      const topSymbols = data
        .filter((item) => item.symbol.endsWith("USDT"))
        .slice(0, 50)
        .map((item) => item.symbol.toLowerCase());
      setSymbols([...new Set([...topSymbols, ...alwaysIncludedSymbols])]);
    };
    fetchSymbols();
  }, []);

  useEffect(() => {
    if (symbols.length === 0) return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${symbols
        .map((symbol) => `${symbol}@trade`)
        .join("/")}`
    );

    const coinData = {};
    const timestamps = {};

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const stream = data.stream;
      const symbol = stream.split("@")[0];
      const trade = data.data;

      const nextNumber = parseFloat(trade.p);
      if (isNaN(nextNumber)) return;

      const formattedPrice = formatToInteger(nextNumber);
      const now = Date.now();

      if (!coinData[symbol]) {
        coinData[symbol] = [];
        timestamps[symbol] = now;
      }

      if (now - timestamps[symbol] >= 1000) {
        timestamps[symbol] = now;
        coinData[symbol].push(formattedPrice);

        if (coinData[symbol].length >= 60) {
          const result = calculateMetrics(coinData[symbol]);
          setMetrics((prev) => ({ ...prev, [symbol]: result }));

          if (result.avgVelocity > 1 && Notification.permission === "granted") {
            new Notification("High Velocity Alert", {
              body: `Symbol: ${symbol.toUpperCase()} | Avg Velocity: ${result.avgVelocity.toFixed(
                2
              )}`,
            });
          }

          coinData[symbol] = [];
        }
      }

      setPrices((prev) => ({ ...prev, [symbol]: formattedPrice }));
    };

    return () => ws.close();
  }, [symbols]);

  return (
    <div>
      <h2>Latest Prices:</h2>
      <ul>
        {Object.entries(prices).map(([symbol, price]) => (
          <li key={symbol}>
            {symbol.toUpperCase()}: {price}
          </li>
        ))}
      </ul>

      <h2>Metrics:</h2>
      <ul>
        {Object.entries(metrics).map(([symbol, metric]) => (
          <li key={symbol}>
            {symbol.toUpperCase()} - Avg Velocity:{" "}
            {metric.avgVelocity.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
