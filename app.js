/* eslint-disable no-undef */
require('dotenv').config();
require('module-alias/register');

const express = require('express'),
  mongoose = require('mongoose'),
  cookieParser = require('cookie-parser'),
  descriptor = require('express-list-endpoints-descriptor')(express),
  logger = require('morgan'),
  helmet = require('helmet'),
  fs = require('fs'),
  cors = require('cors'),
  hpp = require('hpp');

const corsOptions = {
  exposedHeaders: 'X-Total-Pages',
}

const { env } = process;
mongoose.connect(`mongodb://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const indexRouter = require('./routes/index');
const pokeRouter = require('./routes/pokemon');
const cardRouter = require('./routes/card');
const app = express();

// setup route middlewares
app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(hpp())

app.use('/', indexRouter);
app.use('/pokemon', pokeRouter);
app.use('/card', cardRouter);

const routes = JSON.stringify(descriptor.listAllEndpoints(app), null, 2)
fs.writeFileSync('./route-list.json', routes)

module.exports = app;
