import mongoose from "mongoose";
import Constants from "../constants.js";
const C = new Constants();

export default class MongoDB {

    constructor() {
        try {

            const mongooseOptions = {
                connectTimeoutMS: 3600000,
                autoIndex: true,
                socketTimeoutMS: 3600000,
                directConnection: true,
                serverSelectionTimeoutMS: 30000
            };

            const mongoURI = this.getMongoURI();
    
            // use createConnection instead of calling mongoose.connect so we can use multiple connections
            MongoDB.connection = mongoose.createConnection(mongoURI, mongooseOptions);
    
            MongoDB.connection.on("open", (ref) => {
                console.log("Connected to MongoDB server");
            });
    
            MongoDB.connection.on("error", (err) => {
                console.log("Could not connect to MongoDB server");
            });
    
            MongoDB.connection.on("reconnected", () => {
                console.log("MongoDB reconnected!");
            });
    
            MongoDB.connection.on("disconnected", (err) => {
                console.log("MongoDB disconnected!");
            });
        } catch (err) {
            console.error('Error connecting to MongoDB:', err.message);
            process.exit(1);
        }
    }

    getMongoURI() {

        let mongodbConnectionString = "";
        if (!C.mongoDBConfig.authSource) {

            mongodbConnectionString = "mongodb://" + (C.mongoDBConfig.host).join() + "/" + C.mongoDBConfig.dbName;
        } else {

            mongodbConnectionString = "mongodb://" + C.mongoDBConfig.username + ":" +
                C.mongoDBConfig.password + "@" + (C.mongoDBConfig.host).join() + "/" + C.mongoDBConfig.dbName +
                "?ssl=false&authSource=" + C.mongoDBConfig.authSource;

            if (C.mongoDBConfig.replicaSetName) {
                mongodbConnectionString += "&replicaSet=" + C.mongoDBConfig.replicaSetName;
            }
        }

        return mongodbConnectionString;
    }
}