# Shine & Sparkle Cleaning — Інструкція розгортання на Cloudflare Pages

Сайт оптимізовано для роботи на **Cloudflare Pages** без необхідності в сервері та базі даних:
- **`client/`** — Повністю автономний фронтенд (React 18 + Vite). 
  - **Адмін-панель (`/#admin` або ⚙️ у футері):** зміна контактів (WhatsApp, email, назва) та повне керування послугами (додавання, редагування, тарифи, списки).
  - **3D Card Deck Slider:** плавний мобільний слайдер послуг із підтримкою свайпів.
  - **Анімовані кнопки відправки (Uiverse):** відправка повідомлень та розрахунку квоти безпосередньо у WhatsApp.
- **`server/`** — Опціональний бекенд на Express.js + PostgreSQL (за потреби можна підключити в майбутньому).

---

## 🚀 Спосіб 1: Автоматичний деплой через Cloudflare Dashboard (Рекомендовано)

Найзручніший спосіб — підключити ваш репозиторій GitHub / GitLab безпосередньо в Cloudflare Pages.

### Крок 1. Створення проєкту в Cloudflare Pages
1. Увійдіть у [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Перейдіть у розділ **Workers & Pages** -> **Create application** -> вкладка **Pages** -> **Connect to Git**.
3. Виберіть ваш репозиторій `shine-sparkle-app`.

### Крок 2. Налаштування збірки (Build settings)
Вкажіть такі параметри:
- **Project name:** `shine-sparkle-app` (або довільна назва)
- **Production branch:** `latest_branch` (або ваша основна гілка, наприклад `main`)
- **Framework preset:** `Vite`
- **Root directory:** `client` *(важливо, оскільки фронтенд у підпапці)*
- **Build command:** `npm run build`
- **Build output directory:** `dist`

> **Примітка:** Якщо залишити Root directory як `/` (корінь репозиторію), проєкт також збереться завдяки скриптам у кореневому `package.json`, але рекомендовано вказати `client`.

### Крок 3. Змінні середовища (Environment variables)
У налаштуваннях проєкту (**Settings** -> **Environment variables** -> **Production**):
- `VITE_API_URL` = `https://<ваш-бекенд-домен>` (наприклад, `https://shine-sparkle-api.onrender.com`)

---

## ⚡ Спосіб 2: Деплой через Wrangler CLI

Якщо ви хочете деплоїти прямо з командного рядка:

1. Встановіть або запустіть Wrangler:
   ```bash
   npx wrangler login
   ```
2. Зберіть фронтенд:
   ```bash
   npm run build
   ```
3. Опублікуйте проєкт на Cloudflare Pages:
   ```bash
   npx wrangler pages deploy client/dist --project-name=shine-sparkle-app
   ```
   *(або зсередини папки `client` команду: `npm run deploy`)*

---

## ⚙️ Що було налаштовано для Cloudflare Pages

1. **SPA Routing (`client/public/_redirects`)**:
   Додано правило `/* /index.html 200`, щоб при оновленні сторінки або прямих посиланнях Cloudflare не повертав помилку 404.

2. **Оптимізація кешування та безпека (`client/public/_headers`)**:
   - Кешування хешованих ассетів Vite (`/assets/*`) на 1 рік (`Cache-Control: immutable`).
   - `index.html` завжди перевіряється заново, щоб користувачі миттєво отримували оновлення.
   - Базові заголовки захисту (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

3. **Конфігурація `wrangler.toml`**:
   Додано конфігурації для автоматичного визначення директорії `dist`.

4. **Гнучкий `api.js`**:
   URL бекенду тепер безпечно підхоплюється з `VITE_API_URL` без жорсткої прив'язки до localhost у продакшені.

---

## 🗄️ Розгортання Бекенду (Express + PostgreSQL)

Cloudflare Pages обслуговує статичний фронтенд. Для роботи бекенду (`server/`):

1. **Створіть базу даних PostgreSQL** (наприклад, безкоштовно на [Neon.tech](https://neon.tech), [Supabase](https://supabase.com) або [Railway](https://railway.app)).
2. **Розгорніть Node.js сервер** (наприклад, на [Render.com](https://render.com) Web Service або Railway):
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment Variables на сервері:**
     - `DATABASE_URL` = посилання на вашу базу даних
     - `PGSSL` = `true` (для більшості хмарних БД)
     - `CLIENT_ORIGIN` = `https://shine-sparkle-app.pages.dev,*.pages.dev` (URL вашого сайту на Cloudflare Pages)
3. **Виконайте міграцію БД:**
   ```bash
   cd server
   npm run db:migrate
   ```
   *(створює таблиці `contacts` та `quotes`)*