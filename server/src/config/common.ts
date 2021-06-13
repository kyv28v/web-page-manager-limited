// DB_TYPE = 'postgres' or 'mongodb'
export const DB_TYPE = process.env.DB_TYPE || 'mongodb';

export namespace pgConf {
    export const user = process.env.DB_USER || 'postgres';
    export const password = process.env.DB_PASSWORD || 'postgres';
    export const host = process.env.DB_HOST || 'localhost';
    export const port = process.env.DB_PORT || 5432;
    export const database = process.env.DB_NAME || 'postgres';
    export const ssl = process.env.DB_SSL || false;
    export const rejectUnauthorized = process.env.DB_REJECTUNAUTHORIZED || false;
}

export namespace mongoConf {
    // export const connectString = `mongodb+srv://user:user@cluster0.xxxxxxxx.mongodb.net/webPageManager?retryWrites=true&w=majority`;
    // export const connectString = process.env.CONNECT_STRING || `mongodb://localhost:27017/webPageManager`;
    export const connectString = process.env.CONNECT_STRING || `mongodb://localhost:27017/webPageManager`;
}

export namespace tokenConf {
    export const algorithm = 'HS256';
    export const accessTokenExpiresIn = '30m';          // expiration：30 minutes
    export const refreshTokenExpiresIn = '30 days';     // expiration：30 days
    export const accessTokenSecretKey = 'Sv3tnH9pe6DT4Vm9G7UzmDmyM2qTWE38';
    export const refreshTokenSecretKey = '9JYZxaQfdCjX8iHDC5MLmmv2TgYQLdRv';
}
