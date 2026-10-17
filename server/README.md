# מערכת לניהול ולהצגת תפוסה במסעדות — צד שרת

צד השרת של המערכת, לפי מסמך האפיון (`restaurant_project.pdf`, גרסה 1.0).

**טכנולוגיות:** Node.js 22 LTS · Express 5 · TypeScript (strict) · PostgreSQL · Prisma 6 · Zod · JWT · bcrypt (`bcryptjs`) · Swagger/OpenAPI · Vitest + Supertest

---

## תוכן עניינים

1. [הרצה מקומית](#1-הרצה-מקומית)
2. [פקודות npm](#2-פקודות-npm)
3. [משתני סביבה](#3-משתני-סביבה)
4. [מבנה הפרויקט](#4-מבנה-הפרויקט)
5. [מסד הנתונים](#5-מסד-הנתונים)
6. [החלטות מימוש (פרטים שלא הוגדרו באפיון)](#6-החלטות-מימוש)
7. [מדריך אינטגרציה לצד הלקוח](#7-מדריך-אינטגרציה-לצד-הלקוח)
8. [בדיקות](#8-בדיקות)
9. [פריסה ל־Render](#9-פריסה-לrender)

---

## 1. הרצה מקומית

דרישות: Node.js 20 ומעלה (מומלץ 22, ראו `.nvmrc`).

```bash
cd server
npm install
cp .env.example .env          # ואז להחליף את JWT_SECRET בערך אקראי ארוך
```

### הפעלת PostgreSQL — אחת משתי האפשרויות

**אפשרות א' — בלי Docker (עובד מיידית ב־Windows):**

```bash
npm run db:local     # להשאיר את הטרמינל פתוח; Ctrl+C עוצר את השרת
```

הסקריפט מריץ שרת PostgreSQL אמיתי (בינאריים של החבילה `embedded-postgres`) על פורט 5432,
עם המשתמש והסיסמה `restaurant` ושני מסדים: `restaurant_db` (פיתוח) ו־`restaurant_test` (בדיקות).
הנתונים נשמרים בתיקייה `~/.restaurant-occupancy-pgdata`, מחוץ לפרויקט.

**אפשרות ב' — Docker** (דורש Docker Desktop עם WSL2):

```bash
npm run db:up        # docker compose up -d db
```

שתי האפשרויות תואמות לערכי ברירת המחדל ב־`.env.example`, ולכן אין צורך לשנות את `DATABASE_URL`.

### מיגרציות, נתוני דוגמה והרצה

```bash
npx prisma migrate deploy    # יצירת הטבלאות
npm run seed                 # נתוני דוגמה (אופציונלי)
npm run dev                  # http://localhost:4000 , Swagger: http://localhost:4000/api-docs
```

**משתמשי דוגמה** (סיסמה לכולם: `Password123!`, לשימוש מקומי בלבד):

| אימייל | תפקיד |
|---|---|
| `guest@example.com` | משתמש רגיל, ללא מסעדה |
| `dana@example.com` | בעלת "פסטה בסטה" (חלבי, תל אביב) |
| `yossi@example.com` | בעל "הגריל של יוסי" (בשרי, חיפה) |
| `michal@example.com` | בעלת "קפה הגפן" (חלבי, ירושלים) |
| `avi@example.com` | בעל "שיפודי הנמל" (בשרי, תל אביב, מלאה) |

---

## 2. פקודות npm

| פקודה | תיאור |
|---|---|
| `npm run dev` | שרת פיתוח עם טעינה מחדש (tsx watch) |
| `npm run typecheck` | בדיקת טיפוסים (`tsc --noEmit`) |
| `npm run build` | קומפילציה ל־`dist/` |
| `npm start` | הרצת הגרסה המקומפלת |
| `npm test` | כל הבדיקות האוטומטיות (דורש מסד בדיקות פעיל) |
| `npm run db:local` | PostgreSQL מקומי בלי Docker |
| `npm run db:up` / `db:down` | PostgreSQL ב־Docker |
| `npm run prisma:migrate` | יצירת מיגרציה חדשה בזמן פיתוח (`prisma migrate dev`) |
| `npm run prisma:deploy` | החלת מיגרציות קיימות (`prisma migrate deploy`) |
| `npm run seed` | נתוני דוגמה (אפשר להריץ יותר מפעם אחת) |
| `npm run openapi:export` | ייצוא מחדש של `openapi.json` |

---

## 3. משתני סביבה

| משתנה | חובה | ברירת מחדל | תיאור |
|---|---|---|---|
| `DATABASE_URL` | כן | — | מחרוזת חיבור ל־PostgreSQL |
| `JWT_SECRET` | כן | — | סוד לחתימת JWT, לפחות 16 תווים (מומלץ 64 ומעלה). **לעולם לא בקוד.** |
| `JWT_EXPIRES_IN` | לא | `1d` | תוקף האסימון (`60`, `2h`, `1d`, ...) |
| `PORT` | לא | `4000` | פורט השרת (ב־Render נקבע אוטומטית) |
| `CORS_ORIGIN` | לא | `http://localhost:5173` | כתובות הלקוח המורשות, מופרדות בפסיק. `*` מתיר כל מקור |
| `TEST_DATABASE_URL` | לבדיקות | — | מסד **נפרד** לבדיקות; **הבדיקות מוחקות את כל הנתונים בו** |
| `NODE_ENV` | לא | `development` | `development` / `test` / `production` |

השרת בודק את המשתנים בעת העלייה ונעצר עם הודעה ברורה אם חסר משהו. ערכי המשתנים עצמם אינם מודפסים.
הקובץ `.env` מופיע ב־`.gitignore`. אל תכללו אותו בקובץ ZIP או ב־Git.

---

## 4. מבנה הפרויקט

```
server/
├── prisma/
│   ├── schema.prisma            # המודלים User, Restaurant, TableGroup
│   ├── migrations/              # מיגרציות SQL (כולל אילוצי CHECK)
│   └── seed.ts                  # נתוני דוגמה
├── prisma.config.ts
├── src/
│   ├── server.ts                # נקודת כניסה (listen + כיבוי מסודר)
│   ├── app.ts                   # הרכבת Express: CORS, JSON, נתיבים, Swagger, טיפול בשגיאות
│   ├── config/env.ts            # קריאה ובדיקה של משתני סביבה (Zod)
│   ├── lib/                     # prisma, jwt, password (bcrypt), errors, validate
│   ├── middleware/
│   │   ├── auth.ts              # requireAuth: אימות Bearer JWT וטעינת המשתמש מהמסד
│   │   └── errorHandler.ts      # פורמט שגיאות אחיד, בלי stack trace ללקוח
│   ├── modules/
│   │   ├── auth/                # register / login / me
│   │   └── restaurants/         # CRUD, קבוצות שולחנות, חיפוש, occupancy.ts (חישובי תפוסה)
│   └── docs/openapi.ts          # מסמך OpenAPI 3.0
├── tests/                       # בדיקות Vitest + Supertest מול PostgreSQL אמיתי
├── scripts/                     # local-db.mjs, export-openapi.ts
├── openapi.json                 # מסמך OpenAPI מיוצא
├── docker-compose.yml
└── .env.example
```

---

## 5. מסד הנתונים

לפי סעיף 7 באפיון. שמות הטבלאות: `users`, `restaurants`, `table_groups`.

| מודל | שדות עיקריים | אילוצים |
|---|---|---|
| **User** | `id` (UUID), `fullName`, `email`, `passwordHash`, `createdAt`, `updatedAt` | `email` ייחודי ונשמר באותיות קטנות (CHECK במסד) |
| **Restaurant** | `id`, `ownerId`, `name`, `ownerName`, `ownerPhone?`, `street`, `city`, `location?`, `description`, `type` (MEAT/DAIRY), `imageUrl?`, `createdAt`, `updatedAt` | `ownerId` ייחודי (מסעדה אחת לכל חשבון), FK ל־User. אין שדה שעות פתיחה |
| **TableGroup** | `id`, `restaurantId`, `capacity`, `totalTables`, `occupiedTables` | ייחודי ל־(`restaurantId`, `capacity`). CHECK: `capacity > 0`, `totalTables >= 0`, `0 <= occupiedTables <= totalTables` |

האילוצים נאכפים גם בשרת (Zod ולוגיקה עסקית) וגם במסד (CHECK, UNIQUE, FK). נתונים לא תקינים נדחים גם כשהם לא עוברים דרך ה־API.

**תפקיד המשתמש:** אין עמודת role. משתמש הוא **מנהל** אם יש לו מסעדה (`restaurant != null`).
כך "יכולת מנהל מופעלת באותו חשבון" ברגע שנוצרת המסעדה, בלי חשבון נוסף ובלי מצב לא עקבי.

### מבנה שדה המיקום (`location`)

האפיון מבקש לתעד את המבנה שנבחר. הבחירה: **מחרוזת טקסט חופשית, רשות** (עד 100 תווים) שמתארת אזור או שכונה,
למשל `"מרכז"`, `"צפון"`, `"נמל תל אביב"`. הסינון `?location=` מחפש את הערך (תת־מחרוזת, ללא תלות ברישיות)
**גם בשדה `location` וגם בשדה `city`**. לכן חיפוש `location=חיפה` מוצא מסעדות בחיפה גם אם לא הוזן להן אזור.
לא נבחרו קואורדינטות או חיפוש לפי מרחק, כדי לא להרחיב את היקף הפרויקט.

---

## 6. החלטות מימוש

פרטים שלא הוגדרו במלואם באפיון. בכל מקרה נבחרה ברירת מחדל פשוטה ובטוחה:

| נושא | ההחלטה |
|---|---|
| סיסמה | 8–72 תווים (72 היא המגבלה של bcrypt). Hash עם bcrypt, cost 12 |
| אימייל | עובר trim והמרה לאותיות קטנות לפני שמירה ובדיקה. ייחודי ללא תלות ברישיות |
| הרשמה | מחזירה את המשתמש (201) **בלי** אסימון, לפי האפיון. הלקוח מבצע login אחרי הרשמה |
| אימייל קיים | 409 עם `code: "EMAIL_EXISTS"` ו־`details: { suggestion: "login" }`, כדי שהלקוח יציע מעבר להתחברות |
| login שגוי | 401 עם אותה הודעה לאימייל לא קיים ולסיסמה שגויה (מונע גילוי חשבונות) |
| JWT | HS256, תוקף לפי `JWT_EXPIRES_IN` (ברירת מחדל יום). המשתמש נטען מהמסד בכל בקשה, ולכן אסימון של משתמש שנמחק נדחה והסטטוס (מנהל או משתמש רגיל) תמיד עדכני |
| "מסעדה לא גמורה אינה מופיעה" | המסעדה נוצרת **באופן אטומי** יחד עם קבוצות השולחנות, אחרי ולידציה של כל שדות החובה. אין שמירה חלקית, ולכן כל מסעדה קיימת היא מסעדה גמורה |
| מינימום שולחנות | יצירה ועדכון דורשים לפחות קבוצה אחת **ולפחות שולחן אחד בסך הכול**, כדי שלא תהיה מסעדה "ריקה" |
| קיבולות כפולות | בבקשה אחת (POST/PUT) קבוצות עם אותה קיבולת **מאוחדות**: השולחנות והתפוסים מסוכמים. ב־PATCH של קבוצה, שינוי קיבולת לקיבולת שכבר קיימת מחזיר 409 `DUPLICATE_CAPACITY` |
| תפוסים מעל הכולל | אם המנהל מקטין את `totalTables` מתחת למספר התפוסים השמור (ולא שולח ערך תפוסים חדש, או שולח שוב את הערך השמור), השרת מוריד את `occupiedTables` ל־`totalTables` ומחזיר הודעה ב־`adjustments`. ערך תפוסים **חדש** שגדול מ־`totalTables` נדחה ב־400 |
| `occupiedTables` שלא נשלח | נשמר הערך הקיים (0 לקבוצה חדשה) |
| PUT table-groups | מחליף את כל הקבוצות. קבוצות מותאמות לפי `capacity`, כך שה־id נשמר. קיבולות שלא נשלחו נמחקות |
| אחוז תפוסה | מספר שלם מעוגל (0–100). אם אין מקומות כלל, האחוז הוא 0 |
| טלפון בעל העסק | מוחזר **רק** לבעל המסעדה (`isOwner: true`). לאחרים השדה לא נכלל בתשובה. גם `ownerId` לא נחשף |
| שדות לא מוכרים | גוף בקשה עם שדה לא מוכר (למשל `ownerId`) נדחה ב־400. אי אפשר לשנות בעלים |
| תמונה | `imageUrl` כתובת `http(s)` בלבד, רשות. אין העלאת קבצים. הלקוח מציג תמונת ברירת מחדל כשהערך `null` |
| ניקוי שדה רשות | ב־PATCH, הערך `null` או `""` מנקה את `ownerPhone`, `location` או `imageUrl` |
| id לא תקין | id שאינו UUID מחזיר 404 (כמו מסעדה שלא קיימת) |
| מיון | `sort` = `name` (ברירת מחדל), `freeSeats`, `occupancy`, `createdAt`. קידומת `-` למיון יורד |
| חיפוש `q` | לפי שם המסעדה, תת־מחרוזת ללא תלות ברישיות |
| עימוד | לא נדרש באפיון ולא מומש. הרשימה מחזירה את כל התוצאות ו־`total` |
| מחיקה | אין נתיב מחיקת מסעדה (בקשת DELETE מחזירה 404) |
| עדכון בזמן אמת | אין, לפי האפיון. הנתונים מתעדכנים כשהמנהל שומר |
| מקביליות | עדכוני מסעדה ושולחנות רצים בטרנזקציה עם נעילת שורה (`SELECT ... FOR UPDATE`) |

---

## 7. מדריך אינטגרציה לצד הלקוח

### כללי

- כתובת בסיס בפיתוח: `http://localhost:4000/api`. ה־CORS מאפשר את `http://localhost:5173` (Vite) כברירת מחדל.
- גוף הבקשה והתשובה ב־JSON (`Content-Type: application/json`).
- נתיבים מוגנים: `Authorization: Bearer <token>`.
- התיעוד המלא והאינטראקטיבי: **`/api-docs`** (Swagger UI). אפשר ללחוץ שם על Authorize ולהדביק את ה־token.
  מסמך OpenAPI גולמי: `/api-docs/openapi.json` או הקובץ `openapi.json`. אפשר לייבא אותו ל־Postman או
  לייצר ממנו טיפוסי TypeScript, למשל עם `npx openapi-typescript openapi.json -o src/api/schema.d.ts`.

### פורמט שגיאה (תמיד)

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request data",
             "details": [ { "path": "email", "message": "Invalid email address" } ] } }
```

ב־`VALIDATION_ERROR`, השדה `details[].path` הוא שם השדה בטופס (למשל `name`, `tableGroups.0.totalTables`).
אפשר למפות אותו ישירות ל־`setError` של React Hook Form. ההודעות באנגלית. מומלץ להציג הודעה בעברית לפי `code` ו־`path`.

| סטטוס | `code` | מתי | מה הלקוח עושה |
|---|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` | נתונים לא תקינים | הצגת שגיאות ליד השדות |
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED` | אין אסימון, אסימון לא תקין או פג תוקף | מחיקת ה־token ומעבר למסך התחברות |
| 401 | `INVALID_CREDENTIALS` | אימייל או סיסמה שגויים ב־login | הודעה בטופס ההתחברות |
| 403 | `FORBIDDEN` | ניסיון לערוך מסעדה של מישהו אחר | הודעת "אין הרשאה" |
| 404 | `RESTAURANT_NOT_FOUND`, `TABLE_GROUP_NOT_FOUND`, `NOT_FOUND` | לא נמצא | מסך "לא נמצא" |
| 409 | `EMAIL_EXISTS` | הרשמה עם אימייל קיים | הודעה וקישור להתחברות (`details.suggestion === "login"`) |
| 409 | `RESTAURANT_EXISTS` | לחשבון כבר יש מסעדה | מעבר לעריכת המסעדה הקיימת |
| 409 | `DUPLICATE_CAPACITY` | שינוי קיבולת לקיבולת קיימת | הודעה בטופס |
| 500 | `INTERNAL_ERROR` | שגיאה לא צפויה | הודעה כללית |

### זרימות עיקריות

**הרשמה והתחברות**

```http
POST /api/auth/register   { "fullName": "...", "email": "...", "password": "..." }   → 201 { user }
POST /api/auth/login      { "email": "...", "password": "..." }                      → 200 { token, user }
GET  /api/auth/me                                                                    → 200 { user }
```

`user` = `{ id, fullName, email, role: "USER" | "MANAGER", isManager, restaurantId, createdAt, updatedAt }`.
אחרי login שומרים את ה־token. ב־`/me` משתמשים בטעינת האפליקציה כדי לדעת אם המשתמש מחובר ואם הוא מנהל.

**כפתור "בעל מסעדה"**
- אם `user.restaurantId === null`: מעבר לטופס יצירה (`POST /api/restaurants`).
- אחרת: מעבר לעריכה (`GET /api/restaurants/{restaurantId}`, ואז `PATCH` או `PUT`).
- אחרי יצירה מוצלחת יש לרענן את `/auth/me` (ב־React Query: `invalidateQueries(['me'])`). המשתמש הופך ל־`MANAGER`.

**רשימה, חיפוש וסינון**

```http
GET /api/restaurants?q=פסטה&location=מרכז&city=תל אביב&type=DAIRY&minFreeSeats=4&sort=-freeSeats
→ 200 { items: Restaurant[], total }
```

כל הפרמטרים רשות. ערך ריק (`?type=`) מתעלמים ממנו, כך שאפשר לשלוח את כל שדות טופס הסינון כמו שהם.

**אובייקט מסעדה (Restaurant)**

```jsonc
{
  "id": "uuid", "name": "...", "ownerName": "...",
  "ownerPhone": "050-...",          // רק כש-isOwner === true
  "street": "...", "city": "...", "location": "מרכז" /* או null */,
  "description": "...", "type": "MEAT" /* או DAIRY */, "imageUrl": null,
  "isOwner": false, "createdAt": "...", "updatedAt": "...",
  "occupancy": {
    "totalSeats": 50, "occupiedSeats": 40, "freeSeats": 10, "occupancyPercent": 80,
    "totalTables": 15, "occupiedTables": 12, "freeTables": 3,
    "freeTablesByCapacity": [ { "capacity": 2, "totalTables": 5, "occupiedTables": 4, "freeTables": 1, "freeSeats": 2 }, ... ]
  },
  "tableGroups": [ { "id": "uuid", "capacity": 2, "totalTables": 5, "occupiedTables": 4, "freeTables": 1 }, ... ]
}
```

- **גלגל התפוסה:** `occupancy.occupancyPercent` (0–100). את הצבע הלקוח בוחר, למשל ירוק מתחת ל־50, צהוב מתחת ל־80, אדום מעל.
- **מקומות פנויים:** `occupancy.freeSeats`. **שולחנות פנויים לפי קיבולת:** `occupancy.freeTablesByCapacity`.
- כל החישובים נעשים בשרת. אין לחשב אותם מחדש בלקוח.
- `type`: הצגה בעברית `MEAT → בשרי`, `DAIRY → חלבי`.

**יצירת מסעדה**

```http
POST /api/restaurants
{ "name": "...", "ownerName": "...", "ownerPhone": "050-1234567", "street": "...", "city": "...",
  "location": "מרכז", "description": "...", "type": "DAIRY", "imageUrl": null,
  "tableGroups": [ { "capacity": 2, "totalTables": 5 }, { "capacity": 4, "totalTables": 10 } ] }
→ 201 { restaurant }
```

**עריכת פרטים** (בלי שולחנות): `PATCH /api/restaurants/:id` עם כל תת־קבוצה של השדות. מחזיר `{ restaurant }`.

**עריכת קבוצות שולחנות (מסך יצירה/עריכה):** `PUT /api/restaurants/:id/table-groups` עם הרשימה המלאה `{ tableGroups: [...] }`.

**ניהול תפוסה (מסך המנהל):** עדכון קבוצה אחת:

```http
PATCH /api/restaurants/:id/table-groups/:groupId   { "occupiedTables": 6 }
→ 200 { restaurantId, tableGroup, tableGroups, occupancy, adjustments }
```

**`adjustments`:** אם המערך לא ריק, השרת תיקן ערך (למשל הוריד את מספר התפוסים כי מספר השולחנות הוקטן).
יש להציג למנהל את ההודעה. כל פריט כולל `capacity`, `requestedOccupiedTables` ו־`occupiedTables`, ואפשר לבנות מהם הודעה בעברית.

### דוגמת קוד ל־fetch (TypeScript)

```ts
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem('token'); // ואז ניווט למסך התחברות
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? res.statusText, body?.error?.details);
  }
  return body as T;
}
```

---

## 8. בדיקות

הבדיקות (Vitest + Supertest) רצות מול **PostgreSQL אמיתי**, במסד הבדיקות שמוגדר ב־`TEST_DATABASE_URL`.
המיגרציות מוחלות עליו אוטומטית. התצורה מסרבת לרוץ אם מסד הבדיקות זהה ל־`DATABASE_URL`.

```bash
npm run db:local     # בטרמינל נפרד (או npm run db:up)
npm test
```

| קובץ | מה נבדק |
|---|---|
| `occupancy.test.ts` | נוסחאות התפוסה, הדוגמה מהאפיון (10 מקומות פנויים), 0 מקומות, עיגול, התאמת תפוסים |
| `auth.test.ts` | הרשמה (כולל Hash, אימייל כפול ללא תלות ברישיות, ולידציה), login תקין ושגוי, `/me`, אסימון חסר, שגוי, חתום בסוד אחר, `alg:none`, פג תוקף, משתמש שנמחק, JSON שבור, 404 |
| `restaurants.test.ts` | 401 בכל נתיבי המסעדות, יצירה והפעלת מנהל, 409 למסעדה שנייה, ולידציות, הסתרת טלפון, PATCH לבעלים בלבד (403 למשתמש רגיל ולמנהל אחר), 404, אין מחיקה, PUT ו־PATCH של קבוצות (איחוד, התאמת תפוסים, קיבולת כפולה, קבוצה של מסעדה אחרת), אילוצי CHECK במסד |
| `search.test.ts` | חיפוש לפי שם, סינון לפי עיר, מיקום, סוג ומקומות פנויים, שילובי מסננים, מיון, פרמטרים ריקים ולא תקינים, הסתרת טלפון ברשימה, `isOwner` |

---

## 9. פריסה ל־Render

בשורש המאגר נמצא `render.yaml` (Blueprint) שמגדיר שירות Web (`rootDir: server`) ומסד PostgreSQL.

1. מעלים את המאגר ל־GitHub. מוודאים ש־`.env` **לא** נכלל בו.
2. ב־Render: **New → Blueprint**, ובוחרים את המאגר.
3. ממלאים את `CORS_ORIGIN` בכתובת הלקוח שנפרס (למשל `https://my-client.onrender.com`).
   את `JWT_SECRET` Render מייצר אוטומטית, ואת `DATABASE_URL` הוא מחבר מהמסד.
4. בכל עלייה השירות מריץ `prisma migrate deploy`, והבדיקה הבריאותית היא `/api/health`.
5. נתוני דוגמה (אופציונלי): ב־Shell של השירות, `npx prisma db seed`.

### מגבלות של השירותים החינמיים (Render)

- **שירות Web חינמי נרדם** אחרי כ־15 דקות ללא תעבורה. הבקשה הראשונה אחרי זה יכולה לקחת 30–60 שניות. כדאי שהלקוח יציג מצב טעינה.
- **PostgreSQL חינמי פג תוקף** 30 יום אחרי היצירה (עם תקופת חסד קצרה) ואז נמחק, וגודלו מוגבל ל־1GB. אין גיבויים.
  לפרויקט ארוך יותר צריך לשדרג או לעבור לספק אחר (למשל Neon או Supabase) ולעדכן את `DATABASE_URL`.
- אין שלב pre-deploy בתוכנית החינמית, ולכן המיגרציות רצות בפקודת ההפעלה. הפעולה אידמפוטנטית.
- מערכת הקבצים זמנית, ולכן התמונות נשמרות ככתובת URL חיצונית ולא כקובץ.
- המגבלות עשויות להשתנות. כדאי לבדוק את המחירון העדכני של Render.

---

## אבטחה — סיכום

- סיסמאות נשמרות כ־bcrypt hash בלבד. `passwordHash` לא מוחזר באף תשובה.
- `JWT_SECRET` נקרא רק ממשתנה סביבה. השרת לא עולה בלעדיו.
- כל הרשאה נבדקת בשרת בכל בקשה: אימות JWT, טעינת המשתמש, ובדיקת בעלות לפני כל עריכה.
- שגיאה לא צפויה מחזירה הודעה כללית בלבד. הפרטים נרשמים רק ביומן השרת.
- גוף בקשה מוגבל ל־100KB. שדות לא מוכרים נדחים. אילוצי תקינות נאכפים גם במסד.
- `npm audit`: נשארה התראה אחת (`deepmerge-ts`), בכלי ה־CLI של Prisma בלבד. הכלי מעבד רק את קובץ התצורה של הפרויקט, ולכן קלט ממשתמשים לא מגיע אליו. התיקון דורש מעבר ל־Prisma 7 (שינוי שובר), ולכן הוא לא בוצע בגרסה הזו.
