const express = require('express');
const { hawtioBackend } = require('./build/main/index');

const app = express();
app.get('/', (req, res) => {
  res.send('hello!');
});
app.use('/proxy', hawtioBackend({
  logLevel: 'debug'
}));
app.listen(3333, () => {
  console.log('started');
});
