import {NextFunction, Request, Response} from 'express';

const express = require('express');
const router = express.Router();

// health check API
router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.json({ message: 'API Called.' });
});

module.exports = router;
