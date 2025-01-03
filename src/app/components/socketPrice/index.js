"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper function to format prices
function formatPrice(price) {
  if (price >= 1) return price.toFixed(2);
  if (price > 0.0001) return price.toFixed(6);
  return price.toFixed(8);
}

export default function CryptoWebSocket() {
  const [prices, setPrices] = useState({});
  const [latestPrices, setLatestPrices] = useState({});
  const [alerts, setAlerts] = useState([]);
  const threshold = 0.1;

  const alwaysIncludedSymbols = [
    "dogeusdt",
    "pepeusdt",
    "1mbabydogeusdt",
    "bonkusdt",
    "peopleusdt",
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

      const combinedSymbols = [
        ...new Set([...topSymbols, ...alwaysIncludedSymbols]),
      ];
      setSymbols(combinedSymbols);
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
            const alertMessage = `${symbol.toUpperCase()} moved ${
              change > 0 ? "up" : "down"
            } by $${Math.abs(change)}: ${formatPrice(
              prevPrice
            )} -> ${formatPrice(currPrice)}`;
            acc.push({
              symbol,
              time: currTime,
              message: alertMessage,
            });

            // toast.info(alertMessage);
          }

          return acc;
        }, []);
      }
    );

    setAlerts((prevAlerts) => [...prevAlerts, ...detectedAlerts].slice(-10)); // Keep last 10 alerts
  }, [prices]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Real-Time Crypto Price Tracker
      </h1>
      {/* <ToastContainer position="top-right" /> */}
      <h2 className="text-2xl font-semibold mb-4">Latest Prices:</h2>
      <ul className="list-disc pl-6 mb-6">
        {Object.entries(latestPrices).map(([symbol, price]) => (
          <li key={symbol} className="text-lg">
            {symbol.toUpperCase()}: ${formatPrice(price)}
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
