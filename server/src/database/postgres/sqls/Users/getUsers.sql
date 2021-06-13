SELECT _id, code, name, age, sex, birthday, note, auth
 FROM users
 WHERE name LIKE '%' || $1 || '%'
 ORDER BY _id