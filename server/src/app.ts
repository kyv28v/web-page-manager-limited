import {NextFunction, Request, Response} from 'express';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jwt = require('jsonwebtoken');
const multer = require('multer');

import { tokenConf } from './config/common';

const indexRouter = require('./api/index');
const dbRouter = require('./api/common/db');
const authRouter = require('./api/common/auth');
const changePasswordRouter = require('./api/common/changePassword');
const systemRouter = require('./api/common/system');

const app = express();

require('log-timestamp');

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API call log
app.use('/api/*', async (req: any, res: any, next: any) => {
  // console.log('===== API Called. req=' + req.originalUrl + ', body=' + JSON.stringify(req.body));
  console.log('===== API Called. req=' + req.originalUrl);
  next();
});

// Express routing(not require authentication)
app.use('/api/', indexRouter);
app.use('/api/common/auth', authRouter);

// Token check
app.use('/api/*', async (req: any, res: any, next: any) => {
  const token = req.headers['access-token'];
  if (!token) {
    res.status(401);
    return res.json({message: 'No token provided'});
  }
  try {
    const decoded = await jwt.verify(token, tokenConf.accessTokenSecretKey);
    req.decoded = decoded;
    next();
  } catch (e) {
    res.status(401);
    return res.json({message: e.message});
  }
});

// Express routing(require authentication)
app.use(multer().any());
app.use('/api/common/db', dbRouter);
app.use('/api/common/changePassword', changePasswordRouter);
app.use('/api/common/system', systemRouter);

// Angular routing
app.use(express.static(path.join(__dirname, '../../front/dist')));
app.use('/*', express.static(path.join(__dirname, '../../front/dist/index.html')));

// catch 404 and forward to error handler
app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
