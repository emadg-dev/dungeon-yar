import { ClassTemplate } from '../types';

function generateFixedHp(hitDie: number, perLevel: number): Record<number, number> {
  const hpMap: Record<number, number> = {};
  hpMap[1] = hitDie;
  for (let lvl = 2; lvl <= 20; lvl++) {
    hpMap[lvl] = hitDie + (lvl - 1) * perLevel;
  }
  return hpMap;
}

export const CANON_CLASS_TEMPLATES: ClassTemplate[] = [
  // 1. دیوانزاد (Saman)
  {
    id: 'class-devanzad',
    name: 'دیوانزاد (Saman\'s class)',
    description: 'وارثان خون و سازه‌های دیوان کهن؛ پیوند شگفت‌انگیز با سنگ، فلز و ماشین‌های سنگی باستانی.',
    hitDie: 10,
    savingThrowProficiencies: ['str', 'con'],
    skillChoices: {
      count: 2,
      options: ['athletics', 'stone_sense', 'history', 'intimidation', 'survival']
    },
    weaponProficiencies: ['تمام سلاح‌های ساده و جنگی (Simple & Martial Weapons)'],
    armorProficiencies: ['زره‌های سبک، متوسط و سنگین، سپرها (All Armor & Shields)'],
    startingEquipment: ['چکش پژواک‌سنگ یا تبر بزرگ کوه‌شکاف', 'زره فلزی ورنا', 'کوله اکتشاف سنگ'],
    acFormula: {
      base: 10,
      abilityMods: ['dex'],
      unarmored: false,
      note: 'محاسبه براساس زره تجهیزشده + سپر'
    },
    extraAttackLevel: 5,
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(10, 6),
    hpFormula: '۱۰ در سطح ۱ + ۶ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 16, dex: 12, con: 14, int: 13, wis: 12, cha: 8 },
    featuresByLevel: {
      1: [
        {
          name: 'خون سنگ',
          description: 'با لمس سنگ و تمرکز بر ارتعاشات آن، ساختار و منشأ آن را بدون نیاز به چک قدرت (Strength) درمی‌یابد؛ حس غریزی نسبت به سنگ و فلز دارد.',
          usage: 'none'
        }
      ],
      2: [
        {
          name: 'طنین خاک و سازه',
          description: 'می‌تواند ضعف‌های ساختاری دیوارها یا سازه‌های مکانیکی را با ضربه‌ای دقیق هدف قرار دهد.',
          usage: 'short'
        }
      ],
      3: [
        {
          name: 'سازه همراه (Construct Companion)',
          description: 'فعال‌سازی یک سازه سنگی همراه وفادار با AC 15 و HP معادل (2×سطح + 2×مادیفایر CON). سازه می‌تواند در نبرد حمله کند و ضربات را جذب نماید.',
          usage: 'long'
        }
      ],
      5: [
        {
          name: 'حمله مضاعف (Extra Attack)',
          description: 'می‌تواند در اکشن حمله، دو بار ضربه بزند.',
          usage: 'none'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-architect',
        name: 'مکتب معماران آوند',
        description: 'تمرکز بر مهندسی باستانی، ارتقای سازه همراه و بازسازی ماشین‌های کهن.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'پیوند ارتعاشی سازه',
              description: 'سازه همراه می‌تواند به عنوان واکنش نیمی از صدمه وارده به سامان را به خود جذب کند.',
              usage: 'short'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-divanzad-forge',
        name: 'انرژی سازه همراه',
        description: 'جان و وضعیت سازه سنگی همراه دیوانزاد (AC 15).',
        resetType: 'long',
        formulaOrDiceByLevel: '2×level + 2×con'
      }
    ],
    startingFeatures: [
      {
        id: 'feat-dev-1',
        name: 'خون سنگ',
        description: 'با لمس سنگ و تمرکز بر ارتعاشات آن، ساختار و منشأ آن را بدون نیاز به چک قدرت (Strength) درمی‌یابد؛ حس غریزی نسبت به سنگ و فلز دارد.',
        source: 'دیوانزاد - سطح ۱',
        usageType: 'none'
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-sam-special', 'wpn-sam-showy'],
    updatedAt: new Date().toISOString()
  },

  // 2. سایه‌خوان (Shideh)
  {
    id: 'class-sayehkhan',
    name: 'سایه‌خوان (Shideh)',
    description: 'خوانندگان تاروپود شکسته زمان، سایه‌های برجای‌مانده از حوادث گذشته و راهروهای پنهان شن‌شین.',
    hitDie: 8,
    savingThrowProficiencies: ['dex', 'int'],
    skillChoices: {
      count: 3,
      options: ['stealth', 'sleight_of_hand', 'investigation', 'deception', 'insight', 'time_echo']
    },
    weaponProficiencies: ['سلاح‌های ساده، شمشیر کوتاه، راپیر، خنجر، کمان کوتاه'],
    armorProficiencies: ['زره‌های سبک (Light Armor)'],
    startingEquipment: ['خنجر سایه‌تراش یا شمشیر کوتاه شن‌شین', 'ردای چرمی سبک', 'کوله دزدان زمان'],
    acFormula: {
      base: 10,
      abilityMods: ['dex'],
      unarmored: false,
      note: 'زره سبک + DEX'
    },
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(8, 5),
    hpFormula: '۸ در سطح ۱ + ۵ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 9, dex: 16, con: 12, int: 15, wis: 13, cha: 11 },
    featuresByLevel: {
      1: [
        {
          name: 'پژواک لحظه',
          description: 'بر تاروپود آسیب‌دیده زمان تمرکز می‌کند و تصاویری گذرا از گذشته را احضار می‌نماید (مشاهده پژواک‌های روح‌مانند از آنچه در یک مکان رخ داده است).',
          usage: 'short'
        }
      ],
      2: [
        {
          name: 'خستگی واقعیت (Reality Fatigue)',
          description: 'ایجاد انحراف در واقعیت پیرامون دشمن به تعداد (مادیفایر INT + 1) در هر استراحت کامل. دشمن دچار خطای دید یا جا ماندن در زمان می‌شود.',
          usage: 'long'
        }
      ],
      3: [
        {
          name: 'گذر از سایه‌ها',
          description: 'می‌تواند به عنوان بونوس اکشن در تاریکی یا سایه کامل تا فاصله ۳۰ فوت تله‌پورت کند.',
          usage: 'short'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-chronoshadow',
        name: 'راسته‌ی سایه‌خواران',
        description: 'تمرکز بر رخنه در خاطرات فراموش‌شده و دزدی لحظه‌ها.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'سرقت ثانیه',
              description: 'واکنش در برابر حمله دشمن برای تغییر موقعیت در خط زمانی.',
              usage: 'short'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-reality-fatigue',
        name: 'خستگی واقعیت',
        description: 'تعداد دفعات اعمال انحراف زمانی بر اهداف (INT mod + 1 در هر استراحت کامل).',
        resetType: 'long',
        formulaOrDiceByLevel: 'INT + 1'
      }
    ],
    startingFeatures: [
      {
        id: 'feat-say-1',
        name: 'پژواک لحظه',
        description: 'بر تاروپود آسیب‌دیده زمان تمرکز می‌کند و تصاویری گذرا از گذشته را احضار می‌نماید.',
        source: 'سایه‌خوان - سطح ۱',
        usageType: 'short',
        maxUses: 1
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-shi-special', 'wpn-shi-showy'],
    updatedAt: new Date().toISOString()
  },

  // 3. پیمان‌بان (Mana)
  {
    id: 'class-peymanban',
    name: 'پیمان‌بان (Mana)',
    description: 'محافظان پیوند با نبض جنگل کهن ورنا و ریشه‌های حیات‌بخش طبیعت باستانی.',
    hitDie: 8,
    savingThrowProficiencies: ['con', 'wis'],
    skillChoices: {
      count: 2,
      options: ['nature', 'animal_handling', 'survival', 'medicine', 'perception']
    },
    weaponProficiencies: ['سلاح‌های ساده، کمان بلند، نیزه، قمه جنگلی'],
    armorProficiencies: ['زره‌های سبک و متوسط، سپرهای غیرفلزی'],
    startingEquipment: ['کمان ریشه‌بافت یا کمان بلند ورنا', 'زره پوست و چوب سخت', 'بسته‌های بذر ورنا'],
    acFormula: {
      base: 10,
      abilityMods: ['dex'],
      unarmored: false,
      note: 'زره متوسط (حداکثر +2 DEX) + سپر'
    },
    spellcasting: {
      ability: 'wis',
      saveDCFormula: '8 + prof + wis',
      slotsByLevel: {
        1: [2],
        2: [3],
        3: [4, 2],
        4: [4, 3],
        5: [4, 3, 2]
      },
      cantripsByLevel: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3 },
      spellList: [
        { level: 1, spells: ['زبان حیوانات', 'درمان زخم‌های ریشه', 'ریشه‌های بازدارنده', 'مه غلیظ ورنا'] },
        { level: 2, spells: ['رویش خارستان', 'حس حیات جنگل', 'باد آرامش‌بخش'] }
      ]
    },
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(8, 5),
    hpFormula: '۸ در سطح ۱ + ۵ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 10, dex: 14, con: 14, int: 11, wis: 16, cha: 12 },
    featuresByLevel: {
      1: [
        {
          name: 'زبان ریشه‌ها',
          description: 'با گذاشتن دست بر خاک یا ریشه‌ها، نبض جنگل را حس می‌کند، با موجودات کوچک یا ریشه‌ها ارتباط برقرار می‌سازد و جریان‌های جادویی را دنبال می‌کند.',
          usage: 'none'
        }
      ],
      2: [
        {
          name: 'جریان عصاره بهاری',
          description: 'کانال‌زنی انرژی طبیعت برای ترمیم زخم یاران یا تسریع رشد بذرها.',
          usage: 'short'
        }
      ],
      4: [
        {
          name: 'همراه جنگل (Forest Companion)',
          description: 'پیوند با موجودی از بیشه باستانی ورنا (AC 13, HP ویژه، حمله نیش یا چنگال ریشه با +4 برای اصابت و 1d6+2 صدمه).',
          usage: 'long'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-warden-grove',
        name: 'دایره بیشه ورنا',
        description: 'تمرکز بر جادوی احیاگر زندگی و ارتباط تله‌پاتیک با همراه جنگل.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'هم‌آوایی با خاک',
              description: 'کاهش صدمه عناصر بر روی یاران در محدوده ۱۰ فوتی.',
              usage: 'long'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-forest-companion',
        name: 'جان همراه جنگل',
        description: 'وضعیت سلامت همراه بیشه باستانی مانا.',
        resetType: 'long',
        formulaOrDiceByLevel: '3×level + WIS'
      }
    ],
    startingFeatures: [
      {
        id: 'feat-pey-1',
        name: 'زبان ریشه‌ها',
        description: 'با گذاشتن دست بر خاک یا ریشه‌ها، نبض جنگل را حس می‌کند و جریان‌های جادویی را دنبال می‌نماید.',
        source: 'پیمان‌بان - سطح ۱',
        usageType: 'none'
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-man-special', 'wpn-man-showy'],
    updatedAt: new Date().toISOString()
  },

  // 4. فره‌دار (Pardis)
  {
    id: 'class-farrehdar',
    name: 'فره‌دار (Pardis)',
    description: 'دارندگان نشان بیدارشده فره، حاملان هاله نور جامد و پایدارکنندگان زمان آشوب‌زده.',
    hitDie: 10,
    savingThrowProficiencies: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      options: ['athletics', 'insight', 'persuasion', 'religion', 'time_echo']
    },
    weaponProficiencies: ['تمام سلاح‌های ساده و جنگی، گرزهای عهد'],
    armorProficiencies: ['تمام زره‌ها و سپرها'],
    startingEquipment: ['گرز پیمان یا گرز بزرگ فره‌سوز', 'زره سنگین نشان‌دار', 'سپر زرین پیمان'],
    acFormula: {
      base: 10,
      abilityMods: ['dex'],
      unarmored: false,
      note: 'زره سنگین + سپر'
    },
    spellcasting: {
      ability: 'cha',
      saveDCFormula: '8 + prof + cha',
      slotsByLevel: {
        1: [0],
        2: [2],
        3: [3],
        4: [3],
        5: [4, 2]
      }
    },
    extraAttackLevel: 5,
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(10, 6),
    hpFormula: '۱۰ در سطح ۱ + ۶ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 15, dex: 10, con: 14, int: 9, wis: 13, cha: 16 },
    featuresByLevel: {
      1: [
        {
          name: 'نشان فره',
          description: 'نشان بیدارشده‌ای که می‌تواند سپری از نور جامد (مانند زره زندار) در اطراف خود و یاران ایجاد کند و زمان آشوبناک را به طور موقت تثبیت نماید (از جمله کاهش AC دشمنان زمانی مانند گسسته‌زمان).',
          usage: 'short'
        },
        {
          name: 'ندای فره',
          description: 'فره به حامل خود در مواقعی که استفاده از آن ضروری و سرنوشت‌ساز است هشدار و ندا می‌دهد.',
          usage: 'none'
        }
      ],
      2: [
        {
          name: 'ضربت ایزدی (Divine Smite)',
          description: 'یک بار در هر استراحت کوتاه؛ با اصابت ضربه سلاح، نور جامد فره فوران کرده و صدمه تابشی اضافه وارد می‌کند (2d8 در سطوح 2-4، 3d8 در سطوح 5-8، 4d8 در سطوح 9-12، 5d8 در سطوح 13-16، 6d8 در سطوح 17+).',
          usage: 'short'
        }
      ],
      3: [
        {
          name: 'انتخاب سوگند فره‌داری (Subclass)',
          description: 'سوگند نگهبان (محافظت از یاران و ثبات زمان) یا سوگند شکارچی تاریکی (نابودی هیولاهای سایه).',
          usage: 'none'
        }
      ],
      5: [
        {
          name: 'حمله مضاعف (Extra Attack)',
          description: 'می‌تواند در اکشن حمله، دو بار ضربه بزند.',
          usage: 'none'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-guardian-oath',
        name: 'سوگند نگهبان (Oath of the Warden)',
        description: 'تمرکز بر پایداری، حفاظت از یاران و ایستادگی در برابر امواج تباهی زمان.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'هاله ثبات',
              description: 'یاران در شعاع ۱۰ فوتی در برابر شوک‌های زمانی و تغییر AC ایمن می‌شوند.',
              usage: 'short'
            }
          ]
        }
      },
      {
        id: 'sub-shadow-hunter',
        name: 'سوگند شکارچی تاریکی (Oath of the Shadow Hunter)',
        description: 'تمرکز بر تعقیب و ریشه‌کن کردن موجوداتی که از تاروپود شکسته زمان تغذیه می‌کنند.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'شکار سایه',
              description: 'برتری در ضربات به اهدافی که در تاریکی یا نوسان زمانی هستند.',
              usage: 'short'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-divine-smite',
        name: 'ضربت ایزدی (Divine Smite)',
        description: 'فورانی از نور جامد فره هنگام حمله (۱ بار در هر استراحت کوتاه از سطح ۲؛ صدمه 2d8 تا 6d8).',
        resetType: 'short',
        formulaOrDiceByLevel: {
          2: '2d8', 3: '2d8', 4: '2d8',
          5: '3d8', 6: '3d8', 7: '3d8', 8: '3d8',
          9: '4d8', 10: '4d8', 11: '4d8', 12: '4d8',
          13: '5d8', 14: '5d8', 15: '5d8', 16: '5d8',
          17: '6d8', 18: '6d8', 19: '6d8', 20: '6d8'
        }
      }
    ],
    startingFeatures: [
      {
        id: 'feat-far-1',
        name: 'نشان فره',
        description: 'ایجاد سپر نور جامد در اطراف خود و یاران و تثبیت موقت زمان آشوبناک.',
        source: 'فره‌دار - سطح ۱',
        usageType: 'short',
        maxUses: 1
      },
      {
        id: 'feat-far-2',
        name: 'ندای فره',
        description: 'فره به حامل خود در مواقع خطر هشدار می‌دهد.',
        source: 'فره‌دار - سطح ۱',
        usageType: 'none'
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-par-special', 'wpn-par-showy'],
    updatedAt: new Date().toISOString()
  },

  // 5. موبد آذرین (Hamoun)
  {
    id: 'class-azarin',
    name: 'موبد آذرین (Hamoun)',
    description: 'آتش‌افروزان حافظه و احضارکنندگان خاطرات خفته در دل آتشدان‌های کهن و زغال‌های سرد.',
    hitDie: 8,
    savingThrowProficiencies: ['con', 'int'],
    skillChoices: {
      count: 2,
      options: ['arcana', 'history', 'religion', 'insight', 'medicine']
    },
    weaponProficiencies: ['سلاح‌های ساده، عصاها، گرز آتشدان'],
    armorProficiencies: ['بدون زره (None)'],
    startingEquipment: ['عصای آذرین یا گرز آتشدان', 'ردای موبدان آذر', 'کیسه زغال کهن و عود'],
    acFormula: {
      base: 10,
      abilityMods: ['dex', 'int'],
      unarmored: true,
      note: 'دفاع بدون زره موبدان: ۱۰ + DEX + INT (با زره یا سپر باطل می‌شود)'
    },
    spellcasting: {
      ability: 'int',
      saveDCFormula: '8 + prof + int',
      slotsByLevel: {
        1: [2],
        2: [3],
        3: [4, 2],
        4: [4, 3],
        5: [4, 3, 2]
      },
      cantripsByLevel: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4 }
    },
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(8, 5),
    hpFormula: '۸ در سطح ۱ + ۵ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 9, dex: 13, con: 14, int: 16, wis: 14, cha: 11 },
    featuresByLevel: {
      1: [
        {
          name: 'شعله‌ی حافظه (خاطره‌ی شعله)',
          description: 'آتشدان‌ها یا اشیای سرد را شعله‌ور می‌سازد تا خاطرات گذشته را به صورت تصویر نمایش دهند (مانند نشان دادن یک عدد، جهت یا واقعه)؛ توانایی روشن کردن زغال سرد.',
          usage: 'short'
        }
      ],
      2: [
        {
          name: 'گرمای التیام‌بخش اخگر',
          description: 'انتقال گرمای اخگرهای کهن برای تسریع بهبودی یاران در حین استراحت کوتاه.',
          usage: 'short'
        }
      ],
      3: [
        {
          name: 'نگهبان اخگر مقدس',
          description: 'افزایش صدمه جادوهای آتشین و مقاومت در برابر سرمای زمانی وردان.',
          usage: 'none'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-flame-keeper',
        name: 'طریقت آتشدان ابدی',
        description: 'تمرکز بر حفظ اخگر مادر و محافظت از رازهای کهن معبد آذران.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'سپر خاکستر',
              description: 'واکنش برای ایجاد لایه‌ای از خاکستر شناور که حمله ورودی را منحرف می‌کند.',
              usage: 'short'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-flame-memory',
        name: 'شعله‌های حافظه',
        description: 'تعداد دفعات افروختن زغال سرد برای احضار تصاویر گذشته.',
        resetType: 'short',
        formulaOrDiceByLevel: {
          1: '2', 2: '2', 3: '3', 4: '3', 5: '4'
        }
      }
    ],
    startingFeatures: [
      {
        id: 'feat-aza-1',
        name: 'شعله‌ی حافظه (خاطره‌ی شعله)',
        description: 'افروختن آتشدان‌های سرد برای نمایش خاطرات گذشته به صورت تصویر.',
        source: 'موبد آذرین - سطح ۱',
        usageType: 'short',
        maxUses: 2
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-ham-special', 'wpn-ham-showy'],
    updatedAt: new Date().toISOString()
  },

  // 6. مه‌آشنا (Siavash - fairy)
  {
    id: 'class-meh-ashna',
    name: 'مه‌آشنا (Siavash - fairy)',
    description: 'پریان حساسی که ارتعاشات مه و امواج صوتی محبوس را می‌شنوند و بر جریان لحظه‌ها چیره می‌شوند.',
    hitDie: 8,
    savingThrowProficiencies: ['dex', 'wis'],
    skillChoices: {
      count: 2,
      options: ['acrobatics', 'athletics', 'stealth', 'insight', 'perception']
    },
    weaponProficiencies: ['سلاح‌های ساده، شمشیر کوتاه'],
    armorProficiencies: ['بدون زره (None)'],
    startingEquipment: ['خنجر پریان یا شمشیر کوتاه سبک', 'لباس بافته از مه', 'ساعت کوچک فاز زمانی'],
    acFormula: {
      base: 10,
      abilityMods: ['dex', 'wis'],
      unarmored: true,
      note: 'دفاع بی‌پیرایه پریان: ۱۰ + DEX + WIS (با زره یا سپر باطل می‌شود)'
    },
    extraAttackLevel: 5,
    asiLevels: [4, 8, 12, 16, 19],
    fixedHpByLevel: generateFixedHp(8, 5),
    hpFormula: '۸ در سطح ۱ + ۵ به ازای هر سطح بعدی (+ مادیفایر CON × سطح)',
    baseAbilityScores: { str: 10, dex: 16, con: 12, int: 14, wis: 15, cha: 12 },
    featuresByLevel: {
      1: [
        {
          name: 'لرزش ادراک',
          description: 'دست او برای چند ثانیه نیمه‌شفاف و سبک می‌شود و می‌تواند ادراک حسی متفاوتی را لمس کند.',
          usage: 'short'
        },
        {
          name: 'پژواک گم',
          description: 'حساس به پژواک‌های فرکانس صوتی در مکان‌های مسدود یا پلمپ‌شده (شنیدن انعکاس گذشته از میان سنگ‌های ضخیم).',
          usage: 'none'
        },
        {
          name: 'تاس هنرهای رزمی (Martial Arts Die)',
          description: 'تاس صدمه حملات بی‌پیرایه و سلاح‌های مه‌آشنا: 1d4 در سطوح ۱-۴، 1d6 در سطوح ۵-۱۰، 1d8 در سطوح ۱۱-۱۶، 1d10 در سطوح ۱۷+.',
          usage: 'none'
        }
      ],
      2: [
        {
          name: 'امتیاز لحظه (Moment Points)',
          description: 'تعداد امتیاز معادل سطح کاراکتر؛ خرج کردن برای حرکات ناگهانی در مه، دفاع برق‌آسا یا ضربه گیج‌کننده زمانی.',
          usage: 'short'
        }
      ],
      3: [
        {
          name: 'سنت پریان مه‌آشنا (Tradition)',
          description: 'آغاز مسیر اختصاصی در سطوح ۳، ۶، ۱۱ و ۱۷.',
          usage: 'none'
        }
      ],
      5: [
        {
          name: 'حمله مضاعف (Extra Attack)',
          description: 'می‌تواند در اکشن حمله، دو بار ضربه بزند.',
          usage: 'none'
        }
      ]
    },
    subclasses: [
      {
        id: 'sub-mist-tradition',
        name: 'سنت پژواک‌های مه (Way of the Mist Echoes)',
        description: 'تمرکز بر حلول در مه، شکستن ادراک دشمن و جابجایی بدون وزن میان خطوط زمان.',
        unlockLevel: 3,
        featuresByLevel: {
          3: [
            {
              name: 'قدم‌های بی‌وزن',
              description: 'خرج ۱ امتیاز لحظه برای نامرئی شدن در مه تا پایان نوبت.',
              usage: 'short'
            }
          ],
          6: [
            {
              name: 'ضربه ارتعاش صوتی',
              description: 'صدمه نیرو (Force) به جای صدمه فیزیکی با ارتعاش فرکانس سنگ.',
              usage: 'none'
            }
          ],
          11: [
            {
              name: 'انعطاف فاز زمانی',
              description: 'تغییر سن و حالت بدنی برای فرار از گیر افتادن یا طلسم‌ها.',
              usage: 'long'
            }
          ],
          17: [
            {
              name: 'مه مطلق باستان',
              description: 'احضار مه غلیظی که تمام دشمنان درون آن را دچار کندی (Slow) می‌کند.',
              usage: 'long'
            }
          ]
        }
      }
    ],
    classResources: [
      {
        id: 'res-moment-points',
        name: 'امتیاز لحظه (Moment Points)',
        description: 'معادل سطح کاراکتر در هر استراحت کوتاه یا بلند.',
        resetType: 'short',
        formulaOrDiceByLevel: 'level'
      },
      {
        id: 'res-martial-arts-die',
        name: 'تاس هنرهای رزمی',
        description: 'مقدار تاس صدمه ضربات بدون سلاح و تکنیک‌های مه‌آشنا.',
        resetType: 'none',
        formulaOrDiceByLevel: {
          1: '1d4', 2: '1d4', 3: '1d4', 4: '1d4',
          5: '1d6', 6: '1d6', 7: '1d6', 8: '1d6', 9: '1d6', 10: '1d6',
          11: '1d8', 12: '1d8', 13: '1d8', 14: '1d8', 15: '1d8', 16: '1d8',
          17: '1d10', 18: '1d10', 19: '1d10', 20: '1d10'
        }
      }
    ],
    startingFeatures: [
      {
        id: 'feat-meh-1',
        name: 'لرزش ادراک',
        description: 'دست او برای چند ثانیه نیمه‌شفاف و سبک می‌شود.',
        source: 'مه‌آشنا - سطح ۱',
        usageType: 'short',
        maxUses: 1
      },
      {
        id: 'feat-meh-2',
        name: 'پژواک گم',
        description: 'حساس به ارتعاشات صوتی در مکان‌های مسدود و دیوارهای سنگی.',
        source: 'مه‌آشنا - سطح ۱',
        usageType: 'none'
      }
    ],
    level2Options: ['باز شدن / ارتقا با امتیاز مهارت (اخگرهای تپنده)'],
    starterWeaponOptions: ['wpn-sia-special', 'wpn-sia-showy'],
    updatedAt: new Date().toISOString()
  }
];
