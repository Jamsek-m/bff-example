const app = require("./src/app");

const PORT = process.env.PORT || "3000";
const server = app();
server.listen(PORT, () => {
    console.log("Server listening in port " + PORT + "!");
});
