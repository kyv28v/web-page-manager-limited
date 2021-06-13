SELECT _id, code, name, age, sex, birthday, note, menus, auth
 FROM users
 WHERE _id = $1