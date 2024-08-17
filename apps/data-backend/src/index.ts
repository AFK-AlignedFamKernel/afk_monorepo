import express from "express";
import {server} from "./graphql"
import dotenv from "dotenv";
import router from "./router";
dotenv.config();

const app = express();

// Start the Backend
const port = process.env.PORT || 5050;
app.use('/', router)

app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});

// Start the server GraphQL
server.listen().then(({ url }) => {
  console.log(`🚀 Backend server running at http://localhost:${port}/graphql`);
});
