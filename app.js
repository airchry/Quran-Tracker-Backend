import express from "express"
import "dotenv/config"
import cors from "cors";
import versesRouter from "./routes/verses.js"
import playersRouter from "./routes/player.js"

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.use("/api/verses", versesRouter)
app.use("/api/players", playersRouter)

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})