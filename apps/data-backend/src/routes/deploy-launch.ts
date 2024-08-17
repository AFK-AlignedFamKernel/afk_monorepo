import express from 'express'
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../utils/http';
import { isValidStarknetAddress } from '../utils/starknet';

const Router = express.Router()

Router.get('/', async (req, res) => {
  try {
    const launchs = await prisma.token_launch.findMany({})
    console.log("launchs", launchs)
    res.status(HTTPStatus.OK).json({
      data: launchs
    })
  } catch (error) {
    res.status(HTTPStatus.InternalServerError).send(error)
  }
})

Router.get('/:launch', async (req, res) => {
  try {
      const { launch } = req.params
      if (!isValidStarknetAddress(launch)) {
          res.status(HTTPStatus.BadRequest).send({ code: HTTPStatus.BadRequest, message: 'Invalid token address' })
          return
      }
      const tokenData = await prisma.token_launch.findMany({where:{
          memecoin_address:launch
      }})
      res.status(HTTPStatus.OK).json({
          data: tokenData
      })
  } catch (error) {
      res.status(HTTPStatus.InternalServerError).send(error)
  }
})


export default Router
