import express from 'express'
import { HTTPStatus } from '../utils/http';
import { launchBot, sendMessage, sendWebAppButton } from '../services/telegram-app';
import dotenv from "dotenv"
import { TELEGRAM_API_URL, WEBHOOK_DOMAIN } from '../utils/constants';
dotenv.config();
const Router = express.Router()

Router.post('/launch-bot', async (req, res) => {
  try {
    console.log("gm")

    launchBot(process.env.TELEGRAM_BOT_TOKEN)

  } catch (error) {
    res.status(HTTPStatus.InternalServerError).send(error)
  }
})

Router.get('/launch-bot', async (req, res) => {
  try {
    console.log("gm")

    launchBot(process.env.TELEGRAM_BOT_TOKEN)

  } catch (error) {
    res.status(HTTPStatus.InternalServerError).send(error)
  }
})


Router.get('/', async (req, res) => {
  try {

    sendWebAppButton(process.env.TG_ADMIN_CHAT_ID)

  } catch (error) {
    res.status(HTTPStatus.InternalServerError).send(error)
  }
})


// Webhook route to handle incoming updates from Telegram
Router.post('/webhook', async (req, res) => {
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

  // Return a 200 response to acknowledge the update
  res.sendStatus(200);
});

Router.get('/setWebhook', async (req, res) => {
  const url = `${TELEGRAM_API_URL}/setWebhook`;
  const webhookUrl = `${WEBHOOK_DOMAIN}/webhook`; // Replace with your server's public URL
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: webhookUrl }),
  });

  if (response.ok) {
    res.send('Webhook set successfully!');
  } else {
    res.status(500).send('Failed to set webhook');
  }
});


export default Router
