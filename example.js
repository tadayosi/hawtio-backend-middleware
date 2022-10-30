const express = require('express');
const { hawtioBackend } = require('./build/main/index');

const port = 3333;

const app = express();
app.get('/', (req, res) => {
  res.send('hello!');
});
app.use('/proxy', hawtioBackend({
  logLevel: 'debug'
}));
app.listen(port, () => {
  console.log(`started at :${port}`);
});
