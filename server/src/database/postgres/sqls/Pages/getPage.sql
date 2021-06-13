SELECT pages._id
, users._id user_id
, users.name create_user_name
, pages.type
, pages.data
 FROM pages
 LEFT JOIN users ON pages.create_user_id = users._id
 WHERE pages._id = $1