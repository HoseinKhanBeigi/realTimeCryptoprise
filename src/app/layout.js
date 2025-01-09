import CryptoWebSocket from "./components/CryptoWebSocket";

export const metadata = {
  title: "Crypto Tracker",
  description: "Real-time crypto tracking with velocity alerts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CryptoWebSocket />
        {children}
      </body>
    </html>
  );
}
