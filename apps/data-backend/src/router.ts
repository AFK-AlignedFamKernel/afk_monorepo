import express from 'express';

import deploy from './routes/indexer/deploy-token';
import deployLaunch from './routes/indexer/deploy-launch';
import buyCoin from './routes/indexer/buy-coin';
import tokenStats from './routes/indexer/token_stats';
import tokenGraph from './routes/indexer/graph';
import holdings from './routes/indexer/holdings';
import transactions from './routes/indexer/transactions';

const Router = express.Router();

Router.use('/deploy', deploy);
Router.use('/deploy-launch', deployLaunch);
Router.use('/buy-coin', buyCoin);
Router.use('/stats', tokenStats);
Router.use('/candles', tokenGraph);
Router.use('/token-distribution', holdings); 
Router.use('/my-share', transactions);

export default Router;