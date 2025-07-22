import express from "express";
import { PORT } from "./config";

const useAuth = import("./routes/auth.js");
const useModels = import("./routes/models.js");

const app = express();

app.use(useAuth);
app.use(useModels);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
