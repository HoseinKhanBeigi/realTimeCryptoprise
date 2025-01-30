"use client";

import Pusher from 'pusher-js';
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

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });

    const channel = pusher.subscribe('crypto-channel');
    channel.bind('price-update', (data) => {
      setData(data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  return (
    <main>
      {/* Display your data here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
