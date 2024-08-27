import express from "express";
import dotenv from "dotenv";
import router from "./router";
import helmet from "helmet";
import { launchBot, sendWebAppButton } from "./services/telegram-app";
const cors = require("cors");

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.APP_URL_WEB
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);
const port = process.env.PORT || 5050;
app.listen(port, () => {
    console.log(`🚀 Backend server running at http://localhost:${port}`);
    try {
        launchBot(process.env.TELEGRAM_BOT_TOKEN);
    } catch (error) {
        console.error("Error launching bot:", error);
    }
});
// Optionally re-enable GraphQL if you plan to use it
/*
server.listen({ port: 4000 }).then(({ url }) => {
    console.log(`🚀 GraphQL server ready at ${url}`);
});
*/
