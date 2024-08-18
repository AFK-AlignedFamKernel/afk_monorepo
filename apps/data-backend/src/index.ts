import express from "express";
import {server} from "./graphql"
import dotenv from "dotenv";
import router from "./router";
// import cors from "cors";
import helmet from "helmet"
const cors = require("cors")
dotenv.config();
const app = express();
app.use(cors())
app.use(helmet())
// Alternatively, you can configure CORS for specific routes or origins
app.use(cors({
  origin: 'http://localhost:8081' // Adjust this to match the URL of your React Native web version if necessary
}));
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// app.use(cors)
// app.use(express.urlencoded({ extended: false }))
// app.use(express.json())
// Start the Backend
const port = process.env.PORT || 5050;
app.use('/', router)

app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});

// Start the server GraphQL
// server.listen().then(({ url }) => {
//   console.log(`🚀 Backend server running at http://localhost:${port}/graphql`);
// });
