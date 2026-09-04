/* ---------------------------------------------------------------------------
 * Satsregisteret — delt datamodel og beregning
 * Rasmussen Solutions, september 2026
 *
 * Bruges af satser.html (forklaring) og satsvaerksted.html (legeplads), så de
 * to sider aldrig kan komme til at vise forskellige tal.
 *
 * OM TALLENE
 *   Kronebeløbene er OPDIGTEDE. Vi har ikke en organisations faktiske
 *   forhandlede satser.
 *   Efterprøvet mod offentlige kilder og derfor rigtigt:
 *     - reguleringsdatoerne 1/5-2025, 1/3-2026 og 1/3-2027 (OK25)
 *     - pension 11 % arbejdsgiver + 2 % egenbetaling fra 1/5-2025
 *     - særlig lønopsparing 14,55 % -> 15,55 % (1/3-2026) -> 16,55 % (1/3-2027)
 *     - sygeløn 12 uger efter OK25 (tidligere 9)
 *     - malerfaget er minimallønsområde
 * ------------------------------------------------------------------------- */

window.Satsregister = (function () {
  "use strict";

  var ROLES = [
    ["andet", "— ikke i lærlingeforløb —"],
    ["svend", "Svendesats"],
    ["l1", "Lærling 1. år"],
    ["l2", "Lærling 2. år"],
    ["l3", "Lærling 3. år"],
    ["l4", "Lærling 4. år"]
  ];

  var GROUPS = {
    svend:    "Svende",
    laerling: "Lærlinge",
    tillaeg:  "Tillæg og overarbejde",
    pension:  "Pension og SH"
  };

  function seed() {
    return {
      versions: [
        { id: "v1", from: "2024-01-01", published: "2023-12-04", note: "OK23 — regulering" },
        { id: "v2", from: "2025-05-01", published: "2025-03-28", note: "OK25 — år 1" },
        { id: "v3", from: "2026-03-01", published: "2026-03-18", note: "OK25 — år 2" },
        { id: "v4", from: "2027-03-01", published: "2027-01-20", note: "OK25 — år 3" }
      ],
      rates: [
        { id:"r1",  group:"svend",    role:"svend", unit:"kr/time", label:"Mindstebetaling, svend",
          v:{ v1:145.25, v2:152.55, v3:156.10, v4:159.80 } },
        { id:"r2",  group:"svend",    role:"andet", unit:"kr/time", label:"Mindste akkordudbetaling",
          v:{ v1:152.70, v2:160.40, v3:164.15, v4:168.05 } },
        { id:"r11", group:"svend",    role:"andet", unit:"kr/time", label:"Sygdom, maks. 12 uger",
          v:{ v1:145.25, v2:152.55, v3:156.10, v4:159.80 } },

        { id:"r3",  group:"laerling", role:"l1",    unit:"kr/time", label:"Lærling, 1. år",
          v:{ v1:74.00,  v2:78.20,  v3:81.35,  v4:84.20 } },
        { id:"r4",  group:"laerling", role:"l2",    unit:"kr/time", label:"Lærling, 2. år",
          v:{ v1:83.75,  v2:88.45,  v3:92.00,  v4:95.20 } },
        { id:"r5",  group:"laerling", role:"l3",    unit:"kr/time", label:"Lærling, 3. år",
          v:{ v1:95.90,  v2:101.30, v3:105.35, v4:109.05 } },
        { id:"r6",  group:"laerling", role:"l4",    unit:"kr/time", label:"Lærling, 4. år",
          v:{ v1:112.40, v2:118.75, v3:123.50, v4:127.80 } },

        { id:"r7",  group:"tillaeg",  role:"andet", unit:"kr/time", label:"Overarbejde, de første fire timer",
          v:{ v1:60.15,  v2:63.15,  v3:64.85,  v4:66.55 } },
        { id:"r12", group:"tillaeg",  role:"andet", unit:"kr/time", label:"Overarbejde efter fire timer samt weekend",
          v:{ v1:120.30, v2:126.30, v3:129.70, v4:133.10 } },
        { id:"r13", group:"tillaeg",  role:"andet", unit:"kr/km",   label:"Kørselsgodtgørelse, egen bil",
          v:{ v1:3.79,   v2:3.81,   v3:3.86,   v4:3.90 } },

        { id:"r8",  group:"pension",  role:"andet", unit:"%",       label:"Pension, arbejdsgiverbetalt",
          v:{ v1:10.00,  v2:11.00,  v3:11.00,  v4:11.00 } },
        { id:"r9",  group:"pension",  role:"andet", unit:"%",       label:"Pension, egenbetaling",
          v:{ v1:2.00,   v2:2.00,   v3:2.00,   v4:2.00 } },
        { id:"r10", group:"pension",  role:"andet", unit:"%",       label:"Særlig lønopsparing (SH)",
          v:{ v1:14.55,  v2:14.55,  v3:15.55,  v4:16.55 } }
      ]
    };
  }

  /* ---------- formatering ---------- */
  var MONTHS = ["januar","februar","marts","april","maj","juni",
                "juli","august","september","oktober","november","december"];

  function num(x) {
    if (x === null || x === undefined || x === "") return null;
    var n = Number(x);
    return isNaN(n) ? null : n;
  }
  function fmt(n, unit) {
    if (n === null || n === undefined) return "—";
    var s = Number(n).toFixed(2).replace(".", ",");
    return unit === "%" ? s + " %" : s + " kr.";
  }
  function dk(iso) {
    if (!iso) return "—";
    var p = iso.split("-");
    return p[2] + "." + p[1] + "." + p[0];
  }
  function dkLong(iso) {
    if (!iso) return "—";
    var p = iso.split("-");
    return parseInt(p[2], 10) + ". " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ---------- datoregning ---------- */
  function addYears(iso, n) {
    var p = iso.split("-").map(Number);
    return new Date(Date.UTC(p[0] + n, p[1] - 1, p[2])).toISOString().slice(0, 10);
  }
  function dayBefore(iso) {
    var p = iso.split("-").map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] - 1)).toISOString().slice(0, 10);
  }

  /* ---------- opslag i modellen ---------- */
  function sortedVersions(state) {
    return state.versions
      .filter(function (v) { return !!v.from; })
      .slice()
      .sort(function (a, b) { return a.from < b.from ? -1 : a.from > b.from ? 1 : 0; });
  }

  /* to søjler med samme dato gør tidslinjen tvetydig */
  function duplicateDates(state) {
    var seen = {}, dup = {};
    state.versions.forEach(function (v) {
      if (!v.from) return;
      if (seen[v.from]) dup[v.from] = true;
      seen[v.from] = true;
    });
    return dup;
  }

  /* tom celle betyder "uændret": gå tilbage til nærmeste tidligere søjle med værdi */
  function valueAt(state, rate, versionId) {
    var vs = sortedVersions(state), idx = -1;
    for (var i = 0; i < vs.length; i++) if (vs[i].id === versionId) { idx = i; break; }
    if (idx < 0) return null;
    for (var j = idx; j >= 0; j--) {
      var val = num(rate.v[vs[j].id]);
      if (val !== null) return val;
    }
    return null;
  }
  function isInherited(state, rate, versionId) {
    return num(rate.v[versionId]) === null && valueAt(state, rate, versionId) !== null;
  }
  function versionAt(state, date) {
    var vs = sortedVersions(state), best = null;
    for (var i = 0; i < vs.length; i++) if (vs[i].from <= date) best = vs[i];
    return best;
  }
  function previousVersion(state, versionId) {
    var vs = sortedVersions(state), prev = null;
    for (var i = 0; i < vs.length; i++) { if (vs[i].id === versionId) break; prev = vs[i]; }
    return prev;
  }
  function nextVersionAfter(state, date) {
    var vs = sortedVersions(state);
    for (var i = 0; i < vs.length; i++) if (vs[i].from > date) return vs[i];
    return null;
  }
  function rateByRole(state, role) {
    for (var i = 0; i < state.rates.length; i++)
      if (state.rates[i].role === role) return state.rates[i];
    return null;
  }
  function ratesInGroup(state, group) {
    return state.rates.filter(function (r) { return r.group === group; });
  }

  /* ---------- lærlingeforløbet ----------
   * Lærlingen rykker trin på sin egen dato; overenskomsten regulerer på sin.
   * Perioderne er skæringen mellem de to kalendere.
   */
  function buildTimeline(state, start, years) {
    if (!start) return [];
    var end = addYears(start, years);
    var vs  = sortedVersions(state);
    var uncovered = (!versionAt(state, start) && vs.length) ? vs[0].from : null;

    var bounds = [start];
    for (var y = 1; y <= years; y++) bounds.push(addYears(start, y));
    vs.forEach(function (v) {
      if (v.from > start && v.from < addYears(start, years + 1)) bounds.push(v.from);
    });
    bounds = bounds.filter(function (d, i, a) { return a.indexOf(d) === i; }).sort();

    var horizon = addYears(start, years + 1);
    var raw = [];

    for (var i = 0; i < bounds.length; i++) {
      var from = bounds[i];
      if (from >= horizon) break;

      var isApprentice = from < end;
      var yearIdx = 0;
      if (isApprentice) {
        for (var y2 = years; y2 >= 1; y2--) {
          if (from >= addYears(start, y2 - 1)) { yearIdx = y2; break; }
        }
      }

      var ver = versionAt(state, from);
      if (!ver) continue;                      /* før tabellens dækning */

      var row  = isApprentice ? rateByRole(state, "l" + yearIdx) : rateByRole(state, "svend");
      var rate = row ? valueAt(state, row, ver.id) : null;
      var role = isApprentice ? ("Lærling, " + yearIdx + ". år") : "Svend";

      var isVersionDate = vs.some(function (v) { return v.from === from; });
      var reason;
      if (from === start) reason = "Han starter i lære";
      else if (from === end) reason = "Han er udlært og går på svendeløn" +
        (isVersionDate ? " — samme dag som en regulering" : "");
      else if (isVersionDate) reason = "I regulerede overenskomsten";
      else reason = "Han rykkede et lærlingeår op";

      var vObj = vs.filter(function (v) { return v.from === from; })[0];

      raw.push({
        from: from,
        role: role,
        rate: rate,
        reason: reason,
        retro: !!(vObj && vObj.published && vObj.published > from),
        missing: !row
      });
    }

    /* fold perioder sammen hvor hverken rolle eller sats ændrer sig — ellers står
       der "regulering" på en linje, hvor intet flyttede sig */
    var segs = [];
    raw.forEach(function (s) {
      var last = segs[segs.length - 1];
      if (last && last.role === s.role && last.rate === s.rate && !s.retro) return;
      segs.push(s);
    });
    for (var k = 0; k < segs.length; k++) {
      segs[k].to = (k + 1 < segs.length) ? dayBefore(segs[k + 1].from) : null;
    }

    segs.uncovered = uncovered;
    return segs;
  }

  /* ---------- hvad flyttede sig mellem to reguleringer ---------- */
  function compare(state, fromId, toId) {
    return state.rates.map(function (r) {
      var oldV = valueAt(state, r, fromId);
      var newV = valueAt(state, r, toId);
      var diff = (oldV === null || newV === null) ? null : newV - oldV;
      var pct  = (diff === null || oldV === null || oldV === 0) ? null : (diff / oldV) * 100;
      return {
        rate: r, oldV: oldV, newV: newV, diff: diff, pct: pct,
        same: diff !== null && Math.abs(diff) <= 0.0001
      };
    });
  }

  /* ---------- eksport ---------- */
  function toCSV(state) {
    var vs = sortedVersions(state);
    var lines = [];
    lines.push(["Sats", "Enhed", "Rolle"].concat(vs.map(function (v) { return v.from; })).join(";"));
    state.rates.forEach(function (r) {
      var roleLabel = (ROLES.filter(function (x) { return x[0] === r.role; })[0] || ["", ""])[1];
      var row = [r.label, r.unit, r.role === "andet" ? "" : roleLabel];
      vs.forEach(function (v) {
        var val = valueAt(state, r, v.id);
        row.push(val === null ? "" : String(val).replace(".", ","));
      });
      lines.push(row.join(";"));
    });
    lines.push("");
    lines.push("Reguleringer");
    lines.push(["Gaelder fra", "Aftalt den", "Note"].join(";"));
    vs.forEach(function (v) {
      lines.push([v.from || "", v.published || "", v.note || ""].join(";"));
    });
    return lines.join("\n");
  }

  return {
    ROLES: ROLES,
    GROUPS: GROUPS,
    seed: seed,
    num: num, fmt: fmt, dk: dk, dkLong: dkLong, esc: esc, today: today,
    addYears: addYears, dayBefore: dayBefore,
    sortedVersions: sortedVersions,
    duplicateDates: duplicateDates,
    valueAt: valueAt,
    isInherited: isInherited,
    versionAt: versionAt,
    previousVersion: previousVersion,
    nextVersionAfter: nextVersionAfter,
    rateByRole: rateByRole,
    ratesInGroup: ratesInGroup,
    buildTimeline: buildTimeline,
    compare: compare,
    toCSV: toCSV
  };
})();
