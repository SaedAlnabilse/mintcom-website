export interface MenuItemOption {
  id: string;
  name: { en: string; ar: string };
  price: number;
}

export interface MenuItemOptionGroup {
  id: string;
  name: { en: string; ar: string };
  required?: boolean;
  maxSelect?: number;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  calories: number;
  prepTime: string;
  tags: ('chef' | 'vegan' | 'vegetarian' | 'spicy' | 'gluten-free' | 'popular')[];
  allergens: string[];
  optionGroups?: MenuItemOptionGroup[];
}

export interface MenuCategory {
  id: string;
  name: { en: string; ar: string };
  icon: string;
  itemCount: number;
}

export interface CartItemOption {
  groupId: string;
  groupName: { en: string; ar: string };
  optionId: string;
  optionName: { en: string; ar: string };
  price: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: CartItemOption[];
  specialNote?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface TableOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  timestamp: string;
  status: 'received' | 'preparing' | 'served';
  specialInstructions?: string;
}

export interface RestaurantInfo {
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  logo: string;
  banner: string;
  rating: number;
  reviewsCount: number;
  address: { en: string; ar: string };
  wifiName: string;
  wifiPass: string;
  openingHours: { en: string; ar: string };
  currency: {
    code: string;
    symbolEn: string;
    symbolAr: string;
  };
}

export const RESTAURANT_INFO: RestaurantInfo = {
  name: {
    en: 'Mint Bistro & Lounge',
    ar: 'مينت بيسترو ولounge',
  },
  tagline: {
    en: 'Artisan Woodfired Kitchen & Specialty Coffee',
    ar: 'مطبخ الحطب الحرفي والقهوة المختصة',
  },
  logo: '🌿',
  banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  rating: 4.9,
  reviewsCount: 384,
  address: {
    en: '45 Abdoun Circle, Amman, Jordan',
    ar: '٤٥ دوار عبدون، عمّان، الأردن',
  },
  wifiName: 'MintBistro_Guest',
  wifiPass: 'mintcom2026',
  openingHours: {
    en: 'Open Now • 10:00 AM – 12:00 AM',
    ar: 'مفتوح الآن • ١٠:٠٠ ص – ١٢:٠٠ م',
  },
  currency: {
    code: 'JOD',
    symbolEn: 'JD',
    symbolAr: 'د.أ',
  },
};

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'starters', name: { en: 'Starters & Tapas', ar: 'المقبلات والتاباس' }, icon: '🥗', itemCount: 4 },
  { id: 'burgers', name: { en: 'Gourmet Burgers', ar: 'برجر جورميه' }, icon: '🍔', itemCount: 4 },
  { id: 'pizzas', name: { en: 'Woodfired Pizzas', ar: 'بيتزا الحطب' }, icon: '🍕', itemCount: 4 },
  { id: 'mains', name: { en: 'Signature Mains', ar: 'الأطباق الرئيسية' }, icon: '🥩', itemCount: 4 },
  { id: 'coffee', name: { en: 'Specialty Coffee', ar: 'القهوة المختصة' }, icon: '☕', itemCount: 4 },
  { id: 'drinks', name: { en: 'Refreshers', ar: 'العصائر والموهيتو' }, icon: '🍹', itemCount: 3 },
  { id: 'desserts', name: { en: 'Artisan Desserts', ar: 'الحلويات الفاخرة' }, icon: '🍰', itemCount: 3 },
];

export const MENU_ITEMS: MenuItem[] = [
  // STARTERS
  {
    id: 'str-1',
    categoryId: 'starters',
    name: { en: 'Crispy Truffle Burrata', ar: 'بوراتا الكمأة المقرمشة' },
    description: {
      en: 'Golden panko-crusted fresh Italian burrata, heirloom cherry tomatoes, 12-year aged balsamic glaze, fresh basil pesto.',
      ar: 'جبنة بوراتا إيطالية طازجة مغلفة بالبانكو المقرمش، طماطم كرزية ملونة، بلسميك معتق، وصلصة البيستو الطازجة.',
    },
    price: 14.5,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
    calories: 480,
    prepTime: '10-12 min',
    tags: ['chef', 'vegetarian', 'popular'],
    allergens: ['Dairy', 'Gluten'],
    optionGroups: [
      {
        id: 'bread',
        name: { en: 'Choice of Bread', ar: 'اختيار الخبز' },
        required: true,
        options: [
          { id: 'sourdough', name: { en: 'Toasted Garlic Sourdough', ar: 'ساوردو محمص بالثوم' }, price: 0 },
          { id: 'focaccia', name: { en: 'Rosemary Sea Salt Focaccia', ar: 'فوكاتشا إكليل الجبل' }, price: 1.5 },
        ],
      },
    ],
  },
  {
    id: 'str-2',
    categoryId: 'starters',
    name: { en: 'Wagyu Beef Carpaccio', ar: 'كارباتشيو لحم الواغيو' },
    description: {
      en: 'Thinly shaved MB7+ Australian Wagyu, caperberries, shaved black winter truffles, Parmigiano-Reggiano, baby arugula.',
      ar: 'شرائح رقيقة من لحم الواغيو الأسترالي الفاخر، كبر، كمأة سوداء مبشورة، بارميجيانو ريجانو، وجرجير طازج.',
    },
    price: 18.0,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    calories: 340,
    prepTime: '8-10 min',
    tags: ['chef', 'gluten-free'],
    allergens: ['Dairy'],
  },
  {
    id: 'str-3',
    categoryId: 'starters',
    name: { en: 'Smoked Paprika Calamari', ar: 'كالاماري بالبابريكا المدخنة' },
    description: {
      en: 'Flash-fried baby calamari, Spanish smoked paprika, burnt lime aioli, fresh scallions, crushed pink peppercorns.',
      ar: 'كالاماري مقلي خفيف مع البابريكا الإسبانية المدخنة، صلصة أيولي الليمون المحروق، وبصل أخضر.',
    },
    price: 13.0,
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    calories: 420,
    prepTime: '10 min',
    tags: ['popular'],
    allergens: ['Seafood', 'Gluten', 'Egg'],
  },
  {
    id: 'str-4',
    categoryId: 'starters',
    name: { en: 'Smoky Roasted Eggplant Dip', ar: 'متبل الباذنجان المدخن بزيت الزيتون' },
    description: {
      en: 'Fire-roasted local eggplant, whipped tahini, pomegranate molasses, crushed walnuts, served with hot lavash bread.',
      ar: 'باذنجان مشوي على الحطب، طحينة مخفوقة، دبس رمان جبلي، جوز محمص، يقدم مع خبز اللافاش الساخن.',
    },
    price: 9.5,
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    calories: 290,
    prepTime: '8 min',
    tags: ['vegan', 'popular'],
    allergens: ['Sesame', 'Nuts', 'Gluten'],
  },

  // BURGERS
  {
    id: 'brg-1',
    categoryId: 'burgers',
    name: { en: 'The Mint Signature Truffle Burger', ar: 'برجر الكمأة الخاص بمينت' },
    description: {
      en: '200g Black Angus beef patty, melted gruyere cheese, black truffle butter, caramelized sweet onions, wild rocket, toasted brioche bun.',
      ar: 'قطعة لحم أنجوس أسود ٢٠٠ غرام، جبن غرويير ذائب، زبدة الكمأة السوداء، بصل مكرمل، جرجير بري، في خبز بريوش طازج.',
    },
    price: 16.5,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    calories: 780,
    prepTime: '15-18 min',
    tags: ['chef', 'popular'],
    allergens: ['Dairy', 'Gluten', 'Egg'],
    optionGroups: [
      {
        id: 'doneness',
        name: { en: 'Patty Temperature', ar: 'درجة استواء اللحم' },
        required: true,
        options: [
          { id: 'medium-rare', name: { en: 'Medium Rare (Juicy pink center)', ar: 'ميديم رير (وردي طري)' }, price: 0 },
          { id: 'medium', name: { en: 'Medium (Slightly pink)', ar: 'ميديم (وردي خفيف)' }, price: 0 },
          { id: 'well-done', name: { en: 'Well Done (Fully cooked)', ar: 'ويل دن (ناضج تماماً)' }, price: 0 },
        ],
      },
      {
        id: 'side',
        name: { en: 'Select Side', ar: 'اختر الطبق الجانبي' },
        required: true,
        options: [
          { id: 'fries', name: { en: 'Hand-Cut Herb French Fries', ar: 'بطاطس مقلية بالأعشاب' }, price: 0 },
          { id: 'truffle-fries', name: { en: 'Parmesan Truffle Fries', ar: 'بطاطس البارميزان والكمأة' }, price: 2.5 },
          { id: 'salad', name: { en: 'Wild Arugula Side Salad', ar: 'سلطة جرجير برية' }, price: 1.5 },
        ],
      },
    ],
  },
  {
    id: 'brg-2',
    categoryId: 'burgers',
    name: { en: 'Smoked Nashville Hot Chicken', ar: 'برجر الدجاج الحار على طريقة ناشفيل' },
    description: {
      en: 'Buttermilk-brined crispy chicken breast dipped in Nashville chili oil, crunchy dill pickles, comeback slaw, warm potato bun.',
      ar: 'صدر دجاج مقرمش منقوع باللبن ومتبل بزيت شطة ناشفيل المدخن، خيار مخلل، سلطة كولسلو، في خبز البطاطس الطري.',
    },
    price: 14.0,
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    calories: 720,
    prepTime: '12-15 min',
    tags: ['spicy', 'popular'],
    allergens: ['Gluten', 'Dairy', 'Egg'],
  },
  {
    id: 'brg-3',
    categoryId: 'burgers',
    name: { en: 'Double Smash Cheddar Burger', ar: 'دبل سماش برجر بالجبنة الشيدر' },
    description: {
      en: 'Twin seared crust smash patties, double vintage cheddar, house secret relish, thinly shaved red onions, mustard aioli.',
      ar: 'شريحتان من لحم الأنجوس المقرمش على الصاج، جبن شيدر إنجليزي معتق مضاعف، صوص ريليش السري، وبصل أحمر.',
    },
    price: 15.0,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    calories: 820,
    prepTime: '12 min',
    tags: ['popular'],
    allergens: ['Dairy', 'Gluten', 'Mustard'],
  },
  {
    id: 'brg-4',
    categoryId: 'burgers',
    name: { en: 'Charred Halloumi & Avocado Burger', ar: 'برجر الحلوم المشوي والأفوكادو' },
    description: {
      en: 'Thick grilled Cypriot halloumi, smashed ripe avocado, sun-dried tomato tapenade, baby spinach, roasted garlic mayo.',
      ar: 'جبن حلوم قبرصي مشوي على اللهب، أفوكادو طازج مهروس، تتبيلة طماطم مجففة، سبانخ صغيرة، ومايونيز الثوم المشوي.',
    },
    price: 13.5,
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
    calories: 610,
    prepTime: '12 min',
    tags: ['vegetarian'],
    allergens: ['Dairy', 'Gluten', 'Egg'],
  },

  // PIZZAS
  {
    id: 'piz-1',
    categoryId: 'pizzas',
    name: { en: 'Napoletana Margherita DOC', ar: 'بيتزا مارغريتا نابوليتانا الأصيلة' },
    description: {
      en: '48-hour slow fermented dough, San Marzano DOP tomatoes, fresh Fior di Latte mozzarella, fresh organic basil, extra virgin olive oil.',
      ar: 'عجينة متخمرة لمدة ٤٨ ساعة ومخبوزة على الحطب، صلصة طماطم سان مارزانو، موزاريلا فيور دي لاتي، وريحان إيطالي طازج.',
    },
    price: 13.0,
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    calories: 650,
    prepTime: '10-12 min',
    tags: ['vegetarian', 'popular'],
    allergens: ['Dairy', 'Gluten'],
  },
  {
    id: 'piz-2',
    categoryId: 'pizzas',
    name: { en: 'Tartufo & Wild Forest Mushroom', ar: 'بيتزا الكمأة وفطر الغابات البري' },
    description: {
      en: 'Creamy truffle velouté base, sautéed porcini & chanterelle mushrooms, smoked scamorza, fresh thyme, white truffle oil drizzle.',
      ar: 'قاعدة كريمة الكمأة الغنية، فطر البورشيني والشانتيريل البري، جبنة سكامورزا مدخنة، زعتر بري، ورذاذ زيت الكمأة الأبيض.',
    },
    price: 17.5,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    calories: 720,
    prepTime: '12-14 min',
    tags: ['chef', 'vegetarian'],
    allergens: ['Dairy', 'Gluten'],
  },
  {
    id: 'piz-3',
    categoryId: 'pizzas',
    name: { en: 'Diavola Hot Honey & Bresaola', ar: 'بيتزا ديافولا مع عسل حار وبريزاولا' },
    description: {
      en: 'Crushed San Marzano tomatoes, mozzarella, dry-cured beef bresaola, spicy Calabrian chili flakes, habanero hot honey infusion.',
      ar: 'صلصة طماطم، موزاريلا، شرائح بريزاولا البقر المجففة، رقائق الفلفل الحار، ولمسة عسل الهابانيرو الحار الطبيعي.',
    },
    price: 16.5,
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    calories: 740,
    prepTime: '12 min',
    tags: ['spicy'],
    allergens: ['Dairy', 'Gluten'],
  },
  {
    id: 'piz-4',
    categoryId: 'pizzas',
    name: { en: 'Four Cheese & Rosemary Fig', ar: 'بيتزا الأجبان الأربعة والتين والروزماري' },
    description: {
      en: 'Fior di latte, Gorgonzola dolce, fontina, aged pecorino, caramelized black mission figs, wild clover honey, fresh rosemary.',
      ar: 'موزاريلا، جورجونزولا دولتشي، فونتينا، بيكورينو معتق، تين أسود مكرمل، عسل البرسيم، وإكليل الجبل الطازج.',
    },
    price: 15.5,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    calories: 690,
    prepTime: '12 min',
    tags: ['vegetarian'],
    allergens: ['Dairy', 'Gluten'],
  },

  // MAINS
  {
    id: 'main-1',
    categoryId: 'mains',
    name: { en: 'Pan-Seared Chilean Sea Bass', ar: 'سمك القاروص التشيلي المحمر' },
    description: {
      en: 'Sustainably caught Chilean sea bass, cauliflower silk purée, charred asparagus spears, saffron lemon reduction emulsion.',
      ar: 'فيليه سمك القاروص التشيلي الطازج المشوي، بيوريه القرنبيط الحريري، هليون محمر على النار، وصلصة الزعفران والليمون.',
    },
    price: 26.0,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    calories: 520,
    prepTime: '18-20 min',
    tags: ['chef', 'gluten-free'],
    allergens: ['Fish', 'Dairy'],
  },
  {
    id: 'main-2',
    categoryId: 'mains',
    name: { en: 'Slow-Braised Short Rib Rigatoni', ar: 'ريغاتوني ريبس اللحم المطهو ببطء' },
    description: {
      en: '8-hour braised beef short ribs pulled in a rich San Marzano tomato ragù, bronze-die rigatoni, freshly grated Grana Padano.',
      ar: 'أضلاع اللحم البقري المطهوة على نار هادئة لـ ٨ ساعات بصلصة الراجو الإيطالية، مكرونة ريغاتوني طازجة، وجبنة غرانا بادانو.',
    },
    price: 19.5,
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d62810f3?auto=format&fit=crop&w=800&q=80',
    calories: 740,
    prepTime: '14-16 min',
    tags: ['popular'],
    allergens: ['Dairy', 'Gluten'],
  },
  {
    id: 'main-3',
    categoryId: 'mains',
    name: { en: 'Charcoal Grilled Ribeye (300g)', ar: 'ستيك ريب آي مشوي على الفحم (٣٠٠ غ)' },
    description: {
      en: 'Grain-fed Black Angus prime ribeye, smoked bone marrow butter, roasted confit garlic bulb, peppercorn jus.',
      ar: 'قطعة ريب آي أنجوس فاخرة مشوية على الفحم، زبدة نخاع العظم المدخنة، رأس ثوم كونفيت مكرمل، وصوص الفلفل الأسود.',
    },
    price: 28.5,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    calories: 790,
    prepTime: '18-22 min',
    tags: ['chef', 'gluten-free'],
    allergens: ['Dairy'],
  },
  {
    id: 'main-4',
    categoryId: 'mains',
    name: { en: 'Grilled Lemon Herb Chicken', ar: 'دجاج مشوي بالليمون والأعشاب' },
    description: {
      en: 'Half free-range chicken roasted with fresh rosemary, sumac, confit baby potatoes, and charred lemon reduction.',
      ar: 'نصف دجاج بلدي متبل بإكليل الجبل والليمون والسماق البلدي، مشوي مع بطاطس صغيرة وثوم محمص.',
    },
    price: 17.0,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    calories: 610,
    prepTime: '16-18 min',
    tags: ['gluten-free'],
    allergens: [],
  },

  // COFFEE
  {
    id: 'cof-1',
    categoryId: 'coffee',
    name: { en: 'Spanish Lavender Latte', ar: 'سبانش لافندر لاتيه' },
    description: {
      en: 'Double shot of Ethiopian Yirgacheffe espresso, sweetened organic condensed milk, natural lavender essence, silky steamed milk.',
      ar: 'جرعة مزدوجة من إسبريسو إثيوبي فاخر، حليب مكثف محلى عضوي، خلاصة اللافندر الطبيعية، ورغوة حليب ناعمة.',
    },
    price: 5.5,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
    calories: 220,
    prepTime: '4 min',
    tags: ['popular'],
    allergens: ['Dairy'],
  },
  {
    id: 'cof-2',
    categoryId: 'coffee',
    name: { en: 'Ceremonial Iced Matcha Cloud', ar: 'سحابة الماتشا اليابانية الباردة' },
    description: {
      en: 'First-harvest Uji Japanese ceremonial matcha whisked fresh, sweet oat milk, topped with a vanilla cold foam cloud.',
      ar: 'ماتشا احتفالية يابانية من مدينة أوجي مخفوقة يدوياً، حليب شوفان كريمي، تعلوها طبقة رغوة الفانيليا الباردة.',
    },
    price: 6.0,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    calories: 160,
    prepTime: '5 min',
    tags: ['chef', 'vegan', 'popular'],
    allergens: [],
  },
  {
    id: 'cof-3',
    categoryId: 'coffee',
    name: { en: 'Cold Brew Cascara Tonic', ar: 'كولد برو منقوع الكاسكارا وتونيك' },
    description: {
      en: '24-hour slow steeped Colombian Gesha cold brew, sparkling Mediterranean tonic, expressed fresh orange peel oil.',
      ar: 'قهوة كولد برو مقطرة ببطء لـ ٢٤ ساعة من بن جيشا الكولومبي، ماء تونيك فوار، ونكهة قشر البرتقال الطبيعي.',
    },
    price: 5.0,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    calories: 45,
    prepTime: '3 min',
    tags: ['vegan'],
    allergens: [],
  },
  {
    id: 'cof-4',
    categoryId: 'coffee',
    name: { en: 'Cortado Double Origin', ar: 'كورتادو مزدوج المصدر' },
    description: {
      en: 'Equal parts rich espresso and warm textured velvety whole milk. Served in a classic Gibraltar glass.',
      ar: 'نسبة متساوية تماماً من الإسبريسو المركز وحليب كامل الدسم المخملي الدافئ في كوب جبل طارق الكلاسيكي.',
    },
    price: 4.5,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    calories: 80,
    prepTime: '3 min',
    tags: [],
    allergens: ['Dairy'],
  },

  // DRINKS
  {
    id: 'drk-1',
    categoryId: 'drinks',
    name: { en: 'Wild Mint & Passionfruit Mojito', ar: 'موهيتو النعناع البري والباشن فروت' },
    description: {
      en: 'Muddled garden mint leaves, organic passionfruit pulp, freshly squeezed Persian lime juice, crushed ice, sparkling soda.',
      ar: 'أوراق نعناع طازجة مهروسة، لب فاكهة الباشن فروت الطبيعي، ليمون طازج، ثلج مجروش، ومياه غازية فوارة.',
    },
    price: 6.0,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    calories: 130,
    prepTime: '4 min',
    tags: ['vegan', 'popular'],
    allergens: [],
  },
  {
    id: 'drk-2',
    categoryId: 'drinks',
    name: { en: 'Blood Orange & Rosemary Spritz', ar: 'مشروب البرتقال الدموي وإكليل الجبل' },
    description: {
      en: 'Sicilian blood orange juice, charred rosemary sprig, elderflower syrup, sparkling San Pellegrino, dehydrated orange wheel.',
      ar: 'عصير برتقال دموي صقلي طازج، غصن إكليل الجبل المحروق، سيروب زهر البيلسان، ومياه سان بيليغرينو.',
    },
    price: 6.5,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    calories: 110,
    prepTime: '4 min',
    tags: ['vegan'],
    allergens: [],
  },
  {
    id: 'drk-3',
    categoryId: 'drinks',
    name: { en: 'Freshly Pressed Green Glow', ar: 'عصير الجرين جلو الأخضر البارد' },
    description: {
      en: 'Cold-pressed Granny Smith green apples, English cucumber, celery, baby spinach, fresh ginger, dash of lemon.',
      ar: 'عصير بارد معصور على البطيء من التفاح الأخضر، الخيار، الكرفس، السبانخ، الزنجبيل الطازج، ولمسة ليمون.',
    },
    price: 5.5,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    calories: 95,
    prepTime: '5 min',
    tags: ['vegan', 'gluten-free'],
    allergens: ['Celery'],
  },

  // DESSERTS
  {
    id: 'des-1',
    categoryId: 'desserts',
    name: { en: 'Warm Pistachio Kunafa Fondant', ar: 'فوندان الفستق الحلبي والكنافة الدافئ' },
    description: {
      en: 'Crispy golden kunafa crust encasing a molten pure Aleppo pistachio heart, topped with clotted mastic ice cream and orange blossom syrup.',
      ar: 'كنافة ذهبية مقرمشة محشوة بفوندان الفستق الحلبي السائل، تعلوها بوظة المستكة العربية الأصيلة وشيرة زهر البرتقال.',
    },
    price: 9.5,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    calories: 580,
    prepTime: '12 min',
    tags: ['chef', 'popular'],
    allergens: ['Dairy', 'Gluten', 'Nuts'],
  },
  {
    id: 'des-2',
    categoryId: 'desserts',
    name: { en: '70% Dark Valrhona Chocolate Tart', ar: 'تارت شوكولاتة فالرونا الداكنة ٧٠٪' },
    description: {
      en: 'Crisp cocoa sable pastry, molten Valrhona Guanaja ganache, Maldon sea salt flakes, Madagascar vanilla bean crema.',
      ar: 'تارت الكاكاو الهش، جاناش شوكولاتة فالرونا الداكنة الفاخرة، رقائق ملح مالدون البحري، وكريمة فانيليا مدغشقر.',
    },
    price: 8.5,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
    calories: 510,
    prepTime: '8 min',
    tags: ['vegetarian'],
    allergens: ['Dairy', 'Gluten', 'Egg'],
  },
  {
    id: 'des-3',
    categoryId: 'desserts',
    name: { en: 'Madagascar Vanilla Bean Tiramisu', ar: 'تيراميسو فانيليا مدغشقر الإيطالي' },
    description: {
      en: 'Espresso-dipped artisanal ladyfingers, whipped mascarpone cream, dark cocoa dust, hazelnut brittle crunch.',
      ar: 'أصابع بسكويت مغموسة بالإسبريسو المركز، كريمة ماسكاربوني غنية، مسحوق الكاكاو الفاخر، ومقرمشات البندق المكرمل.',
    },
    price: 8.0,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    calories: 460,
    prepTime: '6 min',
    tags: ['popular'],
    allergens: ['Dairy', 'Gluten', 'Egg', 'Nuts'],
  },
];
