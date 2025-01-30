import { telegramService } from '../../subscription/route';

export async function POST(req) {
  try {
    const update = await req.json();
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Handle commands or messages
      if (text === '/start') {
        await telegramService.sendMessage(chatId, 'Welcome! Bot is active and ready to send crypto updates.');
      } else if (text === '/status') {
        await telegramService.sendMessage(chatId, 'Bot is running normally.');
      }
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error in webhook handler:', error);
    return new Response('Error', { status: 500 });
  }
} 