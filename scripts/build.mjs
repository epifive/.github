// Builds the EpiFive organisation profile: animated banner, a live stats strip and one card per
// project (light + dark), then rewrites the generated parts of profile/README.md.
// Runs in GitHub Actions every day (GITHUB_TOKEN) or locally: `node scripts/build.mjs`.
// No dependencies — Node 20+.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORG = "epifive";
const ASSETS = join(ROOT, "profile", "assets");
mkdirSync(ASSETS, { recursive: true });

/** Projects shown on the profile, in order. Live demo and guide links are added under each card. */
const PROJECTS = [
  { repo: "statuszen", title: "Statuszen", tag: "Uptime monitoring & status pages", demo: "https://statuszen.vercel.app", guide: "statuszen-open-source-uptime-monitor-status-page" },
  { repo: "pulsezen", title: "Pulsezen", tag: "Cookieless web analytics", demo: "https://pulsezen-iota.vercel.app", guide: "pulsezen-self-hosted-google-analytics-alternative" },
  { repo: "trustzen", title: "Trustzen", tag: "Social proof & testimonial widgets", demo: "https://trustzen-eight.vercel.app", guide: "trustzen-open-source-testimonial-widget" },
  { repo: "referzen", title: "Referzen", tag: "Affiliate & referral programs", demo: "https://referzen-demo.vercel.app", guide: "referzen-open-source-affiliate-software" },
  { repo: "searchzen", title: "Searchzen", tag: "SEO rank tracker & site audit", demo: "https://searchzen-demo.vercel.app", guide: "searchzen-self-hosted-seo-rank-tracker" },
  { repo: "queuezen", title: "Queuezen", tag: "Social media scheduler", demo: "https://queuezen-demo.vercel.app", guide: "queuezen-open-source-social-media-scheduler" },
  { repo: "dialzen", title: "Dialzen", tag: "AI voice agents", demo: "https://dialzen-demo.vercel.app", guide: "dialzen-open-source-ai-voice-agent" },
  { repo: "whatsapp-crm", title: "CRM for WhatsApp", tag: "Team inbox, campaigns & chatbots", demo: "https://crm-for-whatsapp-demo.vercel.app", guide: "crm-for-whatsapp-open-source-whatsapp-crm" },
  { repo: "toolzen", title: "Toolzen", tag: "156 online tools website", demo: "https://toolzen-sand.vercel.app", guide: "toolzen-open-source-online-tools-website-script" },
];
const RESOURCES = [
  { repo: "it-cheatsheets", title: "IT Cheat Sheets", tag: "662 verified command sheets" },
  { repo: "azure-vm-prices", title: "Azure VM Prices", tag: "INR & USD price dataset" },
  { repo: "m365-azure-checklists", title: "M365 & Azure Checklists", tag: "Security & cost checklists" },
];

const THEMES = {
  dark: { bg: "#0f1316", surface: "#151a1e", rule: "#252c32", ink: "#e5e9ec", muted: "#8b96a0", accent: "#4cc9a6", accent2: "#f4e37c", wash: "#15302a" },
  light: { bg: "#f5f6f4", surface: "#ffffff", rule: "#d9dee1", ink: "#14181d", muted: "#65707b", accent: "#0a7560", accent2: "#b5791b", wash: "#e3f1ec" },
};
const LANG_COLOURS = { TypeScript: "#3178c6", JavaScript: "#f1e05a", HTML: "#e34c26", CSS: "#563d7c" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Greedy word wrap by an approximate character budget. */
function wrap(text, max, lines) {
  const out = [];
  let line = "";
  for (const w of String(text).split(/\s+/)) {
    if ((line + " " + w).trim().length > max) {
      out.push(line.trim());
      line = w;
      if (out.length === lines) break;
    } else line += ` ${w}`;
  }
  if (out.length < lines && line.trim()) out.push(line.trim());
  if (out.length === lines && out.join(" ").length < String(text).length) {
    out[lines - 1] = `${out[lines - 1].replace(/[.,;:]?$/, "")}…`;
  }
  return out.slice(0, lines);
}

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

async function gh(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "epifive-profile" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

const STAR = "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z";
const FORK = "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z";

function card(p, info, t, i) {
  const W = 420;
  const H = 168;
  const desc = wrap(info.description || p.tag, 58, 2);
  const lang = info.language || "TypeScript";
  const delay = (i * 0.12).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}">
<title>${esc(p.title)} — ${esc(p.tag)}</title>
<style>
  .c{animation:in .6s ease-out ${delay}s both}
  @keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .glow{animation:pulse 3.2s ease-in-out ${delay}s infinite}
  @keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}
  text{font-family:${FONT}}
</style>
<g class="c">
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.surface}" stroke="${t.rule}"/>
  <rect x="0" y="0" width="5" height="${H}" rx="2.5" fill="${t.accent}"/>
  <circle class="glow" cx="${W - 28}" cy="28" r="6" fill="${t.accent}"/>
  <text x="24" y="40" font-size="20" font-weight="700" fill="${t.ink}">${esc(p.title)}</text>
  <text x="24" y="62" font-size="12.5" font-weight="600" fill="${t.accent}" letter-spacing=".3">${esc(p.tag.toUpperCase())}</text>
  ${desc.map((l, k) => `<text x="24" y="${90 + k * 18}" font-size="13" fill="${t.muted}">${esc(l)}</text>`).join("\n  ")}
  <line x1="24" y1="${H - 34}" x2="${W - 24}" y2="${H - 34}" stroke="${t.rule}"/>
  <circle cx="30" cy="${H - 17}" r="5" fill="${LANG_COLOURS[lang] ?? t.accent}"/>
  <text x="41" y="${H - 13}" font-size="12" fill="${t.muted}">${esc(lang)}</text>
  <g transform="translate(${W - 150} ${H - 25})" fill="${t.muted}">
    <path d="${STAR}"/><text x="21" y="12" font-size="12">${fmt(info.stargazers_count ?? 0)}</text>
    <g transform="translate(62 0)"><path d="${FORK}"/><text x="21" y="12" font-size="12">${fmt(info.forks_count ?? 0)}</text></g>
  </g>
  <text x="${W - 24}" y="${H - 13}" font-size="12" font-weight="600" fill="${t.accent2}" text-anchor="end">MIT</text>
</g>
</svg>
`;
}

function banner(t, totals) {
  const W = 1200;
  const H = 300;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="EpiFive">
<title>EpiFive — open-source SaaS and IT engineering resources</title>
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${t.bg}"/><stop offset=".55" stop-color="${t.surface}"/><stop offset="1" stop-color="${t.wash}"/>
  </linearGradient>
  <linearGradient id="shine" x1="0" x2="1">
    <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${t.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
  </linearGradient>
  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
    <path d="M32 0H0V32" fill="none" stroke="${t.rule}" stroke-width="1"/>
  </pattern>
</defs>
<style>
  text{font-family:${FONT}}
  .l1{animation:up .7s ease-out .1s both}.l2{animation:up .7s ease-out .35s both}.l3{animation:up .7s ease-out .6s both}.l4{animation:up .7s ease-out .85s both}
  @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .sweep{animation:sweep 6s linear infinite}
  @keyframes sweep{from{transform:translateX(-420px)}to{transform:translateX(${W + 420}px)}}
  .dot{animation:blink 2.4s ease-in-out infinite}.d2{animation-delay:.4s}.d3{animation-delay:.8s}
  @keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}
  .cursor{animation:cur 1s steps(1) infinite}@keyframes cur{50%{opacity:0}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="url(#g)"/>
<rect width="${W}" height="${H}" rx="18" fill="url(#grid)" opacity=".55"/>
<rect class="sweep" x="0" y="0" width="420" height="${H}" fill="url(#shine)" opacity=".18"/>
<g transform="translate(70 0)">
  <g class="l1">
    <rect x="0" y="58" width="58" height="58" rx="14" fill="${t.accent}"/>
    <text x="29" y="98" font-size="30" font-weight="800" fill="${t.bg}" text-anchor="middle">E5</text>
    <text x="78" y="102" font-size="46" font-weight="800" fill="${t.ink}" letter-spacing="-1">EpiFive</text>
  </g>
  <text class="l2" x="0" y="160" font-size="24" font-weight="600" fill="${t.ink}">Open-source SaaS you can self-host — and IT guides written up properly.</text>
  <text class="l3" x="0" y="196" font-size="17" fill="${t.muted}">Next.js 16 · TypeScript · MySQL, SQLite or PostgreSQL · MIT licensed · live demos<tspan class="cursor" fill="${t.accent}"> ▍</tspan></text>
  <g transform="translate(0 228)"><g class="l4" font-size="15" font-weight="600">
    <rect width="170" height="36" rx="18" fill="${t.wash}" stroke="${t.accent}"/>
    <text x="85" y="23" fill="${t.accent}" text-anchor="middle">${totals.products} SaaS products</text>
    <rect x="184" width="170" height="36" rx="18" fill="${t.wash}" stroke="${t.accent}"/>
    <text x="269" y="23" fill="${t.accent}" text-anchor="middle">${totals.repos} public repos</text>
    <rect x="368" width="150" height="36" rx="18" fill="${t.wash}" stroke="${t.accent}"/>
    <text x="443" y="23" fill="${t.accent}" text-anchor="middle">${totals.stars >= 10 ? `★ ${fmt(totals.stars)} stars` : "MIT licensed"}</text>
  </g></g>
</g>
<g transform="translate(${W - 120} 50)">
  <circle class="dot" cx="0" cy="0" r="6" fill="${t.accent}"/><circle class="dot d2" cx="22" cy="0" r="6" fill="${t.accent2}"/><circle class="dot d3" cx="44" cy="0" r="6" fill="${t.accent}"/>
</g>
</svg>
`;
}

function divider(t, label) {
  const W = 1200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="56" viewBox="0 0 ${W} 56" role="img" aria-label="${esc(label)}">
<style>text{font-family:${FONT}}.w{animation:grow 1.2s ease-out both}@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}</style>
<text x="0" y="34" font-size="22" font-weight="700" fill="${t.ink}">${esc(label)}</text>
<rect class="w" x="${18 + label.length * 12}" y="26" width="${W - 30 - label.length * 12}" height="2" rx="1" fill="${t.accent}" opacity=".6" style="transform-origin:left"/>
</svg>
`;
}

function picture(name, alt, width) {
  const base = "./assets";
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="${base}/${name}-dark.svg"><img src="${base}/${name}-light.svg" alt="${esc(alt)}" width="${width}"></picture>`;
}

function grid(items, withLinks) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const cells = items.slice(i, i + 2).map((p) => {
      const links = withLinks
        ? `<br><sub><a href="${p.demo}">Live demo</a> · <a href="https://www.epifive.com/blog/${p.guide}">Guide</a> · <a href="https://github.com/${ORG}/${p.repo}">Code</a></sub>`
        : `<br><sub><a href="https://github.com/${ORG}/${p.repo}">Repository</a></sub>`;
      return `<td width="50%" valign="top"><a href="https://github.com/${ORG}/${p.repo}">${picture(`card-${p.repo}`, `${p.title} — ${p.tag}`, 420)}</a>${links}</td>`;
    });
    rows.push(`<tr>\n${cells.join("\n")}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}

const repos = await gh(`/orgs/${ORG}/repos?per_page=100&type=public`);
const byName = new Map(repos.map((r) => [r.name, r]));
const totals = {
  repos: repos.filter((r) => !r.fork && r.name !== ".github").length,
  stars: repos.reduce((n, r) => n + (r.stargazers_count ?? 0), 0),
  products: PROJECTS.filter((p) => byName.has(p.repo)).length,
};

for (const [mode, t] of Object.entries(THEMES)) {
  writeFileSync(join(ASSETS, `banner-${mode}.svg`), banner(t, totals));
  writeFileSync(join(ASSETS, `divider-products-${mode}.svg`), divider(t, "Open-source SaaS products"));
  writeFileSync(join(ASSETS, `divider-resources-${mode}.svg`), divider(t, "IT engineering resources"));
  [...PROJECTS, ...RESOURCES].forEach((p, i) => {
    const info = byName.get(p.repo) ?? {};
    writeFileSync(join(ASSETS, `card-${p.repo}-${mode}.svg`), card(p, info, t, i % 2));
  });
}

const generated = `<!-- generated by scripts/build.mjs — do not edit by hand -->
<p align="center">${picture("banner", "EpiFive — open-source SaaS and IT engineering resources", 1200)}</p>

<p align="center">
  <a href="https://www.epifive.com"><img alt="Website" src="https://img.shields.io/badge/website-epifive.com-0a7560?style=for-the-badge"></a>
  <a href="https://www.epifive.com/open-source"><img alt="Open source" src="https://img.shields.io/badge/open%20source-${totals.products}%20products-4cc9a6?style=for-the-badge"></a>
  <a href="https://www.epifive.com/blog"><img alt="Blog" src="https://img.shields.io/badge/blog-guides-b5791b?style=for-the-badge"></a>
  <a href="https://www.epifive.com/services#custom-app-development"><img alt="Hire us" src="https://img.shields.io/badge/hosted%20%26%20custom-services-14181d?style=for-the-badge"></a>
</p>

${picture("divider-products", "Open-source SaaS products", 1200)}

Complete, self-hostable SaaS products — each with an admin panel, plans & payments, full
documentation and a **live demo**. MIT licensed: use them, fork them, run them for your clients.

${grid(PROJECTS.filter((p) => byName.has(p.repo)), true)}

${picture("divider-resources", "IT engineering resources", 1200)}

${grid(RESOURCES.filter((p) => byName.has(p.repo)), false)}
<!-- end generated -->`;

const readmePath = join(ROOT, "profile", "README.md");
const readme = readFileSync(readmePath, "utf8");
const next = readme.replace(/<!-- generated by[\s\S]*?<!-- end generated -->/, generated);
writeFileSync(readmePath, next);
console.log(`profile: ${totals.products} products, ${totals.repos} repos, ${totals.stars} stars`);
