# WebPageManager

[**English**](README_en.md)

Angular、Expressを使用した、自由にページ作成できるサイトです。  
サイドバーから動的にページを追加できます。  
ページは、単純なJSONデータを保存するようになっており、拡張しやすいような作りにしています。  
現在はシンプルなテキスト、テーブル、ファイルアップデートのページのみを持っています。  

DBはPostgreSQL、またはMongoDBのどちらかを選択可能です。  

![WebPageManager2](https://user-images.githubusercontent.com/61641646/121801186-05773000-cc71-11eb-9564-64ed80e96acb.png)

## 動作確認環境

・node.js       v10.24.0  
・npm           7.6.3  
・angular       9.1.3  
・PostgreSql    12.6

## インストール、設定  

1. nodeモジュールのインストール  
    ```
    npm install
    ```

2. データベースの作成(PostgreSql または MongoDB)  
    ここは公式ページなどを参考にしてください。

3. DB設定  
    `'server/src/config/common.ts'`に定義しています。  
  ここに記載された環境設定を登録するか、このファイルを直接書き換えてください。

    Postgres または MongoDB の切り替え
    ```
    // DB_TYPE = 'postgres' or 'mongodb'
    export const DB_TYPE = process.env.DB_TYPE || 'postgres';
    ```

    DB接続設定
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

4. DBテーブル、データ設定.  

    テーブル、初期ユーザ作成
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

## ビルド＆起動方法  

ビルド
```
$ npm install
$ npm run build
```

起動

```
$ npm start
```

起動（開発用、ソースの変更監視）
```
$ npm run watch
```

※ VSCodeでデバッグする場合、「Attach Node」でnodeのプロセス（`・・・/ts-node ./src/bin/www.ts`）にアタッチしてください。

## herokuでの実行

以下の設定が必要です。

・DBの設定を変更する  
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
* MongoDB Atlas へ接続する場合の接続文字列の例。
* MongoDB Atlas は、デフォルトでIPアドレスのフィルターがかかっています。  
  Network Accessから、「ALLOW ACCESS FROM ANYWHERE」を選択すれば、フィルターを解除できます。

・タイムゾーンの設定(Postgresのみ)
```
# alter database XXXXXXXXXX set timezone = 'Asia/Tokyo';
```
## 仕様
*デフォルトで、自動的に管理ユーザでログインするようにしています。  
　必要がなければ、 `front/src/app/app.module.ts` の  
　`await user.login('admin', '123456', { dispHome: false });`  
　を削除してください。  
 
*ログイン後、左側のサイドバーからまずは「メニュー」を追加し、メニューに対して「ページ」を追加してください。
