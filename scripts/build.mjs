// Builds the EpiFive organisation profile: animated hero, an animated "install in 3 commands"
// terminal, section headings, resource cards and the generated part of profile/README.md.
// Runs in GitHub Actions every day (GITHUB_TOKEN) or locally: `node scripts/build.mjs`.
// No dependencies — Node 20+.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORG = "epifive";
const ASSETS = join(ROOT, "profile", "assets");
mkdirSync(ASSETS, { recursive: true });

/** Buy Me a Coffee page (https://buymeacoffee.com/<name>). */
const COFFEE = "epifive";

/** Products in display order; previews live in profile/assets/previews/<repo>.jpg. */
const PROJECTS = [
  { repo: "statuszen", title: "Statuszen", tag: "Uptime monitoring & status pages", demo: "https://statuszen.vercel.app", guide: "statuszen-open-source-uptime-monitor-status-page" },
  { repo: "pulsezen", title: "Pulsezen", tag: "Cookieless web analytics", demo: "https://pulsezen-iota.vercel.app", guide: "pulsezen-self-hosted-google-analytics-alternative" },
  { repo: "dialzen", title: "Dialzen", tag: "AI voice agents", demo: "https://dialzen-demo.vercel.app", guide: "dialzen-open-source-ai-voice-agent" },
  { repo: "queuezen", title: "Queuezen", tag: "Social media scheduler", demo: "https://queuezen-demo.vercel.app", guide: "queuezen-open-source-social-media-scheduler" },
  { repo: "whatsapp-crm", title: "CRM for WhatsApp", tag: "Team inbox, campaigns & chatbots", demo: "https://crm-for-whatsapp-demo.vercel.app", guide: "crm-for-whatsapp-open-source-whatsapp-crm" },
  { repo: "searchzen", title: "Searchzen", tag: "SEO rank tracker & site audit", demo: "https://searchzen-demo.vercel.app", guide: "searchzen-self-hosted-seo-rank-tracker" },
  { repo: "trustzen", title: "Trustzen", tag: "Social proof & testimonial widgets", demo: "https://trustzen-eight.vercel.app", guide: "trustzen-open-source-testimonial-widget" },
  { repo: "referzen", title: "Referzen", tag: "Affiliate & referral programs", demo: "https://referzen-demo.vercel.app", guide: "referzen-open-source-affiliate-software" },
  { repo: "toolzen", title: "Toolzen", tag: "156 online tools website", demo: "https://toolzen-sand.vercel.app", guide: "toolzen-open-source-online-tools-website-script" },
];
const RESOURCES = [
  { repo: "it-cheatsheets", title: "IT Cheat Sheets", tag: "662 verified command sheets" },
  { repo: "azure-vm-prices", title: "Azure VM Prices", tag: "INR & USD price dataset" },
  { repo: "m365-azure-checklists", title: "M365 & Azure Checklists", tag: "Security & cost checklists" },
];

const T = {
  dark: { bg: "#0b1014", bg2: "#0f1a1f", surface: "#121a1f", rule: "#22313a", ink: "#eef3f5", muted: "#93a1ab", accent: "#4cc9a6", accent2: "#f4e37c", accent3: "#7c8cff", wash: "#123029" },
  light: { bg: "#f7faf8", bg2: "#e7f3ee", surface: "#ffffff", rule: "#d6e0dc", ink: "#10171c", muted: "#5f6c75", accent: "#0a7560", accent2: "#b5791b", accent3: "#4f5bd5", wash: "#dff0e9" },
};
const LANG_COLOURS = { TypeScript: "#3178c6", JavaScript: "#f1e05a" };
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

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
  if (out.length === lines && out.join(" ").length < String(text).length) out[lines - 1] += "…";
  return out.slice(0, lines);
}

async function gh(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "epifive-profile" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

/** Animated hero: drifting colour orbs, a scanning light, rotating product names, floating chips. */
function hero(t, totals) {
  const W = 1200;
  const H = 400;
  const words = PROJECTS.map((p) => (/^[A-Z]{2,}/.test(p.tag) ? p.tag : p.tag[0].toLowerCase() + p.tag.slice(1)));
  const step = 2.4;
  const cycle = step * words.length;
  const kf = words
    .map((_, i) => {
      const a = ((i * step) / cycle) * 100;
      const b = (((i + 1) * step) / cycle) * 100;
      return `.w${i}{animation:w${i} ${cycle}s infinite}@keyframes w${i}{0%,${a.toFixed(2)}%{opacity:0;transform:translateY(14px)}${(a + 2).toFixed(2)}%,${(b - 2).toFixed(2)}%{opacity:1;transform:none}${Math.min(b, 100).toFixed(2)}%,100%{opacity:0;transform:translateY(-14px)}}`;
    })
    .join("\n  ");
  const rotating = words
    .map((w, i) => `<text class="w${i}" x="0" y="0" font-size="36" font-weight="900" fill="url(#txt)">${esc(w)}</text>`)
    .join("\n    ");
  const chips = ["Statuszen", "Pulsezen", "Dialzen", "Queuezen"]
    .map(
      (n, i) => `<g transform="translate(${(i % 2) * 160} ${Math.floor(i / 2) * 104 + (i % 2) * 34})"><g class="float f${(i % 3) + 1}">
    <rect width="148" height="74" rx="14" fill="${t.surface}" stroke="${t.rule}"/>
    <circle cx="22" cy="25" r="7" fill="${[t.accent, t.accent3, t.accent2, t.accent][i]}"/>
    <text x="36" y="30" font-size="15" font-weight="800" fill="${t.ink}">${n}</text>
    <rect x="14" y="48" width="120" height="7" rx="3.5" fill="${t.rule}"/>
    <rect class="bar b${i}" x="14" y="48" width="120" height="7" rx="3.5" fill="${t.accent}"/>
  </g></g>`,
    )
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="EpiFive">
<title>EpiFive — open-source SaaS you can self-host</title>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
  <linearGradient id="txt" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset=".55" stop-color="${t.accent3}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>
  <radialGradient id="o1"><stop offset="0" stop-color="${t.accent}" stop-opacity=".55"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
  <radialGradient id="o2"><stop offset="0" stop-color="${t.accent3}" stop-opacity=".45"/><stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/></radialGradient>
  <radialGradient id="o3"><stop offset="0" stop-color="${t.accent2}" stop-opacity=".35"/><stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${t.rule}" stroke-width="1"/></pattern>
  <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".5" stop-color="${t.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="22"/></clipPath>
</defs>
<style>
  text{font-family:${FONT}}
  .o1{animation:d1 14s ease-in-out infinite}.o2{animation:d2 18s ease-in-out infinite}.o3{animation:d3 16s ease-in-out infinite}
  @keyframes d1{0%,100%{transform:translate(0,0)}50%{transform:translate(160px,60px)}}
  @keyframes d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-180px,-40px)}}
  @keyframes d3{0%,100%{transform:translate(0,0)}50%{transform:translate(-90px,70px)}}
  .scan{animation:scan 7s linear infinite}@keyframes scan{from{transform:translateY(-140px)}to{transform:translateY(${H + 140}px)}}
  .in1{animation:in .8s ease-out .1s both}.in2{animation:in .8s ease-out .3s both}.in3{animation:in .8s ease-out .5s both}.in4{animation:in .8s ease-out .7s both}
  @keyframes in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .float{animation:fl 6s ease-in-out infinite}.f2{animation-delay:-2s}.f3{animation-delay:-4s}
  @keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  .bar{transform-origin:14px 0;animation:bar 3.6s ease-in-out infinite}.b1{animation-delay:-.9s}.b2{animation-delay:-1.8s}.b3{animation-delay:-2.7s}
  @keyframes bar{0%,100%{transform:scaleX(.25)}50%{transform:scaleX(1)}}
  ${kf}
</style>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" opacity=".5"/>
  <circle class="o1" cx="180" cy="80" r="260" fill="url(#o1)"/>
  <circle class="o2" cx="1050" cy="330" r="300" fill="url(#o2)"/>
  <circle class="o3" cx="760" cy="40" r="220" fill="url(#o3)"/>
  <rect class="scan" x="0" y="0" width="${W}" height="140" fill="url(#scan)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.rule}"/>
<g transform="translate(72 0)">
  <g class="in1">
    <rect x="0" y="58" width="64" height="64" rx="16" fill="${t.accent}"/>
    <text x="32" y="102" font-size="32" font-weight="900" fill="${t.bg}" text-anchor="middle">E5</text>
    <text x="84" y="106" font-size="50" font-weight="900" fill="${t.ink}" letter-spacing="-1.5">EpiFive</text>
    <rect x="292" y="76" width="160" height="28" rx="14" fill="${t.wash}" stroke="${t.accent}"/>
    <text x="372" y="95" font-size="13" font-weight="800" fill="${t.accent}" text-anchor="middle">OPEN SOURCE · MIT</text>
  </g>
  <text class="in2" x="0" y="178" font-size="30" font-weight="700" fill="${t.ink}">Self-hostable SaaS for</text>
  <g transform="translate(0 228)"><g class="in2">
    ${rotating}
  </g></g>
  <text class="in3" x="0" y="282" font-size="17" fill="${t.muted}">Web installer · admin panel · plans &amp; payments · docs · a live demo for every product</text>
  <g transform="translate(0 310)"><g class="in4" font-size="15" font-weight="800">
    <rect width="180" height="42" rx="21" fill="${t.accent}"/><text x="90" y="27" fill="${t.bg}" text-anchor="middle">${totals.products} SaaS products</text>
    <rect x="194" width="166" height="42" rx="21" fill="none" stroke="${t.accent}" stroke-width="1.5"/><text x="277" y="27" fill="${t.accent}" text-anchor="middle">${totals.repos} public repos</text>
    <rect x="374" width="176" height="42" rx="21" fill="none" stroke="${t.accent2}" stroke-width="1.5"/><text x="462" y="27" fill="${t.accent2}" text-anchor="middle">${totals.stars >= 10 ? `★ ${fmt(totals.stars)} stars` : "Next.js 16 + TS"}</text>
  </g></g>
</g>
<g transform="translate(800 72)">
  ${chips}
</g>
</svg>
`;
}

/** Animated terminal typing the 3-command install (SMIL, works inside <img>). */
function terminal(t) {
  const W = 1200;
  const H = 230;
  const lines = [
    { p: "$", s: "git clone https://github.com/epifive/statuszen.git && cd statuszen/app", type: 2.4 },
    { p: "$", s: "npm install && npm run dev", type: 1.4 },
    { p: "✔", s: "Ready on http://localhost:3000  →  open /install and pick SQLite or MySQL", type: 0.01 },
  ];
  let at = 0.5;
  const rows = lines
    .map((l, i) => {
      const y = 94 + i * 38;
      const width = (l.s.length + 2) * 9.7 + 20;
      const begin = at.toFixed(2);
      at += l.type + 0.7;
      return `<clipPath id="c${i}"><rect x="36" y="${y - 22}" height="32" width="0"><animate attributeName="width" from="0" to="${width.toFixed(0)}" begin="${begin}s" dur="${l.type}s" fill="freeze"/></rect></clipPath>
<g clip-path="url(#c${i})"><text x="40" y="${y}" font-size="16" font-family="${MONO}"><tspan fill="${i === 2 ? t.accent : t.accent2}" font-weight="700">${esc(l.p)}</tspan><tspan fill="${i === 2 ? t.accent : t.ink}"> ${esc(l.s)}</tspan></text></g>`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Install in three commands">
<title>Install any EpiFive product in three commands</title>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.surface}" stroke="${t.rule}"/>
<path d="M.5 16.5a16 16 0 0 1 16-16h${W - 33}a16 16 0 0 1 16 16V44.5H.5Z" fill="${t.wash}"/>
<circle cx="28" cy="22" r="7" fill="#ff5f57"/><circle cx="50" cy="22" r="7" fill="#febc2e"/><circle cx="72" cy="22" r="7" fill="#28c840"/>
<text x="${W / 2}" y="27" font-size="13" font-weight="600" fill="${t.muted}" text-anchor="middle" font-family="${FONT}">install in 3 commands — the same for every product</text>
${rows}
<rect x="40" y="188" width="10" height="18" fill="${t.accent}"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>
</svg>
`;
}

function card(p, info, t, i) {
  const W = 380;
  const H = 168;
  const desc = wrap(info.description || p.tag, 52, 2);
  const lang = info.language || "JavaScript";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}">
<title>${esc(p.title)} — ${esc(p.tag)}</title>
<defs><linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent3}"/></linearGradient></defs>
<style>text{font-family:${FONT}}.c{animation:in .6s ease-out ${(i * 0.15).toFixed(2)}s both}@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}</style>
<g class="c">
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="16" fill="${t.surface}" stroke="${t.rule}"/>
  <rect x="16" y="0" width="${W - 32}" height="4" rx="2" fill="url(#a)"/>
  <text x="22" y="42" font-size="19" font-weight="800" fill="${t.ink}">${esc(p.title)}</text>
  <text x="22" y="63" font-size="11.5" font-weight="700" fill="${t.accent}" letter-spacing=".4">${esc(p.tag.toUpperCase())}</text>
  ${desc.map((l, k) => `<text x="22" y="${92 + k * 18}" font-size="12.5" fill="${t.muted}">${esc(l)}</text>`).join("\n  ")}
  <circle cx="28" cy="${H - 20}" r="5" fill="${LANG_COLOURS[lang] ?? t.accent}"/>
  <text x="39" y="${H - 16}" font-size="12" fill="${t.muted}">${esc(lang)} · ★ ${fmt(info.stargazers_count ?? 0)}</text>
  <text x="${W - 22}" y="${H - 16}" font-size="12" font-weight="800" fill="${t.accent}" text-anchor="end">Open →</text>
</g>
</svg>
`;
}

function heading(t, label, sub) {
  const W = 1200;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="86" viewBox="0 0 ${W} 86" role="img" aria-label="${esc(label)}">
<defs><linearGradient id="h" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset=".6" stop-color="${t.accent3}"/><stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/></linearGradient></defs>
<style>text{font-family:${FONT}}.u{animation:g 1.4s ease-out both;transform-origin:left}@keyframes g{from{transform:scaleX(0)}to{transform:scaleX(1)}}</style>
<text x="0" y="38" font-size="28" font-weight="900" fill="${t.ink}">${esc(label)}</text>
<text x="0" y="66" font-size="15" fill="${t.muted}">${esc(sub)}</text>
<rect class="u" x="0" y="80" width="${W}" height="3" rx="1.5" fill="url(#h)"/>
</svg>
`;
}

function picture(name, alt, width) {
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/${name}-dark.svg"><img src="./assets/${name}-light.svg" alt="${esc(alt)}" width="${width}"></picture>`;
}

function showcase(items) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const cells = items.slice(i, i + 2).map(
      (p) => `<td width="50%" valign="top" align="center">
<a href="https://github.com/${ORG}/${p.repo}"><img src="./assets/previews/${p.repo}.jpg" alt="${esc(p.title)} — ${esc(p.tag)}" width="100%"></a>
<br><b><a href="https://github.com/${ORG}/${p.repo}">${esc(p.title)}</a></b> · ${esc(p.tag)}
<br><a href="${p.demo}"><img alt="Live demo" src="https://img.shields.io/badge/%E2%96%B6%20live-demo-0a7560?style=flat-square"></a> <a href="https://www.epifive.com/blog/${p.guide}"><img alt="Guide" src="https://img.shields.io/badge/read-guide-b5791b?style=flat-square"></a> <a href="https://github.com/${ORG}/${p.repo}"><img alt="Stars" src="https://img.shields.io/github/stars/${ORG}/${p.repo}?style=flat-square&label=stars&color=4f5bd5"></a>
</td>`,
    );
    if (cells.length === 1) cells.push('<td width="50%"></td>');
    rows.push(`<tr>\n${cells.join("\n")}\n</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}

function resourceGrid(items) {
  const cells = items.map(
    (p) => `<td width="33%" valign="top"><a href="https://github.com/${ORG}/${p.repo}">${picture(`card-${p.repo}`, `${p.title} — ${p.tag}`, 380)}</a></td>`,
  );
  return `<table>\n<tr>\n${cells.join("\n")}\n</tr>\n</table>`;
}

const repos = await gh(`/orgs/${ORG}/repos?per_page=100&type=public`);
const byName = new Map(repos.map((r) => [r.name, r]));
const totals = {
  repos: repos.filter((r) => !r.fork && r.name !== ".github").length,
  stars: repos.reduce((n, r) => n + (r.stargazers_count ?? 0), 0),
  products: PROJECTS.filter((p) => byName.has(p.repo)).length,
};

for (const [mode, t] of Object.entries(T)) {
  writeFileSync(join(ASSETS, `hero-${mode}.svg`), hero(t, totals));
  writeFileSync(join(ASSETS, `terminal-${mode}.svg`), terminal(t));
  writeFileSync(join(ASSETS, `h-products-${mode}.svg`), heading(t, "Open-source SaaS products", "Complete products with installer, admin, payments, docs and a live demo — MIT licensed."));
  writeFileSync(join(ASSETS, `h-install-${mode}.svg`), heading(t, "Up and running in minutes", "Clone, install, open the web installer. SQLite for a quick try, MySQL or PostgreSQL for production."));
  writeFileSync(join(ASSETS, `h-resources-${mode}.svg`), heading(t, "IT engineering resources", "Free datasets, cheat sheets and checklists from the EpiFive blog."));
  RESOURCES.forEach((p, i) => writeFileSync(join(ASSETS, `card-${p.repo}-${mode}.svg`), card(p, byName.get(p.repo) ?? {}, t, i)));
}

const generated = `<!-- generated by scripts/build.mjs — do not edit by hand -->
<p align="center">${picture("hero", "EpiFive — open-source SaaS you can self-host", 1200)}</p>

<p align="center">
  <a href="https://www.epifive.com"><img alt="Website" src="https://img.shields.io/badge/epifive.com-website-0a7560?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://www.epifive.com/open-source"><img alt="Open source" src="https://img.shields.io/badge/${totals.products}%20products-open%20source-4f5bd5?style=for-the-badge&logo=github&logoColor=white"></a>
  <a href="https://www.epifive.com/blog"><img alt="Blog" src="https://img.shields.io/badge/guides-blog-b5791b?style=for-the-badge&logo=readdotcv&logoColor=white"></a>
  <a href="https://buymeacoffee.com/${COFFEE}"><img alt="Buy us a coffee" src="https://img.shields.io/badge/buy%20us%20a-coffee-ffdd00?style=for-the-badge&logo=buymeacoffee&logoColor=000"></a>
</p>

${picture("h-products", "Open-source SaaS products", 1200)}

${showcase(PROJECTS.filter((p) => byName.has(p.repo)))}

${picture("h-install", "Up and running in minutes", 1200)}

<p align="center">${picture("terminal", "Install in three commands", 1200)}</p>

${picture("h-resources", "IT engineering resources", 1200)}

${resourceGrid(RESOURCES.filter((p) => byName.has(p.repo)))}
<!-- end generated -->`;

const readmePath = join(ROOT, "profile", "README.md");
const readme = readFileSync(readmePath, "utf8");
writeFileSync(readmePath, readme.replace(/<!-- generated by[\s\S]*?<!-- end generated -->/, generated));
console.log(`profile: ${totals.products} products, ${totals.repos} repos, ${totals.stars} stars`);
