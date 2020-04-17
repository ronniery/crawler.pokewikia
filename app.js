const createError = require('http-errors'),
  express = require('express'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  lessMiddleware = require('less-middleware'),
  logger = require('morgan'),
  helmet = require('helmet'),
  cors = require('cors'),
  csrf = require('csurf'),
  hpp = require('hpp');

const indexRouter = require('./routes/index');
const pokeRouter = require('./routes/pokemon');
const app = express();

// setup route middlewares
const csrfProtection = csrf({ cookie: true })

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.disable('x-powered-by');

app.use(cors());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrf({ cookie: true }))
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(hpp())

app.use('/', indexRouter);
app.use('/pokemon', pokeRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
 
  // handle CSRF token errors here
  res.status(403)
  res.send('form tampered with')
})

module.exports = app;
