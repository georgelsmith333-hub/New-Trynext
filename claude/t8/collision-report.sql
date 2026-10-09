-- T8 read-only collision / duplicate report. Changes nothing. Returns no customer details
-- beyond order numbers and a masked phone suffix, so output is safe to paste into a report.
-- 1) Any key collisions after the migration (must return zero rows):
SELECT idempotency_key, count(*) AS n
FROM orders WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key HAVING count(*) > 1;

-- 2) Historic look-alike orders the in-memory guard could not stop (same phone, same total,
--    created within 5 minutes). These explain why the persistent key is wanted; they are NOT
--    changed or removed by this plan.
SELECT a.order_number AS first_order, b.order_number AS second_order,
       right(a.customer_phone, 3) AS phone_suffix, a.total,
       round(extract(epoch FROM (b.created_at - a.created_at))) AS seconds_apart
FROM orders a
JOIN orders b ON b.id > a.id
 AND b.customer_phone = a.customer_phone
 AND b.total = a.total
 AND b.created_at - a.created_at < interval '5 minutes'
ORDER BY a.created_at DESC
LIMIT 50;
