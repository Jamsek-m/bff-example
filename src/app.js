const express = require("express");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const RedisStore = require("connect-redis")(session);
const Redis = require("ioredis");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");

const controllers = require("./controller");
const config = require("./config");

const redisClient = new Redis();
redisClient.on("connect", () => {
    console.log("connected to redis on localhost:6379!");
});


module.exports = function() {
    const server = express();
    
    // basic express config
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: true}));
    server.use(cookieParser());
    server.use(cors());

    // Session store config - using redis to store additional info on session (like tokens)
    server.use(session({
        store: new RedisStore({client: redisClient}),
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
    }));
    
    // Sample React app, that uses this BFF
    server.use(express.static(path.join(__dirname, "public")));
    
    // Login route to trigger oidc login flow
    server.get("/login", controllers.login);
    // Logout route to clear session in BFF and in IDp
    server.get("/logout", controllers.logout);
    // Example of a proxied request, in this case, userinfo endpoint in IDp, could be any service.
    // checks if user has associated session and if it has, retrieves access token and appends it to request
    server.get("/profile", controllers.profile, controllers.profileProxy);
    // Callback endpoint, that IDp returns to, after successfull login (where 
    // authorization code is returned and exchanged for tokens)
    server.get("/oidc/callback", controllers.callback);

    // General catch-all route for redirection to sample react app
    server.get("/*", (req, res) => {
        res.sendFile( path.join(__dirname, "public", "index.html"));
    });
    
    return server;
}
