// Bygger projektsiderne (trackrs.html, milepro.html, ...) ud fra data.mjs.
// Kør fra repoets rod: node scripts/cases/build.mjs
// Header og footer hentes fra satser.html, så alle sider har samme menu.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cases } from './data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://rasmussen-solutions.dk';

const esc = s => String(s)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function slice(html, from, to) {
	const a = html.indexOf(from);
	const b = html.indexOf(to, a);
	if (a < 0 || b < 0) throw new Error(`Kunne ikke finde "${from}" … "${to}" i satser.html`);
	return html.slice(a, b);
}

const satser = readFileSync(join(root, 'satser.html'), 'utf8');
const header = slice(satser, '<div class="em40_header_area_main">', '<div class="breadcumb-area">').trimEnd();
const footer = slice(satser, '<div class="witrfm_area">', '<script').trimEnd();

const pages = cases.filter(c => !c.external);

function neighbours(c) {
	const i = cases.indexOf(c);
	const prev = cases[(i - 1 + cases.length) % cases.length];
	const next = cases[(i + 1) % cases.length];
	return { prev, next };
}

const section = (eyebrow, title, body) => `
		<section class="cs-sec">
			<div class="cs-eyebrow">${esc(eyebrow)}</div>
			<h2 class="cs-h">${esc(title)}</h2>
${body}
		</section>`;

function shotsHtml(c) {
	if (!c.shots.length) {
		return `			<div class="cs-pending">Skærmbilleder følger.</div>`;
	}
	return figures(c.shots);
}

function figures(shots) {
	return `			<div class="cs-shots">
${shots.map(s => `				<figure class="cs-shot ${s.kind}">
					<button type="button" aria-label="Forstør: ${esc(s.title)}"><img src="assets/images/cases/${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy"></button>
					<figcaption><b>${esc(s.title)}</b>${esc(s.caption)}</figcaption>
				</figure>`).join('\n')}
			</div>`;
}

// Kapitler: længere afsnit om ét område af produktet, med status og egne skærmbilleder.
// status: 'live' | 'rollout' | 'soon' styrer farven på mærket.
function chapters(c) {
	if (!c.chapters) return '';
	return c.chapters.map(ch => `
		<section class="cs-sec cs-chapter">
			<div class="cs-eyebrow">${esc(ch.eyebrow)}${ch.status ? ` <span class="cs-status ${ch.status[0]}">${esc(ch.status[1])}</span>` : ''}</div>
			<h2 class="cs-h">${esc(ch.title)}</h2>
${ch.body.map(p => `			<p>${p}</p>`).join('\n')}
${ch.points ? `			<ul class="cs-points">\n${ch.points.map(p => `				<li>${p}</li>`).join('\n')}\n			</ul>` : ''}
${ch.shots ? figures(ch.shots) : ''}
		</section>`).join('');
}

function page(c) {
	const { prev, next } = neighbours(c);
	const url = `${SITE}/${c.slug}.html`;
	const title = `${c.name} | Rasmussen Solutions`;

	const intro = `
		<section class="cs-sec">
${c.draft ? `			<div class="cs-draft"><b>Kladde.</b> ${esc(c.draft)}</div>\n` : ''}			<div class="cs-eyebrow">${esc(c.eyebrow)}</div>
			<h2 class="cs-h">${esc(c.headline)}</h2>
${c.lede ? `			<p class="cs-lede">${c.lede}</p>` : ''}
${c.todo ? `			<p class="cs-todo">${esc(c.todo)}</p>` : ''}
			<dl class="cs-facts">
${c.facts.map(([dt, dd]) => `				<div class="cs-fact"><dt>${esc(dt)}</dt><dd>${esc(dd)}</dd></div>`).join('\n')}
			</dl>
		</section>`;

	const features = c.features ? section('Hvad vi byggede', c.featuresTitle, `			<div class="cs-feat">
${c.features.map(([h, p]) => `				<div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n')}
			</div>`) : '';

	const process = c.steps ? section('Processen', c.processTitle, `${c.pull ? `			<p class="cs-pull">${esc(c.pull)}</p>\n` : ''}			<div class="cs-steps">
${c.steps.map(([who, h, p], i) => `				<div class="cs-step"><div class="cs-step-n">${i + 1}</div><div class="cs-step-b"><div class="cs-step-who">${esc(who)}</div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></div>`).join('\n')}
			</div>`) : '';

	const stack = c.stack ? section('Teknik', 'Under motorhjelmen', `			<dl class="cs-stack">
${c.stack.map(([dt, dd]) => `				<div><dt>${esc(dt)}</dt><dd>${esc(dd)}</dd></div>`).join('\n')}
			</dl>`) : '';

	const btn = c.link ? `<a class="cs-btn" href="${esc(c.link.href)}">${esc(c.link.label)} →</a>` : '';

	return `<!DOCTYPE HTML>
<html lang="da-DK">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="x-ua-compatible" content="ie=edge">
	<!-- Genereret af scripts/cases/build.mjs ud fra scripts/cases/data.mjs. Ret dér, ikke her. -->
	<title>${esc(title)}</title>
	<meta name="description" content="${esc(c.description)}">
	<meta name="viewport" content="width=device-width, initial-scale=1">
${c.draft ? '	<meta name="robots" content="noindex">\n' : ''}	<link rel="canonical" href="${url}">
	<meta property="og:type" content="article">
	<meta property="og:title" content="${esc(title)}">
	<meta property="og:description" content="${esc(c.description)}">
	<meta property="og:url" content="${url}">
	<meta property="og:image" content="${SITE}/assets/images/${esc(c.thumb)}">
	<link rel="icon" type="image/png" href="assets/images/favicon.png">
	<link rel="stylesheet" type="text/css" href="assets/css/bootstrap.min.css">
	<link rel="stylesheet" type="text/css" href="venobox/venobox.css">
	<link rel="stylesheet" type="text/css" href="assets/css/plugin_theme_css.css">
	<link rel="stylesheet" type="text/css" href="style.css">
	<link rel="stylesheet" type="text/css" href="assets/css/responsive.css">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap">
	<link rel="stylesheet" type="text/css" href="assets/css/case.css">
</head>
<body>
${header}

<div id="rs-case">
	<header class="cs-hero">
		<div class="cs-wide cs-hero-in">
			<div class="cs-logo"><img src="assets/images/${esc(c.thumb)}" alt="${esc(c.name)} logo"></div>
			<div>
				<div class="cs-crumbs"><a href="index.html">Forside</a> / <a href="index.html#project">Projekter</a> / ${esc(c.name)}</div>
				<h1>${esc(c.name)}</h1>
				<p class="cs-tag">${esc(c.tagline)}</p>
				<div class="cs-chips">${c.chips.map(t => `<span class="cs-chip">${esc(t)}</span>`).join('')}</div>
				${btn}
			</div>
		</div>
	</header>

	<div class="cs-wrap">${intro}
	</div>

	<section class="cs-gallery">
		<div class="cs-wide">
			<div class="cs-eyebrow">Skærmbilleder</div>
			<h2 class="cs-h">${c.shots.length ? 'Sådan ser det ud' : 'Skærmbilleder'}</h2>
${shotsHtml(c)}
		</div>
	</section>

	<div class="cs-wrap">${chapters(c)}${features}${process}${stack}

		<div class="cs-cta">
			<h2>Har I brug for noget lignende?</h2>
			<p>Vi bygger apps og platforme, hvor data, hardware og mennesker skal hænge sammen. Ring eller skriv, så tager vi en snak om jeres opgave.</p>
			${c.link ? `<a class="cs-btn" href="${esc(c.link.href)}">${esc(c.link.label)} →</a>` : '<a class="cs-btn" href="mailto:Emil@Rasmussen-Solutions.dk">Skriv til os →</a>'}
			<div class="cs-contact"><a href="tel:+4560727108">+45 60 72 71 08</a> · <a href="mailto:Emil@Rasmussen-Solutions.dk">Emil@Rasmussen-Solutions.dk</a></div>
		</div>

		<nav class="cs-next" aria-label="Andre projekter">
			<a href="${prev.slug}.html"><small>Forrige projekt</small>← ${esc(prev.name)}</a>
			<a href="${next.slug}.html"><small>Næste projekt</small>${esc(next.name)} →</a>
		</nav>
	</div>
</div>

<div class="cs-lb" id="cs-lb" hidden><button type="button">Luk ✕</button><img alt=""></div>

${footer}

<script src="assets/js/vendor/jquery-3.5.1.min.js"></script>
<script src="assets/js/bootstrap.min.js"></script>
<script src="assets/js/theme-pluginjs.js"></script>
<script src="assets/js/jquery.meanmenu.js"></script>
<script src="assets/js/theme.js"></script>
<script src="assets/js/case.js"></script>
</body>
</html>
`;
}

for (const c of pages) {
	writeFileSync(join(root, `${c.slug}.html`), page(c));
	console.log(`skrev ${c.slug}.html`);
}
