export const config = {
  runtime: 'edge',
};

export async function GET() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws');
  
  binanceWs.onmessage = async (event) => {
    await writer.write(event.data);
  };
  
  return new Response(stream.readable);
} 