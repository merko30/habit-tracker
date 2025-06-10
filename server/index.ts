import express from "express";
import ip from "ip";
import dotenv from "dotenv";

dotenv.config();

const _ip = ip.address();
console.log(`Server will be accessible at http://${_ip}:3001`);

import habitsRouter from "./routes/habits";
import usersRouter from "./routes/users";
import habitCompletionsRouter from "./routes/habitCompletions";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Mount routers (no db arg needed)
app.use("/habits", habitsRouter);
app.use("/completions", habitCompletionsRouter);
app.use("/", usersRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
