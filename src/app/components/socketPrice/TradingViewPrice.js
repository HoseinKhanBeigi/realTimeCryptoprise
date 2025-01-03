"use client";

import { useEffect, useState } from "react";

// Utility function to detect rapid price changes
function detectRapidChanges(data, threshold) {
  const alerts = [];

  for (const symbol in data) {
    const prices = data[symbol];
    for (let i = 1; i < prices.length; i++) {
      const [prevTime, prevPrice] = Object.entries(prices[i - 1])[0];
      const [currTime, currPrice] = Object.entries(prices[i])[0];

      const change = currPrice - prevPrice;

      if (Math.abs(change) >= threshold) {
        const direction = change > 0 ? "up" : "down";
        alerts.push({
          symbol,
          time: currTime,
          message: `${symbol.toUpperCase()} moved ${direction} by $${Math.abs(
            change
          )}: ${prevPrice} -> ${currPrice}`,
        });
      }
    }
  }

  return alerts;
}

export default function CryptoWebSocket() {
  const [prices, setPrices] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [latestPrices, setLatestPrices] = useState({});
  const threshold = 0.1; // Threshold for rapid price change detection

  const alwaysIncludedSymbols = [
    "dogeusdt",
    "pepeusdt",
    "babydogeusdt",
    "bobusdt",
    "peopleusdt",
  ]; // Ensure these are always tracked
  const lastNotification = {}; // Tracks the last notification time per coin

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch(
          "https://api.binance.com/api/v3/ticker/price"
        );
        const data = await response.json();

        // Get the top 50 USDT trading pairs
        const topSymbols = data
          .filter((item) => item.symbol.endsWith("USDT"))
          .slice(0, 50)
          .map((item) => item.symbol.toLowerCase());

        // Combine top symbols with always included symbols (remove duplicates)
        const combinedSymbols = Array.from(
          new Set([...topSymbols, ...alwaysIncludedSymbols])
        );

        // Initialize the prices object for all tracked symbols
        setPrices(
          Object.fromEntries(combinedSymbols.map((symbol) => [symbol, []]))
        );
      } catch (error) {
        console.error("Error fetching symbols:", error);
      }
    };

    fetchSymbols();
  }, []);

  useEffect(() => {
    if (Object.keys(prices).length === 0) return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${Object.keys(prices)
        .map((symbol) => `${symbol}@trade`)
        .join("/")}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const stream = data.stream; // Example: "btcusdt@trade"
      const symbol = stream.split("@")[0];
      const trade = data.data;
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const currentPrice = parseFloat(trade.p);

      setPrices((prevPrices) => {
        const updatedPrices = { ...prevPrices };
        if (!updatedPrices[symbol]) updatedPrices[symbol] = [];
        updatedPrices[symbol].push({ [currentTime]: currentPrice });

        if (updatedPrices[symbol].length > 5) {
          updatedPrices[symbol].shift();
        }

        return updatedPrices;
      });

      setLatestPrices((prevPrices) => ({
        ...prevPrices,
        [symbol]: currentPrice,
      }));
    };

    return () => ws.close();
  }, [prices]);

  // useEffect(() => {
  //   if (Notification.permission !== "granted") {
  //     console.error("Notification permissions not granted");
  //     return;
  //   }

  //   const detectedAlerts = detectRapidChanges(prices, threshold);
  //   const cooldown = 5000; // 5 seconds cooldown per coin

  //   detectedAlerts.forEach((alert) => {
  //     const now = Date.now();
  //     if (
  //       !lastNotification[alert.symbol] ||
  //       now - lastNotification[alert.symbol] > cooldown
  //     ) {
  //       console.log("Notification triggered for:", alert.message);
  //       new Notification("Crypto Price Alert", {
  //         body: alert.message,
  //       });
  //       lastNotification[alert.symbol] = now;
  //     }
  //   });

  //   setAlerts(detectedAlerts);
  // }, [prices]);

  useEffect(() => {
    if (!("Notification" in window)) {
      console.error("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          console.error("Notification permissions denied");
        }
      });
    }

    const detectedAlerts = detectRapidChanges(prices, threshold);
    const cooldown = 5000; // 5 seconds cooldown per coin

    detectedAlerts.forEach((alert) => {
      const now = Date.now();
      if (
        !lastNotification[alert.symbol] ||
        now - lastNotification[alert.symbol] > cooldown
      ) {
        try {
          new Notification("Crypto Price Alert", {
            body: alert.message,
          });
          lastNotification[alert.symbol] = now;
        } catch (error) {
          console.error("Error showing notification:", error);
        }
      }
    });

    setAlerts(detectedAlerts);
  }, [prices]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Real-Time Crypto Price Tracker
      </h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={() => Notification.requestPermission()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Enable Notifications
        </button>
      </div>
      <h2 className="text-2xl font-semibold mb-4">Latest Prices:</h2>
      <ul className="list-disc pl-6 mb-6">
        {Object.entries(latestPrices).map(([symbol, price]) => (
          <li key={symbol} className="text-lg">
            {symbol.toUpperCase()}: ${price.toFixed(2)}
          </li>
        ))}
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Price Alerts:</h2>
      {alerts.length > 0 ? (
        <ul className="list-disc pl-6">
          {alerts.map((alert, index) => (
            <li key={index} className="text-red-500">
              {`${alert.time}: ${alert.message}`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center">No rapid changes detected.</p>
      )}
    </div>
  );
}
