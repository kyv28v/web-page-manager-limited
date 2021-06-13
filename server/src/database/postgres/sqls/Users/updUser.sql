UPDATE users SET code = $2, name = $3, age = $4, sex = $5, birthday = $6, note = $7, auth = $8
 WHERE _id = $1