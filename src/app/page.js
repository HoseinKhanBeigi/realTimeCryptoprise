"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/subscription');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <main>
      {error && <div>Error: {error}</div>}
      {data && (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {!data && !error && <div>Loading...</div>}
    </main>
  );
}
