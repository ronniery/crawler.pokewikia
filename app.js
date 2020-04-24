/* eslint-disable no-undef */
require('dotenv').config();
require('module-alias/register');

const express = require('express'),
  mongoose = require('mongoose'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  logger = require('morgan'),
  helmet = require('helmet'),
  cors = require('cors'),
  hpp = require('hpp');

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
app.use(cors());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(hpp())

app.use('/', indexRouter);
app.use('/pokemon', pokeRouter);
app.use('/card', cardRouter);

module.exports = app;
