import { NextFunction, Request, Response } from 'express';
import { Database, getDatabase } from '../../database/database';

const express = require('express');
const router = express.Router();

router.get('/', async function(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('db.get() start');
        console.log('action:' + req.query.action);
        console.log('values:' + req.query.values);

        // const sql = fs.readFileSync('./src/config/sql/' + req.query.sql, 'utf-8');
        // console.log(sql);

        // execute query
        const values = JSON.parse(req.query.values);
        const data = await query(req.query.action, values, false);

        console.log('db.get() end');
        // console.log('data:' + JSON.stringify(data.rows));
        res.json({rows: data.rows, message: null});
    } catch (e) {
        console.error(e.stack);
        res.json({rows: null, message: e.message});
    }
});

router.get('/download', async function(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('db/download.get() start');
        console.log('values:' + req.query.values);

        const action = 'Bytes/getByte'

        // execute query
        const values = JSON.parse(req.query.values);
        const data = await query(action, values, false);

        console.log('db/download.get() end');
        // console.log('data:' + JSON.stringify(data.rows));
        // res.json({rows: data.rows, message: null});
        return res.status(200).send(data.rows[0])
    } catch (e) {
        console.error(e.stack);
        res.json({rows: null, message: e.message});
    }
});

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
    try {
        const logSize = 200;

        console.log('db.post() start');
        console.log('action:' + req.body.action);
        console.log('value size:' + (req.body.values + '').length);
        console.log(('values:' + req.body.values).substr(0, logSize));

        // const sql = fs.readFileSync('./src/config/sql/' + req.body.sql, 'utf-8');
        // console.log(sql);

        // execute query
        const data = await query(req.body.action, req.body.values, true);

        console.log('db.post() end');
        const dataStr = JSON.stringify(data.rows);
        console.log('data size:' + dataStr.length);
        console.log('data:' + dataStr.substr(0, logSize));
        res.json({rows: data.rows, message: null});
    } catch (e) {
        console.error(e.stack);
        res.json({rows: null, message: e.message});
    }
});

router.post('/upload', async function(req: any, res: Response, next: NextFunction) {
    try {
        console.log('db/upload.post() start');
        console.log('file length:' + req.files.length);

        const action = 'Bytes/addByte'

        // execute query
        const ids = []
        for (let i = 0; i < req.files.length; i++) {
            const data = await query(action, [req.files[i].buffer], true);
            ids.push({_id: data.rows[0]._id});
        }

        console.log('db/upload.post() end');
        res.json({rows: ids, message: null});
    } catch (e) {
        console.error(e.stack);
        res.json({rows: null, message: e.message});
    }
});

async function query(action: string, values: any[], trans: boolean) {
    const db: Database = getDatabase();
    try {
        console.log('db.query() start');
        console.log('action:' + action);
        // console.log('values:' + JSON.stringify(values));

        // connect db
        await db.connect();

        // execute query
        if (trans) { await db.begin(); }
        const data = await db.query(action, values);
        if (trans) { await db.commit(); }

        console.log('db.query() end');
        // console.log('data:' + JSON.stringify(data.rows));
        return data;
    } catch (e) {
        if (trans) { await db.rollback(); }
        throw e;
    } finally {
        await db.release();
    }
}

module.exports = router;
