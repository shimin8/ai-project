import mongoose from "mongoose";
import Constants from "../constants.js";
const C = new Constants();

export default class MongoDBLogger {

    constructor() {
        if (!MongoDBLogger.connection) {
            MongoDBLogger.connect();
        }
    }
    
    static connect() {
        try {

            const mongooseOptions = {
                connectTimeoutMS: 3600000,
                autoIndex: true,
                socketTimeoutMS: 3600000,
                directConnection: true,
                serverSelectionTimeoutMS: 30000
            };

            const mongoURI = MongoDBLogger.getMongoURI();
    
            // use createConnection instead of calling mongoose.connect so we can use multiple connections
            MongoDBLogger.connection = mongoose.createConnection(mongoURI, mongooseOptions);
    
            MongoDBLogger.connection.on("open", (ref) => {
                console.log("Connected to MongoDB Logger server");
            });
    
            MongoDBLogger.connection.on("error", (err) => {
                console.log("Could not connect to MongoDB Logger server");
            });
    
            MongoDBLogger.connection.on("reconnected", () => {
                console.log("MongoDB reconnected!");
            });
    
            MongoDBLogger.connection.on("disconnected", (err) => {
                console.log("MongoDB disconnected!");
            });

            return MongoDBLogger.connection;
        } catch (err) {
            console.error('Error connecting to MongoDB:', err.message);
            process.exit(1);
        }
    }

    static getMongoURI() {

        let mongodbConnectionString = "";
        if (!C.mongoDBLoggerConfig.authSource) {

            mongodbConnectionString = "mongodb://" + (C.mongoDBLoggerConfig.host).join() + "/" + C.mongoDBLoggerConfig.dbName;
        } else {

            mongodbConnectionString = "mongodb://" + C.mongoDBLoggerConfig.username + ":" +
                C.mongoDBLoggerConfig.password + "@" + (C.mongoDBLoggerConfig.host).join() + "/" + C.mongoDBLoggerConfig.dbName +
                "?ssl=false&authSource=" + C.mongoDBLoggerConfig.authSource;

            if (C.mongoDBLoggerConfig.replicaSetName) {
                mongodbConnectionString += "&replicaSet=" + C.mongoDBLoggerConfig.replicaSetName;
            }
        }

        return mongodbConnectionString;
    }
}