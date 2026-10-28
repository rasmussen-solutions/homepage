/* rs.js - cookieless visitor analytics. Contract: products/site-analytics/README.md. Keep byte-identical in every wwwroot. */
(function (w, d) {
  var n = w.navigator, dnt = n.doNotTrack || w.doNotTrack || n.msDoNotTrack;
  if (n.globalPrivacyControl || dnt === '1' || dnt === 'yes') return;
  var URL_ = 'https://mesterplan.dk/api/rs/e', loc = w.location, host = loc.hostname;
  var me = d.currentScript, site = (me && me.getAttribute('data-site')) || host;
  var pv = w.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
  var t0 = Date.now(), maxScroll = 0, left = 0;

  function send(e, props, extra) {
    var o = { e: e, p: loc.pathname, pv: pv, s: site };
    if (props) o.d = props;
    for (var k in extra) o[k] = extra[k];
    var body = JSON.stringify(o);
    try {
      if (n.sendBeacon && n.sendBeacon(URL_, new Blob([body], { type: 'text/plain' }))) return;
    } catch (x) {}
    try {
      fetch(URL_, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } });
    } catch (x) {}
  }

  var q = new URLSearchParams(loc.search), utm = {};
  ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (k) {
    var v = q.get('utm_' + k);
    if (v) utm['utm_' + k] = v.slice(0, 100);
  });
  if (d.querySelector('meta[name="rs-404"]')) send('page_not_found', 0, { r: d.referrer });
  else send('pageview', 0, { r: d.referrer, utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign, utm_content: utm.utm_content, utm_term: utm.utm_term });

  d.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('a,[data-rs]') : null;
    if (!el) return;
    var tag = el.getAttribute('data-rs');
    if (tag) return send('cta_click', { label: tag });
    var href = el.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) return send('outbound', { target_host: 'mailto' });
    if (/^tel:/i.test(href)) return send('outbound', { target_host: 'tel' });
    var u;
    try { u = new URL(href, loc.href); } catch (x) { return; }
    if (/\/signup/.test(u.pathname)) return send('cta_click', { label: (el.textContent || '').trim().slice(0, 60), href: u.pathname });
    if (/\/login/.test(u.pathname)) return send('cta_click', { label: 'login' });
    if (u.hostname !== host && /^https?:$/.test(u.protocol)) send('outbound', { target_host: u.hostname });
  }, true);

  d.addEventListener('submit', function (ev) {
    var f = ev.target;
    send('form_submit', { form: (f && (f.id || f.getAttribute('name')) || '').slice(0, 60) });
  }, true);

  w.addEventListener('scroll', function () {
    var h = d.documentElement, max = h.scrollHeight - w.innerHeight;
    var pct = max > 0 ? Math.round(100 * (w.pageYOffset || h.scrollTop) / max) : 100;
    if (pct > maxScroll) maxScroll = pct;
  }, { passive: true });

  function leave() {
    if (left) return;
    left = 1;
    send('engagement', { scroll_pct: Math.min(100, maxScroll), engaged_ms: Date.now() - t0 });
  }
  d.addEventListener('visibilitychange', function () {
    if (d.visibilityState === 'hidden') leave();
  });
  w.addEventListener('pagehide', leave);
})(window, document);
