import { NextFunction, Request, Response } from 'express';
import { Database, getDatabase } from '../../database/database';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
    const db: Database = await getDatabase();
    try {
        console.log('changePassword() start');
        console.log('userId:' + req.body.userId);
        // console.log('oldPassword:' + req.body.oldPassword);
        // console.log('newPassword:' + req.body.newPassword);

        // connect db
        await db.connect();

        // execute query
        // const data = await db.query('SELECT * FROM users WHERE id = $1', [ req.body.userId ]);
        const data = await db.query('Users/getUser', [ req.body.userId ]);

        // Error if user not found
        if (data.rows.length === 0) {
            throw new Error('Invalid id');
        }

        // Error if password mismatch
        if (data.rows[0].password !== req.body.oldPassword) {
            throw new Error('Invalid old password');
        }

        // execute query
        await db.begin();
        // const ret = await db.query('UPDATE users SET password = $1 WHERE id = $2', [ req.body.newPassword, req.body.userId ]);
        const ret = await db.query('Users/updPassword', [ req.body.newPassword, req.body.userId ]);
        await db.commit();

        console.log('changePassword() end');
        res.json({ message: null });
    } catch (e) {
        console.log(e.stack);
        res.json({ message: e.message });
    } finally {
        await db.release();
    }
});

module.exports = router;
