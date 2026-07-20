const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = process.env.REACT_APP_API_URL || '';

const html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
const injected = html.replace(
  '</head>',
  `<script>window.API_URL="${API_URL}";</script></head>`
);

app.use('/static', express.static(path.join(__dirname, 'build', 'static')));
app.use(express.static(path.join(__dirname, 'build'), { index: false }));

app.get('*', (req, res) => {
  res.send(injected);
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
