import connectDB from "./db";
import app from "./app.js";
import config from "./config/index.js";




connectDB()
.then(() => {

    app.on("error", (error) => {
        console.error(`Error: ${error}`);
        throw error
    })


    const onListening = () => {
        console.log(`Server is listening on port ${config.PORT}`);
    }

    app.listen(config.PORT, onListening )
})
.catch((error) => {
    console.log(`MongoDB connection failed!!! : ${error}`);
})