import { pgConf } from '../../config/common';
import '../../utility/extensions';

const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: pgConf.user,
    password: pgConf.password,
    host: pgConf.host,
    port: pgConf.port,
    database: pgConf.database,
    ssl: (pgConf.ssl.toBool() ? { rejectUnauthorized: pgConf.rejectUnauthorized.toBool() } : pgConf.ssl),
});

export class Postgres {
    private client: any;

    async connect() {
        console.log('Postgres.connect(' + JSON.stringify(pool.options) + ')');
        this.client = await pool.connect();
    }

    async release() {
        if (this.client) { await this.client.release(true); }
    }

    async query(action: string, values: any) {
        // console.log('Postgres.query(' + action + ',' + values + ')');
        const sql = fs.readFileSync('./src/database/postgres/sqls/' + action + '.sql', 'utf-8');
        const ret = await this.client.query(sql, values);
        return ret;
    }

    async begin() {
        await this.client.query('BEGIN');
    }

    async commit() {
        await this.client.query('COMMIT');
    }

    async rollback() {
        await this.client.query('ROLLBACK');
    }
}

const getPostgres = async () => {
    const postgres = new Postgres();
    return postgres;
};

export { getPostgres };
