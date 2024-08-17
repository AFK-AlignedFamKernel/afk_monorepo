import express from 'express'

import deploy from './routes/deploy-token'
import deployLaunch from './routes/deploy-launch'
import buyCoin from './routes/buy-coin'

const Router = express.Router()
Router.use('/deploy', deploy)
Router.use('/deploy-launch', deployLaunch)
Router.use("/buy-coin", buyCoin)

export default Router
