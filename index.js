const path = require('path');
const express = require('express');
const consolidate = require('consolidate');
const config = require('./config');

const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', path.resolve(__dirname, 'views'));

app.get('/', (req, res) => res.render('index.html'));

const server = app.listen(config.app.PORT, () => {
    console.log(`Server running at port ${config.app.PORT}`);
});
