"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper function to format prices with appropriate decimals
function formatPrice(price) {
  if (price >= 1) return price.toFixed(2); // For prices >= 1, use 2 decimals
  if (price > 0.0001) return price.toFixed(6); // For small prices, use 6 decimals
  return price.toFixed(8); // For very small prices, use 8 decimals
}

export default function CryptoWebSocket() {
  const [prices, setPrices] = useState({});
  const [latestPrices, setLatestPrices] = useState({});
  const [alerts, setAlerts] = useState([]);
  const threshold = 0.1;

  const alwaysIncludedSymbols = [
    "dogeusdt",
    // "pepeusdt",
    // "babydogeusdt",
    // "bobusdt",
    // "peopleusdt",
  ];
  const [symbols, setSymbols] = useState([]);

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

      const combinedSymbols = [...new Set([...alwaysIncludedSymbols])];

      setSymbols(combinedSymbols);
    };
    console.log("combinedSymbols");
    // fetchSymbols();
  }, []);

  useEffect(() => {
    if (symbols.length === 0) return;

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${symbols
        .map((symbol) => `${symbol}@trade`)
        .join("/")}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const stream = data.stream;
      const symbol = stream.split("@")[0];
      const trade = data.data;

      const currentTime = new Date().toLocaleTimeString();
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
  }, [symbols]);

  useEffect(() => {
    const detectedAlerts = Object.entries(prices).flatMap(
      ([symbol, priceList]) => {
        return priceList.reduce((acc, current, idx) => {
          if (idx === 0) return acc;

          const [prevTime, prevPrice] = Object.entries(priceList[idx - 1])[0];
          const [currTime, currPrice] = Object.entries(current)[0];
          const change = currPrice - prevPrice;

          if (Math.abs(change) >= threshold) {
            acc.push({
              symbol,
              time: currTime,
              message: `${symbol.toUpperCase()} moved ${
                change > 0 ? "up" : "down"
              } by $${Math.abs(change)}: ${formatPrice(
                prevPrice
              )} -> ${formatPrice(currPrice)}`,
            });
          }

          return acc;
        }, []);
      }
    );

    detectedAlerts.forEach((alert) => {
      toast.info(alert.message, {
        position: toast.POSITION.TOP_RIGHT,
      });
    });

    setAlerts(detectedAlerts);
  }, [prices]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Real-Time Crypto Price Tracker
      </h1>
      <ToastContainer />
      <h2 className="text-2xl font-semibold mb-4">Latest Prices:</h2>
      <ul className="list-disc pl-6 mb-6">
        {Object.entries(latestPrices).map(([symbol, price]) => (
          <li key={symbol} className="text-lg">
            {symbol.toUpperCase()}: ${formatPrice(price)}
          </li>
        ))}
      </ul>
    </div>
  );
}
