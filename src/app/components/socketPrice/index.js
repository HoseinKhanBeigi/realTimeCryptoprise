// "use client";

// import { useEffect, useState } from "react";

// // Helper function to format prices to integers
// function formatToInteger(price) {
//   if (price >= 1) {
//     // If price is already a big number, leave it as-is
//     return price; // No conversion for numbers >= 1
//   } else if (price > 0.0001) {
//     // For small prices, keep six decimal places and convert
//     return Math.round(price * 1_000_0);
//   } else {
//     // For very small prices, keep eight decimal places and convert
//     return Math.round(price * 100_000_000);
//   }
// }

// const calculateMetrics = (data) => {
//   if (data.length < 2) {
//     return {
//       velocities: [],
//       totalChange: 0,
//       avgVelocity: 0,
//     };
//   }

//   const velocities = [];
//   let totalChange = 0;

//   for (let i = 0; i < data.length - 1; i++) {
//     const change = data[i + 1] - data[i];
//     velocities.push(change); // No need for `.toFixed` since data is already integers
//     totalChange += change;
//   }

//   const totalTime = data.length - 1;
//   const avgVelocity = totalTime > 0 ? totalChange / totalTime : 0;

//   return {
//     velocities,
//     totalChange,
//     avgVelocity,
//   };
// };

// export default function CryptoWebSocket() {
//   const [prices, setPrices] = useState({});
//   const [metrics, setMetrics] = useState({});
//   const [symbols, setSymbols] = useState([]);

//   const alwaysIncludedSymbols = [
//     "adausdt",
//     "bonkusdt",
//     "pepeusdt",
//     "babydogeusdt",
//     "bobusdt",
//     "peopleusdt",
//   ];

//   useEffect(() => {
//     const fetchSymbols = async () => {
//       const response = await fetch(
//         "https://api.binance.com/api/v3/ticker/price"
//       );
//       const data = await response.json();

//       const topSymbols = data
//         .filter((item) => item.symbol.endsWith("USDT"))
//         .slice(0, 50)
//         .map((item) => item.symbol.toLowerCase());

//       const combinedSymbols = [
//         ...new Set([...topSymbols, ...alwaysIncludedSymbols]),
//       ];

//       setSymbols(combinedSymbols);
//     };

//     fetchSymbols();
//   }, []);

//   useEffect(() => {
//     if (symbols.length === 0) return;

//     const ws = new WebSocket(
//       `wss://stream.binance.com:9443/stream?streams=${symbols
//         .map((symbol) => `${symbol}@trade`)
//         .join("/")}`
//     );

//     const coinData = {}; // Track data for each coin
//     const timestamps = {}; // Track timestamps for each coin

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       const stream = data.stream;
//       const symbol = stream.split("@")[0];
//       const trade = data.data;

//       const nextNumber = parseFloat(trade.p);
//       if (isNaN(nextNumber)) return;

//       const formattedPrice = formatToInteger(nextNumber); // Format price as integer

//       const now = Date.now();

//       // Initialize tracking for new symbols
//       if (!coinData[symbol]) {
//         coinData[symbol] = [];
//         timestamps[symbol] = now;
//       }

//       // Enforce real-second updates
//       if (now - timestamps[symbol] >= 1000) {
//         timestamps[symbol] = now; // Update last timestamp
//         coinData[symbol].push(formattedPrice); // Use formatted integer price

//         console.log(
//           `${symbol.toUpperCase()} - Second ${
//             coinData[symbol].length
//           }: Original Price ${nextNumber}, Formatted Price: ${formattedPrice}`
//         );

//         // Calculate metrics after 60 seconds
//         if (coinData[symbol].length >= 60) {
//           const result = calculateMetrics(coinData[symbol]); // Metrics use integer data
//           setMetrics((prevMetrics) => ({
//             ...prevMetrics,
//             [symbol]: result,
//           }));

//           console.log(`Metrics for ${symbol.toUpperCase()}:`, result);

//           // Reset the array for the next minute
//           coinData[symbol] = [];
//         }
//       }

//       // Update the latest price
//       setPrices((prevPrices) => ({
//         ...prevPrices,
//         [symbol]: formattedPrice, // Store integer price for display
//       }));
//     };

//     return () => ws.close();
//   }, [symbols]);

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-3xl font-bold text-center mb-6">
//         Real-Time Crypto Price Tracker
//       </h1>

//       <h2 className="text-2xl font-semibold mb-4">Latest Prices:</h2>
//       <ul className="list-disc pl-6 mb-6">
//         {Object.entries(prices).map(([symbol, price]) => (
//           <li key={symbol} className="text-lg">
//             {symbol.toUpperCase()}: {price}
//           </li>
//         ))}
//       </ul>

//       <h2 className="text-2xl font-semibold mb-4">Metrics:</h2>
//       <ul className="list-disc pl-6">
//         {Object.entries(metrics).map(([symbol, metric]) => (
//           <li key={symbol} className="text-lg">
//             {symbol.toUpperCase()} - Total Change: {metric?.totalChange || 0},{" "}
//             Avg Velocity: {metric?.avgVelocity || 0}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";

// Helper function to format prices to integers
function formatToInteger(price) {
  if (price >= 1) {
    return price; // No conversion for numbers >= 1
  } else if (price > 0.0001) {
    return Math.round(price * 1_000_0);
  } else {
    return Math.round(price * 100_000_000);
  }
}

const calculateMetrics = (data) => {
  if (data.length < 2) {
    return {
      velocities: [],
      totalChange: 0,
      avgVelocity: 0,
    };
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

  return {
    velocities,
    totalChange,
    avgVelocity,
  };
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
    "peopleusdt",
  ];

  // Request Notification Permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          console.warn("Notifications are disabled.");
        }
      });
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

        console.log(
          `${symbol.toUpperCase()} - Second ${
            coinData[symbol].length
          }: Original Price ${nextNumber}, Formatted Price: ${formattedPrice}`
        );

        if (coinData[symbol].length >= 60) {
          const result = calculateMetrics(coinData[symbol]);
          setMetrics((prevMetrics) => ({
            ...prevMetrics,
            [symbol]: result,
          }));

          console.log(`Metrics for ${symbol.toUpperCase()}:`, result);

          // Trigger a notification if avgVelocity exceeds a threshold
          if (
            result.avgVelocity > 10 &&
            Notification.permission === "granted"
          ) {
            new Notification("High Velocity Alert", {
              body: `Symbol: ${symbol.toUpperCase()} | AvgVelocity: ${result.avgVelocity.toFixed(
                2
              )}`,
              // icon: "/icon.png", // Optional icon path
            });
          }

          coinData[symbol] = [];
        }
      }

      setPrices((prevPrices) => ({
        ...prevPrices,
        [symbol]: formattedPrice,
      }));
    };

    return () => ws.close();
  }, [symbols]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Real-Time Crypto Price Tracker
      </h1>

      <h2 className="text-2xl font-semibold mb-4">Latest Prices:</h2>
      <ul className="list-disc pl-6 mb-6">
        {Object.entries(prices).map(([symbol, price]) => (
          <li key={symbol} className="text-lg">
            {symbol.toUpperCase()}: {price}
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Metrics:</h2>
      <ul className="list-disc pl-6">
        {Object.entries(metrics).map(([symbol, metric]) => (
          <li key={symbol} className="text-lg">
            {symbol.toUpperCase()} - Total Change: {metric?.totalChange || 0},{" "}
            Avg Velocity: {metric?.avgVelocity || 0}
          </li>
        ))}
      </ul>
    </div>
  );
}
