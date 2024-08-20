import { Telegraf } from 'telegraf';
import { NextApiRequest, NextApiResponse } from 'next';

let bot: Telegraf | null = null;

export function launchBot(token: string) {
    // Create a bot using the token received from @BotFather
    const botInstance = new Telegraf(token);

    // Example: Listen to commands
    botInstance.command('start', (ctx) => ctx.reply('Welcome!'));

    // Example: Listen to messages
    botInstance.on('text', (ctx) => {
        ctx.reply(`You said: ${ctx.message.text}`);
    });

    // Launch the bot
    botInstance.launch().then(() => console.log('Bot launched'));

    // Enable graceful stop
    process.once('SIGINT', () => botInstance.stop('SIGINT'));
    process.once('SIGTERM', () => botInstance.stop('SIGTERM'));

    return botInstance;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("req", req)
    if (req.method === 'POST') {
        if (!bot) {
            const token = process.env.TELEGRAM_BOT_TOKEN || '';
            if (!token) {
                res.status(500).json({ error: 'Bot token not found' });
                return;
            }

            bot = launchBot(token);
        }
        res.status(200).json({ status: 'Bot is running' });
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
