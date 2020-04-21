/* eslint-disable no-undef */
const createError = require('http-errors'),
  express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  logger = require('morgan'),
  helmet = require('helmet'),
  cors = require('cors'),
  hpp = require('hpp');

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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
