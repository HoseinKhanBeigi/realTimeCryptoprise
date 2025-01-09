import { WebSocket } from "ws";
import { notifyOnHighVelocity, calculateMetrics } from "./metrics.js";

const symbols = ["btcusdt", "ethusdt", "adausdt", "pepeusdt"];

export function setupWebSocket(server) {
  const wsBinance = new WebSocket(
    `wss://stream.binance.com:9443/stream?streams=${symbols
      .map((symbol) => `${symbol}@trade`)
      .join("/")}`
  );

  const coinData = {};
  const timestamps = {};

  wsBinance.on("message", (message) => {
    const data = JSON.parse(message);
    const stream = data.stream;
    const symbol = stream.split("@")[0];
    const trade = data.data;

    const nextNumber = parseFloat(trade.p);
    if (isNaN(nextNumber)) return;

    const now = Date.now();
    if (!coinData[symbol]) {
      coinData[symbol] = [];
      timestamps[symbol] = now;
    }

    if (now - timestamps[symbol] >= 1000) {
      timestamps[symbol] = now;
      coinData[symbol].push(nextNumber);

      if (coinData[symbol].length >= 60) {
        const metrics = calculateMetrics(coinData[symbol]);
        console.log(`Metrics for ${symbol.toUpperCase()}:`, metrics);

        if (metrics.avgVelocity > 0.3) {
          notifyOnHighVelocity(symbol, metrics.avgVelocity);
        }

        coinData[symbol] = [];
      }
    }
  });

  wsBinance.on("error", (err) =>
    console.error("Binance WebSocket Error:", err)
  );
  wsBinance.on("close", () => console.log("Binance WebSocket closed"));
}
