import express from "express";
import {server} from "./graphql"
const app = express();

// Start the Backend
const port = process.env.PORT || 5050;

app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}/graphql`);
});

// Start the server GraphQL
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
