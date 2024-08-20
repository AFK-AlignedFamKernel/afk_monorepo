import express from 'express'

import deploy from './routes/deploy-token'
import deployLaunch from './routes/deploy-launch'
import buyCoin from './routes/buy-coin'
import telegramApp from './routes/telegram-app'

const Router = express.Router()
Router.use('/deploy', deploy)
Router.use('/deploy-launch', deployLaunch)
Router.use("/buy-coin", buyCoin)
Router.use("/telegram-app", telegramApp)

export default Router
