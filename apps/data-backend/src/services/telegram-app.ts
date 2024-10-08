import dotenv from "dotenv";
dotenv.config();
const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const WEB_APP_URL =
  process.env.TELEGRAM_WEB_APP ?? "https://tg.afk-community.xyz"; // Replace with your web app's URL

// Use require instead of import because of the error "Cannot use import statement outside a module"
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

/**
 * Creates and launches Telegram bot, and assigns all the required listeners
 *
 * @param token HTTP API token received from @BotFather(https://t.me/BotFather) after creating a bot
 *
 * @remarks
 * Make sure to save the token in a safe and secure place. Anyone with the access can control your bot.
 *
 */
export function launchBot(token: string) {
  try {
    // Create a bot using the token received from @BotFather(https://t.me/BotFather)
    const bot = new Telegraf(token);

    // Assign bot listeners
    listenToCommands(bot);
    listenToMessages(bot);
    listenToQueries(bot);
    listenToMiniAppData(bot);

    // Launch the bot
    bot.launch().then(() => console.log("bot launched"));

    // Handle stop events
    enableGracefulStop(bot);

    // return bot
  } catch (e) {
    console.log("launchBot error", e);
  }
}

/**
 * Assigns command listeners such as /start and /help
 *
 * @param bot Telegraf bot instance
 *
 */
function listenToCommands(bot) {
  try {
    // Register a listener for the /start command, and reply with a message whenever it's used
    bot.start(async (ctx) => {
      await ctx.reply("Welcome to MiniAppSample bot!", {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Start Mini App",
                web_app: { url: process.env.TELEGRAM_WEB_APP },
              },
            ],
          ],
        },
      });

      await ctx.reply("Click on the button below to launch our mini app", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Start Mini App",
                web_app: { url: process.env.TELEGRAM_WEB_APP },
              },
            ],
            [
              {
                text: "Start AFK",
                web_app: { url: process.env.TELEGRAM_MOBILE_APP },
              },
            ],
          ],
        },
      });
    });

    // Register a listener for the /help command, and reply with a message whenever it's used
    bot.help(async (ctx) => {
      await ctx.reply("Run the /start command to use our mini app");
    });
  } catch (e) {}
}

/**
 * Assigns message listeners such as text and stickers
 *
 * @param bot Telegraf bot instance
 *
 */
function listenToMessages(bot: Telegraf) {
  try {
    // Listen to messages and reply with something when ever you receive them
    bot.hears("hi", async (ctx) => {
      await ctx.reply("Hey there!");
    });

    // Listen to messages with the type 'sticker' and reply whenever you receive them
    bot.on(message("text"), async (ctx) => {
      await ctx.reply(
        "I don't understand text but I like stickers, send me some!"
      );
      await ctx.reply(
        "Or you can send me one of these commands \n/start\n/help"
      );
    });

    // Listen to messages with the type 'sticker' and reply whenever you receive them
    bot.on(message("sticker"), async (ctx) => {
      await ctx.reply("I like your sticker! 🔥");
    });
  } catch (e) {
    console.log("listenToMessages", e);
  }
}

/**
 * Listen to messages send by MiniApp through sendData(data)
 * @see https://core.telegram.org/bots/webapps#initializing-mini-apps
 *
 * @param bot Telegraf bot instance
 */
function listenToMiniAppData(bot) {
  try {
    bot.on("message", async (ctx) => {
      if (ctx.message?.web_app_data?.data) {
        try {
          const data = ctx.message?.web_app_data?.data;
          await ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "Got message from MiniApp"
          );
          await ctx.telegram.sendMessage(ctx.message.chat.id, data);
        } catch (e) {
          await ctx.telegram.sendMessage(
            ctx.message.chat.id,
            "Got message from MiniApp but failed to read"
          );
          await ctx.telegram.sendMessage(ctx.message.chat.id, e);
        }
      }
    });
  } catch (e) {}
}

/**
 * Assigns query listeners such inlines and callbacks
 *
 * @param bot Telegraf bot instance
 *
 */
function listenToQueries(bot) {
  try {
    bot.on("callback_query", async (ctx) => {
      // Explicit usage
      await ctx.telegram.answerCbQuery(ctx.callbackQuery.id);

      // Using context shortcut
      await ctx.answerCbQuery();
    });

    bot.on("inline_query", async (ctx) => {
      const article = {
        type: "article",
        id: ctx.inlineQuery.id,
        title: "Message for query",
        input_message_content: {
          message_text: `Message for query`,
        },
      };

      const result = [article];
      // Explicit usage
      await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result);

      // Using context shortcut
      await ctx.answerInlineQuery(result);
    });
  } catch (e) {}
}
/**
 * Listens to process stop events and performs a graceful bot stop
 *
 * @param bot Telegraf bot instance
 *
 */
function enableGracefulStop(bot) {
  try {
    // Enable graceful stop
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (e) {}
}

/**
 * Receives data from the mini app and sends a simple message using answerWebAppQuery
 * @see https://core.telegram.org/bots/api#answerwebappquery
 *
 * We will use InlineQueryResult to create our message
 * @see https://core.telegram.org/bots/api#inlinequeryresult
 */
export const handleMessageRequest = async (bot, request, response) => {
  try {
    // Read data from the request body received by the mini app
    const { queryId, message } = request.body;

    // We are creating InlineQueryResultArticle
    // See https://core.telegram.org/bots/api#inlinequeryresultarticle
    const article = {
      type: "article",
      id: queryId,
      title: "Message from the mini app",
      input_message_content: {
        message_text: `MiniApp: ${message}`,
      },
    };

    // Use queryId and data to send a message to the bot chat
    await bot.answerWebAppQuery(queryId, article);

    // End the request with a success code
    await response.status(200).json({
      message: "success!",
    });
  } catch (e) {
    const errorJson = JSON.stringify(e);
    console.log(`handleMessageRequest error ${errorJson}`);

    await response.status(500).json({
      error: errorJson,
    });
  }
};

export async function sendWebAppButton(chatId) {
  try {
    const url = `${TELEGRAM_API_URL}/sendMessage`;
    console.log("web app url", WEB_APP_URL);
    const body = {
      chat_id: chatId,
      text: "Click the button below to open the web app:",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Web App",
              web_app: {
                url: WEB_APP_URL,
              },
            },
          ],
        ],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error sending web app button: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (e) {
    console.log("Error sendWebApp", e);
  }
}

// Function to send a message to a chat
export async function sendMessage(chatId, text) {
  try {
    const url = `${TELEGRAM_API_URL}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: text,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Error sending message: ${response.statusText}`);
    }
  } catch (e) {
    console.log("sendMessage error", e);
  }
}
