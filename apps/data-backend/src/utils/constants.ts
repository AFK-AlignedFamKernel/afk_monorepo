import dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
export const WEBHOOK_DOMAIN = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
