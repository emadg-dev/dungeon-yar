import {
  Character,
  NPC,
  ItemLibraryEntry,
  RewardPackage,
  CampaignNote,
  User,
  SkillDefinition,
  CharacterNote,
  Encounter,
  WeaponTemplate,
  ClassTemplate,
  CampaignRule,
  LocationEntry
} from '../types';

export const DEFAULT_5E_SKILLS: SkillDefinition[] = [
  { id: 'athletics', nameFa: 'زورآزمایی (قدرت)', nameEn: 'Athletics', ability: 'str', proficient: false, expertise: false },
  { id: 'acrobatics', nameFa: 'آکروباتیک (چابکی)', nameEn: 'Acrobatics', ability: 'dex', proficient: false, expertise: false },
  { id: 'sleight_of_hand', nameFa: 'تردستی (چابکی)', nameEn: 'Sleight of Hand', ability: 'dex', proficient: false, expertise: false },
  { id: 'stealth', nameFa: 'مخفی‌کاری (چابکی)', nameEn: 'Stealth', ability: 'dex', proficient: false, expertise: false },
  { id: 'arcana', nameFa: 'علوم اسرارآمیز و جادو (هوش)', nameEn: 'Arcana', ability: 'int', proficient: false, expertise: false },
  { id: 'history', nameFa: 'تاریخ و وقایع‌نگاری (هوش)', nameEn: 'History', ability: 'int', proficient: false, expertise: false },
  { id: 'investigation', nameFa: 'جستجو و تفتیش (هوش)', nameEn: 'Investigation', ability: 'int', proficient: false, expertise: false },
  { id: 'nature', nameFa: 'طبیعت‌شناسی (هوش)', nameEn: 'Nature', ability: 'int', proficient: false, expertise: false },
  { id: 'religion', nameFa: 'ادیان و فرایض (هوش)', nameEn: 'Religion', ability: 'int', proficient: false, expertise: false },
  { id: 'animal_handling', nameFa: 'مهار حیوانات (خرد)', nameEn: 'Animal Handling', ability: 'wis', proficient: false, expertise: false },
  { id: 'insight', nameFa: 'بینش و درک انگیزه (خرد)', nameEn: 'Insight', ability: 'wis', proficient: false, expertise: false },
  { id: 'medicine', nameFa: 'پزشکی و درمان (خرد)', nameEn: 'Medicine', ability: 'wis', proficient: false, expertise: false },
  { id: 'perception', nameFa: 'ادراک و هوشیاری (خرد)', nameEn: 'Perception', ability: 'wis', proficient: false, expertise: false },
  { id: 'survival', nameFa: 'بقا و راه‌بلدی (خرد)', nameEn: 'Survival', ability: 'wis', proficient: false, expertise: false },
  { id: 'deception', nameFa: 'فریب و نیرنگ (فرهمندی)', nameEn: 'Deception', ability: 'cha', proficient: false, expertise: false },
  { id: 'intimidation', nameFa: 'ارعاب و تهدید (فرهمندی)', nameEn: 'Intimidation', ability: 'cha', proficient: false, expertise: false },
  { id: 'performance', nameFa: 'نمایش و اجرا (فرهمندی)', nameEn: 'Performance', ability: 'cha', proficient: false, expertise: false },
  { id: 'persuasion', nameFa: 'متقاعدسازی و چانه‌زنی (فرهمندی)', nameEn: 'Persuasion', ability: 'cha', proficient: false, expertise: false },
  { id: 'stone_sense', nameFa: 'حس سنگ و خاک کهن (ویژه)', nameEn: 'Stone Lore', ability: 'str', proficient: false, expertise: false, custom: true },
  { id: 'time_echo', nameFa: 'حس طنین زمان (ویژه)', nameEn: 'Time Sense', ability: 'wis', proficient: false, expertise: false, custom: true }
];

export const SEED_WEAPON_TEMPLATES: WeaponTemplate[] = [
  // سامان
  {
    id: 'wpn-sam-special',
    name: 'چکش پژواکسنگ',
    damageDice: '1d6',
    damageType: 'کوبشی (Bludgeoning)',
    range: 'تن به تن',
    properties: 'دو دست 1d8، سربی و برنز ورنا',
    kind: 'special',
    specialAbility: {
      name: 'طنین ساختار',
      description: 'یک بار در هر استراحت کوتاه؛ با کوبیدن دسته چکش بر زمین یا دیوار، ساختار پشت سنگ را تا شعاع ۳۰ فوت حس می‌کند؛ مزیت (Advantage) در چک‌های کشف درهای مخفی و تله‌ها.',
      usesPerRest: 1,
      restType: 'short'
    },
    description: 'ساخته شده از ترکیب سرب و برنز ورنا با وزن متعادل.',
    secretNotes: 'آثار ارتعاشی آن با سازه‌های خوابیده دیوان هماهنگ است.'
  },
  {
    id: 'wpn-sam-showy',
    name: 'تبر بزرگ کوهشکاف',
    damageDice: '1d12',
    damageType: 'برشی (Slashing)',
    range: 'تن به تن',
    properties: 'دو دست، سنگین',
    kind: 'showy',
    description: 'رگه‌های کهربایی روی تیغه هنگام اصابت ضربه با صدای رعد کوتاهی می‌درخشند.',
    secretNotes: 'جلوه بصری بالا، بدون اثر مکانیکی ویژه اضافه.'
  },

  // پردیس
  {
    id: 'wpn-par-special',
    name: 'گرز پیمان',
    damageDice: '1d6',
    damageType: 'کوبشی (Bludgeoning)',
    range: 'تن به تن',
    properties: 'یک دست، سر سنگی تیره',
    kind: 'special',
    specialAbility: {
      name: 'سپر عهد',
      description: 'یک بار در هر استراحت کوتاه؛ واکنش (Reaction) هنگامی که هم‌پیمانی در ۵ فوتی هدف حمله قرار می‌گیرد: +۲ به درجه زرهی (AC) او در برابر آن حمله می‌دهد.',
      usesPerRest: 1,
      restType: 'short'
    },
    description: 'سر سنگی تیره با نشانی محو و تراشیده از عهد باستان.',
    secretNotes: 'در نزدیکی فره‌داران نور ضعیفی بازتاب می‌دهد.'
  },
  {
    id: 'wpn-par-showy',
    name: 'گرز بزرگ فرهسوز',
    damageDice: '1d8',
    damageType: 'کوبشی (Bludgeoning)',
    range: 'تن به تن',
    properties: 'دو دست 1d10، رگه‌های زرین',
    kind: 'showy',
    description: 'رگه‌های زرین و جرقه‌های کهربایی هنگام چرخش در هوا پراکنده می‌شود.',
    secretNotes: 'فاقد قابلیت مکانیکی خاص، تاس صدمه بالاتر.'
  },

  // شیده
  {
    id: 'wpn-shi-special',
    name: 'خنجر لغزنده',
    damageDice: '1d4',
    damageType: 'نافذ (Piercing)',
    range: 'تن به تن / پرتابی (۲۰/۶۰ فوت)',
    properties: 'چابک (Finesse)، سبک، پرتابی',
    kind: 'special',
    specialAbility: {
      name: 'دوختن سایه',
      description: 'یک بار در هر استراحت کوتاه؛ پس از اصابت ضربه، سایه هدف بر زمین دوخته می‌شود و سرعت حرکت آن تا پایان دور بعدی شیده ۱۰ فوت کاهش می‌یابد.',
      usesPerRest: 1,
      restType: 'short'
    },
    description: 'تیغه‌ای سیاه و صیقلی که نور را بازتاب نمی‌دهد.',
    secretNotes: 'سایه هدف برای لحظاتی جدا از بدنش حس می‌شود.'
  },
  {
    id: 'wpn-shi-showy',
    name: 'شمشیر باریک شکافزمان',
    damageDice: '1d6',
    damageType: 'نافذ (Piercing)',
    range: 'تن به تن',
    properties: 'چابک (Finesse)',
    kind: 'showy',
    description: 'تیغه در هنگام برش ردی نیمه‌شفاف و لرزان در هوا بر جای می‌گذارد.',
    secretNotes: 'فقط اثر بصری نوری دارد.'
  },

  // مانا
  {
    id: 'wpn-man-special',
    name: 'کمان ریشهبافت',
    damageDice: '1d4',
    damageType: 'نافذ (Piercing)',
    range: '۸۰/۳۲۰ فوت',
    properties: 'دو دست، دوربرد',
    kind: 'special',
    specialAbility: {
      name: 'تیر نهال',
      description: 'یک بار در هر استراحت کوتاه؛ از تیر شلیک‌شده ریشه‌های نازکی جوانه می‌زند. هدف باید در تست نجات قدرت (STR Save DC 12) موفق شود یا سرعتش تا پایان دور بعدی نصف گردد.',
      usesPerRest: 1,
      restType: 'short'
    },
    description: 'کمانی بافته‌شده از ریشه‌های زنده‌ی جنگل‌های ورنا.',
    secretNotes: 'در مجاورت خاک مرطوب بوی شکوفه می‌دهد.'
  },
  {
    id: 'wpn-man-showy',
    name: 'کمان بلند ورنا',
    damageDice: '1d6',
    damageType: 'نافذ (Piercing)',
    range: '۱۵۰/۶۰۰ فوت',
    properties: 'دو دست، دوربرد',
    kind: 'showy',
    description: 'صدای زمزمه برگ‌ها از زه کمان شنیده می‌شود و هنگام شلیک گلبرگ‌ها از پیکان فرو می‌ریزند.',
    secretNotes: 'برد بلندتر و تاس صدمه بالاتر بدون ویژگی مکانیکی فعال.'
  },

  // هامون
  {
    id: 'wpn-ham-special',
    name: 'عصای آذرین',
    damageDice: '1d4',
    damageType: 'آتشین (Fire)',
    range: 'تن به تن',
    properties: 'دو دست 1d8',
    kind: 'special',
    specialAbility: {
      name: 'شعلهی پیوسته',
      description: 'یک بار در هر استراحت کوتاه؛ به هر بازیکن در فاصله ۵ فوتی خود 1d6 جان (HP) می‌بخشد.',
      usesPerRest: 1,
      restType: 'short'
    },
    description: 'چوب سوخته و سخت که سری از فلز زغال‌مانند گداخته دارد.',
    secretNotes: 'گرمای آن به بدن یاران آرامش می‌بخشد.'
  },
  {
    id: 'wpn-ham-showy',
    name: 'گرز آتشدان',
    damageDice: '1d6',
    damageType: 'آتشین (Fire)',
    range: 'تن به تن',
    properties: 'یک دست',
    kind: 'showy',
    description: 'جرقه‌ها و خاکستر گرم با هر تاب دادن گرز در هوا معلق می‌مانند.',
    secretNotes: 'اثر بصری آتشین بدون ترمیم جان یاران.'
  }
];

// ---------- Shared tables (from the world book) ----------
export const FULL_CASTER_SLOTS: Record<number, number[]> = { // [1st..9th]
  1:[2], 2:[3], 3:[4,2], 4:[4,3], 5:[4,3,2], 6:[4,3,3], 7:[4,3,3,1], 8:[4,3,3,2],
  9:[4,3,3,3,1], 10:[4,3,3,3,2], 11:[4,3,3,3,2,1], 12:[4,3,3,3,2,1],
  13:[4,3,3,3,2,1,1], 14:[4,3,3,3,2,1,1], 15:[4,3,3,3,2,1,1,1], 16:[4,3,3,3,2,1,1,1],
  17:[4,3,3,3,2,1,1,1,1], 18:[4,3,3,3,3,1,1,1,1], 19:[4,3,3,3,3,2,1,1,1], 20:[4,3,3,3,3,2,2,1,1],
};
export const HALF_CASTER_SLOTS: Record<number, number[]> = { // book columns "اسلات۱ / اسلات۲"
  1:[], 2:[2], 3:[3], 4:[3], 5:[4,2], 6:[4,2], 7:[4,3], 8:[4,3], 9:[4,3], 10:[4,3],
  11:[4,3], 12:[4,3], 13:[4,3], 14:[4,3], 15:[4,3], 16:[4,3], 17:[4,4], 18:[4,4], 19:[4,4], 20:[4,4],
};
// Fixed HP total per level (book table). Increment per level after L1:
// فرهدار 8, موبد آذرین 6, دیوانزاد 8, پیمانبان 7, سایهخوان 5, مهآشنا 6
export const FIXED_HP: Record<string, number[]> = {
  "فرهدار":[12,20,28,36,44,52,60,68,76,84,92,100,108,116,124,132,140,148,156,164],
  "موبد آذرین":[9,15,21,27,33,39,45,51,57,63,69,75,81,87,93,99,105,111,117,123],
  "دیوانزاد":[11,19,27,35,43,51,59,67,75,83,91,99,107,115,123,131,139,147,155,163],
  "پیمانبان":[11,18,25,32,39,46,53,60,67,74,81,88,95,102,109,116,123,130,137,144],
  "سایهخوان":[7,12,17,22,27,32,37,42,47,52,57,62,67,72,77,82,87,92,97,102],
  "مهآشنا":[9,15,21,27,33,39,45,51,57,63,69,75,81,87,93,99,105,111,117,123],
};
export const ASI_LEVELS = [4, 8, 12, 16, 19];

// ---------- Classes ----------
export const CLASSES = [
{
  name: "فرهدار", title: "مظهر اراده و پایداری شاهنشاهی",
  hitDie: "d10", saves: ["WIS","CHA"],
  skillChoices: { count: 2, options: ["Athletics","Insight","Intimidation","Persuasion","Religion"] },
  weaponProf: "همه سلاحهای ساده و رزمی", armorProf: "همه زرهها + سپر",
  startingEquipment: "گرز، زره سنگین یا زره سبک + سپر، نشان فره",
  acFormula: "16 (زره سنگین) + 2 (سپر) = 18، مستقل از DEX",
  spellcasting: null,
  extraAttackLevel: 5,
  baseAbilities: { STR:16, DEX:10, CON:15, WIS:12, INT:8, CHA:14 },
  resources: [{ name:"Divine Smite", uses:"1 بار در هر استراحت کوتاه، از سطح ۲",
    diceByLevel:{ 2:"2d8",3:"2d8",4:"3d8",5:"3d8",6:"3d8",7:"4d8",8:"4d8",9:"4d8",10:"4d8",
      11:"5d8",12:"5d8",13:"5d8",14:"5d8",15:"6d8",16:"6d8",17:"6d8",18:"6d8",19:"6d8",20:"6d8" } }],
  subclasses: [
    { name:"سوگند نگهبان", unlockLevel:3, desc:"فداکاری و دریافت آسیب متحدان" },
    { name:"سوگند شکارچی تاریکی", unlockLevel:3, desc:"نابودی موجودات مسخشدهی مهستان و سپیدارون" },
  ],
  notes: "نشان در سطح ۱ مقاومت در برابر ترس را بالا میبرد و در تاریکی اعماق زمین و سیاهچالهای دیوان منبع نور است. به جای تحلیل ذهنی از کاریزمای بالایش برای هدایت یا ارعاب استفاده میکند. با پیشرفت، بدن او ویژگیهای «زره زندار» را میپذیرد.",
  features: {
    1:"نشان فره",2:"ضربه فره (فعال)",3:"سوگند آریامن",4:"زره زندار + ASI",5:"Extra Attack + ندای نگهبان",
    6:"وارث عهد آریامن",7:"فیچر سوگند (سطح ۲)",8:"ASI",9:"مقاومت آسیب عنصری",10:"اورای الهامبخش",
    11:"ضربه فره بهبودیافته",12:"ASI",13:"فیچر سوگند (سطح ۳)",14:"مقاومت ترس متحدان",
    15:"زره زندار بهبودیافته",16:"ASI",17:"فیچر سوگند (سطح ۴)",18:"اورا ۹ متر",19:"ASI",20:"آواتار آریامن (Capstone)",
  },
},
{
  name: "موبد آذرین", title: "حافظ شعلهی خاطرات",
  hitDie: "d8", saves: ["WIS","INT"],
  skillChoices: { count: 2, options: ["History","Insight","Medicine","Religion"] },
  weaponProf: "سلاحهای ساده + چوبدستی", armorProf: "هیچ زره یا سپری",
  startingEquipment: "چوبدستی، کیف دارویی، لباس ساده",
  acFormula: "10 + DEX mod + WIS mod (Unarmored Defense؛ با پوشیدن هر زره یا سپر غیرفعال میشود)",
  spellcasting: { ability:"WIS", dc:"8 + Proficiency + WIS mod", slots:"FULL_CASTER_SLOTS",
    spells: {
      cantrips:["شراره فره (Sacred Flame: 1d8 radiant, Save DEX)","لمس درمان (Spare the Dying)"],
      1:["آتش پاککننده (Cure Wounds)","بازتاب کوچک (Shield of Faith)","آشکارسازی نیت (Detect Evil and Good)"],
      2:["شعله داوری (Zone of Truth)","درمان مصدومیت (Lesser Restoration)","سکوت (Silence)"],
      3:["آتش زندگی (Mass Healing Word)","رفع نفرین (Remove Curse)","بازگشت روح موقت (Speak with Dead)"],
      4:["خاطره شعلهور (Divination)","محافظ آتشین (Guardian of Faith)"],
      5:["شعله جاودان (Raise Dead)","دفع فساد (Dispel Evil and Good)"],
    } },
  extraAttackLevel: null,
  baseAbilities: { STR:8, DEX:10, CON:13, WIS:16, INT:14, CHA:14 },
  resources: [],
  notes: "«شعله حافظه» در سطح ۱ ردپای اتفاقات گذشته را در اشیا و مکانها نشان میدهد. مسیر او از درمان زخمهای ساده در سطح ۲ به پاکسازی نفرینها و افشای توهمات در سطوح بالا میرود.",
  features: {
    1:"شعله حافظه، دفاع بیزره",2:"آتش پاککننده",3:"شعله داوری",4:"ASI",5:"آتش زندگی",6:"خاطره شعلهور",
    7:"مقاومت خطای حافظه",8:"ASI",9:"شعله جمعی",10:"دید آذرین",11:"آتش پالایش",12:"ASI",
    13:"شعله جاودان",14:"مصونیت نسبی توهم",15:"خاطره مطلق",16:"ASI",17:"شعله بازگشت",
    18:"آتش بیکران",19:"ASI",20:"آواتار آتش آذرین (Capstone)",
  },
},
{
  name: "دیوانزاد", title: "معمار استقامت و صنعت باستانی",
  hitDie: "d8", saves: ["CON","INT"],
  skillChoices: { count: 2, options: ["Arcana","Investigation","Nature","Perception"] },
  weaponProf: "سلاحهای ساده + یک سلاح رزمی (پتک جنگی)", armorProf: "زره سبک و متوسط، سپر",
  startingEquipment: "پتک جنگی، زره چرمی نرم، ابزار آهنگری",
  acFormula: "12 (Studded Leather) + CON mod (+2 با سپر)",
  spellcasting: { ability:"INT", dc:"8 + Proficiency + INT mod", slots:"HALF_CASTER_SLOTS", spells: null /* لیست اسپل در متن کتاب نیامده */ },
  extraAttackLevel: 5,
  baseAbilities: { STR:15, DEX:10, CON:16, WIS:8, INT:17, CHA:9 },
  companion: { name:"سازه همراه", fromLevel:3, ac:15, hp:"2 × سطح + 2 × CON mod" },
  resources: [],
  notes: "«خون سنگ» استقامتی فراتر از انسانهای عادی میدهد. «صنعت باستانی» (سطح ۲) ساخت ابزار و ماسکهای هنری است. در سطوح میانی همراهی کوچک از سنگ یا فلز میسازد و در نهایت «استاد باغستان» میشود و فناوریهای مدفون دیوان را فعال میکند.",
  features: {
    1:"خون سنگ",2:"صنعت باستانی",3:"سازه همراه",4:"استخوان آهنین + ASI",5:"استاد باغستان، Extra Attack",
    6:"میراث دیوان",7:"ارتقای سازه",8:"ASI",9:"صنعت پیشرفته",10:"ترمیم خودکار سازه",11:"فناوری مدفون",
    12:"ASI",13:"سازه دوم",14:"مقاومت آسیب سازهای",15:"استاد صنعت باستانی",16:"ASI",
    17:"میراث کامل باغستان",18:"سازه نامیرا",19:"ASI",20:"معمار باغستان (Capstone)",
  },
},
{
  name: "پیمانبان", title: "فرزند خاموش طبیعت (پیمانبان ورنا)",
  hitDie: "d10", saves: ["STR","WIS"],
  skillChoices: { count: 3, options: ["Animal Handling","Nature","Perception","Survival","Stealth"] },
  weaponProf: "سلاحهای ساده + کمانهای ساده و رزمی", armorProf: "زره سبک و متوسط، سپر",
  startingEquipment: "کمان کوتاه، زره چرمی، کیسه بذر ورنا",
  acFormula: "11 (چرم) + DEX mod  یا  13 (متوسط) + min(DEX, +2)",
  spellcasting: { ability:"WIS", dc:"8 + Proficiency + WIS mod", slots:"HALF_CASTER_SLOTS",
    spells: {
      cantrips:["پیام گیاه (Druidcraft)","رشد ناگهانی (Thorn Whip)"],
      1:["زبان ریشهها (Speak with Animals)","پیوند شکارچی (Hunter's Mark)","درمان طبیعی (Cure Wounds)"],
      2:["گام ورنا (Pass without Trace)","تغییر ورنایی مقدماتی (Beast Sense)","دام گیاهی (Entangle)"],
      3:["تغییر ورنایی (Conjure Animals بازطراحیشده)","سرعت گراز (Haste)"],
      4:["همراه جنگل تقویتشده (Conjure Woodland Beings)","مصونیت به عناصر (Protection from Energy)"],
      5:["خشم ورنا (Insect Plague / Sleet Storm)","تجدید حیات جنگل (Reincarnate)"],
    } },
  extraAttackLevel: 5,
  baseAbilities: { STR:10, DEX:16, CON:12, WIS:16, INT:10, CHA:12 },
  companion: { name:"همراه جنگل", fromLevel:4, ac:null, hp:"جدا (HP و Attack مستقل)" },
  resources: [],
  notes: "«زبان ریشهها» پیوندی با موجودات زنده میسازد. «گام ورنا» (سطح ۲) حرکت بیصدا در طبیعت است. «تغییر ورنایی» (سطح ۳) به او اجازه میدهد ویژگیهای حیوانات را برای مدت کوتاه به امانت بگیرد.",
  features: {
    1:"زبان ریشهها",2:"گام ورنا",3:"تغییر ورنایی",4:"ASI",5:"همراه جنگل، Extra Attack",6:"خشم ورنا",
    7:"فرزند جنگل",8:"ASI",9:"تغییر ورنایی پیشرفته",10:"ردیابی بینقص",11:"پیوند عمیق جنگل",12:"ASI",
    13:"همراه جنگل ارتقایافته",14:"مصونیت ردیابی سحری",15:"خشم ورنا (AoE بزرگتر)",16:"ASI",
    17:"یگانگی با ورنا",18:"تغییر ورنایی نامحدود",19:"ASI",20:"آواتار جنگل ورنا (Capstone)",
  },
},
{
  name: "سایهخوان", title: "خواندهی شکافهای واقعیت",
  hitDie: "d6", saves: ["INT","WIS"],
  skillChoices: { count: 2, options: ["Arcana","History","Insight","Investigation"] },
  weaponProf: "خنجر، چاقو، چوبدستی، تیرکمان سبک", armorProf: "هیچ زره یا سپری",
  startingEquipment: "خنجر، کتاب اسپل، جزوه نشانههای زمانی",
  acFormula: "10 + DEX mod (بدون زره)",
  spellcasting: { ability:"INT", dc:"8 + Proficiency + INT mod", slots:"FULL_CASTER_SLOTS",
    note:"در کتاب: «پس از تصحیح INT16 / DEX14»",
    spells: {
      cantrips:["گوی رنگین (Ray of Frost)","پیام لحظهای (Message)"],
      1:["لغزش واقعیت (Bane / Guiding Bolt)","محافظ زمانی (Shield)","شناسایی جادو (Identify)"],
      2:["سایه دوم (See Invisibility بازطراحیشده)","سکون کوتاه (Hold Person)","شکافت ذهن (Suggestion)"],
      3:["شکاف کوتاه (Misty Step)","ضدجادو (Counterspell)","دید ورای زمان (Clairvoyance)"],
      4:["بازنویسی کوچک (Modify Memory-lite)","دیوار زمانلغزیده (Wall of Force)"],
      5:["خواننده قانون جهان (Legend Lore)","دفع زمان (Dispel Magic بر جادوهای زمانی)"],
    } },
  extraAttackLevel: null,
  baseAbilities: { STR:8, DEX:14, CON:12, WIS:14, INT:16, CHA:12 },
  resources: [{ name:"خستگی واقعیت", uses:"INT mod + 1 در هر استراحت طولانی", note:"هر بار استفاده از «لغزش واقعیت» خطر خستگی واقعیت دارد" }],
  notes: "«پژواک لحظه» در سطح ۱ رد باقیماندهی زمان را در مکانها نشان میدهد. «لغزش واقعیت» (سطح ۲) با خطر «خستگی واقعیت» همراه است. در اوج قدرت، «بازنویسی کوچک» و در نهایت «خواننده قانون جهان».",
  features: {
    1:"پژواک لحظه",2:"لغزش واقعیت",3:"سایه دوم",4:"ASI",5:"شکاف کوتاه",6:"بازنویسی کوچک",
    7:"خواننده قانون جهان",8:"ASI",9:"لغزش واقعیت پیشرفته",10:"دیدن آینده نزدیک",11:"شکاف بلند",12:"ASI",
    13:"بازنویسی کلان",14:"مصونیت دستکاری زمانی",15:"خستگی واقعیت کاهشیافته",16:"ASI",
    17:"توقف لحظه",18:"تسلط بر شکافها",19:"ASI",20:"معمار زمان (Capstone)",
  },
},
{
  name: "مهآشنا", title: "سرگردان میان لحظهها",
  hitDie: "d8", saves: ["STR","DEX"],
  skillChoices: { count: 2, options: ["Acrobatics","History","Insight","Religion","Stealth"] },
  weaponProf: "سلاحهای ساده + شمشیر کوتاه", armorProf: "هیچ زره یا سپری",
  startingEquipment: "۱۰ عدد Dart، لباس راهبانه",
  acFormula: "10 + DEX mod + WIS mod (Unarmored Defense؛ با پوشیدن هر زره یا سپر غیرفعال میشود)",
  spellcasting: null,
  extraAttackLevel: 5,
  baseAbilities: { STR:8, DEX:15, CON:12, WIS:16, INT:13, CHA:10 },
  resources: [{ name:"امتیاز لحظه", uses:"= سطح کاراکتر" }],
  martialArtsDie: { "1-4":"1d4", "5-10":"1d6", "11-16":"1d8", "17-20":"1d10" },
  subclasses: [{ name:"راه لحظهی سرگردان", unlockLevel:3, desc:"تردیشن؛ فیچرها در سطوح ۳، ۶، ۱۱ و ۱۷" }],
  notes: "«لرزش ادراک» خود یا اشیای کوچک را نیمشفاف میکند. «پژواک گمشده» رد افراد گمشده در شکافهای زمانی را حس میکند.",
  features: {
    1:"لرزش ادراک",2:"پژواک گمشده",3:"(تردیشن) قدم بیرون از لحظه",4:"ASI",5:"Extra Attack",
    6:"(تردیشن) صدای دوپاره",7:"حرکت بیصدا در زمان",8:"ASI",9:"رهایی از وضعیت",10:"مصونیت به سم",
    11:"(تردیشن) لنگر خاطره",12:"ASI",13:"حرکت میان لحظهها",14:"مصونیت سیوهای WIS/CHA",
    15:"بازگشت از مرز مرگ",16:"ASI",17:"(تردیشن) ایستاده میان دو لحظه",18:"تکرار یک نوبت",
    19:"ASI",20:"ابدیت لحظه (Capstone)",
  },
},
];

export const SEED_CLASS_TEMPLATES: ClassTemplate[] = CLASSES.map(cls => {
  const idMap: Record<string, string> = {
    "فرهدار": "class-farrehdar",
    "موبد آذرین": "class-azarin",
    "دیوانزاد": "class-devanzad",
    "پیمانبان": "class-peymanban",
    "سایهخوان": "class-sayehkhan",
    "مهآشنا": "class-meh-ashna",
  };
  const weaponMap: Record<string, string[]> = {
    "فرهدار": ["wpn-par-special", "wpn-par-showy"],
    "موبد آذرین": ["wpn-ham-special", "wpn-ham-showy"],
    "دیوانزاد": ["wpn-sam-special", "wpn-sam-showy"],
    "پیمانبان": ["wpn-man-special", "wpn-man-showy"],
    "سایهخوان": ["wpn-shi-special", "wpn-shi-showy"],
    "مهآشنا": ["wpn-sia-special", "wpn-sia-showy"],
  };

  const id = idMap[cls.name] || `class-${cls.name}`;
  const hpList = FIXED_HP[cls.name] || [10];

  const slots = cls.spellcasting?.slots === 'FULL_CASTER_SLOTS'
    ? FULL_CASTER_SLOTS
    : cls.spellcasting?.slots === 'HALF_CASTER_SLOTS'
    ? HALF_CASTER_SLOTS
    : cls.spellcasting?.slots || {};

  return {
    id,
    name: cls.name,
    title: cls.title,
    description: cls.notes || cls.title || '',
    hitDie: cls.hitDie,
    saves: cls.saves,
    savingThrowProficiencies: (cls.saves || []).map(s => s.toLowerCase() as any),
    skillChoices: cls.skillChoices,
    weaponProf: cls.weaponProf,
    armorProf: cls.armorProf,
    startingEquipment: cls.startingEquipment,
    acFormula: cls.acFormula,
    spellcasting: cls.spellcasting ? {
      ...cls.spellcasting,
      slotsByLevel: slots,
      saveDCFormula: cls.spellcasting.dc || '8 + prof + mod',
    } : null,
    extraAttackLevel: cls.extraAttackLevel,
    asiLevels: ASI_LEVELS,
    fixedHpByLevel: hpList,
    hpFormula: `جدول جان ثابت (کتاب زروانیا) - ${cls.name}`,
    baseAbilities: cls.baseAbilities,
    baseAbilityScores: {
      str: cls.baseAbilities?.STR || 10,
      dex: cls.baseAbilities?.DEX || 10,
      con: cls.baseAbilities?.CON || 10,
      int: cls.baseAbilities?.INT || 10,
      wis: cls.baseAbilities?.WIS || 10,
      cha: cls.baseAbilities?.CHA || 10,
    },
    companion: (cls as any).companion,
    resources: cls.resources || [],
    classResources: (cls.resources || []).map((r: any, idx: number) => ({
      id: `res-${id}-${idx}`,
      name: r.name,
      description: r.note || r.uses || '',
      resetType: r.uses?.includes('کوتاه') ? 'short' : 'long',
      maxUsesFormula: r.uses,
      diceByLevel: r.diceByLevel
    })),
    subclasses: (cls.subclasses || []).map((sub: any, idx: number) => ({
      id: `sub-${id}-${idx}`,
      name: sub.name,
      description: sub.desc || '',
      unlockLevel: sub.unlockLevel || 3,
      featuresByLevel: {}
    })),
    notes: cls.notes,
    features: cls.features,
    featuresByLevel: Object.entries(cls.features || {}).reduce((acc: any, [lvl, feat]) => {
      const levelNum = parseInt(lvl, 10);
      acc[levelNum] = [{ name: feat, description: '', usage: 'none' }];
      return acc;
    }, {}),
    martialArtsDie: (cls as any).martialArtsDie,
    startingFeatures: [
      {
        id: `feat-${id}-1`,
        name: (cls.features as any)?.[1] || cls.name,
        description: cls.notes ? cls.notes.slice(0, 180) : '',
        source: `${cls.name} - سطح ۱`,
        usageType: 'short',
        maxUses: 1
      }
    ],
    level2Options: [(cls.features as any)?.[2] || 'سطح ۲'],
    starterWeaponOptions: weaponMap[cls.name] || [],
    updatedAt: new Date().toISOString()
  };
});

export const SEED_USERS: User[] = [
  {
    id: 'user-dm',
    email: 'dm@zorvania.ir',
    name: 'دانجن مستر زروانیا (راوی)',
    displayName: 'دانجن مستر زروانیا (راوی)',
    role: 'dm',
    status: 'active',
    activeCharacterId: null,
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 30 * 86400000,
    lastLoginAt: Date.now() - 3600000
  },
  {
    id: 'user-saman',
    email: 'saman@zorvania.ir',
    name: 'سامان (دیوانزاد)',
    displayName: 'سامان (دیوانزاد)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-saman',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 25 * 86400000,
    lastLoginAt: Date.now() - 7200000
  },
  {
    id: 'user-pardis',
    email: 'pardis@zorvania.ir',
    name: 'پردیس (فرهدار)',
    displayName: 'پردیس (فرهدار)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-pardis',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 24 * 86400000,
    lastLoginAt: Date.now() - 14400000
  },
  {
    id: 'user-shideh',
    email: 'shideh@zorvania.ir',
    name: 'شیده (سایهخوان)',
    displayName: 'شیده (سایهخوان)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-shideh',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 22 * 86400000,
    lastLoginAt: Date.now() - 28800000
  },
  {
    id: 'user-mana',
    email: 'mana@zorvania.ir',
    name: 'مانا (پیمانبان)',
    displayName: 'مانا (پیمانبان)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-mana',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 20 * 86400000,
    lastLoginAt: Date.now() - 43200000
  },
  {
    id: 'user-hamoun',
    email: 'hamoun@zorvania.ir',
    name: 'هامون (موبد آذرین)',
    displayName: 'هامون (موبد آذرین)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-hamoun',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 18 * 86400000,
    lastLoginAt: Date.now() - 86400000
  },
  {
    id: 'user-siavash',
    email: 'siavash@zorvania.ir',
    name: 'سیاوش (مهآشنا)',
    displayName: 'سیاوش (مهآشنا)',
    role: 'player',
    status: 'active',
    activeCharacterId: 'char-siavash',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    createdAt: Date.now() - 15 * 86400000,
    lastLoginAt: Date.now() - 172800000
  }
];

export const SEED_CHARACTERS: Character[] = [
  // 1. سامان
  {
    id: 'char-saman',
    ownerId: 'user-saman',
    name: 'سامان',
    race: 'دیوانزاد',
    className: 'دیوانزاد (Saman\'s class)',
    classTemplateId: 'class-devanzad',
    level: 1,
    background: 'وارث خون سازندگان دیوان',
    appearance: 'تنومند با دست‌های سنگین، رگه‌هایی متمایل به خاکستری در زیر پوست و چشمانی متمرکز بر ساختارهای سنگی.',
    personality: 'عمل‌گرا، صبور، مجذوب سازه‌ها و مهندسی کهن.',
    portraitUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 16,
      dex: 12,
      con: 14,
      int: 13,
      wis: 12,
      cha: 8
    },
    savingThrows: {
      str: true,
      dex: false,
      con: true,
      int: false,
      wis: false,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'athletics' || s.id === 'stone_sense') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 12,
      current: 12,
      temp: 0
    },
    ac: 15,
    speed: 9,
    initiativeBonus: 1,
    hitDice: {
      total: '1d10',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [
      {
        id: 'w-sam-1',
        templateId: 'wpn-sam-special',
        name: 'چکش پژواکسنگ',
        damageDice: '1d6',
        damageType: 'کوبشی (Bludgeoning)',
        range: 'تن به تن',
        properties: 'دو دست 1d8، سربی و برنز ورنا',
        kind: 'special',
        isSpecial: true,
        isShowy: false,
        specialAbility: {
          name: 'طنین ساختار',
          description: 'یک بار در هر استراحت کوتاه؛ با کوبیدن دسته چکش بر زمین یا دیوار، ساختار پشت سنگ را تا شعاع ۳۰ فوت حس می‌کند؛ مزیت (Advantage) در چک‌های کشف درهای مخفی و تله‌ها.',
          usesPerRest: 1,
          restType: 'short'
        },
        abilityName: 'طنین ساختار',
        abilityDesc: 'حس ساختار پشت سنگ تا شعاع ۳۰ فوت، مزیت در کشف درهای مخفی/تله‌ها.',
        abilityMaxUses: 1,
        abilityUsed: 0,
        abilityReset: 'short'
      }
    ],
    features: [
      {
        id: 'f-sam-1',
        name: 'خون سنگ',
        description: 'با لمس سنگ و تمرکز بر ارتعاشات آن، ساختار و منشأ آن را بدون نیاز به چک قدرت (Strength) درمی‌یابد؛ حس غریزی نسبت به سنگ و فلز دارد.',
        source: 'دیوانزاد - سطح ۱',
        usageType: 'none',
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [
      {
        id: 'inv-sam-1',
        name: 'مهر آریامن (تکه شکسته)',
        quantity: 1,
        weight: 0.2,
        description: 'تکه شکسته از فلز کهن مهر آریامن؛ در مجاورت سازه‌های بیدارشده بازتاب زرین/کهربایی نشان می‌دهد و با فرورفتگی مثلثی دروازه زندان نخست چفت می‌شود.',
        category: 'artifact',
        equipped: true,
        isQuestItem: true
      },
      {
        id: 'inv-sam-2',
        name: 'سنگ سیاه با سه شیار',
        quantity: 1,
        weight: 0.1,
        description: 'هدیه فراناز؛ مانند قطب‌نمای باستانی کار می‌کند؛ کاربرد دقیق آن هنوز نامعلوم است.',
        category: 'artifact',
        equipped: false,
        isQuestItem: true
      }
    ],
    currencies: { gold: 12, silver: 8, copper: 15 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  },

  // 2. پردیس
  {
    id: 'char-pardis',
    ownerId: 'user-pardis',
    name: 'پردیس',
    race: 'فرهدار',
    className: 'فرهدار (Pardis)',
    classTemplateId: 'class-farrehdar',
    level: 1,
    background: 'نگهبان نشان باستانی',
    appearance: 'چهره‌ای آرام با نگاهی عمیق؛ نشانی نوری و کم‌رنگ بر مچ دست چپش زیر پوست می‌تپد.',
    personality: 'مسئولیت‌پذیر، شجاع در حفاظت از یاران در برابر آشوب زمان.',
    portraitUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 14,
      dex: 12,
      con: 14,
      int: 10,
      wis: 15,
      cha: 13
    },
    savingThrows: {
      str: false,
      dex: false,
      con: true,
      int: false,
      wis: true,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'insight' || s.id === 'religion') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 11,
      current: 11,
      temp: 0
    },
    ac: 16,
    speed: 9,
    initiativeBonus: 1,
    hitDice: {
      total: '1d8',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [
      {
        id: 'w-par-1',
        templateId: 'wpn-par-special',
        name: 'گرز پیمان',
        damageDice: '1d6',
        damageType: 'کوبشی (Bludgeoning)',
        range: 'تن به تن',
        properties: 'یک دست، سر سنگی تیره',
        kind: 'special',
        isSpecial: true,
        isShowy: false,
        specialAbility: {
          name: 'سپر عهد',
          description: 'یک بار در هر استراحت کوتاه؛ واکنش (Reaction) هنگامی که هم‌پیمانی در ۵ فوتی هدف حمله قرار می‌گیرد: +۲ به درجه زرهی (AC) او در برابر آن حمله می‌دهد.',
          usesPerRest: 1,
          restType: 'short'
        },
        abilityName: 'سپر عهد',
        abilityDesc: '+۲ به زره یار در فاصله ۵ فوتی در برابر یک حمله',
        abilityMaxUses: 1,
        abilityUsed: 0,
        abilityReset: 'short'
      }
    ],
    features: [
      {
        id: 'f-par-1',
        name: 'نشان فره',
        description: 'نشان بیدارشده‌ای که می‌تواند سپری از نور جامد (مانند زره زندار) در اطراف خود و یاران ایجاد کند و زمان آشوبناک را به طور موقت تثبیت نماید.',
        source: 'فرهدار - سطح ۱',
        usageType: 'short',
        maxUses: 1,
        usedCount: 0
      },
      {
        id: 'f-par-2',
        name: 'ندای فره',
        description: 'فره به حامل خود در مواقعی که استفاده از آن ضروری است هشدار و ندا می‌دهد.',
        source: 'فرهدار - سطح ۱',
        usageType: 'none',
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [
      {
        id: 'inv-par-1',
        name: 'زره زنجیری محافظ',
        quantity: 1,
        weight: 12,
        description: 'زره حلقه‌ای با نشان باستانی پیمان.',
        category: 'armor',
        equipped: true,
        isQuestItem: false
      }
    ],
    currencies: { gold: 15, silver: 10, copper: 20 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  },

  // 3. شیده
  {
    id: 'char-shideh',
    ownerId: 'user-shideh',
    name: 'شیده',
    race: 'سایهخوان',
    className: 'سایهخوان (Shideh)',
    classTemplateId: 'class-sayehkhan',
    level: 1,
    background: 'همکار پیشین سایه‌خواران در محله پایین شن‌شین',
    appearance: 'چابک با لباس‌های تیره و خاکستری، گام‌های کاملاً بی‌صدا و نگاهی که سایه‌ها را دنبال می‌کند.',
    personality: 'مراقب، رازدار و جستجوگر حقایق پنهان پشت پرده زمان.',
    portraitUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 10,
      dex: 16,
      con: 12,
      int: 14,
      wis: 13,
      cha: 10
    },
    savingThrows: {
      str: false,
      dex: true,
      con: false,
      int: true,
      wis: false,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'stealth' || s.id === 'sleight_of_hand' || s.id === 'investigation') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 9,
      current: 9,
      temp: 0
    },
    ac: 14,
    speed: 9,
    initiativeBonus: 3,
    hitDice: {
      total: '1d8',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [
      {
        id: 'w-shi-1',
        templateId: 'wpn-shi-special',
        name: 'خنجر لغزنده',
        damageDice: '1d4',
        damageType: 'نافذ (Piercing)',
        range: 'تن به تن / پرتابی (۲۰/۶۰ فوت)',
        properties: 'چابک (Finesse)، سبک، پرتابی',
        kind: 'special',
        isSpecial: true,
        isShowy: false,
        specialAbility: {
          name: 'دوختن سایه',
          description: 'یک بار در هر استراحت کوتاه؛ پس از اصابت ضربه، سایه هدف بر زمین دوخته می‌شود و سرعت حرکت آن تا پایان دور بعدی شیده ۱۰ فوت کاهش می‌یابد.',
          usesPerRest: 1,
          restType: 'short'
        },
        abilityName: 'دوختن سایه',
        abilityDesc: 'کاهش ۱۰ فوتی سرعت هدف تا پایان دور بعدی',
        abilityMaxUses: 1,
        abilityUsed: 0,
        abilityReset: 'short'
      }
    ],
    features: [
      {
        id: 'f-shi-1',
        name: 'پژواک لحظه',
        description: 'بر تاروپود آسیب‌دیده زمان تمرکز می‌کند و تصاویری گذرا از گذشته را احضار می‌نماید (مشاهده پژواک‌های روح‌مانند از آنچه در یک مکان رخ داده است).',
        source: 'سایهخوان - سطح ۱',
        usageType: 'short',
        maxUses: 1,
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [
      {
        id: 'inv-shi-1',
        name: 'ابزار قفل‌گشایی و جیب‌بری',
        quantity: 1,
        weight: 0.5,
        description: 'مجموعه میله‌های برنزی نازک برای کار با قفل‌های باستانی.',
        category: 'misc',
        equipped: true,
        isQuestItem: false
      }
    ],
    currencies: { gold: 18, silver: 12, copper: 10 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  },

  // 4. مانا
  {
    id: 'char-mana',
    ownerId: 'user-mana',
    name: 'مانا',
    race: 'پیمانبان',
    className: 'پیمانبان (Mana)',
    classTemplateId: 'class-peymanban',
    level: 1,
    background: 'محافظ نبض جنگل ورنا',
    appearance: 'پوششی بافته از الیاف گیاهی و چرم نرم، گیسوان آراسته با ساقه‌های سبز و چشمانی که جهت ریشه‌ها را می‌خواند.',
    personality: 'آرام و شنوا؛ رابطه عمیقی با گیاهان و موجودات کوچک دارد.',
    portraitUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 10,
      dex: 15,
      con: 13,
      int: 12,
      wis: 15,
      cha: 10
    },
    savingThrows: {
      str: false,
      dex: true,
      con: false,
      int: false,
      wis: true,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'nature' || s.id === 'survival' || s.id === 'animal_handling') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 10,
      current: 10,
      temp: 0
    },
    ac: 14,
    speed: 9,
    initiativeBonus: 2,
    hitDice: {
      total: '1d8',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [
      {
        id: 'w-man-1',
        templateId: 'wpn-man-special',
        name: 'کمان ریشهبافت',
        damageDice: '1d4',
        damageType: 'نافذ (Piercing)',
        range: '۸۰/۳۲۰ فوت',
        properties: 'دو دست، دوربرد',
        kind: 'special',
        isSpecial: true,
        isShowy: false,
        specialAbility: {
          name: 'تیر نهال',
          description: 'یک بار در هر استراحت کوتاه؛ از تیر شلیک‌شده ریشه‌های نازکی جوانه می‌زند. هدف باید در تست نجات قدرت (STR Save DC 12) موفق شود یا سرعتش تا پایان دور بعدی نصف گردد.',
          usesPerRest: 1,
          restType: 'short'
        },
        abilityName: 'تیر نهال',
        abilityDesc: 'ریشه‌ها هدف را فرا می‌گیرند؛ نجات DC 12 قدرت یا نصف شدن سرعت',
        abilityMaxUses: 1,
        abilityUsed: 0,
        abilityReset: 'short'
      }
    ],
    features: [
      {
        id: 'f-man-1',
        name: 'زبان ریشهها',
        description: 'با گذاشتن دست بر خاک یا ریشه‌ها، نبض جنگل را حس می‌کند، با موجودات کوچک یا ریشه‌ها ارتباط برقرار می‌سازد و جریان‌های جادویی را دنبال می‌کند.',
        source: 'پیمانبان - سطح ۱',
        usageType: 'none',
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [
      {
        id: 'inv-man-1',
        name: 'دو بذر ورنا',
        quantity: 2,
        weight: 0.1,
        description: 'کاشتن در خاک خشک یا مرده، حبابی کوتاه از طبیعت خرم ورنا پدید می‌آورد؛ می‌تواند فواره "معبد آب‌های خشکیده" را مجدداً راه‌اندازی کند.',
        category: 'loot',
        equipped: false,
        isQuestItem: true
      }
    ],
    currencies: { gold: 10, silver: 15, copper: 30 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  },

  // 5. هامون
  {
    id: 'char-hamoun',
    ownerId: 'user-hamoun',
    name: 'هامون',
    race: 'موبد آذرین',
    className: 'موبد آذرین (Hamoun)',
    classTemplateId: 'class-azarin',
    level: 1,
    background: 'حافظ آتشدان‌های فراموش‌شده',
    appearance: 'ردای قهوه‌ای و سرخ، دستانی خاکستری‌شده از خاکستر مقدس و صدایی گرم و پرطنین.',
    personality: 'تأمل‌گر، پاسدار خاطرات کهن و احترام‌گذار به آتش و خاکستر.',
    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 12,
      dex: 10,
      con: 14,
      int: 12,
      wis: 16,
      cha: 12
    },
    savingThrows: {
      str: false,
      dex: false,
      con: true,
      int: false,
      wis: true,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'religion' || s.id === 'history' || s.id === 'medicine') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 10,
      current: 10,
      temp: 0
    },
    ac: 13,
    speed: 9,
    initiativeBonus: 0,
    hitDice: {
      total: '1d8',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [
      {
        id: 'w-ham-1',
        templateId: 'wpn-ham-special',
        name: 'عصای آذرین',
        damageDice: '1d4',
        damageType: 'آتشین (Fire)',
        range: 'تن به تن',
        properties: 'دو دست 1d8',
        kind: 'special',
        isSpecial: true,
        isShowy: false,
        specialAbility: {
          name: 'شعلهی پیوسته',
          description: 'یک بار در هر استراحت کوتاه؛ به هر بازیکن در فاصله ۵ فوتی خود 1d6 جان (HP) می‌بخشد.',
          usesPerRest: 1,
          restType: 'short'
        },
        abilityName: 'شعلهی پیوسته',
        abilityDesc: 'ترمیم 1d6 جان برای تمام یاران در فاصله ۵ فوتی',
        abilityMaxUses: 1,
        abilityUsed: 0,
        abilityReset: 'short'
      }
    ],
    features: [
      {
        id: 'f-ham-1',
        name: 'شعلهی حافظه (خاطرهی شعله)',
        description: 'آتشدان‌ها یا اشیای سرد را شعله‌ور می‌سازد تا خاطرات گذشته را به صورت تصویر نمایش دهند (مانند نشان دادن یک عدد، جهت یا واقعه)؛ توانایی روشن کردن زغال سرد.',
        source: 'موبد آذرین - سطح ۱',
        usageType: 'short',
        maxUses: 2,
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [
      {
        id: 'inv-ham-1',
        name: 'اخگر فراموششده',
        quantity: 1,
        weight: 0.1,
        description: 'قطعه جادویی کوچک که در نزدیکی اشیای تاریخی ردی کم‌رنگ از خاطرات را آشکار می‌سازد.',
        category: 'loot',
        equipped: true,
        isQuestItem: true
      },
      {
        id: 'inv-ham-2',
        name: 'اخگرهای تپنده (۳ تکه)',
        quantity: 3,
        weight: 0.3,
        description: 'در طول یک استراحت کوتاه، با جذب هر تکه به یک عضو گروه، یک امتیاز مهارت (Skill Point) برای توانایی‌های سطح ۲ اعطا می‌شود.',
        category: 'loot',
        equipped: false,
        isQuestItem: true
      }
    ],
    currencies: { gold: 14, silver: 20, copper: 40 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  },

  // 6. سیاوش (مه‌آشنا - پری نجات‌یافته)
  {
    id: 'char-siavash',
    ownerId: 'user-siavash',
    name: 'سیاوش',
    race: 'پری ورنا (Fairy)',
    className: 'مهآشنا (Siavash - fairy)',
    classTemplateId: 'class-meh-ashna',
    level: 1,
    background: 'نگهبان نجات‌یافته از نوسان زمان',
    appearance: 'پری لطیف با موهای لرزان به رنگ نقره‌ای و چشمانی که با فرکانس صداها سوسو می‌زنند.',
    personality: 'حساس، رازگو، با حافظه‌ای مواج میان سه دوره خردسالی، میانسالی و کهنسالی.',
    portraitUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    abilities: {
      str: 8,
      dex: 16,
      con: 12,
      int: 14,
      wis: 15,
      cha: 12
    },
    savingThrows: {
      str: false,
      dex: true,
      con: false,
      int: false,
      wis: true,
      cha: false
    },
    skills: DEFAULT_5E_SKILLS.map(s => {
      if (s.id === 'perception' || s.id === 'acrobatics' || s.id === 'time_echo') {
        return { ...s, proficient: true };
      }
      return { ...s };
    }),
    hp: {
      max: 9,
      current: 9,
      temp: 0
    },
    ac: 13,
    speed: 9,
    initiativeBonus: 3,
    hitDice: {
      total: '1d8',
      spent: 0
    },
    exhaustion: 0,
    skillPoints: 0,
    weapons: [],
    features: [
      {
        id: 'f-sia-1',
        name: 'لرزش ادراک',
        description: 'دست او برای چند ثانیه نیمه‌شفاف و سبک می‌شود و می‌تواند ادراک حسی متفاوتی را لمس کند.',
        source: 'مهآشنا - سطح ۱',
        usageType: 'short',
        maxUses: 1,
        usedCount: 0
      },
      {
        id: 'f-sia-2',
        name: 'پژواک گم',
        description: 'حساس به پژواک‌های فرکانس صوتی در مکان‌های مهروموم‌شده یا مسدود؛ شنیدن پژواک‌های گذشته از میان سنگ‌ها.',
        source: 'مهآشنا - سطح ۱',
        usageType: 'none',
        usedCount: 0
      }
    ],
    spells: [],
    inventory: [],
    currencies: { gold: 5, silver: 10, copper: 0 },
    rations: 5,
    lanternOil: 4,
    customResources: [],
    restLog: [],
    revision: 1,
    updatedAt: new Date().toISOString()
  }
];

export const SEED_CHARACTER_NOTES: CharacterNote[] = [
  {
    id: 'note-sam-1',
    characterId: 'char-saman',
    ownerId: 'user-saman',
    title: 'تکه مهر آریامن و صدای دیواره‌ها',
    body: 'وقتی دستم را روی سنگ ورودی سالن گذاشتم، فرکانس عجیبی از ارتعاش مهر به استخوان‌های مچ دستم زد. به نظر می‌رسد این تکه با قفل دروازه اول هم‌نوا است.',
    sessionTag: 'جلسه ۱',
    category: 'clues',
    pinned: true,
    sharedWithDm: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-par-1',
    characterId: 'char-pardis',
    ownerId: 'user-pardis',
    title: 'تثبیت زمان با نشان فره',
    body: 'در جریان مواجهه با گرگ گسستهزمان، نشان فره وقتی درخشید توانست زره و حرکات لرزان موجود را از ۱۶ به ۱۰ سست کند. باید در نبردهای زمانی حواسم به فراخوان فره باشد.',
    sessionTag: 'جلسه ۲',
    category: 'journal',
    pinned: true,
    sharedWithDm: true,
    updatedAt: new Date().toISOString()
  }
];

export const SEED_RULES: CampaignRule[] = [
  {
    id: 'rule-resources',
    title: 'منابع آغازین و جیره‌بندی جلسه‌ی دوم',
    category: 'resources',
    summary: '۴ چراغ روغنی (هرکدام حدود ۶ ساعت روشنایی) و ۵ جیره غذایی.',
    details: 'هر کاراکتر در روز به ۱ جیره غذا نیاز دارد. سپری کردن یک روز کامل بدون جیره: آزمون نجات بنیه با DC 10، در صورت شکست ۱ درجه خستگی (Exhaustion).'
  },
  {
    id: 'rule-vision',
    title: 'قانون تاریکی مطلق',
    category: 'vision',
    summary: 'دید محدود به ۱۰ فوت و ضعف (Disadvantage) در تست‌های هوشیاری (Perception).',
    details: 'بدون منبع نور در دالان‌های زیرزمینی زروانیا، شعاع دید به ۱۰ فوت محدود است و تمام چک‌های ادراک و حملات وابسته به بینایی با Disadvantage انجام می‌شود.'
  },
  {
    id: 'rule-rest',
    title: 'قوانین استراحت (کوتاه، بلند، اردوی پریان)',
    category: 'rest',
    summary: 'استراحت کوتاه = ۱ ساعت | استراحت بلند = تجدید کامل جان و کاهش ۱ درجه خستگی.',
    details: 'استراحت در کمپ پریان (نوشیدن شهد بهار): هر نوشنده 2d6+2 جان ترمیم می‌کند، ۱ درجه خستگی را برطرف می‌سازد و مسمومیت‌ها یا کندی‌های جادویی کهنه را از میان می‌برد.'
  },
  {
    id: 'rule-skills',
    title: 'امتیازهای مهارت (اخگرهای تپنده)',
    category: 'progression',
    summary: 'امتیاز مهارت (Skill Points) برای باز کردن و تقویت توانایی‌های سطح ۲ مصرف می‌شود.',
    details: 'با جذب قطعات اخگرهای تپنده در زمان استراحت کوتاه، هر بازیکن می‌تواند امتیاز مهارت به دست آورد و شاخه‌های توانایی سطح ۲ کلاس خود را بیدار کند.'
  }
];

export const SEED_ITEM_LIBRARY: ItemLibraryEntry[] = [
  // 1. مهر آریامن (two halves; each half opens only some routes; the full seal is the key to all prism gates)
  {
    id: 'item-aryaman-seal',
    name: 'مهر آریامن',
    category: 'artifact',
    rarity: 'باستانی و ممنوعه',
    description: 'دارای دو نیمه؛ هر نیمه تنها برخی مسیرها را می‌گشاید؛ مهر کامل کلید تمام دروازه‌های منشوری است.',
    mechanicalEffect: 'باز کردن دروازه‌های منشوری و مسیرهای پلمپ‌شده معبد آریامن.',
    secretNotes: 'در صورت به دست آوردن هر دو نیمه، دسترسی به تمام اتاق‌های هسته ممکن می‌شود.',
    whoItsFor: 'سامان یا پردیس',
    isRevealed: true,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 2. اخگر تپنده
  {
    id: 'item-pulsing-embers',
    name: 'اخگر تپنده',
    category: 'artifact',
    rarity: 'بسیار کمیاب',
    description: 'اخگر بلورین با تپش نور سرخ و طلایی؛ با جذب یکی در حین استراحت کوتاه، یک امتیاز مهارت (Skill Point) برای توانایی‌های سطح ۲ می‌دهد.',
    mechanicalEffect: '+۱ امتیاز مهارت به یک بازیکن در استراحت کوتاه.',
    secretNotes: 'حاوی انرژی متمرکز آتشدان‌های کهن.',
    whoItsFor: 'هامون و یاران',
    isRevealed: true,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 3. اخگر مادر
  {
    id: 'item-mother-ember',
    name: 'اخگر مادر',
    category: 'artifact',
    rarity: 'افسانه‌ای',
    description: 'هسته نخستین و مادر تمام اخگرهای آتشدان‌های زروانیا.',
    mechanicalEffect: 'احیای کامل حافظه آتش و تغییر وضعیت آریامن به «بازگشته».',
    secretNotes: 'خاطره اخگر مادر کلید نجات و بازگشت آریامن است.',
    whoItsFor: 'هامون',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 4. یاقوت آذر
  {
    id: 'item-azar-ruby',
    name: 'یاقوت آذر',
    category: 'artifact',
    rarity: 'افسانه‌ای',
    description: 'یاقوت درخشان و تراش‌خورده معبد که گرمای درونی آن هرگز فرو نمی‌نشیند.',
    mechanicalEffect: 'یکی از شروط بازگشت فره و فعال‌سازی چاه آذرین.',
    secretNotes: 'برای پایان بازگشت فره الزامی است.',
    whoItsFor: 'کل گروه',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 5. تاج خالی
  {
    id: 'item-empty-crown',
    name: 'تاج خالی',
    category: 'artifact',
    rarity: 'افسانه‌ای',
    description: 'تاج زرین بدون نگین از دوران شاهنشاهی کهن؛ بر سر نهادن آن بر سر فره‌دار یکی از راه‌اندازهای آریامن است.',
    mechanicalEffect: 'راه‌انداز اراده آریامن؛ افزایش کاریزما و فرهمندی حامل.',
    secretNotes: 'تاج خالی بر سر فره‌دار، شاهباز و آریامن را به واکنش وامی‌دارد.',
    whoItsFor: 'پردیس (فره‌دار)',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 6. پر سپید
  {
    id: 'item-white-feather',
    name: 'پر سپید',
    category: 'artifact',
    rarity: 'افسانه‌ای',
    description: 'یک‌بار در هر فصل؛ در منشور کار نمی‌کند؛ هر فراخوانی آریامن را هشیار می‌کند؛ شهباز یک‌بار در هر جلسه می‌تواند «چشم آریامن» را نشان دهد.',
    mechanicalEffect: 'احضار پیوند یا نشانه شهباز؛ در منشور غیرفعال است.',
    secretNotes: 'هوشیار کردن آریامن ممکن است آشفتگی را تشدید کند.',
    whoItsFor: 'کل گروه',
    isRevealed: false,
    resetType: 'season',
    maxUses: 1,
    updatedAt: new Date().toISOString()
  },
  // 7. چراغ خاطره
  {
    id: 'item-memory-lamp',
    name: 'چراغ خاطره',
    category: 'artifact',
    rarity: 'کمیاب',
    description: 'چراغ روغنی کهن با بازتاب نور کهربایی که تصاویر رویدادهای پیشین را در شعله خود نشان می‌دهد.',
    mechanicalEffect: 'روشنایی ۱۵ فوتی و آشکارسازی پژواک‌های اتفاقات ۲۴ ساعت گذشته.',
    secretNotes: '',
    whoItsFor: 'هامون یا شیده',
    isRevealed: true,
    resetType: 'short',
    updatedAt: new Date().toISOString()
  },
  // 8. لوح پنجاه بهار
  {
    id: 'item-fifty-springs-tablet',
    name: 'لوح پنجاه بهار',
    category: 'artifact',
    rarity: 'کمیاب',
    description: 'لوح سنگی فشرده با حکاکی تاریخ وقایع و پیمان‌های پنجاه بهار نخست پس از شکست زمان.',
    mechanicalEffect: '',
    secretNotes: 'بخشی از اسناد تاریخی معتبر برای درک حقیقت زروانیا.',
    whoItsFor: 'کاتب کنداور یا گروه',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 9. ساعت شکسته
  {
    id: 'item-broken-clock',
    name: 'ساعت شکسته',
    category: 'artifact',
    rarity: 'کمیاب',
    description: 'ساعت مکانیکی ظریف با عقربه‌های متناقض که نوسان فازهای زمانی را نشان می‌دهد.',
    mechanicalEffect: '',
    secretNotes: 'مربوط به قفس‌های فاز نگهبان زمان‌گم در برج ساعت.',
    whoItsFor: 'سیاوش (مه‌آشنا)',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 10. کلید بی‌دندان (دندانکلید بیدندانه)
  {
    id: 'item-toothless-key',
    name: 'کلید بی‌دندان',
    category: 'artifact',
    rarity: 'باستانی و ممنوعه',
    description: 'قطعه فلزی بدون دندانه؛ در شیار هسته سنگ‌خواب نظامی قرار می‌گیرد و چرخه انرژی آن را قطع می‌کند.',
    mechanicalEffect: 'قطع چرخه انرژی سنگ‌خواب، ایجاد Stun و کاهش AC به ۱۲.',
    secretNotes: 'ابزار مکانیکی باطل‌کننده سازه‌های دیوان.',
    whoItsFor: 'سامان یا شیده',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 11. سنگ نفس باغستان
  {
    id: 'item-orchard-breathing-stone',
    name: 'سنگ نفس باغستان',
    category: 'artifact',
    rarity: 'باستانی و ممنوعه',
    description: 'هسته تپنده هیدرولیکی که انرژی مکانیکی و حیات باغستان کهن را تنظیم می‌کند.',
    mechanicalEffect: '',
    secretNotes: 'آشکار شونده در راند ۳ نبرد با نگهبان اصلی باغستان.',
    whoItsFor: 'سامان (دیوانزاد)',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 12. ماسک دیوان
  {
    id: 'item-div-mask',
    name: 'ماسک دیوان',
    category: 'artifact',
    rarity: 'کمیاب',
    description: 'ماسک تراشیده از برنز و سنگ با خطوط چهره مهندسان دیوان باستان.',
    mechanicalEffect: '',
    secretNotes: '',
    whoItsFor: 'سامان',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 13. بذر ورنا
  {
    id: 'item-varna-seeds',
    name: 'بذر ورنا',
    category: 'artifact',
    rarity: 'کمیاب',
    description: 'بذر درختان کهن ورنا؛ کاشته شدن در خاک خشک یا مرده، حبابی موقت از طبیعت خرم پدید می‌آورد و فواره "معبد آب‌های خشکیده" را به راه می‌اندازد.',
    mechanicalEffect: 'احیای موضعی طبیعت و راه‌اندازی فواره‌های باستانی.',
    secretNotes: '',
    whoItsFor: 'مانا (پیمان‌بان)',
    isRevealed: true,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 14. تکه یخ وردان
  {
    id: 'item-vardan-ice-shard',
    name: 'تکه یخ وردان',
    category: 'artifact',
    rarity: 'بسیار کمیاب',
    description: 'بلور یخی ماندگار از آستانه وردان که در گرم‌ترین هوا نیز ذوب نمی‌شود.',
    mechanicalEffect: '',
    secretNotes: 'یکی از آستانه‌های سنجش آشفتگی.',
    whoItsFor: 'کل گروه',
    isRevealed: false,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 15. سنگ سیاه با سه شیار
  {
    id: 'item-black-stone-compass',
    name: 'سنگ سیاه با سه شیار',
    category: 'artifact',
    rarity: 'باستانی و ممنوعه',
    description: 'قطب‌نمای باستانی اهدایی فراناز؛ شیارهای آن در حضور انرژی سازه‌های دیوان واکنش نشان می‌دهند.',
    mechanicalEffect: 'جهت‌نمای ساختارهای زیرزمینی کهن.',
    secretNotes: '',
    whoItsFor: 'سامان',
    isRevealed: true,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  // 16. شهد بهار
  {
    id: 'item-spring-nectar',
    name: 'شهد بهار',
    category: 'consumable',
    rarity: 'کمیاب',
    description: 'بازیابی 2d6+2 جان و رفع ۱ سطح خستگی یا یک اثر منفی محیطی.',
    mechanicalEffect: 'ترمیم 2d6+2 HP و -۱ درجه خستگی یا رفع اثر منفی محیطی.',
    secretNotes: 'شهد پاکیزه زنبورهای وحشی بیشه ورنا.',
    whoItsFor: 'کل گروه',
    isRevealed: true,
    resetType: 'none',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-fairy-rations',
    name: 'غذای پریان ورنا',
    category: 'consumable',
    rarity: 'معمولی',
    description: 'نان پریان، عسل وحشی، میوه؛ سامیار سوداگر برای تجارت ارزش بسیار بالایی برای آن قائل است.',
    mechanicalEffect: 'تأمین جیره غذایی با طعم لذیذ یا کالای با ارزش برای مبادله با سامیار.',
    secretNotes: 'سامیار حاضر است تخفیف‌های بزرگ در ازای این غذا بدهد.',
    whoItsFor: 'کل گروه',
    isRevealed: true,
    updatedAt: new Date().toISOString()
  }
];

export const SEED_NPCS: NPC[] = [
  // 1. گسستهزمان (Enemy 1)
  {
    id: 'npc-time-fractured-wolf',
    name: 'گسستهزمان',
    type: 'minion',
    portraitUrl: 'https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&w=400&q=80',
    description: 'گرگ غول‌پیکر جهش‌یافته با تاروپود زمانی شکسته. حرکات نامنظم و جهش‌های تله‌پورت‌مانند غیرقابل پیش‌بینی دارد.',
    locationTag: 'راهروهای مرزی معبد',
    sessionTag: 'جلسه ۲',
    ac: 'آشوبناک ۱۶ / مهارشده ۱۰ (با نشان فره پردیس)',
    hp: {
      current: 55,
      max: 55
    },
    speed: '۱۲ متر (جهش‌های تله‌پورت زمانی)',
    abilities: {
      str: 15,
      dex: 18,
      con: 14,
      int: 4,
      wis: 12,
      cha: 2
    },
    savingThrows: 'چابکی +۶',
    resistances: 'آسیب زمانی، سرعت متغیر',
    vulnerabilities: 'نور جامد فره (تثبیت AC به ۱۰)',
    immunities: 'وضعیت کندی (Slow)',
    attacks: [
      {
        id: 'atk-gw-1',
        name: 'ورود اولیه',
        toHit: 'آزمون DC 16 چابکی',
        damage: 'حمله ناگهانی در مسیر حرکت',
        dc: 'DC 16 Dex',
        notes: 'برای قرار نگرفتن در مسیر هجوم اولیه باید تست چابکی با DC 16 داده شود.'
      },
      {
        id: 'atk-gw-2',
        name: 'حملهی فرسایش سن',
        toHit: 'آزمون DC 13 بنیه',
        damage: 'کاهش توان چابکی',
        dc: 'DC 13 Con',
        notes: 'در صورت شکست، مادیفایر چابکی (DEX Modifier) هدف نصف می‌شود.'
      },
      {
        id: 'atk-gw-3',
        name: 'لغزش زمانی',
        toHit: 'آزمون DC 13 چابکی',
        damage: 'افزایش به AC و نصف شدن صدمه وارده',
        dc: 'DC 13 Dex',
        notes: 'در صورت موفقیت در تست چابکی DC 13، صدمه نصف می‌شود.'
      },
      {
        id: 'atk-gw-4',
        name: 'چنگ انداختن',
        toHit: '+۵ برای اصابت',
        damage: '1d8 + 4 برشی',
        notes: 'ضربه مستقیم فیزیکی با پنجه‌های تیز.'
      }
    ],
    specialAbilities: [
      {
        id: 'sa-gw-1',
        name: 'حرکت تله‌پورت‌گونه پیش‌بینی‌ناپذیر',
        description: 'در انتهای هر نوبت، چند فوت در بعد زمان جابجا می‌شود و موقعیت ثابتی روی نقشه ندارد.'
      }
    ],
    tacticsTips: 'نشان فره پردیس درجه زرهی آن را از ۱۶ به ۱۰ می‌شکند. یادداشت دانجن مستر: ترتیب آمارها به عنوان STR/DEX/CON/WIS/INT/CHA ثبت شده اما به دلیل دوگانگی ستون‌های هوش و خرد، با احتیاط داوری شود.',
    lootDrops: 'پوست متراکم زمانی، ۳۰ سکه نقره کهن',
    dialogueLines: ['*غرش بم که پژواک آن قبل از باز شدن دهانش شنیده می‌شود*'],
    isRevealed: true,
    notes: 'توجه DM: ترتیب ویژگی‌ها در سند اصلی با برچسب هوش (WIS) و خرد (INT) ثبت شده بود.',
    updatedAt: new Date().toISOString()
  },

  // 2. نگهبان زمانگم (Enemy 2)
  {
    id: 'npc-time-lost-guardian',
    name: 'نگهبان زمانگم',
    type: 'boss',
    portraitUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    description: 'نگهبان پری تباه‌شده از غرب ورنا که میان فازهای خردسالی، میانسالی و کهنسالی نوسان می‌کند. پس از نجات، او همان کاراکتر سیاوش (مه‌آشنا) خواهد شد.',
    locationTag: 'برج ساعت کهن',
    sessionTag: 'جلسه ۲',
    ac: '۱۴',
    hp: {
      current: 50,
      max: 50
    },
    speed: '۳۰ فوت (۹ متر)',
    abilities: {
      str: 10,
      dex: 16,
      con: 12,
      int: 14,
      wis: 15,
      cha: 12
    },
    savingThrows: 'خرد +۴، چابکی +۵',
    resistances: 'حملاتی که با فاز فعلی سنی او تطابق ندارند نصف صدمه می‌زنند',
    vulnerabilities: 'ضربات منطبق بر فاز، +۱ به "شکنندگی فاز (Phase Fragility)" اضافه می‌کنند',
    immunities: 'خواب جادویی',
    attacks: [
      {
        id: 'atk-tlg-1',
        name: 'ضربه تماسی',
        toHit: '+۴ برای اصابت',
        damage: '1d8 + 2 کوبشی/زمانی',
        notes: 'لمس دست لرزان که سن هدف را برای ثانیه‌ای تغییر می‌دهد.'
      },
      {
        id: 'atk-tlg-2',
        name: 'پژواک زمانی',
        toHit: 'آزمون DC 12 خرد',
        damage: '2d6 صدمه روانی/زمانی',
        dc: 'DC 12 Wis',
        notes: 'در هر راند یک بازیکن 2d6 صدمه روانی/زمانی می‌خورد؛ نجات خرد DC 12 صدمه را نصف می‌کند.'
      }
    ],
    specialAbilities: [
      {
        id: 'sa-tlg-phases',
        name: 'قانون فازها (خردسالی / میانسالی / کهنسالی)',
        description: 'حملاتی که با فاز فعلی مطابقت ندارند نصف صدمه می‌زنند. ضربات منطبق +۱ به "شکنندگی فاز" می‌افزایند؛ در عدد ۳، ساعت مربوطه به طور خودکار پایدار می‌شود.'
      },
      {
        id: 'sa-tlg-puzzle',
        name: 'معمای ساعت‌ها در قفس‌ها',
        description: 'انداختن ساعت‌ها (کوچک / کهنه / شکسته) در قفس‌های متناظر با فاز سنی، نوسان را باطل می‌کند.'
      },
      {
        id: 'sa-tlg-safefail',
        name: 'شکست امن (Safe-fail)',
        description: 'اگر گروه در نبرد مغلوب شود، کشته نمی‌شوند بلکه بیهوش می‌گردند. با نجات یافتن او، نگهبان بیدار شده و به پی‌سی سیاوش تبدیل می‌گردد.'
      }
    ],
    tacticsTips: 'به بازیکنان فرصت دهید رابطه بین فازهای سنی و ساعت‌ها را کشف کنند.',
    lootDrops: 'ساعت‌های سه فاز، خاکستر زمان',
    dialogueLines: [
      'من... مادرم کجاست؟ نه، من قرن‌هاست اینجا کشیک می‌کشم...',
      'پژواک‌ها دست از سرم برنمی‌دارند!'
    ],
    isRevealed: false,
    updatedAt: new Date().toISOString()
  },

  // 3. نگهبان اصلی باغستان کهن (Enemy 3 - سنگخواب فعال‌شده)
  {
    id: 'npc-ancient-sleeper-guardian',
    name: 'نگهبان اصلی باغستان کهن (سنگخواب فعال‌شده)',
    type: 'boss',
    portraitUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    description: 'سازه‌ی سنگی عظیم حدود ۴ متری که برای محافظت از هسته باغستان بیدار شده است. صفحه‌های زرهی پولادین و رگه‌های برنز دارد.',
    locationTag: 'هسته باغستان کهن',
    sessionTag: 'پایان بخش باغستان',
    ac: '۱۸ (در حالت عادی) / ۱۲ (با دندان‌کلید)',
    hp: {
      current: 120,
      max: 120
    },
    speed: '۲۰ فوت (۶ متر)',
    abilities: {
      str: 18,
      dex: 8,
      con: 18,
      int: 10,
      wis: 10,
      cha: 6
    },
    savingThrows: 'قدرت +۵، بنیه +۶',
    resistances: 'صدمات فیزیکی (کوبشی، برشی، نافذ) نصف می‌شود',
    vulnerabilities: 'آسیب نور/فره، آتش و صدمات جادویی/روانی مقاومت را دور می‌زنند',
    immunities: 'سم، مسمومیت، ترس، خواب',
    attacks: [
      {
        id: 'atk-sg-1',
        name: 'ضربهی محاسبهشده',
        toHit: '+۵ برای اصابت',
        damage: '2d10 + 4 برشی/کوبشی',
        notes: 'برد ۱۰ فوت؛ ضربه ویرانگر شمشیر سنگی سنگین.'
      },
      {
        id: 'atk-sg-2',
        name: 'راند ۱: کوبش زمینلرزه',
        toHit: 'آزمون DC 13 چابکی در شعاع ۱۵ فوت',
        damage: '2d6 کوبشی + افتادن بر زمین (Prone)',
        dc: 'DC 13 Dex',
        notes: 'در صورت موفقیت در تست، صدمه نصف شده و کاراکتر زمین نمی‌خورد.'
      }
    ],
    specialAbilities: [
      {
        id: 'sa-sg-round3',
        name: 'راند ۳: گشوده شدن صفحه‌های سینه',
        trigger: 'شروع راند ۳ تا پایان راند ۴',
        description: 'صفحه‌های سینه گشوده شده و "سنگ نفس باغستان" تا پایان راند ۴ آشکار می‌گردد.'
      },
      {
        id: 'sa-sg-mechkill',
        name: 'کشتن مکانیکی: دندانکلید بیدندانه',
        description: 'استفاده از دندانکلید روی هسته (چک Sleight of Hand با DC 12، هزینه یک اکشن کامل): سازه ۱ دور گیج (Stunned) می‌شود، AC به ۱۲ افت می‌کند و مقاومت فیزیکی‌اش باطل می‌گردد.'
      },
      {
        id: 'sa-sg-peace',
        name: 'مسیر صلح‌آمیز و غیرکشنده (خون دیوانزاد سامان)',
        description: 'سامان با لمس سازه خون دیوانزاد خود را به آن می‌شناساند؛ سازه اعلام می‌کند: "ساختار خونیِ معمار شناسایی شد. کاربر با سطح دسترسی ۰ تأیید شد." و به نشانه تعظیم خاموش می‌شود.'
      }
    ],
    tacticsTips: 'نکات راند به راند DM: در راند ۲ تشدید ارتعاش سازه با سامان رخ می‌دهد و به او سرنخ لمس داده می‌شود.',
    lootDrops: 'سنگ نفس باغستان (آرتیفکت)، برنز خالص ورنا، هسته مکانیکی',
    dialogueLines: [
      '*صدای بم فعال‌سازی هیدرولیک سنگی*',
      'ساختار خونیِ معمار شناسایی شد. کاربر با سطح دسترسی ۰ تأیید شد.'
    ],
    isRevealed: false,
    notes: 'نکات محرمانه DM: راند ۲ ارتعاش متقابل با چکش و خون سامان احساس می‌شود.',
    updatedAt: new Date().toISOString()
  },

  // 4. سنگخواب خراب (باغستان) (Enemy 4 - hazard)
  {
    id: 'npc-broken-sleeper',
    name: 'سنگخواب خراب (باغستان)',
    type: 'hazard',
    portraitUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    description: 'مجسمه سنگ‌خواب شکسته که بدون هدف شمشیر بزرگی را در هوا می‌چرخاند و پی‌درپی خطا می‌زند. آماری برای آن تعریف نشده و بیشتر نقش مانع محیطی را دارد.',
    locationTag: 'ورودی باغستان کهن',
    sessionTag: 'جلسه ۲',
    ac: '۱۰',
    hp: {
      current: 20,
      max: 20
    },
    speed: '۰ (ثابت در محل)',
    abilities: {
      str: 16,
      dex: 6,
      con: 14,
      int: 1,
      wis: 1,
      cha: 1
    },
    savingThrows: 'ندارد',
    resistances: 'سنگی',
    vulnerabilities: 'ندارد',
    immunities: 'وضعیت‌های روانی',
    attacks: [
      {
        id: 'atk-bs-1',
        name: 'چرخش کورکورانه شمشیر بزرگ',
        toHit: '+۰',
        damage: '2d6 برشی (معمولاً به هوا می‌خورد)',
        notes: 'مانع محیطی؛ بازیکنان با گذر با دقت می‌توانند از آن عبور کنند.'
      }
    ],
    specialAbilities: [],
    tacticsTips: 'یک خطر محیطی ساده برای آزمایش واکنش‌های بازیکنان.',
    lootDrops: 'فلز شکسته شمشیر کهن',
    dialogueLines: ['*صدای غیژغیژ چرخ‌دنده‌های شکسته*'],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },

  // NPCs (Allies, Quests, Merchants)
  {
    id: 'npc-faranaz',
    name: 'فراناز',
    type: 'ally',
    portraitUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    description: 'فرمانده پریان ورنا؛ سرد، دانا، هرگز مستقیماً در چشمان طرف مقابل خیره نمی‌شود و هاله‌ها را می‌خواند؛ به تدریج حقایق را دریغ می‌کند و قطره‌چکانی بروز می‌دهد.',
    locationTag: 'اردوگاه پریان ورنا',
    sessionTag: 'جلسه ۱ و ۲',
    ac: '۱۵',
    hp: { current: 35, max: 35 },
    speed: '۹ متر، پرواز ۹ متر',
    abilities: { str: 8, dex: 16, con: 12, int: 16, wis: 17, cha: 16 },
    savingThrows: 'خرد +۶',
    resistances: 'سحرآمیز',
    vulnerabilities: 'ندارد',
    immunities: 'خواب',
    attacks: [],
    specialAbilities: [
      {
        id: 'sa-faranaz-aura',
        name: 'خواندن هاله',
        description: 'هاله روحی افراد را تحلیل کرده و نیات آنان را می‌سنجد.'
      }
    ],
    tacticsTips: 'او به عنوان متحد پشتیبان و مأموریت‌دهنده عمل می‌کند.',
    lootDrops: 'کوزه‌های شهد بهار، نشان فرماندهی ورنا',
    dialogueLines: [
      'هاله‌ی تو... نوسان دارد، مسافر.',
      'تمام حقایق را نمی‌توان به یکباره در برابر چشمان فانی گشود.'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-varnoosh',
    name: 'ورنوش',
    type: 'neutral',
    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    description: 'پری تبعیدشده با موهای خاکستری مات؛ در دل گروه نسبت به فراناز و اهدافش بذر شک و تردید می‌کارد.',
    locationTag: 'حاشیه بیشه خاموش',
    sessionTag: 'جلسه ۲',
    ac: '۱۲',
    hp: { current: 20, max: 20 },
    speed: '۹ متر',
    abilities: { str: 9, dex: 14, con: 11, int: 13, wis: 12, cha: 15 },
    savingThrows: 'فرهمندی +۴',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'پنهان‌کاری و ایجاد تردید در بازیکنان نسبت به دستورات فراناز.',
    lootDrops: 'دست‌نوشته‌های اعتراض‌آمیز ورنا',
    dialogueLines: [
      'آیا تا به حال از خود پرسیده‌اید چرا فراناز چشم در چشمان شما نمی‌دوزد؟',
      'او همه‌چیز را به شما نمی‌گوید... مراقب بهای وعده‌هایش باشید.'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-samiar',
    name: 'سامیار',
    type: 'merchant',
    portraitUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    description: 'عتیقه‌فروش و بازرگان کویر خاموش؛ عاشق غذای پریان؛ دست‌های سریع و تردستی (Sleight-of-hand).',
    locationTag: 'کاروانسرای کویر خاموش',
    sessionTag: 'جلسه ۲',
    ac: '۱۳',
    hp: { current: 18, max: 18 },
    speed: '۹ متر',
    abilities: { str: 10, dex: 16, con: 12, int: 14, wis: 11, cha: 15 },
    savingThrows: 'چابکی +۵',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [
      { id: 'atk-sam-1', name: 'خنجر مخفی', toHit: '+۵', damage: '1d4 + 3' }
    ],
    specialAbilities: [],
    tacticsTips: 'در برابر غذای پریان ورنا حاضر است عتیقه‌های نایاب مبادله کند.',
    lootDrops: 'دندانکلید بیدندانه، کیسه سکه‌های طلا',
    dialogueLines: [
      'غذای پریان؟ بوی عسل وحشی ورنا را از فرسنگ‌ها حس می‌کنم! بیایید معامله کنیم...',
      'این عتیقه بی‌دندانه شاید به کارتان بیاید، اما غذای تازه بهای آن است!'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-pivar-sandar',
    name: 'پیوار و سندار',
    type: 'ally',
    portraitUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80',
    description: 'نگهبانان غول‌پیکر حدود ۴ متری از دیوان؛ متحدان کمدی گروه که نامرئی‌شدنشان معیوب است و بخش‌هایی از بدنشان هویدا می‌ماند؛ سندار از سفر انتقالی آوندی (Avand-travel) وحشت دارد.',
    locationTag: 'دروازه انجمن آوند',
    sessionTag: 'جلسه ۱ و ۲',
    ac: '۱۴',
    hp: { current: 65, max: 65 },
    speed: '۹ متر',
    abilities: { str: 19, dex: 8, con: 16, int: 8, wis: 9, cha: 10 },
    savingThrows: 'قدرت +۶',
    resistances: 'کوبشی',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [
      { id: 'atk-ps-1', name: 'کوبش مشت دیو', toHit: '+۶', damage: '2d8 + 4' }
    ],
    specialAbilities: [
      {
        id: 'sa-faulty-invis',
        name: 'نامرئی‌شدن معیوب',
        description: 'هنگام نامرئی شدن، چکمه‌ها یا شاخ‌هایشان همچنان در هوا معلق و قابل دیدن می‌ماند!'
      }
    ],
    tacticsTips: 'محافظان پرقدرت اما ساده‌دل برای کمک به گروه در حمل بارهای سنگین.',
    lootDrops: 'گرزهای سنگی عظیم',
    dialogueLines: [
      'پیوار، کلاهم نامرئی شد؟ نه سندار، هنوز شست پایت مثل فانوس می‌درخشد!',
      'خواهش می‌کنم از آوند استفاده نکنیم... سرگیجه‌اش تا سه روز با من است!'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-pir-barzin',
    name: 'پیر-برزین',
    type: 'quest-giver',
    portraitUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    description: 'سرمعمار حدود ۴ متری دیوان و ریش‌سفید انجمن آوند؛ ردایی از کتان ارغوانی با گلدوزی‌های برنزی بر تن دارد.',
    locationTag: 'تالار انجمن آوند',
    sessionTag: 'جلسه ۲',
    ac: '۱۲',
    hp: { current: 40, max: 40 },
    speed: '۹ متر',
    abilities: { str: 17, dex: 10, con: 14, int: 18, wis: 16, cha: 14 },
    savingThrows: 'هوش +۷، خرد +۶',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'کلید معماری و راهنمای شناسایی سازه‌های معبد برای سامان.',
    lootDrops: 'ابزارهای معماری باستانی دیوان',
    dialogueLines: [
      'خون معماران در رگ‌های تو جاری است، فرزندم... سنگ‌ها به یاد دارند.'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-kateb-azam-kondavar',
    name: 'کاتب اعظم کنداور',
    type: 'ally',
    portraitUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
    description: 'کاتب سالخورده از نژاد مینیاتوری کنداور (حدود ۳۰ سانتی‌متر)؛ گنجینه‌ای از وقایع تاریخی و اسناد کهن.',
    locationTag: 'کتابخانه کنداور',
    sessionTag: 'جلسه ۲',
    ac: '۱۲',
    hp: { current: 6, max: 6 },
    speed: '۶ متر',
    abilities: { str: 4, dex: 16, con: 10, int: 19, wis: 16, cha: 12 },
    savingThrows: 'هوش +۷',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'پاسخگوی پرسش‌های تاریخی درباره پیمان نخست.',
    lootDrops: 'ذره‌بین بلورین کوچک',
    dialogueLines: ['آرام‌تر ورق بزنید! هر برگی از این کتب، قرنی از رنج است.'],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-farid-kateb',
    name: 'فرید کاتب',
    type: 'quest-giver',
    portraitUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    description: 'کاتب ۳۵ سانتی‌متری کنداور؛ بسیار دقیق و وسواسی که مدام از پریان غرولند می‌کند؛ دارنده نقشه‌های تکمیلی بزرگراه‌های زیرزمینی.',
    locationTag: 'آرشیو اسناد زیرزمینی',
    sessionTag: 'جلسه ۲',
    ac: '۱۲',
    hp: { current: 8, max: 8 },
    speed: '۶ متر',
    abilities: { str: 5, dex: 15, con: 11, int: 17, wis: 14, cha: 10 },
    savingThrows: 'هوش +۶',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'در ازای مأموریتی برای پیدا کردن جوهر مخصوص، نقشه را ارائه می‌کند.',
    lootDrops: 'بخش دوم نقشه بزرگراه زیرزمینی',
    dialogueLines: [
      'پریان! همه‌جا را به هم می‌ریزند و اسمش را شعر و ترانه می‌گذارند!',
      'نقشه را می‌خواهید؟ ابتدا مرکب سنگی من را بازگردانید.'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-nariman',
    name: 'نریمان',
    type: 'neutral',
    portraitUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    description: 'همکار پیشین و مخبر شیده در میان سایه‌خواران محله پایین شن‌شین؛ ارتباطات مخفی دارد.',
    locationTag: 'کوچه‌های تاریک شن‌شین',
    sessionTag: 'جلسه ۱ و ۲',
    ac: '۱۳',
    hp: { current: 16, max: 16 },
    speed: '۹ متر',
    abilities: { str: 11, dex: 15, con: 12, int: 13, wis: 14, cha: 12 },
    savingThrows: 'چابکی +۴',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'منبع اطلاعات محرمانه در برابر دریافت سکه یا اطلاعات متقابل.',
    lootDrops: 'رمزهای مکاتباتی شن‌شین',
    dialogueLines: ['شیده... هنوز زنده‌ای؟ فکر می‌کردم سایه‌ها تو را بلعیده‌اند.'],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'npc-farakhdad',
    name: 'فرخداد',
    type: 'quest-giver',
    portraitUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    description: 'آخرین کاتب آریامن در گوشه‌ای دورافتاده از شن‌شین؛ هرگز دانش خود را به رایگان در اختیار کسی قرار نمی‌دهد.',
    locationTag: 'گوشه دورافتاده شن‌شین',
    sessionTag: 'جلسه ۲',
    ac: '۱۱',
    hp: { current: 14, max: 14 },
    speed: '۹ متر',
    abilities: { str: 8, dex: 12, con: 11, int: 18, wis: 16, cha: 11 },
    savingThrows: 'هوش +۶',
    resistances: 'ندارد',
    vulnerabilities: 'ندارد',
    immunities: 'ندارد',
    attacks: [],
    specialAbilities: [],
    tacticsTips: 'به دانشی در مورد نمادهای مهر آریامن مسلط است.',
    lootDrops: 'طومار تفسیر کتیبه‌های آریامن',
    dialogueLines: [
      'دانش بدون بها، بی‌حرمتی به تاریخ است. چه چیزی برای مبادله آورده‌اید؟'
    ],
    isRevealed: true,
    updatedAt: new Date().toISOString()
  }
];

export const SEED_CAMPAIGN_NOTES: CampaignNote[] = [
  {
    id: 'cn-session-1',
    title: 'خلاصه جلسه ۱: درخشش سنگ خاموش',
    sessionNumber: 'جلسه ۱',
    category: 'session',
    content: 'گروه در پیرامون سازه‌های کهن گرد هم آمدند. سامان با لمس سنگ خاموش ارتعاشات دیوان را حس کرد و اولین نشانه‌های مهر آریامن آشکار گردید.',
    tags: ['جلسه۱', 'درخشش_سنگ_خاموش', 'سامان', 'آریامن'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cn-session-2',
    title: 'خلاصه جلسه ۲: رصدخانهی ریشههای خاموش',
    sessionNumber: 'جلسه ۲',
    category: 'session',
    content: 'ورود گروه به رصدخانه ریشه‌های خاموش؛ رویارویی با گسستهزمان، کشف بقایای ساعت‌های سه فاز و ارتباط مانا با نبض ریشه‌ها.',
    tags: ['جلسه۲', 'رصدخانه_ریشههای_خاموش', 'ورنا', 'گسستهزمان'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cn-factions',
    title: 'دانشنامه گروه‌ها و جناح‌های زروانیا (Factions)',
    category: 'lore',
    content: `جناح‌های سه‌گانه حاضر در جهان زروانیا:
۱. نوژان (Nozhan): جادو را با آغوش باز می‌پذیرند و به دنبال کشف و احیای جریان‌های باستانی هستند.
۲. رهامان (Rohaman): مصمم به نابودی هرگونه جادو و پاکسازی آثار ناشی از شکست زمان.
۳. پیمانداران (Peymandaran): خواهان کنترل، نظم و ثبات؛ در حال حاضر بیشترین نفوذ و تسلط را در ارکان حکومت در اختیار دارند.`,
    tags: ['جناح‌ها', 'نوژان', 'رهامان', 'پیمانداران', 'لور'],
    updatedAt: new Date().toISOString()
  }
];

export const SEED_REWARD_PACKAGES: RewardPackage[] = [
  {
    id: 'rew-session-2',
    title: 'پاداش حل معمای رصدخانه ریشه‌ها',
    description: 'غنیمت اکتشاف تالار ساعت و نجات پری مه‌آشنا.',
    gold: 25,
    silver: 30,
    skillPoints: 1,
    items: [
      {
        id: 'rew-item-1',
        name: 'شهد بهار کهن',
        quantity: 1,
        weight: 0.5,
        description: 'کوزه کوچک حاوی مایع ترمیم‌بخش باستانی.',
        category: 'consumable',
        equipped: false,
        isQuestItem: false,
        isNewBadge: true
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export const SEED_ENCOUNTERS: Encounter[] = [
  {
    id: 'enc-time-wolf',
    name: 'مواجهه با گسستهزمان در دالان مرزی',
    sessionTag: 'جلسه ۲',
    round: 1,
    activeCombatantIndex: 0,
    combatants: [
      {
        id: 'c-shideh',
        name: 'شیده',
        initiative: 18,
        hpCurrent: 9,
        hpMax: 9,
        ac: '14',
        isNpc: false,
        characterId: 'char-shideh',
        conditions: [],
        notes: 'مخفی در سایه گوشه راهرو'
      },
      {
        id: 'c-wolf',
        name: 'گسستهزمان',
        initiative: 16,
        hpCurrent: 55,
        hpMax: 55,
        ac: '16 (آشوبناک)',
        isNpc: true,
        npcId: 'npc-time-fractured-wolf',
        conditions: [],
        notes: 'حالت پرش زمانی فعال؛ نشان فره هنوز زده نشده'
      },
      {
        id: 'c-saman',
        name: 'سامان',
        initiative: 12,
        hpCurrent: 12,
        hpMax: 12,
        ac: '15',
        isNpc: false,
        characterId: 'char-saman',
        conditions: [],
        notes: 'چکش پژواکسنگ آماده'
      },
      {
        id: 'c-pardis',
        name: 'پردیس',
        initiative: 11,
        hpCurrent: 11,
        hpMax: 11,
        ac: '16',
        isNpc: false,
        characterId: 'char-pardis',
        conditions: [],
        notes: 'آماده فعال‌سازی نشان فره برای مهار AC گرگ'
      }
    ],
    notes: 'پردیس با نشان فره می‌تواند AC را از ۱۶ به ۱۰ کاهش دهد.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'enc-time-lost-guardian',
    name: 'مواجهه با نگهبان زمانگم در برج ساعت',
    sessionTag: 'جلسه ۲',
    round: 1,
    activeCombatantIndex: 0,
    combatants: [
      {
        id: 'c-tlg',
        name: 'نگهبان زمانگم',
        initiative: 15,
        hpCurrent: 50,
        hpMax: 50,
        ac: '14',
        isNpc: true,
        npcId: 'npc-time-lost-guardian',
        conditions: [],
        notes: 'فاز فعلی: خردسالی'
      },
      {
        id: 'c-mana',
        name: 'مانا',
        initiative: 14,
        hpCurrent: 10,
        hpMax: 10,
        ac: '14',
        isNpc: false,
        characterId: 'char-mana',
        conditions: [],
        notes: 'کمان ریشهبافت مسلح'
      },
      {
        id: 'c-hamoun',
        name: 'هامون',
        initiative: 9,
        hpCurrent: 10,
        hpMax: 10,
        ac: '13',
        isNpc: false,
        characterId: 'char-hamoun',
        conditions: [],
        notes: 'آماده شعله پیوسته'
      }
    ],
    notes: 'قفس‌های ساعت را آماده داشته باشید؛ در صورت باخت گروه، حالت Safe-fail فعال است.',
    updatedAt: new Date().toISOString()
  }
];

export const SEED_LOCATIONS: LocationEntry[] = [
  {
    id: 'loc-caravanserai',
    name: 'کاروانسرای ماه سرخ',
    region: 'کویر خاموش',
    description: 'کاروانسرایی باستانی با دیوارهای خشتی مستحکم در آستانه کویر خاموش که استراحتگاه کاوشگران فره و کاروان‌های ادویه است.',
    imageUrl: '',
    dmNotes: 'پناهگاهی امن برای گروه در شروع ماجراجویی؛ در زیرزمین آن یک انبار متروکه با اسناد تاریخی نوژان مخفی شده است.',
    revealed: true,
    parentId: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'loc-crystal-grove',
    name: 'بیشه بلورین ورنا',
    region: 'ورنا',
    description: 'جنگلی مه‌آلود و کهن که در میان درختان درهم‌تنیده آن، بلورهای زمان و جریان‌های ماورایی با نوری بنفش‌فام می‌درخشند.',
    imageUrl: '',
    dmNotes: 'محل زندگی موجودات زمان‌گریز و پریان کهن؛ هر دور مبارزه ممکن است طنین زمان رخ دهد.',
    revealed: true,
    parentId: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'loc-silent-tower',
    name: 'برج خاموشی سپیدارون',
    region: 'سپیدارون',
    description: 'برجی بلند و سنگی بر فراز صخره‌های سپیدارون که موبدان در آن آتش مقدس و کتیبه‌های پیمان را پاسداری می‌کردند.',
    imageUrl: '',
    dmNotes: 'نگهبان زمان‌گسسته در طبقه فوقانی این برج مستقر است.',
    revealed: true,
    parentId: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'loc-sangkhab-vault',
    name: 'دخمه سنگ‌خواب شان‌شین',
    region: 'شانشین',
    description: 'دخمه‌ای مرموز زیر شهر شان‌شین که رازهای مهر دوم و سنگ‌های تثبیت زمان در آن مدفون است.',
    imageUrl: '',
    dmNotes: 'تنها با باز کردن قفل سنگی ویژه قابل دسترس است؛ پیمانداران مراقب ورودی آن هستند.',
    revealed: false,
    parentId: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'loc-seven-pacts',
    name: 'پل هفت‌پیمان',
    region: 'مشترک',
    description: 'پل سنگی بزرگ و عظیمی که بر فراز دره شکاف واقعیت امتداد یافته و مرز بین سرزمین‌های باستانی زروانیا را پیوند می‌دهد.',
    imageUrl: '',
    dmNotes: 'محل برخورد نگهبانان و راهزنان شن‌باد.',
    revealed: true,
    parentId: null,
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  }
];

