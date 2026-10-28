// Bygger sitemap.xml ud fra de offentlige .html-sider i repoets rod.
// Kør fra repoets rod: node scripts/build-sitemap.mjs  (kør efter commit af sideændringer,
// så <lastmod> følger sidste git-commit for hver fil).
// Sider med <meta name="robots" content="...noindex..."> udelades.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://rasmussen-solutions.dk';

const noindex = html => /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html);

const files = readdirSync(root).filter(f => f.endsWith('.html')).sort();
const entries = [];
for (const f of files) {
	if (noindex(readFileSync(join(root, f), 'utf8'))) {
		console.log(`udelader (noindex): ${f}`);
		continue;
	}
	const lastmod = execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: root, encoding: 'utf8' }).trim();
	entries.push({ loc: f === 'index.html' ? `${SITE}/` : `${SITE}/${f}`, lastmod });
}
entries.sort((a, b) => (a.loc === `${SITE}/` ? -1 : b.loc === `${SITE}/` ? 1 : a.loc.localeCompare(b.loc)));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `\t<url>\n\t\t<loc>${e.loc}</loc>${e.lastmod ? `\n\t\t<lastmod>${e.lastmod}</lastmod>` : ''}\n\t</url>`).join('\n')}
</urlset>
`;
writeFileSync(join(root, 'sitemap.xml'), xml);
console.log(`skrev sitemap.xml med ${entries.length} URL'er`);
