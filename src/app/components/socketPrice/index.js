"use client";
import dynamic from "next/dynamic";

const CryptoWebSocket = dynamic(() => import("./TradingViewPrice"), {
  ssr: false,
});

export default CryptoWebSocket;
