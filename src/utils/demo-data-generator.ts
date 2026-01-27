import api from '../config/api';
import { DEMO_DATA } from './demo-data';

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random subset
const randomSubset = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
// Helper for random number
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper for weighted random hour to simulate peak times (Lunch: 12-14, Dinner: 18-20)
const getWeightedRandomHour = () => {
  const hours = [
    8, 9, 10,       // Morning (Low)
    11, 12, 12, 13, 13, 14, 14, 15, // Lunch Peak
    16, 17,         // Afternoon (Low)
    18, 18, 19, 19, 20, 20, 21,     // Dinner Peak
    22, 23          // Late (Low)
  ];
  return hours[Math.floor(Math.random() * hours.length)];
};

// Helper to get weighted random payment method
const getWeightedPaymentMethod = () => {
  const methods = DEMO_DATA.paymentMethods || [
    { name: 'Cash', weight: 35 },
    { name: 'Card', weight: 40 },
    { name: 'Apple Pay', weight: 15 },
    { name: 'Google Pay', weight: 10 }
  ];
  const totalWeight = methods.reduce((sum, m) => sum + m.weight, 0);
  let random = Math.random() * totalWeight;
  for (const method of methods) {
    random -= method.weight;
    if (random <= 0) return method.name;
  }
  return methods[0].name;
};

export class DemoDataGenerator {
  private establishmentId: string;
  private currentUserId?: string;
  private logFn: (message: string) => void;
  private progressFn: (progress: number) => void;

  constructor(
    establishmentId: string,
    currentUserId?: string,
    logFn: (message: string) => void = console.log,
    progressFn: (progress: number) => void = () => {}
  ) {
    this.establishmentId = establishmentId;
    this.currentUserId = currentUserId;
    this.logFn = logFn;
    this.progressFn = progressFn;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async findOrCreateCategory(name: string, icon: string) {
    try {
      const res = await api.get('/api/categories');
      const categories = res.data || [];
      const existing = categories.find((c: any) => c.name === name);
      if (existing) return existing;

      const createRes = await api.post('/api/categories', {
        name,
        icon,
        sortOrder: 0
      });
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateCategory: ${errorMsg}`);
      throw e;
    }
  }

  private async findOrCreateProduct(prod: any, categoryId: string, attributeIds: string[]) {
    try {
      const res = await api.get('/api/items');
      const items = res.data || [];
      const existing = items.find((i: any) => i.name === prod.name);
      if (existing) return existing;

      const formData = new FormData();
      formData.append('name', prod.name);
      formData.append('price', prod.price.toString());
      formData.append('costPrice', prod.cost.toString());
      formData.append('categoryId', categoryId);
      formData.append('isAvailable', 'true');
      formData.append('trackStock', 'true');
      formData.append('availableStock', '100');
      formData.append('type', 'ITEM');

      if (attributeIds.length > 0) {
        formData.append('attributeIds', JSON.stringify(attributeIds));
      }

      const createRes = await api.post('/api/items', formData);
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateProduct: ${errorMsg}`);
      throw e;
    }
  }

  private async findOrCreateCustomRole(role: any) {
    try {
      const res = await api.get(`/api/custom-roles/${this.establishmentId}`);
      const roles = res.data || [];
      const existing = roles.find((r: any) => r.name === role.name);
      if (existing) return existing;

      const createRes = await api.post(`/api/custom-roles/${this.establishmentId}`, {
        name: role.name,
        baseRole: role.baseRole || 'USER',
        allowedDiscounts: role.allowedDiscounts || [],
        posAccess: role.posAccess,
        backofficeAccess: role.backofficeAccess,
        permissions: role.permissions,
        backofficePermissions: role.backofficePermissions
      });
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateCustomRole: ${errorMsg}`);
      throw e;
    }
  }

  private async findOrCreateStaff(emp: any, customRoleId?: string) {
    try {
      const res = await api.get('/api/users');
      const users = res.data || [];
      const existing = users.find((u: any) => u.firstName === emp.firstName && u.lastName === emp.lastName);
      if (existing) {
        // Update custom role if provided and different
        if (customRoleId && existing.customRoleId !== customRoleId) {
           await api.patch(`/api/users/${existing.id}`, { customRoleId });
        }
        return existing;
      }

      const validRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'USER'];
      const normalizedRole = (emp.role || 'USER').toUpperCase();
      const role = validRoles.includes(normalizedRole) ? normalizedRole : 'USER';

      const username = `${emp.firstName.toLowerCase()}${randomInt(1, 999)}`;
      const createRes = await api.post('/api/users', {
        firstName: emp.firstName,
        lastName: emp.lastName,
        username: username,
        password: 'password123',
        pinCode: randomInt(1000, 9999).toString(),
        role: role,
        customRoleId: customRoleId,
        posAccess: true,
        backofficeAccess: role === 'MANAGER' || role === 'ADMIN' || !!customRoleId,
        permissions: [],
        allowedDiscounts: [],
        establishmentIds: [this.establishmentId]
      });
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateStaff: ${errorMsg}`);
      throw e;
    }
  }

  private async findOrCreateCustomer(cust: any) {
    try {
      const res = await api.get('/customers', { params: { limit: 1000 } });
      const customers = res.data.customers || [];
      const existing = customers.find((c: any) => c.email === cust.email || c.phone === cust.phone);
      if (existing) return existing;

      const createRes = await api.post('/customers', {
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        notes: `Demo customer - ${cust.tier || 'New'} tier`,
        tier: cust.tier || 'New',
        points: cust.spent ? Math.floor(cust.spent) : 0
      });
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateCustomer: ${errorMsg}`);
      throw e;
    }
  }

  private async findOrCreateDiscount(d: any) {
    try {
      const res = await api.get('/app-settings/discounts');
      const discounts = res.data || [];
      const existing = discounts.find((disc: any) => disc.name === d.name);
      if (existing) return existing;

      const createRes = await api.post('/app-settings/discounts', d);
      return createRes.data;
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
      this.logFn(`Error in findOrCreateDiscount: ${errorMsg}`);
      throw e;
    }
  }

  async clearAll() {
    try {
      this.progressFn(5);
      this.logFn('Starting data purge...');

      // 1. Clear Orders (Must be first as they depend on everything)
      this.logFn('Clearing orders...');
      await this.clearOrders();
      this.progressFn(15);

      // 2. Clear Shifts
      this.logFn('Clearing shifts...');
      await this.clearShifts();
      this.progressFn(25);

      // 3. Clear Manufacturing (Recipes & Materials)
      this.logFn('Clearing manufacturing data...');
      await this.clearManufacturing();
      this.progressFn(35);

      // 4. Clear Products
      this.logFn('Clearing products...');
      await this.clearProducts();
      this.progressFn(45);

      // 5. Clear Attributes (Add-ons)
      this.logFn('Clearing modifiers...');
      await this.clearAttributes();
      this.progressFn(55);

      // 6. Clear Categories
      this.logFn('Clearing categories...');
      await this.clearCategories();
      this.progressFn(65);

      // 7. Clear Customers
      this.logFn('Clearing customers...');
      await this.clearCustomers();
      this.progressFn(75);

      // 8. Clear Staff
      this.logFn('Clearing staff...');
      await this.clearStaff();
      this.progressFn(85);

      // 9. Clear Custom Roles
      this.logFn('Clearing custom roles...');
      await this.clearCustomRoles();
      this.progressFn(90);

      // 10. Clear Discounts
      this.logFn('Clearing discounts...');
      await this.clearDiscounts();
      this.progressFn(95);

      this.logFn('Data purge complete.');
      return true;
    } catch (error) {
      console.error('Data purge failed:', error);
      this.logFn(`Purge Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async clearOrders() {
    try {
      const res = await api.get('/api/orders', { params: { limit: 1000 } });
      const orders = res.data.data || res.data || [];
      for (const order of orders) {
        await api.delete(`/api/orders/${order.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear orders (or no orders found)');
    }
  }

  async clearShifts() {
    try {
      // Use the reports endpoint to find all shifts, with a wide date range
      const res = await api.get('/reports/shifts', {
        params: {
          limit: 1000,
          startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        }
      });
      const shifts = res.data.data || res.data || [];
      for (const shift of shifts) {
        try {
          await api.delete(`/api/shifts/${shift.id}`);
        } catch (e) {
          // Ignore individual deletion errors (might be already deleted or not allowed)
        }
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear shifts');
    }
  }

  async clearCustomRoles() {
    try {
      const res = await api.get(`/api/custom-roles/${this.establishmentId}`);
      const roles = res.data || [];
      for (const role of roles) {
        await api.delete(`/api/custom-roles/${this.establishmentId}/${role.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear custom roles');
    }
  }

  async clearManufacturing() {
    try {
      // Delete Final Recipes
      const finalRes = await api.get('/api/manufacturing/final-recipes');
      const finalRecipes = finalRes.data || [];
      for (const r of finalRecipes) {
        await api.delete(`/api/manufacturing/final-recipes/${r.id}`);
      }

      // Delete Sub Recipes
      const subRes = await api.get('/api/manufacturing/sub-recipes');
      const subRecipes = subRes.data || [];
      for (const r of subRecipes) {
        await api.delete(`/api/manufacturing/sub-recipes/${r.id}`);
      }

      // Delete Raw Materials
      const matRes = await api.get('/api/manufacturing/raw-materials');
      const materials = matRes.data || [];
      for (const m of materials) {
        await api.delete(`/api/manufacturing/raw-materials/${m.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear some manufacturing data');
    }
  }

  async clearProducts() {
    try {
      const res = await api.get('/api/items');
      const items = res.data || [];
      for (const item of items) {
        await api.delete(`/api/items/${item.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear products');
    }
  }

  async clearAttributes() {
    try {
      const res = await api.get('/api/attributes');
      const attributes = res.data || [];
      for (const attr of attributes) {
        await api.delete(`/api/attributes/${attr.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear modifiers');
    }
  }

  async clearCategories() {
    try {
      const res = await api.get('/api/categories');
      const categories = res.data || [];
      for (const cat of categories) {
        await api.delete(`/api/categories/${cat.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear categories');
    }
  }

  async clearCustomers() {
    try {
      const res = await api.get('/customers', { params: { limit: 1000 } });
      const customers = res.data.customers || [];
      for (const c of customers) {
        await api.delete(`/customers/${c.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear customers');
    }
  }

  async clearStaff() {
    try {
      const res = await api.get('/api/users');
      const users = res.data || [];
      for (const user of users) {
        // Skip deleting the current user
        if (this.currentUserId && user.id === this.currentUserId) continue;
        // Skip deleting the account owner if identified differently (usually handled by currentUserId check)

        await api.delete(`/api/users/${user.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear staff');
    }
  }

  async clearDiscounts() {
    try {
      const res = await api.get('/app-settings/discounts');
      const discounts = res.data || [];
      for (const d of discounts) {
        await api.delete(`/app-settings/discounts/${d.id}`);
      }
    } catch (e) {
      this.logFn('Warning: Failed to clear discounts');
    }
  }

  async generateAll(type: 'cafe' | 'restaurant' | 'retail' = 'cafe') {
    try {
      this.progressFn(10);
      this.logFn(`Starting demo data generation for ${type}...`);

      // 1. Categories
      this.logFn('Creating categories...');
      const categories = await this.generateCategories(type);
      this.progressFn(20);

      // 2. Attributes (Modifiers)
      this.logFn('Creating modifiers...');
      const attributes = await this.generateAttributes(type);
      this.progressFn(30);

      // 3. Products
      this.logFn('Creating products...');
      const products = await this.generateProducts(categories, type, attributes);
      this.progressFn(40);

      // 3. Raw Materials (Inventory)
      this.logFn('Stocking inventory...');
      const materials = await this.generateRawMaterials(type);
      this.progressFn(50);

      // 4. Recipes
      if (materials.length > 0) {
        this.logFn('Linking recipes...');
        await this.generateRecipes(type, products, materials);
      }
      this.progressFn(60);

      // 5. Custom Roles
      this.logFn('Creating custom roles...');
      const customRoles = await this.generateCustomRoles();
      this.progressFn(70);

      // 6. Staff
      this.logFn('Creating staff...');
      await this.generateStaff(customRoles);
      this.progressFn(75);

      // 7. Customers
      this.logFn('Creating customers...');
      const customers = await this.generateCustomers();
      this.progressFn(80);

      // 8. Discounts
      this.logFn('Creating discounts...');
      await this.generateDiscounts();
      this.progressFn(85);

      // 9. Simulate Live Shift Cycle (Shift -> Cash Logs -> Orders -> Close -> New Shift)
      this.logFn('Simulating shift...');
      await this.simulateShiftCycle(products, customers, attributes);
      this.progressFn(95);

      // 10. Held Orders
      this.logFn('Creating held orders...');
      await this.generateHeldOrders(products, customers);
      this.progressFn(100);

      this.logFn('Demo data generation complete!');
      return true;
    } catch (error) {
      console.error('Demo data generation failed:', error);
      this.logFn(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async simulateShiftCycle(products: any[], customers: any[], attributes: any[]) {
    try {
      // 1. Ensure any existing shift is closed
      try {
        const activeShiftRes = await api.get('/api/shifts/active');
        if (activeShiftRes.data) {
           await api.post('/api/shifts/end', {
             closingBalance: activeShiftRes.data.cashExpected || 100, // Changed from cashActual to closingBalance
             closeReason: 'Auto-closed by demo generator' // Changed from closingNote to closeReason
           });
        }
      } catch (e) {
        // Ignore if no active shift
      }

      // 2. Start a new shift (The "Past" Shift to be closed)
      this.logFn('Starting a shift to generate history...');
      await api.post('/api/shifts/start', { openingBalance: 100 });

      // 3. Create some Cash Logs (Pay In / Pay Out)
      this.logFn('Processing cash transactions...');
      await api.post('/api/cash-log/pay-in', { amount: 50, description: 'Added float' });
      await api.post('/api/cash-log/pay-out', { amount: 20, description: 'Vendor payment (Ice)' });

      // 4. Generate Orders for this shift (Simulate "Selling")
      this.logFn('Processing sales...');
      const orderCount = 15;
      let shiftRevenue = 0;
      let taxCollected = 0;

      for (let i = 0; i < orderCount; i++) {
        const orderData = await this.createRandomOrderPayload(products, customers, attributes);
        await api.post('/api/orders', orderData);
        shiftRevenue += orderData.subtotal;
        taxCollected += orderData.tax;
        await this.delay(100);
      }

      // 5. Close the shift with a discrepancy (Over/Short)
      this.logFn('Closing shift with cash discrepancy...');
      const freshShiftRes = await api.get('/api/shifts/active');
      const expected = freshShiftRes.data.cashExpected || (100 + 50 - 20 + shiftRevenue); // Fallback calc

      // Create a random discrepancy (-5 to +5)
      const discrepancy = Math.floor(Math.random() * 10) - 5;
      const actual = expected + (discrepancy === 0 ? 5 : discrepancy); // Ensure some discrepancy

      await api.post('/api/shifts/end', {
        closingBalance: actual, // Changed from cashActual to closingBalance
        closeReason: 'Demo Shift - Closed with variance' // Changed from closingNote to closeReason
      });

      // 6. Start a FRESH active shift for the user to use immediately
      this.logFn('Starting new active shift for you...');
      await api.post('/api/shifts/start', { openingBalance: 150 });

    } catch (e: any) {
       this.logFn(`Shift simulation warning: ${e.message}`);
    }
  }

  async generateHeldOrders(products: any[], customers: any[]) {
    try {
      const heldCount = 3;
      for (let i = 0; i < heldCount; i++) {
        const selectedProducts = randomSubset(products, randomInt(1, 3));
        const customer = random(customers);
        const nickname = customer ? `${customer.name}` : `Table ${randomInt(1, 10)}`;

        let subtotal = 0;
        const items = selectedProducts.map(p => {
          const qty = 1;
          const finalPrice = p.price * qty;
          subtotal += finalPrice;

          return {
            itemId: p.id,
            name: p.name,
            basePrice: p.price,
            quantity: qty,
            finalPrice: finalPrice,
            note: '',
            chosenAttributes: []
          };
        });

        const taxRate = 0.16;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        await api.post('/api/held-orders', {
          nickname: nickname,
          orderData: {
            items,
            subtotal,
            tax,
            total,
            paymentMethod: null,
            amountTendered: 0,
            note: 'Demo held order',
            discount: null,
            taxes: []
          }
        });
      }
    } catch (e) {
      this.logFn('Warning: Failed to create held orders');
      console.error(e);
    }
  }

  // Helper to construct order payload
  private async createRandomOrderPayload(products: any[], customers: any[], attributes: any[]) {
    const selectedProducts = randomSubset(products, randomInt(1, 4));
    const customer = Math.random() > 0.3 ? random(customers) : null;
    let taxRate = 0.16;

    let subtotal = 0;
    const items = selectedProducts.map(p => {
      const qty = randomInt(1, 2);
      let price = p.price;
      const modifiers: any[] = [];

      if (attributes.length > 0 && Math.random() > 0.6) {
         const attr = random(attributes) as any;
         if (attr.subAttributes && attr.subAttributes.length > 0) {
           const subAttr = random(attr.subAttributes) as any;
           price += subAttr.price;
           modifiers.push({
             attributeId: attr.id,
             attributeName: attr.name,
             subAttributeId: subAttr.id,
             subAttributeName: subAttr.name,
             price: subAttr.price
           });
         }
      }

      const total = price * qty;
      subtotal += total;

      return {
        itemId: p.id,
        name: p.name,
        quantity: qty,
        basePrice: p.price,
        finalPrice: total,
        modifiers: modifiers
      };
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      items,
      subtotal,
      tax,
      total,
      discount: { amount: 0 },
      paymentMethod: getWeightedPaymentMethod(),
      paymentStatus: 'Completed',
      status: 'Completed',
      customerId: customer?.id,
    };
  }

  async generateCategories(type: 'cafe' | 'restaurant' | 'retail') {
    const data = DEMO_DATA[type].categories;
    const createdCategories = [];

    for (const cat of data) {
      try {
        const category = await this.findOrCreateCategory(cat.name, cat.icon);
        createdCategories.push(category);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create category ${cat.name}: ${errorMsg}`);
      }
    }
    return createdCategories;
  }

  async generateAttributes(type: 'cafe' | 'restaurant' | 'retail') {
    const data = (DEMO_DATA[type] as any).attributes || [];
    const createdAttributes = [];

    for (const attr of data) {
      try {
        const res = await api.post('/api/attributes', {
          name: attr.name,
          inputType: attr.inputType,
          isRequired: attr.isRequired
        });
        const newAttr = res.data;

        // Create sub-attributes (options)
        for (const opt of attr.options) {
          await api.post(`/api/attributes/${newAttr.id}/sub-attributes`, {
            name: opt.name,
            price: opt.price,
            isAvailable: true
          });
          await this.delay(200);
        }

        createdAttributes.push(newAttr);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create modifier ${attr.name}: ${errorMsg}`);
      }
    }
    return createdAttributes;
  }

  async generateProducts(categories: any[], type: 'cafe' | 'restaurant' | 'retail', attributes: any[] = []) {
    const data = DEMO_DATA[type].products;
    const createdProducts = [];

    for (const prod of data) {
      try {
        const category = categories.find(c => c.name === prod.category);
        if (!category) continue;

        const attributeIds = attributes.length > 0 ? attributes.map(a => a.id) : [];
        const product = await this.findOrCreateProduct(prod, category.id, attributeIds);

        createdProducts.push(product);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create product ${prod.name}: ${errorMsg}`);
      }
    }
    return createdProducts;
  }

  async generateRawMaterials(type: 'cafe' | 'restaurant' | 'retail') {
    const data = DEMO_DATA[type].rawMaterials;
    const createdMaterials = [];

    for (const mat of data) {
      try {
        const res = await api.post('/api/manufacturing/raw-materials', {
          name: mat.name,
          unit: mat.unit,
          quantity: mat.stock,
          costPerUnit: mat.cost,
          lowStockThreshold: Math.floor(mat.stock * 0.2)
        });
        createdMaterials.push(res.data);
        await this.delay(300);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create material ${mat.name}: ${errorMsg}`);
      }
    }
    return createdMaterials;
  }

  async generateRecipes(type: 'cafe' | 'restaurant' | 'retail', products: any[], materials: any[]) {
    const data = DEMO_DATA[type].recipes;

    for (const recipe of data) {
      try {
        const product = products.find(p => p.name === recipe.productName);
        if (!product) continue;

        const ingredients = recipe.ingredients.map(ing => {
          const material = materials.find(m => m.name === ing.material);
          if (!material) return null;
          return {
            rawMaterialId: material.id,
            quantity: ing.qty,
            type: 'raw',
            selectedUnit: ing.unit
          };
        }).filter(Boolean);

        if (ingredients.length === 0) continue;

        await api.post('/api/manufacturing/final-recipes', {
          itemId: product.id,
          ingredients
        });
        await this.delay(300);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create recipe for ${recipe.productName}: ${errorMsg}`);
      }
    }
  }

  async generateCustomRoles() {
    const data = DEMO_DATA.customRoles;
    const createdRoles = [];

    for (const role of data) {
      try {
        const createdRole = await this.findOrCreateCustomRole(role);
        createdRoles.push(createdRole);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create custom role ${role.name}: ${errorMsg}`);
      }
    }
    return createdRoles;
  }

  async generateStaff(customRoles: any[] = []) {
    const data = DEMO_DATA.staff;
    const createdStaff = [];

    for (const emp of data) {
      try {
        const customRole = customRoles.find(r => r.name === emp.customRole);
        const staff = await this.findOrCreateStaff(emp, customRole?.id);
        createdStaff.push(staff);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create staff ${emp.firstName}: ${errorMsg}`);
      }
    }
    return createdStaff;
  }

  async generateCustomers() {
    const data = DEMO_DATA.customers;
    const createdCustomers = [];

    for (const cust of data) {
      try {
        const customer = await this.findOrCreateCustomer(cust);
        createdCustomers.push(customer);
        await this.delay(500);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.logFn(`Failed to create customer ${cust.name}: ${errorMsg}`);
      }
    }
    return createdCustomers;
  }

  async generateDiscounts() {
    const data = DEMO_DATA.discounts;
    for (const d of data) {
      try {
        await this.findOrCreateDiscount(d);
        await this.delay(300);
      } catch (e: any) {
        const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
        if (e.response?.status === 403) {
          this.logFn(`Skipping discount "${d.name}": No permission.`);
        } else {
          this.logFn(`Failed to create discount "${d.name}": ${errorMsg}`);
        }
      }
    }
  }

  async generateShifts(staff: any[]) {
    // Generate shifts for the last 30 days with more realistic staffing
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip if it's the current day (shifts are still open)
      if (i === 0) continue;

      // Select 3-5 staff members per day for better coverage
      const dailyStaff = randomSubset(staff, randomInt(3, Math.min(5, staff.length)));

      for (const emp of dailyStaff) {
        try {
          const startHour = randomInt(7, 14);
          const shiftLength = randomInt(5, 10);

          const startTime = new Date(date);
          startTime.setHours(startHour, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(startHour + shiftLength, 0, 0, 0);

          // Detailed financials for the report - varying by day
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const baseMultiplier = isWeekend ? 1.3 : 1.0;

          const openingBalance = 50; // Standard float
          const totalSales = Math.floor(randomInt(300, 1200) * baseMultiplier); // Net sales during shift
          const cashExpected = openingBalance + Math.floor(totalSales * 0.35); // ~35% cash

          // 15% chance of variance
          const variance = Math.random() > 0.85 ? (Math.random() > 0.5 ? randomInt(1, 8) : randomInt(-8, -1)) : 0;
          const cashActual = cashExpected + variance;

          await api.post('/api/shifts/historical', {
             userId: emp.id,
             startTime: startTime.toISOString(),
             endTime: endTime.toISOString(),
             openingBalance,
             totalSales,
             cashExpected,
             cashActual,
             discrepancy: variance,
             status: 'Closed'
          });
        } catch (e: any) {
          // Log specific error for shifts to help debugging
          const errorMsg = e.response?.data?.message || e.message || 'Unknown error';
          this.logFn(`Failed to create shift for ${emp.firstName}: ${errorMsg}`);
        }
      }
    }
  }

  async generateOrders(products: any[], staff: any[], customers: any[], attributes: any[] = []) {
    // Generate 600 orders over last 30 days for rich reports data
    const ORDER_COUNT = 600;

    // Fetch current tax rate from settings
    let taxRate = 0.16; // default 16%
    try {
      const settingsRes = await api.get('/app-settings');
      if (settingsRes.data?.taxRate) {
        taxRate = settingsRes.data.taxRate;
      }
    } catch (e) {
      this.logFn('Using default tax rate of 16%');
    }

    // Generate orders with realistic distribution - more orders on recent days
    for (let i = 0; i < ORDER_COUNT; i++) {
      try {
        // Weight recent days more heavily (more orders recently)
        const dayWeight = Math.random() * Math.random(); // Bias towards 0 (recent)
        const daysAgo = Math.floor(dayWeight * 30);
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);
        orderDate.setHours(getWeightedRandomHour(), randomInt(0, 59), randomInt(0, 59), 0);

        // Select 1-5 products with weighted distribution (1-2 items most common)
        const itemCount = Math.random() > 0.7 ? randomInt(3, 5) : randomInt(1, 2);
        const selectedProducts = randomSubset(products, Math.min(itemCount, products.length));
        const staffMember = random(staff);

        // 70% of orders have a customer attached
        const customer = Math.random() > 0.3 ? random(customers) : null;

        // Simulate some refunds (3% chance)
        const isRefund = Math.random() > 0.97;
        const status = isRefund ? 'REFUNDED' : 'COMPLETED';
        const paymentStatus = isRefund ? 'REFUNDED' : 'COMPLETED';

        let subtotal = 0;
        const items = selectedProducts.map(p => {
          const qty = Math.random() > 0.8 ? randomInt(2, 3) : 1;
          let price = p.price;
          const modifiers: any[] = [];

          // Add random modifiers if available (40% chance)
          if (attributes.length > 0 && Math.random() > 0.6) {
             const attr = random(attributes) as any;
             if (attr.subAttributes && attr.subAttributes.length > 0) {
               const subAttr = random(attr.subAttributes) as any;
               price += subAttr.price;
               modifiers.push({
                 attributeId: attr.id,
                 attributeName: attr.name,
                 subAttributeId: subAttr.id,
                 subAttributeName: subAttr.name,
                 price: subAttr.price
               });
             }
          }

          const total = price * qty;
          subtotal += total;

          return {
            itemId: p.id,
            name: p.name,
            quantity: qty,
            basePrice: p.price,
            finalPrice: total,
            modifiers: modifiers
          };
        });

        // Apply discount occasionally (10% of orders)
        let discountAmount = 0;
        let discountName = null;
        if (Math.random() > 0.9) {
          const discountPercent = random([5, 10, 15, 20]);
          discountAmount = subtotal * (discountPercent / 100);
          discountName = random(['Happy Hour', 'Loyalty Reward', 'Senior Discount', 'Student Discount']);
        }

        const tax = (subtotal - discountAmount) * taxRate;
        const total = subtotal - discountAmount + tax;

        await api.post('/api/orders', {
          items,
          subtotal,
          tax,
          total,
          discount: discountAmount > 0 ? { amount: discountAmount, name: discountName } : { amount: 0 },
          paymentMethod: getWeightedPaymentMethod(),
          paymentStatus: paymentStatus,
          status: status,
          customerId: customer?.id,
          createdAt: orderDate.toISOString(),
          heldBy: staffMember?.id
        });

        // Faster delay for bulk generation
        await this.delay(100);
      } catch (e) {
        // Silent fail for orders to keep moving
      }
    }
  }
}
