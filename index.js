import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT || 3012;

import express from "express";
import MongoDB from "./database/db.js";
import MongoDBLogger from "./database/logger.db.js";
const mongoDb = new MongoDB();
const mongoDbLogger = new MongoDBLogger();

const app = express();

import routes from "./routes/routes.js";
app.use(express.json());
app.use('/', routes);

app.get('/', (req, res) => {
    console.log("Server Health Check!!!");
    res.send("Server Health Check");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});