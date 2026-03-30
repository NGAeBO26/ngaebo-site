// server.js
import express from 'express';
import path from 'path';
const app = express();
const dist = path.join(process.cwd(), 'dist');

app.use('/icons', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.static(dist));
app.get('/health', (req, res) => res.json({ ok: true }));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening ${port}`));