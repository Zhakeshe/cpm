DELETE FROM "Task"
WHERE "type" = 'FOLLOW_UP'
  AND (
    "description" LIKE '3 күн тиілмесе — қайта қоңырау%'
    OR "description" LIKE '3 күннен соң хабарлас%'
    OR "description" LIKE '3 күннен кейін хабарлас%'
    OR "description" LIKE 'Связаться через 3 дня%'
  );

DELETE FROM "AutomationRule"
WHERE "name" IN (
  '3 күн тиілмесе — қайта қоңырау',
  '3 күннен соң хабарлас',
  '3 күннен кейін хабарлас',
  'Связаться через 3 дня'
);
