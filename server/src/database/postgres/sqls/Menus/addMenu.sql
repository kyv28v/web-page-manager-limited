INSERT INTO menus (title, nodes, scope, note, create_user_id) VALUES ($1, $2, $3, $4, $5)
 RETURNING _id;