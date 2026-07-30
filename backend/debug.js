const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/api/debug", (req, res) => {
  console.log("DEBUG req.body:", JSON.stringify(req.body));
  console.log("DEBUG keys:", Object.keys(req.body));
  res.json({ body: req.body, keys: Object.keys(req.body) });
});

app.listen(3099, () => console.log("Debug server on 3099"));
