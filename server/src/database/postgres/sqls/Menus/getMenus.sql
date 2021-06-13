-- usersのmenus配列を行に分割
WITH user_menus AS (
 SELECT menu_id
 FROM (SELECT * FROM users WHERE _id = $1) users
 CROSS JOIN LATERAL jsonb_array_elements (users.menus) menu_id
)
-- menusテーブルと結合してデータ取得
SELECT menus._id, menus.title, menus.nodes children, menus.scope
, menus.create_user_id, users.name create_user_name
 FROM user_menus
 INNER JOIN (SELECT * FROM menus WHERE (create_user_id = $1 OR scope->>'scopeType' = 'Public')) menus   -- 自身が作成したものか、Publicのメニューのみを対象とする
 ON user_menus.menu_id::INT = menus._id
 LEFT JOIN users ON (menus.create_user_id = users._id)