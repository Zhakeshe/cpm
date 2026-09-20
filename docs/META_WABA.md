# Meta WABA — шетке сақталған (жойма!)

Тікелей Cloud API **кодтан өшірілген жоқ**. Қазір inbox Wazzup арқылы жүреді.
Верификация өткен соң негізді қайта қосу:

1. `/opt/crm/.env` ішінде `WHATSAPP_TRANSPORT=meta`
2. Wazzup кілтті өшіру (`WAZZUP_API_KEY`, `WAZZUP_CHANNEL_ID`)
3. Permanent system-user token: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`
4. `docker compose up -d app worker`

## Файлдар (сақтаулы)

- `src/lib/whatsapp.ts` — Graph send/inbound, 24h window
- `src/lib/meta-graph.ts` — Graph GET, credentials
- `src/lib/meta-waba.ts` — sync phone + templates
- `src/lib/meta-webhook.ts` — hub.verify + HMAC
- `src/app/api/webhooks/whatsapp/route.ts` — `GET` challenge, `POST` inbound
- `src/app/api/meta/waba/route.ts` — settings sync
- `src/lib/outbound.ts` — `transport === "meta"` тармағы
- `src/lib/whatsapp-transport.ts` — `WHATSAPP_TRANSPORT=meta` қосқышы
- `src/lib/meta-waba-parked.ts` — тізім + park flag
- webhook URL: `https://quantum.ushqn.com/api/webhooks/whatsapp`
- verify: `WHATSAPP_VERIFY_TOKEN` / `quantum_waba_verify_2026`

Worker Graph sync тек `transport === "meta"` кезде жүреді. Настройкиде «шетте сақталған» баннер көрінеді.
