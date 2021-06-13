SELECT _id, code, name, age, sex, birthday, password, note, menus, auth
 FROM users
 WHERE code = $1