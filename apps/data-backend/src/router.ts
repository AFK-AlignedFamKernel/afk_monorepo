import express from 'express'

import deploy from './routes/indexer/deploy-token'
import deployLaunch from './routes/indexer/deploy-launch'
import buyCoin from './routes/indexer/buy-coin'

const Router = express.Router()
Router.use('/deploy', deploy)
Router.use('/deploy-launch', deployLaunch)
Router.use("/buy-coin", buyCoin)

export default Router
