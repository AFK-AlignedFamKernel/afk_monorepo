import { sendMessage, sendWebAppButton } from '@/services/telegram';
import { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // Parse the request body (ensure it's JSON)
    const data = req.body;
    // Log the received data (for debugging)
    console.log('Webhook received:', data);
    const message = req.body.message;

    if (message) {
      const chatId = message.chat.id;
      const text = message.text;
      console.log(`Received message from chat_id ${chatId}: ${text}`);
      // Respond with a Web App button or another action
      if (text === '/start') {
        await sendWebAppButton(chatId);
      } else {
        await sendMessage(chatId, "I received your message: " + text);
      }
    }

    // Process the webhook data as needed
    const chatId = data?.message?.chat?.id;
    const text = data?.message?.text;

    if (chatId && text) {
      // Example: Respond back with a message or trigger an action
      console.log(`Message from chat ID ${chatId}: ${text}`);
      // Here, you could trigger an action, like sending a response back to Telegram or another system
    }

    // Respond with a 200 status to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } else {
    // If not a POST request, return 405 Method Not Allowed
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
