/**
 * Demo data for local development. Idempotent: safe to run more than once.
 * All demo accounts use the password below – for local/demo use only.
 */
import { PrismaClient, type RestaurantType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Password123!';

interface DemoRestaurant {
  owner: { fullName: string; email: string };
  restaurant: {
    name: string;
    ownerName: string;
    ownerPhone: string | null;
    street: string;
    city: string;
    location: string | null;
    description: string;
    type: RestaurantType;
    imageUrl: string | null;
  };
  tableGroups: { capacity: number; totalTables: number; occupiedTables: number }[];
}

const demo: DemoRestaurant[] = [
  {
    owner: { fullName: 'דנה לוי', email: 'dana@example.com' },
    restaurant: {
      name: 'פסטה בסטה',
      ownerName: 'דנה לוי',
      ownerPhone: '050-1111111',
      street: 'דיזנגוף 100',
      city: 'תל אביב',
      location: 'מרכז',
      description: 'מסעדה איטלקית חלבית עם פסטה טרייה ופיצות מתנור אבן.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 5, occupiedTables: 3 },
      { capacity: 4, totalTables: 10, occupiedTables: 6 },
    ],
  },
  {
    owner: { fullName: 'יוסי כהן', email: 'yossi@example.com' },
    restaurant: {
      name: 'הגריל של יוסי',
      ownerName: 'יוסי כהן',
      ownerPhone: '052-2222222',
      street: 'שדרות הנשיא 20',
      city: 'חיפה',
      location: 'צפון',
      description: 'סטייקיה ובשרים על האש.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 4, occupiedTables: 4 },
      { capacity: 4, totalTables: 8, occupiedTables: 7 },
      { capacity: 6, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'מיכל אברהם', email: 'michal@example.com' },
    restaurant: {
      name: 'קפה הגפן',
      ownerName: 'מיכל אברהם',
      ownerPhone: null,
      street: 'יפו 50',
      city: 'ירושלים',
      location: 'מרכז העיר',
      description: 'בית קפה חלבי עם ארוחות בוקר ומאפים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 2, totalTables: 12, occupiedTables: 2 }],
  },
  {
    owner: { fullName: 'אבי מזרחי', email: 'avi@example.com' },
    restaurant: {
      name: 'שיפודי הנמל',
      ownerName: 'אבי מזרחי',
      ownerPhone: '054-4444444',
      street: 'הנמל 3',
      city: 'תל אביב',
      location: 'נמל תל אביב',
      description: 'שיפודים, סלטים ואווירה על הים.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 6, occupiedTables: 6 },
      { capacity: 8, totalTables: 1, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'רון שפירא', email: 'ron@example.com' },
    restaurant: {
      name: 'אש וגחלים',
      ownerName: 'רון שפירא',
      ownerPhone: '050-3010101',
      street: 'אבן גבירול 45',
      city: 'תל אביב',
      location: 'מרכז',
      description: 'מסעדת בשרים על הגריל, נתחים מיושנים ותפריט עונתי.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 6, occupiedTables: 2 },
      { capacity: 4, totalTables: 8, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'נועה ברק', email: 'noa@example.com' },
    restaurant: {
      name: 'גבינה וענבים',
      ownerName: 'נועה ברק',
      ownerPhone: '052-3020202',
      street: 'עמק רפאים 12',
      city: 'ירושלים',
      location: 'המושבה הגרמנית',
      description: 'בר גבינות ויין עם מגשי אירוח, לחם מחמצת וסלטים טריים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 8, occupiedTables: 7 },
      { capacity: 4, totalTables: 4, occupiedTables: 4 },
    ],
  },
  {
    owner: { fullName: 'משה דהן', email: 'moshe@example.com' },
    restaurant: {
      name: 'הבשרייה של משה',
      ownerName: 'משה דהן',
      ownerPhone: '054-3030303',
      street: 'הרצל 88',
      city: 'באר שבע',
      location: 'דרום',
      description: 'בשרים על האש, קבב ביתי ומנות מזרחיות כמו של סבתא.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 10, occupiedTables: 6 },
      { capacity: 6, totalTables: 3, occupiedTables: 2 },
    ],
  },
  {
    owner: { fullName: 'שירה גולן', email: 'shira@example.com' },
    restaurant: {
      name: 'בוקר טוב',
      ownerName: 'שירה גולן',
      ownerPhone: '053-3040404',
      street: 'ויצמן 7',
      city: 'כפר סבא',
      location: 'שרון',
      description: 'ארוחות בוקר כל היום, שקשוקה, פנקייק וקפה מעולה.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 10, occupiedTables: 3 },
      { capacity: 4, totalTables: 5, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'איתי רוזן', email: 'itay@example.com' },
    restaurant: {
      name: 'סמוקהאוס',
      ownerName: 'איתי רוזן',
      ownerPhone: '050-3050505',
      street: 'המלאכה 15',
      city: 'רמת גן',
      location: 'מרכז',
      description: 'בשר מעושן בסגנון אמריקאי, בריסקט וצלעות בעישון ארוך.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 7, occupiedTables: 7 },
      { capacity: 6, totalTables: 2, occupiedTables: 2 },
    ],
  },
  {
    owner: { fullName: 'טל אוחיון', email: 'tal@example.com' },
    restaurant: {
      name: 'פיצה נאפולי',
      ownerName: 'טל אוחיון',
      ownerPhone: '052-3060606',
      street: 'סוקולוב 30',
      city: 'הרצליה',
      location: 'שרון',
      description: 'פיצה נפוליטנית בתנור עצים, בצק שתופח 48 שעות.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 6, occupiedTables: 4 },
      { capacity: 4, totalTables: 6, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'אלון פרץ', email: 'alon@example.com' },
    restaurant: {
      name: 'שווארמה הכרמל',
      ownerName: 'אלון פרץ',
      ownerPhone: '054-3070707',
      street: 'מוריה 22',
      city: 'חיפה',
      location: 'הכרמל',
      description: 'שווארמה על הגחלים, לאפה טרייה וסלטים בשפע.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 4, totalTables: 8, occupiedTables: 2 }],
  },
  {
    owner: { fullName: 'הילה מור', email: 'hila@example.com' },
    restaurant: {
      name: 'קפה לואיז',
      ownerName: 'הילה מור',
      ownerPhone: '050-3080808',
      street: 'רוטשילד 60',
      city: 'ראשון לציון',
      location: 'מרכז',
      description: 'בית קפה שכונתי עם מאפים מהבוקר, סלטים וכריכים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 9, occupiedTables: 8 },
      { capacity: 4, totalTables: 3, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'עומר חדד', email: 'omer@example.com' },
    restaurant: {
      name: 'מסעדת הגליל',
      ownerName: 'עומר חדד',
      ownerPhone: '052-3090909',
      street: 'הגליל 5',
      city: 'נצרת עילית',
      location: 'צפון',
      description: 'מטבח גלילי ביתי, מנות בשר מסורתיות ואירוח חם.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 6, occupiedTables: 3 },
      { capacity: 8, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'יעל קפלן', email: 'yael@example.com' },
    restaurant: {
      name: 'פסטה מיה',
      ownerName: 'יעל קפלן',
      ownerPhone: '053-3101010',
      street: 'הנביאים 18',
      city: 'רחובות',
      location: 'שפלה',
      description: 'פסטות טריות ברטבים עשירים, לזניה ביתית וקינוחים איטלקיים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 5, occupiedTables: 1 },
      { capacity: 4, totalTables: 6, occupiedTables: 2 },
    ],
  },
  {
    owner: { fullName: 'דוד אזולאי', email: 'david@example.com' },
    restaurant: {
      name: 'סטקיית הנמל',
      ownerName: 'דוד אזולאי',
      ownerPhone: '050-3111111',
      street: 'הנמל 9',
      city: 'אשדוד',
      location: 'דרום',
      description: 'סטייקים איכותיים מול הים, בר יין ומנות פתיחה מושקעות.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 4, occupiedTables: 3 },
      { capacity: 4, totalTables: 8, occupiedTables: 6 },
    ],
  },
  {
    owner: { fullName: 'מאיה שטרן', email: 'maya@example.com' },
    restaurant: {
      name: 'סושי ופרחים',
      ownerName: 'מאיה שטרן',
      ownerPhone: '054-3121212',
      street: 'בן יהודה 110',
      city: 'תל אביב',
      location: 'צפון הישן',
      description: 'מסעדה יפנית חלבית, סושי צמחוני ודגים טריים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 8, occupiedTables: 8 },
      { capacity: 4, totalTables: 4, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'גיא בן דוד', email: 'guy@example.com' },
    restaurant: {
      name: 'בורגר בר',
      ownerName: 'גיא בן דוד',
      ownerPhone: '052-3131313',
      street: 'ז׳בוטינסקי 70',
      city: 'פתח תקווה',
      location: 'מרכז',
      description: 'המבורגרים עסיסיים מבשר טחון במקום, צ׳יפס ביתי ובירה מהחבית.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 6, occupiedTables: 5 },
      { capacity: 4, totalTables: 6, occupiedTables: 4 },
    ],
  },
  {
    owner: { fullName: 'רוני אלמוג', email: 'roni@example.com' },
    restaurant: {
      name: 'הגינה',
      ownerName: 'רוני אלמוג',
      ownerPhone: '050-3141414',
      street: 'המייסדים 3',
      city: 'זכרון יעקב',
      location: 'צפון',
      description: 'מסעדה חלבית בתוך גינה ירוקה, מנות עונתיות מירקות מקומיים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 8, occupiedTables: 2 },
      { capacity: 6, totalTables: 2, occupiedTables: 0 },
    ],
  },
  {
    owner: { fullName: 'שלומי ביטון', email: 'shlomi@example.com' },
    restaurant: {
      name: 'הפרגית של שלומי',
      ownerName: 'שלומי ביטון',
      ownerPhone: '053-3151515',
      street: 'העצמאות 40',
      city: 'נתניה',
      location: 'שרון',
      description: 'פרגיות, שיפודים ומנות עיקריות על האש במחירים הוגנים.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 9, occupiedTables: 9 },
      { capacity: 6, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'ליאת נחום', email: 'liat@example.com' },
    restaurant: {
      name: 'מאפיית השוק',
      ownerName: 'ליאת נחום',
      ownerPhone: '052-3161616',
      street: 'אגריפס 25',
      city: 'ירושלים',
      location: 'מחנה יהודה',
      description: 'מאפים חמים, קרואסונים, בורקסים וקפה בלב השוק.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 2, totalTables: 10, occupiedTables: 6 }],
  },
  {
    owner: { fullName: 'אריאל סבן', email: 'ariel@example.com' },
    restaurant: {
      name: 'בית האסאדו',
      ownerName: 'אריאל סבן',
      ownerPhone: '054-3171717',
      street: 'הבנים 14',
      city: 'הוד השרון',
      location: 'שרון',
      description: 'אסאדו ארגנטינאי בבישול איטי, אמפנדס וצ׳ימיצ׳ורי.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 6, occupiedTables: 2 },
      { capacity: 8, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'אורית לנדאו', email: 'orit@example.com' },
    restaurant: {
      name: 'שוקולד ופיסטוק',
      ownerName: 'אורית לנדאו',
      ownerPhone: '050-3181818',
      street: 'הרצל 120',
      city: 'חולון',
      location: 'מרכז',
      description: 'קינוחים, וופלים בלגיים, גלידה ביתית ומשקאות חמים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 8, occupiedTables: 5 },
      { capacity: 4, totalTables: 3, occupiedTables: 2 },
    ],
  },
  {
    owner: { fullName: 'ניר אשכנזי', email: 'nir@example.com' },
    restaurant: {
      name: 'מעדני הצפון',
      ownerName: 'ניר אשכנזי',
      ownerPhone: '052-3191919',
      street: 'ירושלים 33',
      city: 'קריית שמונה',
      location: 'גליל עליון',
      description: 'מסעדת בשרים כפרית עם נוף להרים ומנות מבשר מקומי.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 4, totalTables: 7, occupiedTables: 1 }],
  },
  {
    owner: { fullName: 'דנית שמעוני', email: 'danit@example.com' },
    restaurant: {
      name: 'הבראסרי הלבנה',
      ownerName: 'דנית שמעוני',
      ownerPhone: '053-3202020',
      street: 'שדרות ירושלים 50',
      city: 'יפו',
      location: 'יפו',
      description: 'בראסרי חלבי בסגנון צרפתי, דגים, קישים ויינות.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 6, occupiedTables: 6 },
      { capacity: 4, totalTables: 5, occupiedTables: 4 },
    ],
  },
  {
    owner: { fullName: 'עידו גבאי', email: 'ido@example.com' },
    restaurant: {
      name: 'שיפודי התקווה',
      ownerName: 'עידו גבאי',
      ownerPhone: '054-3212121',
      street: 'האצ״ל 8',
      city: 'תל אביב',
      location: 'שכונת התקווה',
      description: 'שיפודיה ותיקה עם מבחר בשרים, סלטים ופיתות חמות.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 10, occupiedTables: 8 },
      { capacity: 6, totalTables: 3, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'קרן יוסף', email: 'keren@example.com' },
    restaurant: {
      name: 'סלט בר',
      ownerName: 'קרן יוסף',
      ownerPhone: '050-3222222',
      street: 'הברזל 21',
      city: 'תל אביב',
      location: 'רמת החייל',
      description: 'סלטים בהרכבה אישית, קערות בריאות ומיצים סחוטים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 2, totalTables: 12, occupiedTables: 4 }],
  },
  {
    owner: { fullName: 'חיים טל', email: 'haim@example.com' },
    restaurant: {
      name: 'הקצבייה',
      ownerName: 'חיים טל',
      ownerPhone: '052-3232323',
      street: 'בגין 5',
      city: 'מודיעין',
      location: 'מרכז',
      description: 'קצבייה ומסעדה: בוחרים נתח בויטרינה והשף צולה אותו במקום.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 4, occupiedTables: 2 },
      { capacity: 4, totalTables: 6, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'סיון רביד', email: 'sivan@example.com' },
    restaurant: {
      name: 'בית הקפה בכיכר',
      ownerName: 'סיון רביד',
      ownerPhone: '053-3242424',
      street: 'כיכר העיר 1',
      city: 'רעננה',
      location: 'שרון',
      description: 'בית קפה תוסס בכיכר העירונית, ארוחות קלות ועוגות ביתיות.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 8, occupiedTables: 7 },
      { capacity: 4, totalTables: 4, occupiedTables: 3 },
    ],
  },
  {
    owner: { fullName: 'בני עמר', email: 'beni@example.com' },
    restaurant: {
      name: 'מסעדת המרכז',
      ownerName: 'בני עמר',
      ownerPhone: '054-3252525',
      street: 'התמרים 16',
      city: 'אילת',
      location: 'דרום',
      description: 'מנות בשר מזרחיות, מרקים ותבשילים ביתיים בלב אילת.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 8, occupiedTables: 4 },
      { capacity: 6, totalTables: 2, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'תמר אדלר', email: 'tamar@example.com' },
    restaurant: {
      name: 'ביסטרו לימון',
      ownerName: 'תמר אדלר',
      ownerPhone: '050-3262626',
      street: 'מסדה 40',
      city: 'חיפה',
      location: 'הדר',
      description: 'ביסטרו חלבי קטן ונעים, מנות ים תיכוניות ופסטות.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 6, occupiedTables: 2 },
      { capacity: 4, totalTables: 3, occupiedTables: 1 },
    ],
  },
  {
    owner: { fullName: 'אסף לוינסון', email: 'asaf@example.com' },
    restaurant: {
      name: 'בשר ויין',
      ownerName: 'אסף לוינסון',
      ownerPhone: '052-3272727',
      street: 'עמק יזרעאל 2',
      city: 'עפולה',
      location: 'עמקים',
      description: 'מסעדת שף בשרית עם יינות מיקבי האזור.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 2, totalTables: 5, occupiedTables: 5 },
      { capacity: 4, totalTables: 5, occupiedTables: 4 },
    ],
  },
  {
    owner: { fullName: 'רותם חזן', email: 'rotem@example.com' },
    restaurant: {
      name: 'בייגל וקפה',
      ownerName: 'רותם חזן',
      ownerPhone: '053-3282828',
      street: 'הרב קוק 11',
      city: 'בני ברק',
      location: 'מרכז',
      description: 'בייגלים טריים עם ממרחים, סלמון ושמנת, וקפה איכותי.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [{ capacity: 2, totalTables: 10, occupiedTables: 5 }],
  },
  {
    owner: { fullName: 'יונתן רז', email: 'yonatan@example.com' },
    restaurant: {
      name: 'הטאבון',
      ownerName: 'יונתן רז',
      ownerPhone: '054-3292929',
      street: 'דרך השלום 60',
      city: 'גבעתיים',
      location: 'מרכז',
      description: 'מנות בשר בטאבון, לחמים חמים ומטבלים ביתיים.',
      type: 'MEAT',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 6, occupiedTables: 1 },
      { capacity: 6, totalTables: 2, occupiedTables: 0 },
    ],
  },
  {
    owner: { fullName: 'מורן קדוש', email: 'moran@example.com' },
    restaurant: {
      name: 'הדגים של מורן',
      ownerName: 'מורן קדוש',
      ownerPhone: '050-3303030',
      street: 'הטיילת 4',
      city: 'טבריה',
      location: 'הכנרת',
      description: 'מסעדת דגים חלבית על שפת הכנרת, אמנון טרי וסלטים.',
      type: 'DAIRY',
      imageUrl: null,
    },
    tableGroups: [
      { capacity: 4, totalTables: 8, occupiedTables: 6 },
      { capacity: 8, totalTables: 2, occupiedTables: 2 },
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // A regular user without a restaurant.
  await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: { fullName: 'אורח לדוגמה', email: 'guest@example.com', passwordHash },
  });

  for (const d of demo) {
    const owner = await prisma.user.upsert({
      where: { email: d.owner.email },
      update: {},
      create: { ...d.owner, passwordHash },
    });
    const exists = await prisma.restaurant.findUnique({ where: { ownerId: owner.id } });
    if (exists) continue;
    await prisma.restaurant.create({
      data: { ...d.restaurant, ownerId: owner.id, tableGroups: { create: d.tableGroups } },
    });
  }

  const [users, restaurants] = await Promise.all([prisma.user.count(), prisma.restaurant.count()]);
  console.log(`Seed done: ${users} users, ${restaurants} restaurants. Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
