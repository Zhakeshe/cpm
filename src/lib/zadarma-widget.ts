/** Isolated, authenticated phone document. Never interpolate a key into a URL. */
export function zadarmaWidgetDocument(key: string, sipAccount: string) {
  const js = (value: string) => JSON.stringify(value).replace(/[<>&]/g, (c) => ({
    "<": "\\u003c", ">": "\\u003e", "&": "\\u0026",
  })[c]!);
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;background:#111827;color:#fff;font:14px sans-serif}#notice{padding:12px}</style>
</head><body><div id="notice">Загрузка телефона Zadarma… Разрешите доступ к микрофону.</div>
<script src="https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-lib.js?sub_v=1"></script>
<script src="https://my.zadarma.com/webphoneWebRTCWidget/v9/js/loader-phone-fn.js?sub_v=1"></script>
<script>
window.addEventListener('load', function () {
  try {
    zadarmaWidgetFn(${js(key)}, ${js(sipAccount)}, 'square', 'ru', true, {right:'5px',bottom:'5px'});
    document.getElementById('notice').textContent = 'Телефон Zadarma: дождитесь подключения. Для callback примите звонок менеджеру.';
  } catch (_) {
    document.getElementById('notice').textContent = 'Не удалось загрузить телефон. Обновите телефон и проверьте разрешённый домен в Zadarma.';
  }
});
</script></body></html>`;
}
