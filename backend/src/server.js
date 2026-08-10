const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDb } = require('./config/db');
const { port } = require('./config/env');
const { requireApiKey } = require('./middleware/apiKey');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

async function start() {
  await connectDb();

  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/', (req, res) => {
    res.json({ status: true, message: 'Chatter API running', data: null });
  });

  app.use('/api', requireApiKey, routes);

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`[server] Listening on http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
