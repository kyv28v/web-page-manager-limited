import { NextFunction, Request, Response } from 'express';
import { Database, getDatabase } from '../../database/database';
import { tokenConf } from '../../config/common';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/createtoken', async function(req: Request, res: Response, next: NextFunction) {
    const db: Database = await getDatabase();
    try {
        console.log('auth.createtoken() start');
        console.log('userCode:' + req.body.userCode);
        // console.log('password:' + req.body.password);

        if (!req.body.userCode) {
            throw new Error('Invalid id');
        }

        // connect db
        await db.connect();

        // execute query
        const data = await db.query('Users/getUserCode', [ req.body.userCode ]);

        // Error if user not found
        if (data.rows.length === 0) {
            throw new Error('Invalid id or password');
        }

        // Error if password mismatch
        if (data.rows[0] == null || data.rows[0].password !== req.body.password) {
            throw new Error('Invalid id or password');
        }

        const userId = data.rows[0]._id;

        // Get access token
        const accessToken = jwt.sign(
            { userId: userId },
            tokenConf.accessTokenSecretKey,
            {
                algorithm: tokenConf.algorithm,
                expiresIn: tokenConf.accessTokenExpiresIn,
            });

        // Get refresh token
        const refreshToken = jwt.sign(
            { userId: userId },
            tokenConf.refreshTokenSecretKey,
            {
                algorithm: tokenConf.algorithm,
                expiresIn: tokenConf.refreshTokenExpiresIn,
            });

        console.log('auth.createtoken() end');
        console.log('userId:' + userId);
        console.log('accessToken:' + accessToken);
        console.log('refreshToken:' + refreshToken);
        res.json({ userId: userId, accessToken: accessToken, refreshToken: refreshToken, message: null });
    } catch (e) {
        console.log(e.stack);
        res.json({ message: e.message });
    } finally {
        await db.release();
    }
});

router.post('/refreshtoken', async function(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('auth.refreshtoken() start');

        const refreshToken = req.headers['refresh-token'];
        console.log('refreshToken:' + refreshToken);

        // Deny access if there is no token
        if (!refreshToken) {
            res.status(401);
            return res.json({rows: null, message: 'No token provided'});
        }
        // verify token
        try {
            const decoded = await jwt.verify(refreshToken, tokenConf.refreshTokenSecretKey);
        } catch (e) {
            res.status(401);
            return res.json({rows: null, message: e.message});
        }

        // Get access token
        const accessToken = jwt.sign(
            { userId: req.body.userId },
            tokenConf.accessTokenSecretKey,
            {
                algorithm: tokenConf.algorithm,
                expiresIn: tokenConf.accessTokenExpiresIn,
            });

        // Get refresh token again
        const refreshToken2 = jwt.sign(
            { userId: req.body.userId },
            tokenConf.refreshTokenSecretKey,
            {
                algorithm: tokenConf.algorithm,
                expiresIn: tokenConf.refreshTokenExpiresIn,
            });

        console.log('auth.refreshtoken() end');
        console.log('accessToken:' + accessToken);
        console.log('refreshToken2:' + refreshToken2);
        res.json({ accessToken: accessToken, refreshToken2: refreshToken2, message: null });
    } catch (e) {
        console.log(e.stack);
        res.json({ message: e.message });
    }
});

module.exports = router;
