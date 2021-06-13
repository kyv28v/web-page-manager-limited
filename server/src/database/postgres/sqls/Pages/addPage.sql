INSERT INTO pages (create_user_id, type, data) VALUES ($1, $2, $3)
 RETURNING _id;