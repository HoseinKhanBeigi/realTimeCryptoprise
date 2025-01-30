import axios from 'axios';

// Telegram Service
class TelegramService {
  constructor() {
    this.telegramApiUrl = `https://api.telegram.org/bot7909173256:AAF9M8mc0QYmtO9SUYQPv6XkrPkAz2P_ImU`;
  }

  async setWebhook(url) {
    try {
      const response = await axios.post(`${this.telegramApiUrl}/setWebhook`, {
        url,
        allowed_updates: ['message'],
      });
      console.log('🎯 Webhook set response:', response.data);
    } catch (error) {
      console.error('❌ Failed to set webhook:', error.message);
    }
  }

  async sendMessage(chatId, text) {
    try {
      const numericChatId = Number(chatId);
      if (isNaN(numericChatId)) {
        console.error('❌ Invalid chat ID:', chatId);
        return;
      }

      console.log(`📤 Attempting to send message to chat ${numericChatId}`);
      const response = await axios.post(`${this.telegramApiUrl}/sendMessage`, {
        chat_id: numericChatId,
        text,
      });
      console.log('✉️ Message sent successfully:', response.data);
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  }

  async sendMetricsUpdate(symbol, metrics, chatId) {
    if (!chatId) {
      console.error('❌ No chat ID provided');
      return;
    }

    try {
      const message = `
📊 ${symbol.toUpperCase()} Update:
📈 Avg Velocity: $${(metrics.avgVelocity / 100).toFixed(2)}
🚀 Avg Acceleration: $${(metrics.avgAcceleration / 100).toFixed(2)}
💫 Avg Jerk: $${(metrics.avgJerk / 100).toFixed(2)}
📊 Total Velocity: $${(metrics.totalVelocity / 100).toFixed(2)}
`;
      console.log('📤 Sending formatted message:', message);
      await this.sendMessage(chatId, message);
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send metrics update:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  }
}

// Global variables
let socket = null;
let clients = new Set();
let coinData = {};
let timestamps = {};
let latestMetrics = {};
const telegramService = new TelegramService();
const reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function formatToInteger(price) {
  if (price >= 1) {
    return price;
  } else if (price > 0.0001) {
    return Math.round(price * 1_000_0);
  } else {
    return Math.round(price * 100_000_000);
  }
}

function calculateMetrics(data, dt = 1) {
    let totalVelocity = 0;
    let totalAcceleration = 0;
    let totalJerk = 0;

    const velocities = [];
    const accelerations = [];
    const jerks = [];

    for (let i = 0; i < data.length - 1; i++) {
      // Velocity: First derivative
      const v = (data[i + 1] - data[i]) / dt;
      velocities.push(v);
      totalVelocity += v;

      if (i > 0) {
        // Acceleration: Second derivative
        const a = (velocities[i] - velocities[i - 1]) / dt;
        accelerations.push(a);
        totalAcceleration += a;

        if (i > 1) {
          // Jerk: Third derivative
          const j = (accelerations[i - 1] - accelerations[i - 2]) / dt;
          jerks.push(j);
          totalJerk += j;
        }
      }
    }

    // Averages
    const avgVelocity = totalVelocity / velocities.length || 0;
    const avgAcceleration = totalAcceleration / accelerations.length || 0;
    const avgJerk = totalJerk / jerks.length || 0;

    return {
      avgVelocity,
      avgAcceleration,
      avgJerk,
      totalVelocity,
      totalAcceleration,
      totalJerk,
    };
}

function initializeWebSocket() {
  if (socket === null) {
    try {
      socket = new globalThis.WebSocket('wss://stream.binance.com:9443/ws');

      socket.onopen = () => {
       
        const subscribeMessage = {
          method: 'SUBSCRIBE',
          params: ['btcusdt@trade'],
          id: 1
        };
        socket.send(JSON.stringify(subscribeMessage));
      
      };

      socket.onmessage = async (event) => {
        try {
          const parsed = JSON.parse(event.data);
  

          const price = parsed.p;
          if (!price) return;

          const formattedPrice = formatToInteger(parseFloat(price));
          const now = Date.now();
          const symbol = 'btcusdt';

          if (!coinData[symbol]) {
            coinData[symbol] = [];
            timestamps[symbol] = now;
          }

          if (now - timestamps[symbol] >= 1000) {
            timestamps[symbol] = now;
            coinData[symbol].push(formattedPrice);
            

            if (coinData[symbol].length >= 20) {
              const metrics = calculateMetrics(coinData[symbol]);
              latestMetrics[symbol] = metrics;
            

              try {
                await telegramService.sendMetricsUpdate(symbol, metrics, 193418752);
              } catch (error) {
                console.error(`❌ Failed to send to Telegram:`, error);
              }

              coinData[symbol] = [];
              console.log(`🔄 Reset data collection for ${symbol}`);
            }
          }
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        handleReconnection();
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        handleReconnection();
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      handleReconnection();
    }
  }
}

function handleReconnection() {
  socket = null;
  if (reconnectAttempts < maxReconnectAttempts) {
    setTimeout(initializeWebSocket, 5000 * (reconnectAttempts + 1));
  } else {
    console.error('❌ Max reconnection attempts reached');
  }
}

// Initialize WebSocket connection immediately when the module loads
initializeWebSocket();

// Initialize the webhook when the module loads
try {
  const webhookUrl = 'https://crypto-tracker-git-main-hoseinkhanbeigis-projects.vercel.app/api/telegram/webhook';
  console.log('🔄 Attempting to set webhook URL:', webhookUrl);
  await telegramService.setWebhook(webhookUrl);
  console.log('✅ Webhook set up successfully');
} catch (error) {
  console.error('❌ Error setting up webhook:', error.message);
  if (error.response) {
    console.error('Error details:', error.response.data);
  }
}

export async function GET(request) {
  try {
 
    
    if (!socket || socket.readyState !== 1) {
      console.log('🔄 WebSocket not connected, initializing...');
      initializeWebSocket();
    } else {
      console.log('✅ WebSocket already connected');
    }

    console.log('📊 Current metrics:', latestMetrics);
    
    return new Response(JSON.stringify({ 
      message: "Hello from API",
      timestamp: new Date().toISOString(),
      latestMetrics,
      socketStatus: socket ? socket.readyState : 'no socket'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error in GET handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge',
};
