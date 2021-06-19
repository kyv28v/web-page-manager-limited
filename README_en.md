# WebPageManager

[**Japanese**](README.md)

It is a site where you can freely create pages using Angular and Express.  
You can add pages dynamically from the sidebar.  
The page is designed to store simple JSON data and is designed to be easy to extend.  
Currently it only has simple text, table and file update pages.  
You can select either PostgreSQL or MongoDB as the DB.  

![WebPageManager2](https://user-images.githubusercontent.com/61641646/121801186-05773000-cc71-11eb-9564-64ed80e96acb.png)

## Operation check environment

・node.js       10.24.0  
・npm           7.6.3  
・angular       11.1.0
・MongoDB       4.4.4  
・PostgreSql    12.6

## install and setting.  

1. install node module.  
    ```
    npm install
    ```

2. create database.(PostgreSql or MongoDB)  
    Please refer to the official page.

3. set database config.  
    rewrite `'server/src/config/common.ts'` or System Preferences.  

    switching Postgres or MongoDB.
    ```
    // DB_TYPE = 'postgres' or 'mongodb'
    export const DB_TYPE = process.env.DB_TYPE || 'postgres';
    ```

    setting connection.
    ```
    [Postgres]

    export const user = process.env.DB_USER || 'postgres';
    export const password = process.env.DB_PASSWORD || 'postgres';
    export const host = process.env.DB_HOST || 'localhost';
    export const port = process.env.DB_PORT || 5432;
    export const database = process.env.DB_NAME || 'postgres';
    export const ssl = process.env.DB_SSL || false;
    export const rejectUnauthorized = process.env.DB_REJECTUNAUTHORIZED || false;
    ```

    ```
    [MongoDB]

    export const connectString = process.env.CONNECT_STRING || `mongodb://localhost:27017/webPageManager`;
    ```

4. set database table.  

    create table, default user.
    ```
    [Postgres]

    CREATE TABLE users (_id serial, code varchar(50), name varchar(50), age int, sex int, birthday timestamptz, password varchar(128), note varchar(256), menus jsonb, auth jsonb);
    ALTER TABLE users ADD constraint user_id_uq unique(_id);
    ALTER TABLE users ADD constraint user_code_uq unique(code);

    INSERT INTO users (code, name, password, note, auth) VALUES ('admin', 'Admin User', 'ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413', 'password:123456', '[10, 11, 12, 13, 14, 20, 21, 22, 23, 30, 31, 32, 33]');
    INSERT INTO users (code, name, password, note, auth) VALUES ('guest', 'Guest User', 'ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413', 'password:123456', '[10, 14, 20]');

    CREATE TABLE menus (_id serial, title varchar(64), nodes jsonb, scope jsonb, note varchar(256), create_user_id integer);
    ALTER TABLE menus ADD constraint menu_id_uq unique(_id);

    CREATE TABLE pages (_id serial, create_user_id integer, type varchar(64), data jsonb);
    ALTER TABLE pages ADD constraint page_id_uq unique(_id);

    CREATE TABLE bytes (_id serial, byte bytea);
    ALTER TABLE bytes ADD constraint bytes_id_uq unique(_id);
    ```

    ```
    [MongoDB]

    use webPageManager
    db.users.insert([{
      "code": "admin",
      "name": "Admin User",
      "password": "ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413",
      "note": "password:123456",
      "auth": [10, 11, 12, 13, 14, 20, 21, 22, 23, 30, 31, 32, 33]
    },{
      "code": "guest",
      "name": "Guest User",
      "password": "ba3253876aed6bc22d4a6ff53d8406c6ad864195ed144ab5c87621b6c233b548baeae6956df346ec8c17f5ea10f35ee3cbc514797ed7ddd3145464e2a0bab413",
      "note": "password:123456",
      "auth": [10, 14, 20]
    }])
    ```

## build and run.

build
```
$ npm install
$ npm run build
```

start

```
$ npm start
```

start(For development, Source change monitoring.)
```
$ npm run watch
```

* When debugging with VSCode, please attach to the node process (`.../ts-node ./src/bin/www.ts`) with "Attach Node".

## run in heroku

The following settings are required.

DB setting
```
[Postgres]

heroku config:set DB_TYPE=postgres --app XXXXXXXXXXXX
heroku config:set DB_USER=XXXXXXXXXX --app XXXXXXXXXXXX
heroku config:set DB_PASSWORD=XXXXXXXXXX --app XXXXXXXXXXXX
heroku config:set DB_HOST=XXXXXXXXXX --app XXXXXXXXXXXX
heroku config:set DB_PORT=XXXXXXXXXX --app XXXXXXXXXXXX
heroku config:set DB_NAME=XXXXXXXXXX --app XXXXXXXXXXXX
heroku config:set DB_SSL=true --app XXXXXXXXXXXX
heroku config:set DB_REJECTUNAUTHORIZED=false --app XXXXXXXXXXXX
```

```
[MongoDB]

heroku config:set DB_TYPE=mongodb --app XXXXXXXXXXXX
heroku config:set CONNECT_STRING=mongodb+srv://user:user@cluster0.xxxxxxxx.mongodb.net/webPageManager?retryWrites=true&w=majority --app XXXXXXXXXXXX
```
* An example of a connection string when connecting to MongoDB Atlas.
* MongoDB Atlas is filtered by IP address by default.
  From Network Access, select "ALLOW ACCESS FROM ANYWHERE" to remove the filter.

・Timezone settings (Postgres only)
```
# alter database XXXXXXXXXX set timezone = 'Asia/Tokyo';
```
## specification
*By default, you are automatically logged in as an admin user.  
　If you don't need it, delete the `front/src/app/app.module.ts`  
　`await user.login('admin', '123456', { dispHome: false });` 
 
*After logging in, first add "Menu" from the left sidebar, then add "Page" to the menu.
