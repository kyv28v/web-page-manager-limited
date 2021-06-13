SELECT * FROM menus
 WHERE _id NOT IN(SELECT _id FROM menus WHERE _id = ANY($1::int[]))
 AND scope->>'scopeType' = 'Public'
 ORDER BY _id