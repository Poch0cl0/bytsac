const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = process.env.REACT_APP_API_URL || '';

app.get('/', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
  const injected = html.replace(
    '</head>',
    `<script>window.API_URL="${API_URL}";</script></head>`
  );
  res.send(injected);
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
