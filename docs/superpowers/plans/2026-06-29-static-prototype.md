# Static HTML Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free static HTML/CSS/JS prototype of the 7-block portfolio landing page (per `docs/superpowers/specs/2026-06-29-portfolio-landing-design.md`) so the user can visually evaluate layout, copy, and interactions in a browser before the page is rebuilt on Next.js.

**Architecture:** Single `prototype/index.html` page styled with the Tailwind CDN (Play CDN, in-browser JIT, no build step) plus a small custom stylesheet for things Tailwind can't express (CSS variables, glass-card blur, kinetic-text animation, `prefers-reduced-motion` overrides). Interactive behavior lives in three pure, independently-testable ES modules (`magnetic.js`, `honeypot.js`, `kinetic-text.js`) wired together by a DOM-glue module (`main.js`). No backend — the contact form simulates success/error states client-side.

**Tech Stack:** Plain HTML5, Tailwind CSS via Play CDN (`https://cdn.tailwindcss.com`), vanilla ES modules, Node's built-in test runner (`node --test`) for the pure utility functions. No npm dependencies, no bundler.

## Global Constraints

- Visual spec source of truth: `docs/superpowers/specs/2026-06-29-portfolio-landing-design.md` — copy, colors, fonts, and section order must match it exactly unless this plan explicitly refines a detail (see contrast refinement in Task 2).
- Dark theme background `#0a0a0f`, accent `#7c5cff` for borders/glows/links, accent-solid `#6845e6` for solid button fills (refinement — see Task 2 rationale: `#7c5cff` text-on-fill contrast is 4.34:1, below AA for normal-size text; `#6845e6` measures 5.86:1).
- Fonts: Geist (body/headings) + Geist Mono (labels/tags/numbers), loaded via Fontsource CDN with `system-ui`/`monospace` fallback — font load failure must not break layout.
- This is a throwaway visual prototype, not production code. Test strategy reflects that: pure JS logic (`magnetic.js`, `honeypot.js`, `kinetic-text.js`) gets real automated tests via `node --test`; static markup/CSS sections get grep-based structural assertions plus a manual visual check; there is no real backend, so form submission is simulated client-side only.
- `prefers-reduced-motion: reduce` must disable all motion (kinetic text reveal, cursor-object parallax, magnetic buttons) — this is checked manually in DevTools, not automatable from Node.
- Formal Lighthouse/Core Web Vitals measurement (LCP < 2.5s per spec section 5) is deferred to the future Next.js production plan, not this one: the prototype deliberately uses vanilla JS instead of GSAP and has no build step, which keeps it fast by construction, but a CDN-loaded Tailwind script and CDN fonts make raw Lighthouse numbers here unrepresentative of the production build's actual performance budget.
- Pointer-only effects (cursor-object parallax, magnetic buttons) must be skipped when `(pointer: fine)` doesn't match, so touch devices get a static, fully functional page.
- All CTAs (Telegram, Max, email) are plain `<a href="...">` elements that work with JavaScript disabled.
- **Serve over HTTP for any manual check, never open via `file://`.** `js/main.js` is loaded as `<script type="module">`; browsers block ES module scripts under the `file://` origin via CORS, so opening `index.html` by double-click or `xdg-open` directly loads a page with no working JavaScript (Task 3 implementation surfaced this). Every manual visual check in this plan from here on must run a local static server first, e.g. `cd prototype && python3 -m http.server 8000`, then open `http://localhost:8000/`.
- Out of scope for this plan (per spec sections 1 and 6): live AI chat widget, real backend for the contact form, ru/en i18n toggle, real case studies/testimonials (placeholders are intentional and marked `[ПРИМЕР]`/`TODO`), calendar booking integration.

---

### Task 1: Project scaffold + pure utility modules with tests

**Files:**
- Create: `prototype/package.json`
- Create: `prototype/js/magnetic.js`
- Create: `prototype/js/honeypot.js`
- Create: `prototype/js/kinetic-text.js`
- Create: `prototype/tests/magnetic.test.mjs`
- Create: `prototype/tests/honeypot.test.mjs`
- Create: `prototype/tests/kinetic-text.test.mjs`

**Interfaces:**
- Produces: `computeMagneticOffset(mouseX, mouseY, rect, strength = 0.3) -> { x: number, y: number }` from `js/magnetic.js`
- Produces: `isLikelyBot(formDataLike: { website?: string }) -> boolean` from `js/honeypot.js`
- Produces: `splitWords(text: string) -> string` (HTML string with each word wrapped in `<span class="kinetic-word">`) from `js/kinetic-text.js`
- These three functions are consumed by `js/main.js`, created in Task 3 and Task 9.

- [ ] **Step 1: Initialize git and scaffold directories**

```bash
cd "/home/denis/Документы/Projects/my-ianding-test"
git init
mkdir -p prototype/js prototype/css prototype/tests
```

- [ ] **Step 2: Add module-type marker so Node treats `.js` files as ESM**

Create `prototype/package.json`:

```json
{
  "name": "portfolio-landing-prototype",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 3: Write the failing test for `computeMagneticOffset`**

Create `prototype/tests/magnetic.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMagneticOffset } from '../js/magnetic.js';

test('returns zero offset when mouse is at element center', () => {
  const rect = { left: 0, top: 0, width: 100, height: 40 };
  const result = computeMagneticOffset(50, 20, rect);
  assert.deepEqual(result, { x: 0, y: 0 });
});

test('scales offset by the strength factor', () => {
  const rect = { left: 0, top: 0, width: 100, height: 40 };
  const result = computeMagneticOffset(100, 20, rect, 0.5);
  assert.deepEqual(result, { x: 25, y: 0 });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `cd prototype && node --test tests/magnetic.test.mjs`
Expected: FAIL — `Cannot find module '../js/magnetic.js'`

- [ ] **Step 5: Implement `magnetic.js`**

Create `prototype/js/magnetic.js`:

```js
export function computeMagneticOffset(mouseX, mouseY, rect, strength = 0.3) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = mouseX - centerX;
  const dy = mouseY - centerY;
  return { x: dx * strength, y: dy * strength };
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `cd prototype && node --test tests/magnetic.test.mjs`
Expected: PASS — `# pass 2`

- [ ] **Step 7: Commit**

```bash
git add prototype/package.json prototype/js/magnetic.js prototype/tests/magnetic.test.mjs
git commit -m "feat: add magnetic button offset utility"
```

- [ ] **Step 8: Write the failing test for `isLikelyBot`**

Create `prototype/tests/honeypot.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLikelyBot } from '../js/honeypot.js';

test('flags submission as bot when the honeypot field is filled', () => {
  assert.equal(isLikelyBot({ website: 'http://spam.example' }), true);
});

test('treats an empty honeypot field as human', () => {
  assert.equal(isLikelyBot({ website: '' }), false);
});

test('treats a missing honeypot field as human', () => {
  assert.equal(isLikelyBot({}), false);
});
```

- [ ] **Step 9: Run it to verify it fails**

Run: `cd prototype && node --test tests/honeypot.test.mjs`
Expected: FAIL — `Cannot find module '../js/honeypot.js'`

- [ ] **Step 10: Implement `honeypot.js`**

Create `prototype/js/honeypot.js`:

```js
export function isLikelyBot(formDataLike) {
  const value = formDataLike && formDataLike.website;
  return Boolean(value && value.trim().length > 0);
}
```

- [ ] **Step 11: Run it to verify it passes**

Run: `cd prototype && node --test tests/honeypot.test.mjs`
Expected: PASS — `# pass 3`

- [ ] **Step 12: Commit**

```bash
git add prototype/js/honeypot.js prototype/tests/honeypot.test.mjs
git commit -m "feat: add honeypot bot-detection utility"
```

- [ ] **Step 13: Write the failing test for `splitWords`**

Create `prototype/tests/kinetic-text.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitWords } from '../js/kinetic-text.js';

test('wraps each word in a kinetic-word span', () => {
  const result = splitWords('Hello world');
  assert.equal(
    result,
    '<span class="kinetic-word">Hello</span> <span class="kinetic-word">world</span>'
  );
});

test('collapses repeated whitespace between words', () => {
  const result = splitWords('Hello   world');
  assert.equal(
    result,
    '<span class="kinetic-word">Hello</span> <span class="kinetic-word">world</span>'
  );
});
```

- [ ] **Step 14: Run it to verify it fails**

Run: `cd prototype && node --test tests/kinetic-text.test.mjs`
Expected: FAIL — `Cannot find module '../js/kinetic-text.js'`

- [ ] **Step 15: Implement `kinetic-text.js`**

Create `prototype/js/kinetic-text.js`:

```js
export function splitWords(text) {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => `<span class="kinetic-word">${word}</span>`)
    .join(' ');
}
```

- [ ] **Step 16: Run it to verify it passes**

Run: `cd prototype && node --test tests/kinetic-text.test.mjs`
Expected: PASS — `# pass 2`

- [ ] **Step 17: Commit**

```bash
git add prototype/js/kinetic-text.js prototype/tests/kinetic-text.test.mjs
git commit -m "feat: add kinetic-text word-splitting utility"
```

---

### Task 2: Base HTML shell + global stylesheet

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/css/styles.css`

**Interfaces:**
- Produces: CSS variables `--bg`, `--text`, `--text-muted`, `--accent`, `--accent-solid`, `--glass-bg`, `--glass-border` consumed by every later section's inline Tailwind arbitrary-value classes (e.g. `bg-[var(--accent-solid)]`).
- Produces: shared classes `.glass-card`, `.kinetic-word`, `.magnetic-btn`, `.cursor-object`, `.hp-field` consumed by Tasks 3–9.
- Produces: `<main id="page">` containing a single line `  <!-- NEXT_SECTION -->` — every later task finds this exact line and replaces it with `<section>...</section>` followed by a fresh `<!-- NEXT_SECTION -->` line, so sections compose in order without needing line-number edits.
- Consumes: nothing (first markup file).

- [ ] **Step 1: Create the stylesheet**

Create `prototype/css/styles.css`:

```css
:root {
  --bg: #0a0a0f;
  --text: #f5f5f7;
  --text-muted: #a1a1aa;
  --accent: #7c5cff;
  --accent-solid: #6845e6;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Geist Sans', system-ui, -apple-system, sans-serif;
  margin: 0;
}

.font-mono-fallback {
  font-family: 'Geist Mono', ui-monospace, monospace;
}

.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.kinetic-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.kinetic-word.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.cursor-object {
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
}

.magnetic-btn {
  display: inline-block;
  transition: transform 0.15s ease-out;
}

.hp-field {
  position: absolute;
  left: -9999px;
  top: -9999px;
}

details.faq-item summary {
  cursor: pointer;
  list-style: none;
}

details.faq-item summary::-webkit-details-marker {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }

  .kinetic-word {
    opacity: 1 !important;
    transform: none !important;
  }

  .cursor-object,
  .magnetic-btn {
    transform: none !important;
  }
}
```

- [ ] **Step 2: Create the HTML shell**

Create `prototype/index.html`:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Денис Во — AI-агенты, сайты и приложения</title>
  <meta name="description" content="Денис Во — делаю AI-агентов, сайты и приложения для малого и среднего бизнеса." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Денис Во — AI-агенты, сайты и приложения" />
  <meta property="og:description" content="Делаю AI-агентов, сайты и приложения, которые работают на бизнес, а не просто лежат в портфолио." />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@latest/index.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/geist-mono@latest/index.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <main id="page">
  <!-- NEXT_SECTION -->
  </main>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify structure**

Run: `grep -c "NEXT_SECTION" prototype/index.html`
Expected: `1`

Run: `grep -c "prefers-reduced-motion" prototype/css/styles.css`
Expected: `1`

- [ ] **Step 4: Commit**

```bash
git add prototype/index.html prototype/css/styles.css
git commit -m "feat: add base HTML shell and global stylesheet"
```

---

### Task 3: Hero section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line
- Create: `prototype/js/main.js`

**Interfaces:**
- Consumes: `splitWords(text)` from `js/kinetic-text.js`, `computeMagneticOffset(mouseX, mouseY, rect, strength)` from `js/magnetic.js` (both from Task 1).
- Produces: `js/main.js` with a `DOMContentLoaded` entry point that later tasks (8, 9) extend with more wiring (FAQ has no JS — native `<details>`; Task 9 adds form handling).
- Produces: DOM contract `#hero-heading` (element whose text gets split into kinetic words), `#cursor-object` (element rotated on pointer move), `.magnetic-btn` (elements wired for magnetic offset) — later tasks must keep using these exact selectors/classes.

- [ ] **Step 1: Insert the Hero section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="hero" class="relative min-h-screen overflow-hidden px-6 py-24 md:px-12 flex flex-col justify-center">
    <div id="cursor-object" class="cursor-object pointer-events-none absolute right-[-5%] top-1/4 h-64 w-64 opacity-60 md:h-96 md:w-96" aria-hidden="true">
      <svg viewBox="0 0 200 200" class="h-full w-full">
        <g stroke="#7c5cff" stroke-width="1.2" fill="none" opacity="0.8">
          <circle cx="100" cy="100" r="6" fill="#7c5cff" />
          <circle cx="40" cy="60" r="4" fill="#7c5cff" />
          <circle cx="160" cy="50" r="4" fill="#7c5cff" />
          <circle cx="50" cy="150" r="4" fill="#7c5cff" />
          <circle cx="150" cy="140" r="4" fill="#7c5cff" />
          <line x1="100" y1="100" x2="40" y2="60" />
          <line x1="100" y1="100" x2="160" y2="50" />
          <line x1="100" y1="100" x2="50" y2="150" />
          <line x1="100" y1="100" x2="150" y2="140" />
          <line x1="40" y1="60" x2="160" y2="50" />
          <line x1="50" y1="150" x2="150" y2="140" />
        </g>
      </svg>
    </div>

    <p class="font-mono-fallback text-sm uppercase tracking-widest text-[var(--accent)]">
      Денис Во · AI-агенты, сайты, приложения
    </p>

    <h1 id="hero-heading" class="mt-6 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
      Делаю AI-агентов, сайты и приложения, которые работают на бизнес, а не просто лежат в портфолио
    </h1>

    <p class="mt-6 max-w-xl text-lg text-[var(--text-muted)]">
      Разработчик-одиночка. Беру задачу от идеи до запуска: автоматизация на AI, сайты, веб- и мобильные приложения. Работаю с малым и средним бизнесом.
    </p>

    <div class="mt-10 flex flex-col items-start gap-3">
      <a id="hero-cta" href="https://t.me/PLACEHOLDER" class="magnetic-btn inline-block rounded-full bg-[var(--accent-solid)] px-8 py-4 text-base font-semibold text-white shadow-lg">
        Обсудить задачу в Telegram
      </a>
      <p class="font-mono-fallback text-xs text-[var(--text-muted)]">
        Оплата 50/50 · Без посредников · Первый шаг — бесплатный разбор задачи
      </p>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Create `main.js` with Hero wiring**

Create `prototype/js/main.js`:

```js
import { splitWords } from './kinetic-text.js';
import { computeMagneticOffset } from './magnetic.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointerFine = window.matchMedia('(pointer: fine)').matches;

function setupKineticHeading() {
  const heading = document.getElementById('hero-heading');
  if (!heading) return;

  if (reduceMotion) {
    return;
  }

  heading.innerHTML = splitWords(heading.textContent.trim());
  const words = heading.querySelectorAll('.kinetic-word');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          words.forEach((word, index) => {
            setTimeout(() => word.classList.add('is-visible'), index * 60);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(heading);
}

function setupCursorObject() {
  const cursorObject = document.getElementById('cursor-object');
  if (!cursorObject || !pointerFine || reduceMotion) return;

  window.addEventListener('mousemove', (event) => {
    const rotateY = (event.clientX / window.innerWidth - 0.5) * 20;
    const rotateX = (event.clientY / window.innerHeight - 0.5) * -20;
    cursorObject.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
}

function setupMagneticButtons() {
  if (!pointerFine || reduceMotion) return;

  document.querySelectorAll('.magnetic-btn').forEach((button) => {
    button.addEventListener('mousemove', (event) => {
      const rect = button.getBoundingClientRect();
      const offset = computeMagneticOffset(event.clientX, event.clientY, rect, 0.3);
      button.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0)';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupKineticHeading();
  setupCursorObject();
  setupMagneticButtons();
});
```

- [ ] **Step 3: Verify structure**

Run: `grep -c 'id="hero"' prototype/index.html`
Expected: `1`

Run: `grep -c "setupMagneticButtons" prototype/js/main.js`
Expected: `2` (one function definition, one call site inside the `DOMContentLoaded` listener)

- [ ] **Step 4: Manual visual check**

Run: `cd prototype && python3 -m http.server 8000 &` then open `http://localhost:8000/` in a browser (opening `index.html` directly via `file://` blocks the `type="module"` script via CORS and no JavaScript will run).
Expected: page opens; the H1 fades/slides in word-by-word on load; moving the mouse rotates the node graph in the top-right and makes the Telegram button drift slightly toward the cursor on hover.

- [ ] **Step 5: Commit**

```bash
git add prototype/index.html prototype/js/main.js
git commit -m "feat: add Hero section with kinetic heading, cursor object, and magnetic CTA"
```

---

### Task 4: Cases section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line

**Interfaces:**
- Consumes: `.glass-card` class from Task 2.
- Produces: `id="cases"` section — no JS contract, pure markup.

- [ ] **Step 1: Insert the Cases section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="cases" class="px-6 py-20 md:px-12">
    <h2 class="text-3xl font-semibold md:text-4xl">Портфолио</h2>
    <p class="mt-2 max-w-xl text-[var(--text-muted)]">Примеры задач, которые я решаю. Реальные кейсы появятся здесь после первых проектов.</p>

    <div class="mt-10 grid gap-6 md:grid-cols-3">
      <article class="glass-card p-6">
        <p class="font-mono-fallback text-xs uppercase tracking-wide text-[var(--accent)]">[ПРИМЕР] AI-агент</p>
        <h3 class="mt-3 text-xl font-semibold">AI-агент для приёма заказов</h3>
        <dl class="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          <div>
            <dt class="font-semibold text-[var(--text)]">Проблема</dt>
            <dd>Клиенты пишут ночью и в выходные — заявки теряются, менеджер не успевает отвечать.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Решение</dt>
            <dd>AI-агент в Telegram/WhatsApp принимает заказ, уточняет детали, передаёт готовую заявку менеджеру.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Результат</dt>
            <dd>[заполнить после проекта — % заявок без участия человека, время ответа]</dd>
          </div>
        </dl>
      </article>

      <article class="glass-card p-6">
        <p class="font-mono-fallback text-xs uppercase tracking-wide text-[var(--accent)]">[ПРИМЕР] Сайт</p>
        <h3 class="mt-3 text-xl font-semibold">Сайт-каталог для локального бизнеса</h3>
        <dl class="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          <div>
            <dt class="font-semibold text-[var(--text)]">Проблема</dt>
            <dd>Бизнес ведёт каталог в Instagram/WhatsApp, клиенты не могут быстро найти и сравнить товары/услуги.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Решение</dt>
            <dd>Сайт-каталог с фильтрами и формой заявки.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Результат</dt>
            <dd>[заполнить — рост заявок, время на сайте]</dd>
          </div>
        </dl>
      </article>

      <article class="glass-card p-6">
        <p class="font-mono-fallback text-xs uppercase tracking-wide text-[var(--accent)]">[ПРИМЕР] Приложение</p>
        <h3 class="mt-3 text-xl font-semibold">Приложение для записи клиентов</h3>
        <dl class="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
          <div>
            <dt class="font-semibold text-[var(--text)]">Проблема</dt>
            <dd>Запись идёт через звонки/сообщения, администратор тратит на это часы.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Решение</dt>
            <dd>Веб-приложение с самостоятельной онлайн-записью и напоминаниями.</dd>
          </div>
          <div>
            <dt class="font-semibold text-[var(--text)]">Результат</dt>
            <dd>[заполнить — экономия времени, снижение % неявок]</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Verify structure**

Run: `grep -c 'id="cases"' prototype/index.html`
Expected: `1`

Run: `grep -c "glass-card" prototype/index.html`
Expected: `3` (one per case card; later tasks add more and this count grows — re-running this exact check after Task 4 alone must show `3`)

- [ ] **Step 3: Commit**

```bash
git add prototype/index.html
git commit -m "feat: add Cases section with three placeholder case studies"
```

---

### Task 5: Services & process section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line

**Interfaces:**
- Consumes: `.glass-card` class from Task 2.
- Produces: `id="services"` section — no JS contract.

- [ ] **Step 1: Insert the Services & process section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="services" class="px-6 py-20 md:px-12">
    <h2 class="text-3xl font-semibold md:text-4xl">Услуги и процесс</h2>

    <div class="mt-10 grid gap-4 md:grid-cols-4">
      <div class="glass-card p-5 text-center">Сайты и лендинги</div>
      <div class="glass-card p-5 text-center">Приложения (web/mobile)</div>
      <div class="glass-card p-5 text-center">AI-агенты и автоматизация</div>
      <div class="glass-card p-5 text-center">Поддержка и доработка</div>
    </div>

    <ol class="mt-12 grid gap-6 md:grid-cols-4">
      <li class="glass-card p-5">
        <span class="font-mono-fallback text-[var(--accent)]">01</span>
        <p class="mt-2 font-semibold">Бесплатный разбор задачи</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">15-30 минут, Telegram или звонок</p>
      </li>
      <li class="glass-card p-5">
        <span class="font-mono-fallback text-[var(--accent)]">02</span>
        <p class="mt-2 font-semibold">Бриф и оценка</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">1-2 дня — фиксируем смету и сроки, договор, оплата 50%</p>
      </li>
      <li class="glass-card p-5">
        <span class="font-mono-fallback text-[var(--accent)]">03</span>
        <p class="mt-2 font-semibold">Разработка</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">Демо каждую неделю</p>
      </li>
      <li class="glass-card p-5">
        <span class="font-mono-fallback text-[var(--accent)]">04</span>
        <p class="mt-2 font-semibold">Запуск</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">Оплата остатка 50%, далее — поддержка</p>
      </li>
    </ol>

    <div class="mt-12 grid gap-4 md:grid-cols-3">
      <div class="glass-card p-5">
        <p class="font-semibold">Сайт-визитка</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">от 7 дней / от 30 000₽</p>
      </div>
      <div class="glass-card p-5">
        <p class="font-semibold">Интернет-магазин/приложение</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">от 3 недель / от 80 000₽</p>
      </div>
      <div class="glass-card p-5">
        <p class="font-semibold">AI-агент</p>
        <p class="mt-1 text-sm text-[var(--text-muted)]">от 2 недель / от 60 000₽</p>
      </div>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Verify structure**

Run: `grep -c 'id="services"' prototype/index.html`
Expected: `1`

Run: `grep -c "от 30 000₽" prototype/index.html`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add prototype/index.html
git commit -m "feat: add Services and process section with pricing"
```

---

### Task 6: About section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line

**Interfaces:**
- Consumes: `.cursor-object`-style SVG markup pattern from Task 3 (reused at smaller scale, no JS wiring needed here — it's static, not pointer-reactive).
- Produces: `id="about"` section — no JS contract.

- [ ] **Step 1: Insert the About section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="about" class="px-6 py-20 md:px-12">
    <div class="grid gap-10 md:grid-cols-[200px_1fr] md:items-center">
      <div class="h-40 w-40 opacity-80" aria-hidden="true">
        <svg viewBox="0 0 200 200" class="h-full w-full">
          <g stroke="#7c5cff" stroke-width="1.2" fill="none" opacity="0.8">
            <circle cx="100" cy="100" r="8" fill="#7c5cff" />
            <circle cx="60" cy="70" r="5" fill="#7c5cff" />
            <circle cx="140" cy="80" r="5" fill="#7c5cff" />
            <circle cx="80" cy="140" r="5" fill="#7c5cff" />
            <line x1="100" y1="100" x2="60" y2="70" />
            <line x1="100" y1="100" x2="140" y2="80" />
            <line x1="100" y1="100" x2="80" y2="140" />
          </g>
        </svg>
      </div>
      <div>
        <h2 class="text-3xl font-semibold md:text-4xl">О себе</h2>
        <p class="mt-4 max-w-2xl text-[var(--text-muted)]">
          Денис Во. Делаю AI-агентов, сайты и приложения один — без передачи задачи по цепочке менеджеров.
          <span class="text-[var(--text)]">[1-2 факта в цифрах — лет опыта/количество проектов, заполнить при наличии данных]</span>.
          Беру в работу, когда понимаю, как результат повлияет на бизнес, а не только на красоту интерфейса.
        </p>
      </div>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Verify structure**

Run: `grep -c 'id="about"' prototype/index.html`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add prototype/index.html
git commit -m "feat: add About section with abstract visual"
```

---

### Task 7: Testimonials placeholder section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line

**Interfaces:**
- Consumes: `.glass-card` class from Task 2.
- Produces: `id="testimonials"` section — no JS contract.

- [ ] **Step 1: Insert the Testimonials placeholder section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <!-- TODO: заменить на реальные отзывы (фото/логотип + имя + должность + цифра в цитате) после первых 2-3 проектов -->
  <section id="testimonials" class="px-6 py-20 md:px-12">
    <h2 class="text-3xl font-semibold md:text-4xl">Где посмотреть, как я работаю</h2>
    <p class="mt-2 max-w-xl text-[var(--text-muted)]">Отзывов клиентов пока нет — этот блок будет заменён на реальные отзывы с фото, именем и цифрой результата.</p>

    <div class="mt-8 flex flex-wrap gap-4">
      <a href="https://t.me/PLACEHOLDER_CHANNEL" class="glass-card px-5 py-3 text-sm font-semibold">Telegram-канал</a>
      <a href="https://github.com/PLACEHOLDER" class="glass-card px-5 py-3 text-sm font-semibold">GitHub</a>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Verify structure**

Run: `grep -c 'id="testimonials"' prototype/index.html`
Expected: `1`

- [ ] **Step 3: Commit**

```bash
git add prototype/index.html
git commit -m "feat: add testimonials placeholder section"
```

---

### Task 8: FAQ section

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line

**Interfaces:**
- Consumes: `details.faq-item summary` styling from Task 2 (native `<details>`/`<summary>` — no custom JS needed, keyboard/screen-reader accessible by default).
- Produces: `id="faq"` section — no JS contract.

- [ ] **Step 1: Insert the FAQ section markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="faq" class="px-6 py-20 md:px-12">
    <h2 class="text-3xl font-semibold md:text-4xl">Частые вопросы</h2>

    <div class="mt-8 space-y-3">
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Сколько стоит сайт/приложение/AI-агент?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">Сайт-визитка — от 30 000₽, интернет-магазин/приложение — от 80 000₽, AI-агент — от 60 000₽. Точную сумму считаю после бесплатного разбора задачи.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Сколько времени занимает проект?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">Сайт-визитка — от 7 дней, интернет-магазин/приложение — от 3 недель, AI-агент — от 2 недель.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Как происходит оплата?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">50% до старта разработки, 50% по факту запуска.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Что если у меня нет технического задания?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">Бесплатный разбор задачи поможет его сформировать — разберём, что нужно бизнесу, и зафиксируем это в брифе.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Кастомная разработка или готовые AI-инструменты?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">Зависит от задачи — иногда быстрее готовое решение, иногда нужен кастом. Решаем на разборе задачи.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Что после запуска — есть поддержка?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">14 дней бесплатных правок после запуска, дальше — по договорённости.</p>
      </details>
      <details class="faq-item glass-card p-5">
        <summary class="font-semibold">Что если результат не понравится на старте?</summary>
        <p class="mt-3 text-sm text-[var(--text-muted)]">Оплата поэтапная 50/50 — первый этап это контрольная точка, на которой согласуем направление до того, как продолжим.</p>
      </details>
    </div>
  </section>
  <!-- NEXT_SECTION -->
```

- [ ] **Step 2: Verify structure**

Run: `grep -c "faq-item" prototype/index.html`
Expected: `7`

- [ ] **Step 3: Manual visual check**

Run: `cd prototype && python3 -m http.server 8000 &` then open `http://localhost:8000/`.
Expected: clicking any FAQ question expands/collapses its answer (native `<details>` behavior); works with Tab + Enter from the keyboard too.

- [ ] **Step 4: Commit**

```bash
git add prototype/index.html
git commit -m "feat: add FAQ section with native details/summary accordion"
```

---

### Task 9: Final CTA, footer, and contact form with honeypot

**Files:**
- Modify: `prototype/index.html` — replace the `  <!-- NEXT_SECTION -->` line
- Modify: `prototype/js/main.js` — add form-handling wiring

**Interfaces:**
- Consumes: `isLikelyBot(formDataLike)` from `js/honeypot.js` (Task 1); `.hp-field`, `.glass-card`, `.magnetic-btn` classes from Task 2.
- Produces: DOM contract `#contact-form`, `#contact-form-status` — final task, nothing downstream depends on these.

- [ ] **Step 1: Insert the Final CTA, footer, and form markup**

In `prototype/index.html`, replace:

```html
  <!-- NEXT_SECTION -->
```

with:

```html
  <section id="contact" class="px-6 py-20 md:px-12">
    <h2 class="text-3xl font-semibold md:text-4xl">Готовы обсудить задачу?</h2>
    <p class="mt-3 max-w-xl text-[var(--text-muted)]">
      Бесплатный разбор за 15 минут — пойму, что нужно, и скажу честно, стоит ли AI-агент/сайт своих денег в вашем случае.
    </p>

    <div class="mt-8 flex flex-wrap gap-4">
      <a href="https://t.me/PLACEHOLDER" class="magnetic-btn rounded-full bg-[var(--accent-solid)] px-8 py-4 text-base font-semibold text-white shadow-lg">Telegram</a>
      <a href="https://max.ru/PLACEHOLDER" class="magnetic-btn glass-card px-8 py-4 text-base font-semibold">Max</a>
      <a href="mailto:denis@PLACEHOLDER.ru" class="magnetic-btn glass-card px-8 py-4 text-base font-semibold">Email</a>
    </div>

    <form id="contact-form" class="mt-12 max-w-md space-y-4" novalidate>
      <div class="hp-field" aria-hidden="true">
        <label for="website">Не заполняйте это поле</label>
        <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
      </div>

      <div>
        <label for="name" class="block text-sm text-[var(--text-muted)]">Имя</label>
        <input type="text" id="name" name="name" required class="glass-card mt-1 w-full px-4 py-3 text-[var(--text)] outline-none" />
      </div>

      <div>
        <label for="contact" class="block text-sm text-[var(--text-muted)]">Telegram, Max или email</label>
        <input type="text" id="contact" name="contact" required class="glass-card mt-1 w-full px-4 py-3 text-[var(--text)] outline-none" />
      </div>

      <div>
        <label for="message" class="block text-sm text-[var(--text-muted)]">Что нужно сделать</label>
        <textarea id="message" name="message" rows="3" required class="glass-card mt-1 w-full px-4 py-3 text-[var(--text)] outline-none"></textarea>
      </div>

      <button type="submit" class="magnetic-btn rounded-full bg-[var(--accent-solid)] px-8 py-3 text-base font-semibold text-white shadow-lg">
        Отправить
      </button>

      <p id="contact-form-status" role="status" class="text-sm"></p>
    </form>
  </section>
  <!-- NEXT_SECTION -->

  <footer class="px-6 py-10 text-center text-sm text-[var(--text-muted)] md:px-12">
    <p>© 2026 Денис Во</p>
  </footer>
```

- [ ] **Step 2: Add form handling to `main.js`**

In `prototype/js/main.js`, add this import to the top:

```js
import { isLikelyBot } from './honeypot.js';
```

Then add this function and call it from the `DOMContentLoaded` listener:

```js
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-form-status');
  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const formDataLike = { website: formData.get('website') };

    if (isLikelyBot(formDataLike)) {
      // Don't tip off bots — pretend success without sending anything.
      status.textContent = 'Спасибо! Я скоро отвечу.';
      status.style.color = 'var(--accent)';
      form.reset();
      return;
    }

    // No backend in this prototype — simulate a successful submission.
    status.textContent = 'Спасибо! Я скоро отвечу.';
    status.style.color = 'var(--accent)';
    form.reset();
  });
}
```

Update the `DOMContentLoaded` listener to call it:

```js
document.addEventListener('DOMContentLoaded', () => {
  setupKineticHeading();
  setupCursorObject();
  setupMagneticButtons();
  setupContactForm();
});
```

- [ ] **Step 3: Verify structure**

Run: `grep -c 'id="contact-form"' prototype/index.html`
Expected: `1`

Run: `grep -c "hp-field" prototype/index.html`
Expected: `1`

Run: `grep -c "setupContactForm" prototype/js/main.js`
Expected: `2` (one definition, one call site)

- [ ] **Step 4: Manual visual check**

Run: `cd prototype && python3 -m http.server 8000 &` then open `http://localhost:8000/`.
Expected: filling name/contact/message and clicking "Отправить" shows "Спасибо! Я скоро отвечу." below the button; the three contact buttons (Telegram, Max, Email) are visible and clickable as plain links.

- [ ] **Step 5: Commit**

```bash
git add prototype/index.html prototype/js/main.js
git commit -m "feat: add final CTA, footer, and contact form with honeypot"
```

---

### Task 10: Cross-cutting verification pass

**Files:**
- No new files — this task verifies and, if needed, patches `prototype/index.html`, `prototype/css/styles.css`, `prototype/js/main.js`.

**Interfaces:**
- Consumes: everything produced by Tasks 1–9.
- Produces: nothing new — this is the acceptance gate for the whole plan.

- [ ] **Step 1: Run all utility tests together**

Run: `cd prototype && node --test tests/`
Expected: `# pass 7` (2 + 3 + 2 across the three test files), `# fail 0`

- [ ] **Step 2: Verify every CTA is a plain anchor (works with JS disabled)**

Run: `grep -o '<a [^>]*href="[^"]*"' prototype/index.html | wc -l`
Expected: a number ≥ 6 (Hero CTA, two testimonials links, three contact-section buttons) — confirms CTAs are real `<a href>` elements, not `<button onclick>` or JS-only handlers.

- [ ] **Step 3: Confirm `prefers-reduced-motion` disables motion**

With the local server still running (`cd prototype && python3 -m http.server 8000 &`), open `http://localhost:8000/` in the browser, open DevTools → Rendering tab → set "Emulate CSS media feature prefers-reduced-motion" to "reduce", then reload.
Expected: the Hero heading is fully visible immediately (no word-by-word fade-in), the cursor-object does not rotate on mouse move, and the magnetic buttons do not shift toward the cursor.

- [ ] **Step 4: Confirm pointer-fine effects are skipped on touch**

In DevTools, open the Device Toolbar (Ctrl+Shift+M) and select a touch device preset (e.g. a phone), then reload.
Expected: the cursor-object stays static and magnetic buttons don't shift — `pointerFine` evaluates to `false` so `setupCursorObject` and `setupMagneticButtons` return early.

- [ ] **Step 5: Document the contrast check result**

This is a documentation step, not a code change — confirm and record in the plan's execution notes (or a follow-up commit message) that:
- `var(--text-muted)` (`#a1a1aa`) on `var(--bg)` (`#0a0a0f`) measures ≈ 7.7:1 (WCAG AAA for normal text, well above the 4.5:1 AA floor).
- White text on `var(--accent-solid)` (`#6845e6`) measures ≈ 5.86:1 (passes AA for normal-size text; the original `#7c5cff` measured only 4.34:1, which is why solid-fill buttons use the darker `--accent-solid` token instead).

- [ ] **Step 6: Mobile responsive pass**

In DevTools Device Toolbar, check the page at a 375px-wide viewport (e.g. iPhone SE preset).
Expected: Hero text, case cards, service/process grid, and the contact form all stack into a single column and remain fully readable without horizontal scrolling.

- [ ] **Step 7: Open the finished prototype for the user to review**

Run: `cd "/home/denis/Документы/Projects/my-ianding-test/prototype" && python3 -m http.server 8000 &` then `xdg-open "http://localhost:8000/"`.
Expected: the default browser opens showing the complete page — Hero → Кейсы → Услуги и процесс → О себе → Где посмотреть, как я работаю → FAQ → Готовы обсудить задачу — with all animations and the contact form working (served over HTTP, not `file://`).

- [ ] **Step 8: Commit any fixes made during this pass**

```bash
git add -A
git commit -m "chore: cross-cutting verification pass (reduced motion, contrast, mobile, plain-link CTAs)"
```

(Skip this commit if Steps 1–6 required no code changes.)
