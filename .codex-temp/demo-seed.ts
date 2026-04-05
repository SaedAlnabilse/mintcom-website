// @ts-nocheck
import {
  EmployeeRole,
  EstablishmentType,
  InputType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ShiftState,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ACCOUNT_EMAIL = 'admin@example.com';
const ACCOUNT_PASSWORD = 'password123';
const DEFAULT_POS_PASSWORD = '1234';
const SALT_ROUNDS = 10;

const TARGETS = {
  customersPerEstablishment: 36,
  totalOrdersPerEstablishment: 180,
  totalShiftsPerEstablishment: 30,
  heldOrdersPerEstablishment: 4,
  activityLogsPerEstablishment: 60,
  billingHistoryEntries: 4,
};

const SECONDARY_TARGETS = {
  customersPerEstablishment: 12,
  totalOrdersPerEstablishment: 24,
  totalShiftsPerEstablishment: 8,
  heldOrdersPerEstablishment: 1,
  activityLogsPerEstablishment: 12,
};

const FULL_POS_PERMISSIONS = [
  'pos',
  'dashboard',
  'view_orders',
  'view_reports',
  'view_shift_reports',
  'void_items',
  'refunds',
  'discounts',
  'manage_open_tickets',
  'open_cash_drawer',
  'reprint_receipts',
  'change_taxes',
  'view_activity_logs',
  'manage_inventory',
  'view_cost',
  'manage_employees',
  'manage_customers',
  'manage_settings',
  'manage_discounts',
  'manage_payment_methods',
  'live_chat',
  'manage_billing',
  'pay_in_pay_out',
  'restock_items',
  'loyalty_system_access',
  'manage_establishment_profile',
  'manage_tax_currency',
  'manage_receipt_settings',
  'manage_loyalty_program',
  'cancel_receipts',
  'export_data',
];

const MANAGER_POS_PERMISSIONS = [
  'pos',
  'dashboard',
  'view_orders',
  'view_reports',
  'view_shift_reports',
  'refunds',
  'discounts',
  'manage_open_tickets',
  'open_cash_drawer',
  'reprint_receipts',
  'change_taxes',
  'manage_inventory',
  'manage_employees',
  'manage_customers',
  'manage_discounts',
  'manage_payment_methods',
  'pay_in_pay_out',
  'restock_items',
  'loyalty_system_access',
  'view_activity_logs',
];

const CASHIER_POS_PERMISSIONS = [
  'pos',
  'dashboard',
  'view_orders',
  'discounts',
  'manage_open_tickets',
  'open_cash_drawer',
  'reprint_receipts',
  'pay_in_pay_out',
  'void_items',
];

const BACKOFFICE_FULL_PERMISSIONS = [
  'dashboard',
  'view_orders',
  'view_reports',
  'cancel_receipts',
  'manage_inventory',
  'manage_payment_methods',
  'manage_employees',
  'manage_discounts',
  'manage_loyalty_program',
  'manage_settings',
  'manage_establishment_profile',
  'manage_tax_currency',
  'manage_receipt_settings',
  'delete_establishment',
  'export_data',
];

const BACKOFFICE_MANAGER_PERMISSIONS = [
  'dashboard',
  'view_orders',
  'view_reports',
  'manage_inventory',
  'manage_payment_methods',
  'manage_employees',
  'manage_discounts',
  'manage_loyalty_program',
  'manage_settings',
  'manage_establishment_profile',
  'manage_tax_currency',
  'manage_receipt_settings',
  'export_data',
];

const CUSTOMER_TEMPLATES = [
  'Amina Haddad',
  'Omar Khalaf',
  'Lina Naser',
  'Tariq Samir',
  'Maya Rashed',
  'Hassan Odeh',
  'Noor Jaber',
  'Yousef Hamdan',
  'Salma Darwish',
  'Karim Fares',
  'Dima Suleiman',
  'Zaid Qattan',
  'Rana Shami',
  'Fadi Hani',
  'Jana Tannous',
  'Nour Abu Ali',
  'Sami Alwan',
  'Hiba Khalil',
  'Rami Saadeh',
  'Farah Khatib',
  'Nadine Issa',
  'Mahmoud Khouri',
  'Dana Azar',
  'Khaled Mansour',
  'Sarah Nabil',
  'Laith Hamed',
  'Rita Malki',
  'Basil Najjar',
  'Shahd Bakri',
  'Qais Abbasi',
  'Reem Hattar',
  'Mohammad Zein',
  'Nancy Rifaie',
  'Walid Sayegh',
  'Malak Hijazi',
  'Ali Kanaan',
  'Sahar Awad',
  'Jude Akel',
  'Nisreen Azzam',
  'Tamer Dabbas',
];

const FALLBACK_CATEGORIES = [
  { name: 'Signature Drinks', icon: 'Coffee' },
  { name: 'Meals', icon: 'UtensilsCrossed' },
  { name: 'Desserts', icon: 'Cake' },
  { name: 'Sides', icon: 'Package' },
];

const FALLBACK_ITEMS = [
  { name: 'House Latte', categoryName: 'Signature Drinks', price: 3.75, costPrice: 1.25, trackStock: true, availableStock: 140 },
  { name: 'Iced Americano', categoryName: 'Signature Drinks', price: 2.95, costPrice: 0.95, trackStock: true, availableStock: 180 },
  { name: 'Chicken Wrap', categoryName: 'Meals', price: 6.9, costPrice: 2.8, trackStock: true, availableStock: 70 },
  { name: 'Classic Burger', categoryName: 'Meals', price: 8.5, costPrice: 3.95, trackStock: true, availableStock: 65 },
  { name: 'Loaded Fries', categoryName: 'Sides', price: 4.4, costPrice: 1.5, trackStock: true, availableStock: 90 },
  { name: 'Chocolate Brownie', categoryName: 'Desserts', price: 3.1, costPrice: 1.1, trackStock: true, availableStock: 85 },
  { name: 'San Sebastian Cheesecake', categoryName: 'Desserts', price: 4.85, costPrice: 1.7, trackStock: true, availableStock: 60 },
  { name: 'Club Sandwich', categoryName: 'Meals', price: 7.6, costPrice: 3.2, trackStock: true, availableStock: 72 },
];

const ATTRIBUTE_TEMPLATES = [
  {
    name: 'Size',
    inputType: InputType.SINGLE_SELECT,
    isRequired: true,
    subAttributes: [
      { name: 'Regular', price: 0 },
      { name: 'Large', price: 0.75 },
      { name: 'Family', price: 1.5 },
    ],
  },
  {
    name: 'Extras',
    inputType: InputType.MULTI_SELECT,
    isRequired: false,
    subAttributes: [
      { name: 'Extra Cheese', price: 0.5 },
      { name: 'Extra Shot', price: 0.8 },
      { name: 'Caramel Syrup', price: 0.45 },
      { name: 'Whipped Cream', price: 0.35 },
    ],
  },
];

const DISCOUNT_TEMPLATES = [
  { name: 'Lunch Deal 10%', percentage: 10, adminOnly: false },
  { name: 'VIP Guest 15%', percentage: 15, adminOnly: true },
  { name: 'Happy Hour 5%', percentage: 5, adminOnly: false },
];

const CARD_TYPES = ['Visa', 'Mastercard', 'American Express', 'Mada'];
const OTHER_PAYMENT_METHODS = ['Gift Voucher', 'Bank Transfer', 'Corporate Account'];

const RAW_MATERIAL_TEMPLATES = [
  { name: 'Espresso Beans', unit: 'Kg', quantity: 18, costPerUnit: 12.5, lowStockThreshold: 3 },
  { name: 'Whole Milk', unit: 'L', quantity: 48, costPerUnit: 1.45, lowStockThreshold: 8 },
  { name: 'Burger Buns', unit: 'Units', quantity: 110, costPerUnit: 0.22, lowStockThreshold: 20 },
  { name: 'Beef Patties', unit: 'Units', quantity: 95, costPerUnit: 1.1, lowStockThreshold: 16 },
  { name: 'Chicken Fillet', unit: 'Kg', quantity: 14, costPerUnit: 6.2, lowStockThreshold: 3 },
  { name: 'French Fries', unit: 'Kg', quantity: 26, costPerUnit: 2.1, lowStockThreshold: 4 },
  { name: 'Chocolate Sauce', unit: 'L', quantity: 8, costPerUnit: 4.25, lowStockThreshold: 1.5 },
  { name: 'Takeaway Cups', unit: 'Units', quantity: 240, costPerUnit: 0.08, lowStockThreshold: 40 },
  { name: 'Signature Sauce Base', unit: 'L', quantity: 6, costPerUnit: 3.4, lowStockThreshold: 1 },
  { name: 'Lettuce', unit: 'Kg', quantity: 8, costPerUnit: 2.35, lowStockThreshold: 1.5 },
];

const SUB_RECIPE_TEMPLATES = [
  {
    name: 'Signature Sauce',
    description: 'Demo prep batch for sandwiches and fries.',
    yield: 2.5,
    yieldUnit: 'L',
    ingredients: [
      { rawMaterialName: 'Signature Sauce Base', quantity: 1.4 },
      { rawMaterialName: 'Chocolate Sauce', quantity: 0.15 },
      { rawMaterialName: 'Lettuce', quantity: 0.1 },
    ],
  },
  {
    name: 'Cold Brew Concentrate',
    description: 'Pre-batched beverage base for the demo location.',
    yield: 4,
    yieldUnit: 'L',
    ingredients: [
      { rawMaterialName: 'Espresso Beans', quantity: 0.9 },
      { rawMaterialName: 'Whole Milk', quantity: 0.5 },
    ],
  },
];

const CUSTOM_ROLE_TEMPLATES = [
  {
    name: 'Shift Supervisor',
    baseRole: EmployeeRole.MANAGER,
    permissions: [
      'pos',
      'dashboard',
      'view_orders',
      'view_reports',
      'view_shift_reports',
      'refunds',
      'discounts',
      'manage_open_tickets',
      'open_cash_drawer',
      'reprint_receipts',
      'pay_in_pay_out',
      'manage_customers',
      'view_activity_logs',
    ],
    backofficeAccess: true,
    backofficePermissions: ['dashboard', 'view_orders', 'view_reports', 'manage_employees', 'export_data'],
    posAccess: true,
  },
  {
    name: 'Inventory Lead',
    baseRole: EmployeeRole.USER,
    permissions: ['dashboard', 'manage_inventory', 'view_reports', 'restock_items', 'view_cost'],
    backofficeAccess: true,
    backofficePermissions: ['dashboard', 'view_reports', 'manage_inventory', 'export_data'],
    posAccess: false,
  },
];

const ADMIN_USER_TEMPLATES = [
  { email: 'ops-demo@example.com', firstName: 'Operations', lastName: 'Lead' },
  { email: 'finance-demo@example.com', firstName: 'Finance', lastName: 'Manager' },
];

const ORDER_NOTES = [
  '',
  '',
  '',
  'No onions',
  'Less ice',
  'Extra napkins',
  'Birthday order',
  'Urgent delivery handoff',
  'Customer called ahead',
];

const ACTIVITY_ACTIONS = [
  { action: 'order.completed', module: 'orders', description: 'Closed a customer order successfully.' },
  { action: 'shift.closed', module: 'shifts', description: 'Closed a shift after cash reconciliation.' },
  { action: 'discount.applied', module: 'discounts', description: 'Applied a promotional discount to an order.' },
  { action: 'customer.updated', module: 'customers', description: 'Updated customer loyalty details.' },
  { action: 'inventory.adjusted', module: 'inventory', description: 'Adjusted stock levels for a menu item.' },
  { action: 'payment.method.enabled', module: 'settings', description: 'Enabled a payment method for checkout.' },
  { action: 'employee.reviewed', module: 'staff', description: 'Reviewed shift performance for a staff member.' },
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function setTime(date: Date, hours: number, minutes = 0) {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

class DemoRandom {
  seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed += 0x6d2b79f5;
    let t = this.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(probability: number) {
    return this.next() < probability;
  }

  pick<T>(items: T[]) {
    return items[this.int(0, items.length - 1)];
  }

  sample<T>(items: T[], count: number) {
    const copy = [...items];
    const result: T[] = [];
    while (copy.length > 0 && result.length < count) {
      result.push(copy.splice(this.int(0, copy.length - 1), 1)[0]);
    }
    return result;
  }
}

const passwordCache = new Map<string, string>();

async function getPasswordHash(value: string) {
  if (!passwordCache.has(value)) {
    passwordCache.set(value, await bcrypt.hash(value, SALT_ROUNDS));
  }
  return passwordCache.get(value)!;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16) || 'demo';
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSeedingTargets(establishment: any, index: number, itemCount: number) {
  if (
    index === 0 ||
    establishment.establishmentLoginId === 'demo-pos-01' ||
    itemCount >= 6
  ) {
    return TARGETS;
  }

  return SECONDARY_TARGETS;
}

async function nextOrderNumber(establishmentId: string) {
  const sequence = await prisma.establishmentSequence.upsert({
    where: { establishmentId },
    create: {
      establishmentId,
      lastOrderNumber: 1,
    },
    update: {
      lastOrderNumber: {
        increment: 1,
      },
    },
    select: {
      lastOrderNumber: true,
    },
  });

  return sequence.lastOrderNumber;
}

async function ensureAccount() {
  const passwordHash = await getPasswordHash(ACCOUNT_PASSWORD);
  const existing = await prisma.account.findUnique({
    where: { email: ACCOUNT_EMAIL },
  });

  if (!existing) {
    await prisma.account.create({
      data: {
        email: ACCOUNT_EMAIL,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        emailVerified: true,
      },
    });
  } else {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        emailVerified: true,
      },
    });
  }

  return prisma.account.findUniqueOrThrow({
    where: { email: ACCOUNT_EMAIL },
    include: {
      establishments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

async function ensureAtLeastOneEstablishment(account: any) {
  if (account.establishments.length > 0) {
    return account.establishments;
  }

  await prisma.establishment.create({
    data: {
      accountId: account.id,
      name: 'Demo Restaurant',
      type: EstablishmentType.RESTAURANT,
      country: 'Jordan',
      city: 'Amman',
      address: 'Abdali Boulevard, Amman',
      currency: 'JOD',
      timezone: 'Asia/Amman',
      establishmentLoginId: 'demo-pos-01',
      establishmentPasswordHash: await getPasswordHash(DEFAULT_POS_PASSWORD),
      isActive: true,
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: addDays(new Date(), -90),
      monthlyPrice: 20,
      description: 'Local demo location seeded for realistic operations data.',
    },
  });

  const refreshed = await prisma.account.findUniqueOrThrow({
    where: { id: account.id },
    include: {
      establishments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return refreshed.establishments;
}

async function ensureAppSettings(establishment: any) {
  const existing = await prisma.appSettings.findUnique({
    where: { establishmentId: establishment.id },
  });

  if (!existing) {
    return prisma.appSettings.create({
      data: {
        establishmentId: establishment.id,
        restaurantName: establishment.name,
        restaurantDescription: establishment.description || 'Demo venue with seeded operations data.',
        restaurantAddress: establishment.address || 'Amman',
        currency: establishment.currency || 'JOD',
        taxRate: 0.08,
        openingTime: '08:00',
        closingTime: '23:00',
        farewellMessage: 'Thank you for visiting PayMint Demo.',
        showRestaurantName: true,
        showDescription: true,
        showAddress: true,
        showTaxId: true,
        showFarewellMessage: true,
        taxIdNumber: 'DEMO-TAX-001',
        invoiceStartNumber: 1000,
        holdOrderTableCount: 18,
        loyaltyConfig: {
          enabled: true,
          pointsPerCurrency: 1,
          rewardThreshold: 120,
          rewardValue: 10,
        },
      },
    });
  }

  await prisma.appSettings.update({
    where: { establishmentId: establishment.id },
    data: {
      restaurantName: existing.restaurantName || establishment.name,
      restaurantDescription:
        existing.restaurantDescription ||
        establishment.description ||
        'Demo venue with seeded operations data.',
      restaurantAddress: existing.restaurantAddress || establishment.address || 'Amman',
      currency: existing.currency || establishment.currency || 'JOD',
      openingTime: existing.openingTime || '08:00',
      closingTime: existing.closingTime || '23:00',
      farewellMessage: existing.farewellMessage || 'Thank you for visiting PayMint Demo.',
      taxIdNumber: existing.taxIdNumber || 'DEMO-TAX-001',
      invoiceStartNumber: existing.invoiceStartNumber || 1000,
      loyaltyConfig:
        existing.loyaltyConfig || {
          enabled: true,
          pointsPerCurrency: 1,
          rewardThreshold: 120,
          rewardValue: 10,
        },
    },
  });

  return prisma.appSettings.findUniqueOrThrow({
    where: { establishmentId: establishment.id },
  });
}

async function ensurePaymentSetup(appSettings: any) {
  for (const cardName of CARD_TYPES) {
    await prisma.cardType.upsert({
      where: {
        name_appSettingsId: {
          name: cardName,
          appSettingsId: appSettings.id,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        name: cardName,
        appSettingsId: appSettings.id,
        isActive: true,
      },
    });
  }

  for (const name of OTHER_PAYMENT_METHODS) {
    await prisma.otherPaymentMethod.upsert({
      where: {
        name_appSettingsId: {
          name,
          appSettingsId: appSettings.id,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        name,
        appSettingsId: appSettings.id,
        isActive: true,
      },
    });
  }

  for (const discount of DISCOUNT_TEMPLATES) {
    await prisma.discount.upsert({
      where: {
        name_appSettingsId: {
          name: discount.name,
          appSettingsId: appSettings.id,
        },
      },
      update: {
        percentage: discount.percentage,
        adminOnly: discount.adminOnly,
        isActive: true,
      },
      create: {
        name: discount.name,
        percentage: discount.percentage,
        adminOnly: discount.adminOnly,
        isActive: true,
        appSettingsId: appSettings.id,
      },
    });
  }

  const [cardTypes, paymentMethods, discounts] = await Promise.all([
    prisma.cardType.findMany({ where: { appSettingsId: appSettings.id, isActive: true } }),
    prisma.otherPaymentMethod.findMany({ where: { appSettingsId: appSettings.id, isActive: true } }),
    prisma.discount.findMany({ where: { appSettingsId: appSettings.id, isActive: true } }),
  ]);

  return { cardTypes, paymentMethods, discounts };
}

async function ensureCatalog(establishment: any) {
  const existingItems = await prisma.item.findMany({
    where: {
      establishmentId: establishment.id,
      deletedAt: null,
      type: 'ITEM',
    },
    include: {
      itemSubAttributes: {
        include: {
          subAttribute: {
            include: {
              attribute: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
  });

  if (existingItems.length >= 6) {
    return existingItems;
  }

  const categoryMap = new Map<string, any>();
  for (const categoryTemplate of FALLBACK_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: {
        name_establishmentId: {
          name: categoryTemplate.name,
          establishmentId: establishment.id,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        establishmentId: establishment.id,
        name: categoryTemplate.name,
        icon: categoryTemplate.icon,
        isActive: true,
      },
    });
    categoryMap.set(category.name, category);
  }

  for (const itemTemplate of FALLBACK_ITEMS) {
    const existing = await prisma.item.findFirst({
      where: {
        establishmentId: establishment.id,
        name: itemTemplate.name,
        deletedAt: null,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.item.create({
      data: {
        establishmentId: establishment.id,
        categoryId: categoryMap.get(itemTemplate.categoryName).id,
        name: itemTemplate.name,
        description: `${itemTemplate.name} seeded for demo orders and reports.`,
        price: itemTemplate.price,
        costPrice: itemTemplate.costPrice,
        trackStock: itemTemplate.trackStock,
        availableStock: itemTemplate.availableStock,
        lowStockThresholdYellow: 12,
        lowStockThresholdRed: 6,
        allowNegativeStock: false,
        isAvailable: true,
      },
    });
  }

  return prisma.item.findMany({
    where: {
      establishmentId: establishment.id,
      deletedAt: null,
      type: 'ITEM',
    },
    include: {
      itemSubAttributes: {
        include: {
          subAttribute: {
            include: {
              attribute: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
  });
}

async function ensureAttributes(establishmentId: string, items: any[]) {
  let attributes = await prisma.attribute.findMany({
    where: { establishmentId },
    include: { subAttributes: true },
    orderBy: { name: 'asc' },
  });

  if (attributes.length === 0) {
    for (const template of ATTRIBUTE_TEMPLATES) {
      await prisma.attribute.create({
        data: {
          establishmentId,
          name: template.name,
          inputType: template.inputType,
          isRequired: template.isRequired,
          subAttributes: {
            create: template.subAttributes.map((sub) => ({
              name: sub.name,
              price: sub.price,
              isAvailable: true,
            })),
          },
        },
      });
    }
  }

  attributes = await prisma.attribute.findMany({
    where: { establishmentId },
    include: { subAttributes: true },
    orderBy: { name: 'asc' },
  });

  const attachItems = items.slice(0, Math.min(items.length, 4));
  const sizeAttribute = attributes.find((attribute) => attribute.name === 'Size');
  const extrasAttribute = attributes.find((attribute) => attribute.name === 'Extras');

  for (const item of attachItems) {
    if (sizeAttribute) {
      await prisma.itemAttribute.upsert({
        where: {
          itemId_attributeId: {
            itemId: item.id,
            attributeId: sizeAttribute.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          attributeId: sizeAttribute.id,
        },
      });

      for (const option of sizeAttribute.subAttributes) {
        await prisma.itemSubAttribute.upsert({
          where: {
            itemId_subAttributeId: {
              itemId: item.id,
              subAttributeId: option.id,
            },
          },
          update: {},
          create: {
            itemId: item.id,
            subAttributeId: option.id,
          },
        });
      }
    }

    if (extrasAttribute) {
      await prisma.itemAttribute.upsert({
        where: {
          itemId_attributeId: {
            itemId: item.id,
            attributeId: extrasAttribute.id,
          },
        },
        update: {},
        create: {
          itemId: item.id,
          attributeId: extrasAttribute.id,
        },
      });

      for (const option of extrasAttribute.subAttributes) {
        await prisma.itemSubAttribute.upsert({
          where: {
            itemId_subAttributeId: {
              itemId: item.id,
              subAttributeId: option.id,
            },
          },
          update: {},
          create: {
            itemId: item.id,
            subAttributeId: option.id,
          },
        });
      }
    }
  }

  return prisma.item.findMany({
    where: {
      establishmentId,
      deletedAt: null,
      type: 'ITEM',
    },
    include: {
      itemSubAttributes: {
        include: {
          subAttribute: {
            include: {
              attribute: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
  });
}

async function ensureManufacturing(establishmentId: string, items: any[]) {
  const rawMaterialMap = new Map<string, any>();

  for (const template of RAW_MATERIAL_TEMPLATES) {
    const material = await prisma.rawMaterial.upsert({
      where: {
        name_establishmentId: {
          name: template.name,
          establishmentId,
        },
      },
      update: {},
      create: {
        establishmentId,
        name: template.name,
        unit: template.unit,
        quantity: template.quantity,
        costPerUnit: template.costPerUnit,
        lowStockThreshold: template.lowStockThreshold,
      },
    });
    rawMaterialMap.set(material.name, material);
  }

  const createdSubRecipes: any[] = [];
  for (const template of SUB_RECIPE_TEMPLATES) {
    let recipe = await prisma.subRecipe.findFirst({
      where: {
        establishmentId,
        name: template.name,
      },
      include: {
        ingredients: true,
      },
    });

    if (!recipe) {
      recipe = await prisma.subRecipe.create({
        data: {
          establishmentId,
          name: template.name,
          description: template.description,
          yield: template.yield,
          yieldUnit: template.yieldUnit,
          quantity: round2(template.yield * 2),
          ingredients: {
            create: template.ingredients.map((ingredient) => ({
              rawMaterialId: rawMaterialMap.get(ingredient.rawMaterialName).id,
              quantity: ingredient.quantity,
            })),
          },
        },
        include: {
          ingredients: true,
        },
      });
    }

    createdSubRecipes.push(recipe);
  }

  const selectedItems = items.slice(0, Math.min(items.length, 3));
  for (let index = 0; index < selectedItems.length; index += 1) {
    const item = selectedItems[index];
    const existingRecipe = await prisma.finalRecipe.findUnique({
      where: { itemId: item.id },
    });

    if (existingRecipe) {
      continue;
    }

    const recipeIngredients: any[] = [];
    if (index === 0) {
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Espresso Beans').id,
        quantity: 0.08,
      });
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Whole Milk').id,
        quantity: 0.24,
      });
    } else if (index === 1) {
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Chicken Fillet').id,
        quantity: 0.18,
      });
      recipeIngredients.push({
        subRecipeId: createdSubRecipes[0]?.id,
        quantity: 0.12,
      });
    } else {
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Beef Patties').id,
        quantity: 1,
      });
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Burger Buns').id,
        quantity: 1,
      });
      recipeIngredients.push({
        rawMaterialId: rawMaterialMap.get('Lettuce').id,
        quantity: 0.04,
      });
    }

    await prisma.finalRecipe.create({
      data: {
        establishmentId,
        itemId: item.id,
        ingredients: {
          create: recipeIngredients,
        },
      },
    });
  }
}

async function ensureCustomRoles(establishmentId: string) {
  for (const template of CUSTOM_ROLE_TEMPLATES) {
    const existing = await prisma.customRole.findFirst({
      where: {
        establishmentId,
        name: template.name,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.customRole.create({
      data: {
        establishmentId,
        name: template.name,
        baseRole: template.baseRole,
        permissions: template.permissions,
        backofficeAccess: template.backofficeAccess,
        backofficePermissions: template.backofficePermissions,
        posAccess: template.posAccess,
      },
    });
  }

  return prisma.customRole.findMany({
    where: { establishmentId },
    orderBy: { name: 'asc' },
  });
}

async function ensureAdminUsers(accountId: string, establishments: any[]) {
  for (const template of ADMIN_USER_TEMPLATES) {
    let adminUser = await prisma.adminUser.findFirst({
      where: {
        accountId,
        email: template.email,
      },
    });

    if (!adminUser) {
      adminUser = await prisma.adminUser.create({
        data: {
          accountId,
          email: template.email,
          passwordHash: await getPasswordHash(ACCOUNT_PASSWORD),
          firstName: template.firstName,
          lastName: template.lastName,
          emailVerified: true,
          isActive: true,
        },
      });
    }

    for (const establishment of establishments) {
      await prisma.adminPermission.upsert({
        where: {
          adminUserId_establishmentId: {
            adminUserId: adminUser.id,
            establishmentId: establishment.id,
          },
        },
        update: {
          canManageItems: true,
          canManageEmployees: true,
          canViewReports: true,
          canManageSettings: true,
          canManageBilling: true,
        },
        create: {
          adminUserId: adminUser.id,
          establishmentId: establishment.id,
          canManageItems: true,
          canManageEmployees: true,
          canViewReports: true,
          canManageSettings: true,
          canManageBilling: true,
        },
      });
    }
  }
}

async function ensureBillingHistory(accountId: string, establishmentCount: number) {
  const existingCount = await prisma.billingHistory.count({
    where: { accountId },
  });

  if (existingCount >= TARGETS.billingHistoryEntries) {
    return;
  }

  const missing = TARGETS.billingHistoryEntries - existingCount;
  const now = new Date();
  const baseAmount = round2(Math.max(1, establishmentCount) * 20);

  for (let index = 0; index < missing; index += 1) {
    const periodEnd = startOfDay(addDays(now, -30 * index));
    const periodStart = addDays(periodEnd, -30);
    const createdAt = addDays(periodEnd, -2);

    await prisma.billingHistory.create({
      data: {
        accountId,
        amount: baseAmount,
        currency: 'JOD',
        status: PaymentStatus.PAID,
        description: `PayMint subscription billing cycle ${index + 1}`,
        periodStart,
        periodEnd,
        createdAt,
        paidAt: addMinutes(createdAt, 120),
      },
    });
  }
}

async function ensureEmployees(
  establishment: any,
  customRoles: any[],
  isPrimary: boolean,
) {
  const slug = toSlug(establishment.establishmentLoginId || establishment.name || establishment.id);
  const shiftSupervisorRole = customRoles.find((role) => role.name === 'Shift Supervisor');
  const inventoryLeadRole = customRoles.find((role) => role.name === 'Inventory Lead');

  const templates = [
    {
      username: isPrimary ? 'admin' : `${slug}-admin`,
      password: ACCOUNT_PASSWORD,
      pin: '1234',
      firstName: 'Admin',
      lastName: 'Employee',
      email: isPrimary ? ACCOUNT_EMAIL : `admin+${slug}@example.com`,
      role: EmployeeRole.ADMIN,
      permissions: FULL_POS_PERMISSIONS,
      backofficeAccess: true,
      backofficePermissions: BACKOFFICE_FULL_PERMISSIONS,
      posAccess: true,
    },
    {
      username: isPrimary ? 'cashier' : `${slug}-cashier`,
      password: ACCOUNT_PASSWORD,
      pin: '5678',
      firstName: 'Layla',
      lastName: 'Cashier',
      email: `${slug}.cashier@example.com`,
      role: EmployeeRole.CASHIER,
      permissions: CASHIER_POS_PERMISSIONS,
      backofficeAccess: false,
      backofficePermissions: [],
      posAccess: true,
    },
    {
      username: `${slug}-manager`,
      password: ACCOUNT_PASSWORD,
      pin: '2468',
      firstName: 'Mazen',
      lastName: 'Manager',
      email: `${slug}.manager@example.com`,
      role: EmployeeRole.MANAGER,
      permissions: MANAGER_POS_PERMISSIONS,
      backofficeAccess: true,
      backofficePermissions: BACKOFFICE_MANAGER_PERMISSIONS,
      posAccess: true,
    },
    {
      username: `${slug}-lead`,
      password: ACCOUNT_PASSWORD,
      pin: '1357',
      firstName: 'Ruba',
      lastName: 'Supervisor',
      email: `${slug}.supervisor@example.com`,
      role: EmployeeRole.MANAGER,
      permissions: shiftSupervisorRole?.permissions || MANAGER_POS_PERMISSIONS,
      backofficeAccess: shiftSupervisorRole?.backofficeAccess ?? true,
      backofficePermissions: shiftSupervisorRole?.backofficePermissions || ['dashboard', 'view_orders', 'view_reports'],
      posAccess: shiftSupervisorRole?.posAccess ?? true,
      customRoleId: shiftSupervisorRole?.id,
    },
    {
      username: `${slug}-inventory`,
      password: ACCOUNT_PASSWORD,
      pin: '8080',
      firstName: 'Sami',
      lastName: 'Inventory',
      email: `${slug}.inventory@example.com`,
      role: EmployeeRole.USER,
      permissions: inventoryLeadRole?.permissions || ['manage_inventory', 'view_reports', 'view_cost', 'restock_items'],
      backofficeAccess: inventoryLeadRole?.backofficeAccess ?? true,
      backofficePermissions: inventoryLeadRole?.backofficePermissions || ['dashboard', 'view_reports', 'manage_inventory', 'export_data'],
      posAccess: inventoryLeadRole?.posAccess ?? false,
      customRoleId: inventoryLeadRole?.id,
    },
    {
      username: `${slug}-service`,
      password: ACCOUNT_PASSWORD,
      pin: '2244',
      firstName: 'Dana',
      lastName: 'Service',
      email: `${slug}.service@example.com`,
      role: EmployeeRole.CASHIER,
      permissions: [...CASHIER_POS_PERMISSIONS, 'refunds'],
      backofficeAccess: false,
      backofficePermissions: [],
      posAccess: true,
    },
  ];

  const employees: any[] = [];

  for (const template of templates) {
    let employee = await prisma.employee.findUnique({
      where: { username: template.username },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          username: template.username,
          passwordHash: await getPasswordHash(template.password),
          pinCodeHash: await getPasswordHash(template.pin),
          firstName: template.firstName,
          lastName: template.lastName,
          email: template.email,
          phone: `079${Math.abs(hashString(template.username)).toString().slice(0, 7).padEnd(7, '0')}`,
          isActive: true,
        },
      });
    } else {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          firstName: template.firstName,
          lastName: template.lastName,
          email: employee.email || template.email,
          isActive: true,
        },
      });
    }

    await prisma.employeeAssignment.upsert({
      where: {
        employeeId_establishmentId: {
          employeeId: employee.id,
          establishmentId: establishment.id,
        },
      },
      update: {
        role: template.role,
        permissions: template.permissions,
        customRoleId: template.customRoleId || null,
        backofficeAccess: template.backofficeAccess,
        backofficePermissions: template.backofficePermissions,
        posAccess: template.posAccess,
        isActive: true,
      },
      create: {
        employeeId: employee.id,
        establishmentId: establishment.id,
        role: template.role,
        permissions: template.permissions,
        customRoleId: template.customRoleId || null,
        backofficeAccess: template.backofficeAccess,
        backofficePermissions: template.backofficePermissions,
        posAccess: template.posAccess,
        isActive: true,
      },
    });

    employees.push(employee);
  }

  return prisma.employee.findMany({
    where: {
      assignments: {
        some: {
          establishmentId: establishment.id,
          isActive: true,
        },
      },
    },
    include: {
      assignments: {
        where: {
          establishmentId: establishment.id,
        },
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
}

async function ensureCustomers(
  establishmentId: string,
  customerTarget = TARGETS.customersPerEstablishment,
) {
  const demoPhones: string[] = [];

  for (let index = 0; index < customerTarget; index += 1) {
    const name = CUSTOMER_TEMPLATES[index % CUSTOMER_TEMPLATES.length];
    const phone = `0799${String(index + 1).padStart(5, '0')}`;
    const email = `customer${String(index + 1).padStart(2, '0')}+${establishmentId.slice(-4)}@example.com`;
    demoPhones.push(phone);

    await prisma.customer.upsert({
      where: {
        phone_establishmentId: {
          phone,
          establishmentId,
        },
      },
      update: {
        name,
        email,
      },
      create: {
        establishmentId,
        name,
        phone,
        email,
        tier: index < 2 ? 'VIP' : index < 8 ? 'Gold' : index < 18 ? 'Silver' : 'Bronze',
        points: 0,
        totalVisits: 0,
        totalSpent: 0,
        joinDate: addDays(new Date(), -(index + 14)),
        address: `Customer address ${index + 1}`,
        notes: index % 6 === 0 ? 'Prefers contactless pickup.' : undefined,
      },
    });
  }

  return prisma.customer.findMany({
    where: {
      establishmentId,
      phone: {
        in: demoPhones,
      },
    },
    orderBy: { joinDate: 'asc' },
  });
}

function getOrderOptionsForItem(item: any) {
  const groups = new Map<string, any>();

  for (const link of item.itemSubAttributes || []) {
    const subAttribute = link.subAttribute;
    if (!subAttribute?.attribute) continue;

    const key = subAttribute.attribute.id;
    if (!groups.has(key)) {
      groups.set(key, {
        attributeId: subAttribute.attribute.id,
        inputType: subAttribute.attribute.inputType,
        isRequired: subAttribute.attribute.isRequired,
        options: [],
      });
    }

    groups.get(key).options.push(subAttribute);
  }

  return Array.from(groups.values());
}

function pickChosenAttributes(item: any, random: DemoRandom) {
  const groups = getOrderOptionsForItem(item);
  const selected: any[] = [];
  let extraPrice = 0;

  for (const group of groups) {
    if (group.inputType === 'SINGLE_SELECT') {
      if (group.isRequired || random.chance(0.65)) {
        const choice = random.pick(group.options);
        selected.push(choice);
        extraPrice += toNumber(choice.price);
      }
      continue;
    }

    const optionCount = group.isRequired ? random.int(1, Math.min(2, group.options.length)) : random.int(0, Math.min(2, group.options.length));
    for (const choice of random.sample(group.options, optionCount)) {
      selected.push(choice);
      extraPrice += toNumber(choice.price);
    }
  }

  return {
    selected,
    extraPrice: round2(extraPrice),
  };
}

function buildShiftPlans(
  establishmentId: string,
  employees: any[],
  existingShiftCount: number,
  random: DemoRandom,
  shiftTarget = TARGETS.totalShiftsPerEstablishment,
) {
  const needOpenShift = existingShiftCount === 0;
  const missingCount = Math.max(0, shiftTarget - existingShiftCount);
  const closedTarget = needOpenShift ? Math.max(0, missingCount - 1) : missingCount;

  const posEmployees = employees.filter((employee) => employee.assignments?.[0]?.posAccess !== false);
  const today = startOfDay(new Date());
  const shiftPlans: any[] = [];
  const daysNeeded = Math.max(1, Math.ceil(closedTarget / 2));

  let created = 0;
  for (let dayIndex = daysNeeded; dayIndex >= 1 && created < closedTarget; dayIndex -= 1) {
    const shiftDay = addDays(today, -dayIndex);
    const morningEmployee = posEmployees[created % posEmployees.length];
    const morningStart = setTime(shiftDay, 8, random.int(0, 15));
    const morningEnd = addMinutes(morningStart, 440 + random.int(0, 45));

    shiftPlans.push({
      key: `${establishmentId}-shift-${created + 1}`,
      establishmentId,
      employeeId: morningEmployee.id,
      employeeName: `${morningEmployee.firstName} ${morningEmployee.lastName}`,
      registerId: 'register-main',
      state: ShiftState.CLOSED,
      startTime: morningStart,
      endTime: morningEnd,
      lastSeenAt: morningEnd,
      openingBalance: round2(160 + random.int(10, 40)),
      totalPayIn: round2(random.chance(0.35) ? random.int(5, 25) : 0),
      totalPayOut: round2(random.chance(0.25) ? random.int(4, 18) : 0),
      closeReason: 'MANUAL',
      autoClose: false,
      manualCashOut: false,
      isOpen: false,
    });
    created += 1;

    if (created >= closedTarget) break;

    const eveningEmployee = posEmployees[created % posEmployees.length];
    const eveningStart = setTime(shiftDay, 16, random.int(0, 20));
    const eveningEnd = addMinutes(eveningStart, 390 + random.int(0, 55));
    shiftPlans.push({
      key: `${establishmentId}-shift-${created + 1}`,
      establishmentId,
      employeeId: eveningEmployee.id,
      employeeName: `${eveningEmployee.firstName} ${eveningEmployee.lastName}`,
      registerId: 'register-main',
      state: ShiftState.CLOSED,
      startTime: eveningStart,
      endTime: eveningEnd,
      lastSeenAt: eveningEnd,
      openingBalance: round2(180 + random.int(15, 45)),
      totalPayIn: round2(random.chance(0.3) ? random.int(6, 20) : 0),
      totalPayOut: round2(random.chance(0.28) ? random.int(5, 16) : 0),
      closeReason: 'MANUAL',
      autoClose: false,
      manualCashOut: random.chance(0.15),
      isOpen: false,
    });
    created += 1;
  }

  if (needOpenShift) {
    const currentEmployee = posEmployees[0];
    const openShiftStart = setTime(today, 9, 0);
    shiftPlans.push({
      key: `${establishmentId}-shift-open`,
      establishmentId,
      employeeId: currentEmployee.id,
      employeeName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      registerId: 'register-main',
      state: ShiftState.OPEN,
      startTime: openShiftStart,
      endTime: null,
      lastSeenAt: addMinutes(new Date(), -5),
      openingBalance: 210,
      totalPayIn: 0,
      totalPayOut: 0,
      closeReason: null,
      autoClose: false,
      manualCashOut: false,
      isOpen: true,
    });
  }

  return shiftPlans.sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
}

function buildFallbackOrderWindows(establishmentId: string, employees: any[], random: DemoRandom) {
  const posEmployees = employees.filter((employee) => employee.assignments?.[0]?.posAccess !== false);
  const today = startOfDay(new Date());
  const windows: any[] = [];

  for (let index = 14; index >= 1; index -= 1) {
    const shiftDay = addDays(today, -index);
    windows.push({
      key: `${establishmentId}-fallback-${index}-1`,
      startTime: setTime(shiftDay, 10, 0),
      endTime: setTime(shiftDay, 15, 0),
      employeeId: posEmployees[index % posEmployees.length].id,
      isOpen: false,
    });
    windows.push({
      key: `${establishmentId}-fallback-${index}-2`,
      startTime: setTime(shiftDay, 17, 0),
      endTime: setTime(shiftDay, 22, 0),
      employeeId: posEmployees[(index + 1) % posEmployees.length].id,
      isOpen: false,
    });
  }

  windows.push({
    key: `${establishmentId}-fallback-open`,
    startTime: setTime(today, 9, 15),
    endTime: new Date(),
    employeeId: posEmployees[0].id,
    isOpen: true,
  });

  return windows;
}

function buildOrderPlans(params: {
  establishment: any;
  catalog: any[];
  customers: any[];
  discounts: any[];
  cardTypes: any[];
  paymentMethods: any[];
  employees: any[];
  shiftPlans: any[];
  totalMissingOrders: number;
  random: DemoRandom;
  taxRate: number;
}) {
  const {
    establishment,
    catalog,
    customers,
    discounts,
    cardTypes,
    paymentMethods,
    employees,
    shiftPlans,
    totalMissingOrders,
    random,
    taxRate,
  } = params;

  const refundCount = totalMissingOrders >= 40 ? Math.min(12, Math.floor(totalMissingOrders * 0.08)) : Math.min(4, Math.floor(totalMissingOrders / 8));
  const baseOrderCount = Math.max(0, totalMissingOrders - refundCount);

  const orderPlans: any[] = [];
  const cashSalesByShiftKey = new Map<string, number>();
  const sourceWindows = shiftPlans.length > 0 ? shiftPlans : buildFallbackOrderWindows(establishment.id, employees, random);

  let created = 0;
  let windowIndex = 0;

  while (created < baseOrderCount) {
    const window = sourceWindows[windowIndex % sourceWindows.length];
    windowIndex += 1;

    const isWeekend = [5, 6].includes(window.startTime.getDay());
    const baseCount = window.isOpen
      ? random.int(5, 8)
      : random.int(3, 6) + (isWeekend ? 1 : 0) + (window.startTime.getHours() >= 16 ? 1 : 0);
    const countForWindow = Math.min(baseCount, baseOrderCount - created);

    for (let index = 0; index < countForWindow; index += 1) {
      const windowEnd = window.endTime || new Date();
      const remainingMinutes = Math.max(
        30,
        Math.floor((windowEnd.getTime() - window.startTime.getTime()) / 60_000) - 20,
      );
      const createdAt = addMinutes(window.startTime, 10 + random.int(0, remainingMinutes));
      const isPending = window.isOpen && index >= countForWindow - 2;
      const itemCount = random.int(1, Math.min(4, catalog.length));
      const lineItems = random.sample(catalog, itemCount).map((catalogItem) => {
        const quantity = random.int(1, 3);
        const chosen = pickChosenAttributes(catalogItem, random);
        const basePrice = toNumber(catalogItem.price, 0);
        const linePrice = round2((basePrice + chosen.extraPrice) * quantity);

        return {
          itemId: catalogItem.id,
          name: catalogItem.name,
          basePrice,
          quantity,
          finalPrice: linePrice,
          note: random.chance(0.08) ? 'Prepared for demo order flow.' : null,
          chosenAttributes: chosen.selected.map((option) => ({
            subAttributeId: option.id,
          })),
        };
      });

      const subtotal = round2(lineItems.reduce((sum, line) => sum + line.finalPrice, 0));
      const customer = random.chance(0.72) ? random.pick(customers) : null;
      const discount = subtotal >= 10 && random.chance(0.18) ? random.pick(discounts) : null;
      const discountAmount = discount ? round2((subtotal * toNumber(discount.percentage)) / 100) : 0;
      const taxableSubtotal = round2(Math.max(0, subtotal - discountAmount));
      const tax = round2(taxableSubtotal * taxRate);
      const total = round2(taxableSubtotal + tax);
      const paymentMethod = (() => {
        const roll = random.next();
        if (roll < 0.42) return PaymentMethod.CASH;
        if (roll < 0.68) return PaymentMethod.CARD;
        if (roll < 0.78) return PaymentMethod.APPLE_PAY;
        if (roll < 0.87) return PaymentMethod.TALABAT;
        if (roll < 0.94) return PaymentMethod.CAREEM;
        if (roll < 0.98) return PaymentMethod.ZAIN_CASH;
        return PaymentMethod.OTHER;
      })();

      const amountTendered =
        paymentMethod === PaymentMethod.CASH
          ? round2(total + random.pick([0, 0, 0.5, 1, 2, 5]))
          : total;

      const change = paymentMethod === PaymentMethod.CASH ? round2(amountTendered - total) : 0;
      const pointsEarned = customer ? Math.max(1, Math.floor(total)) : 0;
      const pointsRedeemed = customer && random.chance(0.12) ? random.int(2, 10) : 0;

      orderPlans.push({
        establishmentId: establishment.id,
        shiftKey: window.key,
        employeeId: window.employeeId,
        customerId: customer?.id || null,
        createdAt,
        completedAt: isPending ? null : addMinutes(createdAt, random.int(2, 14)),
        status: isPending ? OrderStatus.PENDING : OrderStatus.COMPLETED,
        subtotal,
        discountAmount,
        discountId: discount?.id || null,
        discountReason: discount ? discount.name : null,
        tax,
        taxRate,
        total,
        paymentMethod,
        amountTendered,
        change,
        note: random.pick(ORDER_NOTES) || null,
        refundReason: null,
        currency: establishment.currency || 'JOD',
        cardType:
          paymentMethod === PaymentMethod.CARD || paymentMethod === PaymentMethod.APPLE_PAY
            ? random.pick(cardTypes)?.name || null
            : null,
        otherPaymentMethod:
          paymentMethod === PaymentMethod.OTHER
            ? random.pick(paymentMethods)?.name || null
            : null,
        splitPayments: null,
        isTaxChanged: false,
        pointsEarned,
        pointsRedeemed,
        items: lineItems,
      });

      if (!isPending && paymentMethod === PaymentMethod.CASH) {
        cashSalesByShiftKey.set(
          window.key,
          round2((cashSalesByShiftKey.get(window.key) || 0) + total),
        );
      }

      created += 1;
    }
  }

  return {
    orderPlans: orderPlans.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()),
    cashSalesByShiftKey,
    refundCount,
  };
}

async function persistShiftPlans(shiftPlans: any[], cashSalesByShiftKey: Map<string, number>) {
  const createdShifts = new Map<string, any>();

  for (const plan of shiftPlans) {
    const expectedBalance = round2(
      plan.openingBalance +
        (cashSalesByShiftKey.get(plan.key) || 0) +
        toNumber(plan.totalPayIn) -
        toNumber(plan.totalPayOut),
    );
    const discrepancyTrigger = Math.abs(hashString(`${plan.key}-discrepancy`)) % 100 < 18;
    const discrepancy = plan.isOpen
      ? 0
      : round2(
          plan.manualCashOut || discrepancyTrigger
            ? [0, -2.5, 1.75, -4.2, 3.1][Math.abs(hashString(plan.key)) % 5]
            : 0,
        );
    const closingBalance = plan.isOpen ? null : round2(expectedBalance + discrepancy);

    const shift = await prisma.shift.create({
      data: {
        establishmentId: plan.establishmentId,
        employeeId: plan.employeeId,
        registerId: plan.registerId,
        state: plan.isOpen ? ShiftState.OPEN : ShiftState.CLOSED,
        startTime: plan.startTime,
        endTime: plan.endTime,
        lastSeenAt: plan.lastSeenAt,
        openingBalance: plan.openingBalance,
        closingBalance,
        totalPayIn: plan.totalPayIn,
        totalPayOut: plan.totalPayOut,
        autoClose: plan.autoClose,
        manualCashOut: plan.manualCashOut,
        closeReason: plan.closeReason,
        createdAt: plan.startTime,
        updatedAt: plan.endTime || new Date(),
      },
    });

    await prisma.cashLog.create({
      data: {
        type: 'CASH_IN',
        amount: plan.openingBalance,
        reason: 'SHIFT_START',
        note: `Started shift with opening balance ${plan.openingBalance.toFixed(2)}`,
        employeeId: plan.employeeId,
        shiftId: shift.id,
        createdAt: plan.startTime,
      },
    });

    if (plan.totalPayIn > 0) {
      await prisma.cashLog.create({
        data: {
          type: 'PAY_IN',
          amount: plan.totalPayIn,
          reason: 'SAFE_DROP_RETURN',
          note: 'Seeded pay-in entry for demo cash movement.',
          employeeId: plan.employeeId,
          shiftId: shift.id,
          createdAt: addMinutes(plan.startTime, 160),
        },
      });
    }

    if (plan.totalPayOut > 0) {
      await prisma.cashLog.create({
        data: {
          type: 'PAY_OUT',
          amount: plan.totalPayOut,
          reason: 'SUPPLIES',
          note: 'Seeded pay-out entry for demo expenses.',
          employeeId: plan.employeeId,
          shiftId: shift.id,
          createdAt: addMinutes(plan.startTime, 250),
        },
      });
    }

    if (!plan.isOpen && plan.endTime) {
      await prisma.cashLog.create({
        data: {
          type: 'CASH_OUT',
          amount: closingBalance,
          expectedAmount: expectedBalance,
          discrepancy: round2(closingBalance - expectedBalance),
          reason: plan.closeReason || 'MANUAL',
          note: `Closed shift at ${closingBalance.toFixed(2)} with expected ${expectedBalance.toFixed(2)}`,
          autoClose: plan.autoClose,
          employeeId: plan.employeeId,
          shiftId: shift.id,
          createdAt: plan.endTime,
        },
      });
    }

    createdShifts.set(plan.key, shift);
  }

  return createdShifts;
}

async function persistOrders(orderPlans: any[]) {
  const createdOrders: any[] = [];

  for (const plan of orderPlans) {
    const order = await prisma.order.create({
      data: {
        establishmentId: plan.establishmentId,
        orderNumber: await nextOrderNumber(plan.establishmentId),
        status: plan.status,
        subtotal: plan.subtotal,
        discountAmount: plan.discountAmount,
        discountId: plan.discountId,
        discountReason: plan.discountReason,
        tax: plan.tax,
        taxRate: plan.taxRate,
        total: plan.total,
        paymentMethod: plan.paymentMethod,
        amountTendered: plan.amountTendered,
        change: plan.change,
        note: plan.note,
        refundReason: plan.refundReason,
        currency: plan.currency,
        cardType: plan.cardType,
        otherPaymentMethod: plan.otherPaymentMethod,
        splitPayments: plan.splitPayments,
        isTaxChanged: plan.isTaxChanged,
        employeeId: plan.employeeId,
        createdAt: plan.createdAt,
        updatedAt: plan.completedAt || plan.createdAt,
        completedAt: plan.completedAt,
        customerId: plan.customerId,
        pointsEarned: plan.pointsEarned,
        pointsRedeemed: plan.pointsRedeemed,
        items: {
          create: plan.items.map((item: any) => ({
            itemId: item.itemId,
            name: item.name,
            basePrice: item.basePrice,
            quantity: item.quantity,
            finalPrice: item.finalPrice,
            note: item.note,
            chosenAttributes: {
              create: item.chosenAttributes,
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            chosenAttributes: true,
          },
        },
      },
    });

    createdOrders.push(order);
  }

  return createdOrders;
}

async function createRefunds(createdOrders: any[], employees: any[], refundCount: number) {
  const eligibleOrders = createdOrders.filter(
    (order) =>
      order.status === OrderStatus.COMPLETED &&
      order.paymentMethod !== PaymentMethod.CASH &&
      order.items?.length > 0 &&
      order.createdAt.getTime() < addDays(new Date(), -2).getTime(),
  );

  const refundEmployees = employees.filter((employee) =>
    [EmployeeRole.ADMIN, EmployeeRole.MANAGER].includes(employee.assignments?.[0]?.role),
  );

  let created = 0;
  for (const originalOrder of eligibleOrders) {
    if (created >= refundCount) {
      break;
    }

    const refundedBy = refundEmployees[created % refundEmployees.length];
    const refundedAt = addMinutes(originalOrder.createdAt, 180 + created * 25);

    await prisma.order.create({
      data: {
        establishmentId: originalOrder.establishmentId,
        orderNumber: await nextOrderNumber(originalOrder.establishmentId),
        status: OrderStatus.REFUNDED,
        subtotal: round2(-toNumber(originalOrder.subtotal)),
        discountAmount: round2(-toNumber(originalOrder.discountAmount)),
        tax: round2(-toNumber(originalOrder.tax)),
        taxRate: toNumber(originalOrder.taxRate, 0.08),
        total: round2(-toNumber(originalOrder.total)),
        paymentMethod: originalOrder.paymentMethod,
        amountTendered: null,
        change: 0,
        note: originalOrder.note,
        refundReason: 'Demo refund generated for report coverage.',
        currency: originalOrder.currency,
        cardType: originalOrder.cardType,
        otherPaymentMethod: originalOrder.otherPaymentMethod,
        splitPayments: null,
        isTaxChanged: originalOrder.isTaxChanged,
        employeeId: refundedBy.id,
        refundedById: refundedBy.id,
        refundedAt,
        originalOrderId: originalOrder.id,
        createdAt: refundedAt,
        updatedAt: refundedAt,
        customerId: originalOrder.customerId,
        pointsEarned: 0,
        pointsRedeemed: 0,
        items: {
          create: originalOrder.items.map((item: any) => ({
            itemId: item.itemId,
            name: item.name,
            basePrice: round2(-toNumber(item.basePrice)),
            quantity: item.quantity,
            finalPrice: round2(-toNumber(item.finalPrice)),
            note: item.note,
            chosenAttributes: {
              create: item.chosenAttributes.map((chosen: any) => ({
                subAttributeId: chosen.subAttributeId,
              })),
            },
          })),
        },
      },
    });

    await prisma.order.update({
      where: { id: originalOrder.id },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt,
        refundedById: refundedBy.id,
        refundReason: 'Demo refund generated for report coverage.',
      },
    });

    created += 1;
  }
}

async function ensureHeldOrders(
  establishmentId: string,
  employees: any[],
  catalog: any[],
  existingCount: number,
  random: DemoRandom,
  heldOrderTarget = TARGETS.heldOrdersPerEstablishment,
) {
  const missing = Math.max(0, heldOrderTarget - existingCount);
  if (missing === 0) {
    return;
  }

  const nicknames = ['Table 4', 'Patio 2', 'Delivery Hold', 'Family Combo'];
  const posEmployees = employees.filter((employee) => employee.assignments?.[0]?.posAccess !== false);

  for (let index = 0; index < missing; index += 1) {
    const item = random.pick(catalog);
    const quantity = random.int(1, 3);
    const subtotal = round2(toNumber(item.price) * quantity);
    const tax = round2(subtotal * 0.08);
    const total = round2(subtotal + tax);

    await prisma.heldOrder.create({
      data: {
        establishmentId,
        nickname: nicknames[index % nicknames.length],
        orderData: {
          subtotal,
          tax,
          total,
          paymentMethod: 'CASH',
          items: [
            {
              itemId: item.id,
              name: item.name,
              quantity,
              price: toNumber(item.price),
            },
          ],
        },
        pinnedAt: addMinutes(new Date(), -(index + 1) * 18),
        heldById: posEmployees[index % posEmployees.length].id,
      },
    });
  }
}

async function ensureActivityLogs(
  establishmentId: string,
  employees: any[],
  existingCount: number,
  random: DemoRandom,
  activityTarget = TARGETS.activityLogsPerEstablishment,
) {
  const missing = Math.max(0, activityTarget - existingCount);
  if (missing === 0) {
    return;
  }

  const actors = employees.filter((employee) => employee.assignments?.length > 0);
  const startDate = addDays(new Date(), -14);

  for (let index = 0; index < missing; index += 1) {
    const template = ACTIVITY_ACTIONS[index % ACTIVITY_ACTIONS.length];
    const actor = actors[index % actors.length];
    const timestamp = addMinutes(startDate, random.int(0, 14 * 24 * 60));

    await prisma.activityLog.create({
      data: {
        establishmentId,
        action: template.action,
        module: template.module,
        description: template.description,
        employeeId: actor.id,
        ipAddress: `192.168.0.${10 + (index % 25)}`,
        timestamp,
      },
    });
  }
}

async function refreshCustomerStats(establishmentId: string, customers: any[]) {
  const createdCustomerIds = customers.map((customer) => customer.id);
  const orders = await prisma.order.findMany({
    where: {
      establishmentId,
      customerId: {
        in: createdCustomerIds,
      },
      status: OrderStatus.COMPLETED,
    },
    select: {
      customerId: true,
      total: true,
      pointsEarned: true,
    },
  });

  const aggregate = new Map<string, { totalSpent: number; totalVisits: number; points: number }>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const current = aggregate.get(order.customerId) || { totalSpent: 0, totalVisits: 0, points: 0 };
    current.totalSpent = round2(current.totalSpent + toNumber(order.total));
    current.totalVisits += 1;
    current.points += toNumber(order.pointsEarned);
    aggregate.set(order.customerId, current);
  }

  for (const customer of customers) {
    const metrics = aggregate.get(customer.id) || {
      totalSpent: 0,
      totalVisits: 0,
      points: 0,
    };
    const tier =
      metrics.totalSpent >= 250 ? 'VIP' : metrics.totalSpent >= 140 ? 'Gold' : metrics.totalSpent >= 70 ? 'Silver' : 'Bronze';

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: metrics.totalSpent,
        totalVisits: metrics.totalVisits,
        points: metrics.points,
        tier,
      },
    });
  }
}

async function seedEstablishmentData(establishment: any, index: number, totalEstablishments: number) {
  const random = new DemoRandom(hashString(`${establishment.id}-${establishment.establishmentLoginId || establishment.name}`));

  const appSettings = await ensureAppSettings(establishment);
  const paymentSetup = await ensurePaymentSetup(appSettings);
  let catalog = await ensureCatalog(establishment);
  catalog = await ensureAttributes(establishment.id, catalog);
  const seedTargets = getSeedingTargets(establishment, index, catalog.length);
  await ensureManufacturing(establishment.id, catalog);
  const customRoles = await ensureCustomRoles(establishment.id);
  const employees = await ensureEmployees(establishment, customRoles, index === 0);
  const customers = await ensureCustomers(
    establishment.id,
    seedTargets.customersPerEstablishment,
  );

  const [existingOrderCount, existingShiftCount, existingHeldCount, existingActivityCount] = await Promise.all([
    prisma.order.count({ where: { establishmentId: establishment.id } }),
    prisma.shift.count({ where: { establishmentId: establishment.id } }),
    prisma.heldOrder.count({ where: { establishmentId: establishment.id } }),
    prisma.activityLog.count({ where: { establishmentId: establishment.id } }),
  ]);

  const shiftPlans = buildShiftPlans(
    establishment.id,
    employees,
    existingShiftCount,
    random,
    seedTargets.totalShiftsPerEstablishment,
  );
  const totalMissingOrders = Math.max(
    0,
    seedTargets.totalOrdersPerEstablishment - existingOrderCount,
  );

  if (totalMissingOrders > 0) {
    const { orderPlans, cashSalesByShiftKey, refundCount } = buildOrderPlans({
      establishment,
      catalog,
      customers,
      discounts: paymentSetup.discounts,
      cardTypes: paymentSetup.cardTypes,
      paymentMethods: paymentSetup.paymentMethods,
      employees,
      shiftPlans,
      totalMissingOrders,
      random,
      taxRate: toNumber(appSettings.taxRate, 0.08),
    });

    if (shiftPlans.length > 0) {
      await persistShiftPlans(shiftPlans, cashSalesByShiftKey);
    }
    const createdOrders = await persistOrders(orderPlans);
    await createRefunds(createdOrders, employees, refundCount);
  } else if (shiftPlans.length > 0) {
    await persistShiftPlans(shiftPlans, new Map());
  }

  await ensureHeldOrders(
    establishment.id,
    employees,
    catalog,
    existingHeldCount,
    random,
    seedTargets.heldOrdersPerEstablishment,
  );
  await ensureActivityLogs(
    establishment.id,
    employees,
    existingActivityCount,
    random,
    seedTargets.activityLogsPerEstablishment,
  );
  await refreshCustomerStats(establishment.id, customers);

  const updatedEstablishment = await prisma.establishment.findUniqueOrThrow({
    where: { id: establishment.id },
    include: {
      _count: {
        select: {
          orders: true,
          customers: true,
          employees: true,
          shifts: true,
          items: true,
        },
      },
    },
  });

  console.log(
    `Seeded establishment ${index + 1}/${totalEstablishments}: ${updatedEstablishment.name} | ` +
      `items=${updatedEstablishment._count.items}, customers=${updatedEstablishment._count.customers}, ` +
      `employees=${updatedEstablishment._count.employees}, shifts=${updatedEstablishment._count.shifts}, orders=${updatedEstablishment._count.orders}`,
  );
}

async function main() {
  console.log('Seeding rich demo dataset...');

  const account = await ensureAccount();
  const establishments = await ensureAtLeastOneEstablishment(account);

  await ensureAdminUsers(account.id, establishments);
  await ensureBillingHistory(account.id, establishments.length);

  for (let index = 0; index < establishments.length; index += 1) {
    await seedEstablishmentData(establishments[index], index, establishments.length);
  }

  console.log('');
  console.log('=============================================');
  console.log('DEMO DATA SEEDED SUCCESSFULLY');
  console.log('=============================================');
  console.log(`Backoffice account: ${ACCOUNT_EMAIL}`);
  console.log(`Suggested password: ${ACCOUNT_PASSWORD}`);
  console.log('Primary POS login defaults (created if missing):');
  console.log('  Username: admin');
  console.log('  Password: password123');
  console.log('  PIN: 1234');
  console.log('  Username: cashier');
  console.log('  Password: password123');
  console.log('  PIN: 5678');
  console.log('=============================================');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
