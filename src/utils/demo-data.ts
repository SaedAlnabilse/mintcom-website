export const DEMO_DATA = {
  establishmentTypes: ['CAFE', 'RESTAURANT', 'RETAIL'],

  cafe: {
    name: "Arabica Roasters",
    categories: [
      { name: "Coffee", icon: "coffee" },
      { name: "Specialty Coffee", icon: "star" },
      { name: "Tea & Infusions", icon: "cup" },
      { name: "Pastries", icon: "croissant" },
      { name: "Breakfast", icon: "sun" },
      { name: "Sandwiches", icon: "utensils" },
      { name: "Cold Drinks", icon: "droplet" },
      { name: "Smoothies", icon: "glass" },
      { name: "Desserts", icon: "cake" },
      { name: "Snacks", icon: "cookie" }
    ],
    products: [
      // Coffee (12 items)
      { name: "Espresso", price: 2.50, cost: 0.50, category: "Coffee" },
      { name: "Double Espresso", price: 3.00, cost: 0.70, category: "Coffee" },
      { name: "Americano", price: 3.00, cost: 0.60, category: "Coffee" },
      { name: "Latte", price: 4.00, cost: 1.20, category: "Coffee" },
      { name: "Cappuccino", price: 4.00, cost: 1.20, category: "Coffee" },
      { name: "Flat White", price: 3.75, cost: 1.10, category: "Coffee" },
      { name: "Mocha", price: 4.50, cost: 1.50, category: "Coffee" },
      { name: "Spanish Latte", price: 4.75, cost: 1.60, category: "Coffee" },
      { name: "Cortado", price: 3.50, cost: 0.90, category: "Coffee" },
      { name: "Macchiato", price: 3.25, cost: 0.80, category: "Coffee" },
      { name: "Iced Latte", price: 4.50, cost: 1.30, category: "Coffee" },
      { name: "Iced Americano", price: 3.50, cost: 0.70, category: "Coffee" },

      // Specialty Coffee (8 items)
      { name: "V60 Pour Over", price: 5.00, cost: 1.50, category: "Specialty Coffee" },
      { name: "Chemex", price: 6.00, cost: 2.00, category: "Specialty Coffee" },
      { name: "Aeropress", price: 4.50, cost: 1.40, category: "Specialty Coffee" },
      { name: "Cold Brew", price: 4.50, cost: 1.00, category: "Specialty Coffee" },
      { name: "Nitro Cold Brew", price: 5.50, cost: 1.50, category: "Specialty Coffee" },
      { name: "Affogato", price: 5.00, cost: 1.60, category: "Specialty Coffee" },
      { name: "Turkish Coffee", price: 3.50, cost: 0.80, category: "Specialty Coffee" },
      { name: "Vietnamese Coffee", price: 4.50, cost: 1.20, category: "Specialty Coffee" },

      // Tea & Infusions (10 items)
      { name: "Earl Grey", price: 3.00, cost: 0.50, category: "Tea & Infusions" },
      { name: "English Breakfast", price: 3.00, cost: 0.50, category: "Tea & Infusions" },
      { name: "Green Tea", price: 3.00, cost: 0.50, category: "Tea & Infusions" },
      { name: "Matcha Latte", price: 4.50, cost: 1.50, category: "Tea & Infusions" },
      { name: "Chai Latte", price: 4.00, cost: 1.20, category: "Tea & Infusions" },
      { name: "Chamomile", price: 3.00, cost: 0.40, category: "Tea & Infusions" },
      { name: "Peppermint Tea", price: 3.00, cost: 0.40, category: "Tea & Infusions" },
      { name: "Hibiscus Tea", price: 3.50, cost: 0.60, category: "Tea & Infusions" },
      { name: "Iced Matcha Latte", price: 5.00, cost: 1.60, category: "Tea & Infusions" },
      { name: "London Fog", price: 4.50, cost: 1.30, category: "Tea & Infusions" },

      // Pastries (10 items)
      { name: "Croissant", price: 2.50, cost: 0.80, category: "Pastries" },
      { name: "Pain au Chocolat", price: 3.00, cost: 1.00, category: "Pastries" },
      { name: "Almond Croissant", price: 3.50, cost: 1.20, category: "Pastries" },
      { name: "Cinnamon Roll", price: 3.50, cost: 1.10, category: "Pastries" },
      { name: "Danish Pastry", price: 3.00, cost: 0.90, category: "Pastries" },
      { name: "Blueberry Muffin", price: 2.75, cost: 0.70, category: "Pastries" },
      { name: "Chocolate Muffin", price: 2.75, cost: 0.70, category: "Pastries" },
      { name: "Banana Bread", price: 3.00, cost: 0.80, category: "Pastries" },
      { name: "Scone", price: 2.50, cost: 0.65, category: "Pastries" },
      { name: "Brioche", price: 3.25, cost: 0.95, category: "Pastries" },

      // Breakfast (8 items)
      { name: "Avocado Toast", price: 8.00, cost: 3.00, category: "Breakfast" },
      { name: "Eggs Benedict", price: 10.00, cost: 3.50, category: "Breakfast" },
      { name: "Shakshuka", price: 9.00, cost: 3.00, category: "Breakfast" },
      { name: "Açaí Bowl", price: 9.50, cost: 4.00, category: "Breakfast" },
      { name: "Granola Bowl", price: 7.00, cost: 2.50, category: "Breakfast" },
      { name: "French Toast", price: 8.50, cost: 2.80, category: "Breakfast" },
      { name: "Pancakes", price: 8.00, cost: 2.50, category: "Breakfast" },
      { name: "Omelette", price: 9.00, cost: 3.20, category: "Breakfast" },

      // Sandwiches (8 items)
      { name: "Club Sandwich", price: 9.00, cost: 3.50, category: "Sandwiches" },
      { name: "Chicken Panini", price: 8.50, cost: 3.20, category: "Sandwiches" },
      { name: "Veggie Wrap", price: 7.50, cost: 2.50, category: "Sandwiches" },
      { name: "Tuna Melt", price: 8.00, cost: 3.00, category: "Sandwiches" },
      { name: "BLT", price: 7.50, cost: 2.80, category: "Sandwiches" },
      { name: "Grilled Cheese", price: 6.50, cost: 2.00, category: "Sandwiches" },
      { name: "Caprese Panini", price: 8.00, cost: 2.90, category: "Sandwiches" },
      { name: "Turkey & Cheese", price: 8.50, cost: 3.30, category: "Sandwiches" },

      // Cold Drinks (6 items)
      { name: "Fresh Orange Juice", price: 4.00, cost: 1.50, category: "Cold Drinks" },
      { name: "Iced Tea", price: 3.50, cost: 0.80, category: "Cold Drinks" },
      { name: "Lemonade", price: 3.50, cost: 0.70, category: "Cold Drinks" },
      { name: "Sparkling Water", price: 2.50, cost: 0.50, category: "Cold Drinks" },
      { name: "Apple Juice", price: 3.50, cost: 1.00, category: "Cold Drinks" },
      { name: "Ginger Shot", price: 3.00, cost: 0.90, category: "Cold Drinks" },

      // Smoothies (6 items)
      { name: "Mango Smoothie", price: 5.50, cost: 2.00, category: "Smoothies" },
      { name: "Berry Blast", price: 5.50, cost: 2.10, category: "Smoothies" },
      { name: "Green Detox", price: 6.00, cost: 2.50, category: "Smoothies" },
      { name: "Tropical Paradise", price: 5.50, cost: 2.00, category: "Smoothies" },
      { name: "Peanut Butter Banana", price: 5.50, cost: 2.00, category: "Smoothies" },
      { name: "Protein Power", price: 6.50, cost: 2.80, category: "Smoothies" },

      // Desserts (6 items)
      { name: "Cheesecake", price: 5.50, cost: 2.00, category: "Desserts" },
      { name: "Tiramisu", price: 6.00, cost: 2.20, category: "Desserts" },
      { name: "Brownie", price: 4.00, cost: 1.20, category: "Desserts" },
      { name: "Cookie", price: 2.50, cost: 0.60, category: "Desserts" },
      { name: "Carrot Cake", price: 5.00, cost: 1.80, category: "Desserts" },
      { name: "Chocolate Cake", price: 5.50, cost: 2.00, category: "Desserts" },

      // Snacks (6 items)
      { name: "Mixed Nuts", price: 3.00, cost: 1.00, category: "Snacks" },
      { name: "Energy Bar", price: 3.50, cost: 1.20, category: "Snacks" },
      { name: "Chips", price: 2.00, cost: 0.50, category: "Snacks" },
      { name: "Hummus & Pita", price: 5.00, cost: 1.80, category: "Snacks" },
      { name: "Fruit Cup", price: 4.00, cost: 1.50, category: "Snacks" },
      { name: "Cheese Platter", price: 8.00, cost: 3.00, category: "Snacks" }
    ],
    rawMaterials: [
      { name: "Coffee Beans (Ethiopian)", unit: "kg", cost: 18.00, stock: 50 },
      { name: "Coffee Beans (Colombian)", unit: "kg", cost: 15.00, stock: 45 },
      { name: "Coffee Beans (Brazilian)", unit: "kg", cost: 12.00, stock: 40 },
      { name: "Espresso Blend", unit: "kg", cost: 14.00, stock: 60 },
      { name: "Whole Milk", unit: "L", cost: 1.50, stock: 100 },
      { name: "Oat Milk", unit: "L", cost: 2.50, stock: 50 },
      { name: "Almond Milk", unit: "L", cost: 2.80, stock: 40 },
      { name: "Soy Milk", unit: "L", cost: 2.20, stock: 35 },
      { name: "Heavy Cream", unit: "L", cost: 4.00, stock: 30 },
      { name: "Sugar", unit: "kg", cost: 0.80, stock: 25 },
      { name: "Brown Sugar", unit: "kg", cost: 1.20, stock: 20 },
      { name: "Vanilla Syrup", unit: "L", cost: 8.00, stock: 15 },
      { name: "Caramel Syrup", unit: "L", cost: 8.00, stock: 15 },
      { name: "Hazelnut Syrup", unit: "L", cost: 8.50, stock: 12 },
      { name: "Chocolate Syrup", unit: "L", cost: 7.50, stock: 20 },
      { name: "Matcha Powder", unit: "kg", cost: 45.00, stock: 8 },
      { name: "Cocoa Powder", unit: "kg", cost: 12.00, stock: 10 },
      { name: "All-Purpose Flour", unit: "kg", cost: 0.90, stock: 50 },
      { name: "Butter", unit: "kg", cost: 8.00, stock: 30 },
      { name: "Eggs", unit: "pcs", cost: 0.15, stock: 300 },
      { name: "Avocado", unit: "pcs", cost: 1.50, stock: 80 },
      { name: "Bread Loaf", unit: "pcs", cost: 2.00, stock: 40 },
      { name: "Croissant Dough", unit: "kg", cost: 6.00, stock: 25 },
      { name: "Fresh Berries", unit: "kg", cost: 15.00, stock: 20 },
      { name: "Bananas", unit: "kg", cost: 1.20, stock: 30 },
      { name: "Oranges", unit: "kg", cost: 2.50, stock: 40 },
      { name: "Lemons", unit: "kg", cost: 3.00, stock: 25 },
      { name: "Ice", unit: "kg", cost: 0.30, stock: 100 }
    ],
    recipes: [
      { productName: "Espresso", ingredients: [{ material: "Espresso Blend", qty: 0.018, unit: "kg" }] },
      { productName: "Double Espresso", ingredients: [{ material: "Espresso Blend", qty: 0.036, unit: "kg" }] },
      { productName: "Latte", ingredients: [{ material: "Espresso Blend", qty: 0.018, unit: "kg" }, { material: "Whole Milk", qty: 0.25, unit: "L" }] },
      { productName: "Cappuccino", ingredients: [{ material: "Espresso Blend", qty: 0.018, unit: "kg" }, { material: "Whole Milk", qty: 0.20, unit: "L" }] },
      { productName: "Flat White", ingredients: [{ material: "Espresso Blend", qty: 0.036, unit: "kg" }, { material: "Whole Milk", qty: 0.18, unit: "L" }] },
      { productName: "Mocha", ingredients: [{ material: "Espresso Blend", qty: 0.018, unit: "kg" }, { material: "Whole Milk", qty: 0.22, unit: "L" }, { material: "Chocolate Syrup", qty: 0.03, unit: "L" }] },
      { productName: "Spanish Latte", ingredients: [{ material: "Espresso Blend", qty: 0.018, unit: "kg" }, { material: "Whole Milk", qty: 0.20, unit: "L" }, { material: "Heavy Cream", qty: 0.05, unit: "L" }] },
      { productName: "Avocado Toast", ingredients: [{ material: "Avocado", qty: 1, unit: "pcs" }, { material: "Eggs", qty: 2, unit: "pcs" }, { material: "Bread Loaf", qty: 0.1, unit: "pcs" }] },
      { productName: "Matcha Latte", ingredients: [{ material: "Matcha Powder", qty: 0.005, unit: "kg" }, { material: "Whole Milk", qty: 0.30, unit: "L" }] },
      { productName: "Croissant", ingredients: [{ material: "Croissant Dough", qty: 0.12, unit: "kg" }, { material: "Butter", qty: 0.03, unit: "kg" }] },
      { productName: "V60 Pour Over", ingredients: [{ material: "Coffee Beans (Ethiopian)", qty: 0.022, unit: "kg" }] },
      { productName: "Cold Brew", ingredients: [{ material: "Coffee Beans (Colombian)", qty: 0.08, unit: "kg" }] }
    ],
    attributes: [
      {
        name: "Milk Type",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "Whole Milk", price: 0 },
          { name: "Oat Milk", price: 0.50 },
          { name: "Almond Milk", price: 0.50 },
          { name: "Soy Milk", price: 0.40 },
          { name: "Skim Milk", price: 0 }
        ]
      },
      {
        name: "Size",
        inputType: "SINGLE_SELECT",
        isRequired: true,
        options: [
          { name: "Small (8oz)", price: 0 },
          { name: "Medium (12oz)", price: 0.75 },
          { name: "Large (16oz)", price: 1.50 }
        ]
      },
      {
        name: "Extra Shots",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "None", price: 0 },
          { name: "+1 Shot", price: 0.75 },
          { name: "+2 Shots", price: 1.50 }
        ]
      },
      {
        name: "Sweetness",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "Regular", price: 0 },
          { name: "Less Sweet", price: 0 },
          { name: "Extra Sweet", price: 0 },
          { name: "No Sugar", price: 0 }
        ]
      },
      {
        name: "Add-ons",
        inputType: "MULTI_SELECT",
        isRequired: false,
        options: [
          { name: "Vanilla Syrup", price: 0.50 },
          { name: "Caramel Drizzle", price: 0.50 },
          { name: "Whipped Cream", price: 0.40 },
          { name: "Cinnamon", price: 0 }
        ]
      }
    ]
  },

  restaurant: {
    name: "Urban Bistro",
    categories: [
      { name: "Starters", icon: "star" },
      { name: "Soups", icon: "bowl" },
      { name: "Salads", icon: "leaf" },
      { name: "Mains", icon: "utensils" },
      { name: "Burgers", icon: "menu" },
      { name: "Pasta", icon: "pasta" },
      { name: "Seafood", icon: "fish" },
      { name: "Sides", icon: "grid" },
      { name: "Desserts", icon: "cake" },
      { name: "Beverages", icon: "glass" }
    ],
    products: [
      // Starters (10 items)
      { name: "Truffle Fries", price: 6.00, cost: 2.00, category: "Starters" },
      { name: "Calamari", price: 9.00, cost: 3.50, category: "Starters" },
      { name: "Chicken Wings", price: 8.00, cost: 3.00, category: "Starters" },
      { name: "Bruschetta", price: 7.00, cost: 2.20, category: "Starters" },
      { name: "Garlic Bread", price: 4.50, cost: 1.20, category: "Starters" },
      { name: "Spinach Dip", price: 7.50, cost: 2.50, category: "Starters" },
      { name: "Beef Carpaccio", price: 12.00, cost: 5.00, category: "Starters" },
      { name: "Shrimp Cocktail", price: 14.00, cost: 6.00, category: "Starters" },
      { name: "Stuffed Mushrooms", price: 8.50, cost: 2.80, category: "Starters" },
      { name: "Nachos", price: 9.00, cost: 3.00, category: "Starters" },

      // Soups (4 items)
      { name: "French Onion Soup", price: 7.00, cost: 2.00, category: "Soups" },
      { name: "Tomato Bisque", price: 6.00, cost: 1.80, category: "Soups" },
      { name: "Chicken Noodle Soup", price: 6.50, cost: 2.20, category: "Soups" },
      { name: "Lobster Bisque", price: 12.00, cost: 5.00, category: "Soups" },

      // Salads (6 items)
      { name: "Caesar Salad", price: 12.00, cost: 4.00, category: "Salads" },
      { name: "Greek Salad", price: 11.00, cost: 3.50, category: "Salads" },
      { name: "Cobb Salad", price: 14.00, cost: 5.00, category: "Salads" },
      { name: "Caprese Salad", price: 10.00, cost: 3.50, category: "Salads" },
      { name: "House Salad", price: 8.00, cost: 2.50, category: "Salads" },
      { name: "Quinoa Salad", price: 13.00, cost: 4.50, category: "Salads" },

      // Mains (12 items)
      { name: "Ribeye Steak", price: 28.00, cost: 12.00, category: "Mains" },
      { name: "NY Strip Steak", price: 26.00, cost: 11.00, category: "Mains" },
      { name: "Filet Mignon", price: 32.00, cost: 14.00, category: "Mains" },
      { name: "Grilled Salmon", price: 24.00, cost: 10.00, category: "Mains" },
      { name: "Mushroom Risotto", price: 18.00, cost: 6.00, category: "Mains" },
      { name: "Lamb Chops", price: 30.00, cost: 13.00, category: "Mains" },
      { name: "Roasted Chicken", price: 20.00, cost: 7.00, category: "Mains" },
      { name: "Duck Breast", price: 26.00, cost: 10.00, category: "Mains" },
      { name: "Pork Tenderloin", price: 22.00, cost: 8.00, category: "Mains" },
      { name: "Veal Scaloppine", price: 28.00, cost: 12.00, category: "Mains" },
      { name: "BBQ Ribs", price: 24.00, cost: 9.00, category: "Mains" },
      { name: "Vegetable Stir Fry", price: 16.00, cost: 5.00, category: "Mains" },

      // Burgers (6 items)
      { name: "Classic Burger", price: 14.00, cost: 5.00, category: "Burgers" },
      { name: "Cheese Burger", price: 15.00, cost: 5.50, category: "Burgers" },
      { name: "Bacon Burger", price: 16.00, cost: 6.00, category: "Burgers" },
      { name: "Truffle Burger", price: 18.00, cost: 7.00, category: "Burgers" },
      { name: "Veggie Burger", price: 14.00, cost: 4.50, category: "Burgers" },
      { name: "Chicken Burger", price: 15.00, cost: 5.00, category: "Burgers" },

      // Pasta (6 items)
      { name: "Spaghetti Bolognese", price: 16.00, cost: 5.00, category: "Pasta" },
      { name: "Fettuccine Alfredo", price: 15.00, cost: 4.50, category: "Pasta" },
      { name: "Penne Arrabiata", price: 14.00, cost: 4.00, category: "Pasta" },
      { name: "Carbonara", price: 17.00, cost: 5.50, category: "Pasta" },
      { name: "Lasagna", price: 18.00, cost: 6.00, category: "Pasta" },
      { name: "Seafood Linguine", price: 22.00, cost: 8.00, category: "Pasta" },

      // Seafood (6 items)
      { name: "Grilled Sea Bass", price: 28.00, cost: 12.00, category: "Seafood" },
      { name: "Lobster Tail", price: 45.00, cost: 22.00, category: "Seafood" },
      { name: "Shrimp Scampi", price: 24.00, cost: 10.00, category: "Seafood" },
      { name: "Fish & Chips", price: 18.00, cost: 6.50, category: "Seafood" },
      { name: "Crab Cakes", price: 20.00, cost: 8.00, category: "Seafood" },
      { name: "Mussels Marinara", price: 16.00, cost: 6.00, category: "Seafood" },

      // Sides (8 items)
      { name: "Mashed Potatoes", price: 5.00, cost: 1.50, category: "Sides" },
      { name: "French Fries", price: 4.50, cost: 1.20, category: "Sides" },
      { name: "Onion Rings", price: 5.00, cost: 1.50, category: "Sides" },
      { name: "Grilled Vegetables", price: 6.00, cost: 2.00, category: "Sides" },
      { name: "Creamed Spinach", price: 5.50, cost: 1.80, category: "Sides" },
      { name: "Coleslaw", price: 4.00, cost: 1.00, category: "Sides" },
      { name: "Baked Potato", price: 4.50, cost: 1.20, category: "Sides" },
      { name: "Mac & Cheese", price: 6.00, cost: 2.00, category: "Sides" },

      // Desserts (6 items)
      { name: "Cheesecake", price: 7.00, cost: 2.50, category: "Desserts" },
      { name: "Chocolate Fondant", price: 8.00, cost: 3.00, category: "Desserts" },
      { name: "Tiramisu", price: 7.50, cost: 2.80, category: "Desserts" },
      { name: "Crème Brûlée", price: 7.00, cost: 2.50, category: "Desserts" },
      { name: "Apple Pie", price: 6.50, cost: 2.20, category: "Desserts" },
      { name: "Ice Cream Sundae", price: 6.00, cost: 2.00, category: "Desserts" },

      // Beverages (8 items)
      { name: "Soft Drink", price: 3.00, cost: 0.50, category: "Beverages" },
      { name: "Fresh Juice", price: 5.00, cost: 1.50, category: "Beverages" },
      { name: "Iced Tea", price: 3.50, cost: 0.60, category: "Beverages" },
      { name: "Sparkling Water", price: 3.00, cost: 0.80, category: "Beverages" },
      { name: "Coffee", price: 3.50, cost: 0.50, category: "Beverages" },
      { name: "Espresso", price: 3.00, cost: 0.40, category: "Beverages" },
      { name: "Cappuccino", price: 4.50, cost: 0.80, category: "Beverages" },
      { name: "Hot Chocolate", price: 4.00, cost: 0.70, category: "Beverages" }
    ],
    rawMaterials: [
      { name: "Ribeye Beef", unit: "kg", cost: 22.00, stock: 40 },
      { name: "NY Strip Beef", unit: "kg", cost: 20.00, stock: 35 },
      { name: "Filet Beef", unit: "kg", cost: 28.00, stock: 25 },
      { name: "Ground Beef", unit: "kg", cost: 8.00, stock: 50 },
      { name: "Chicken Breast", unit: "kg", cost: 6.00, stock: 60 },
      { name: "Chicken Wings", unit: "kg", cost: 5.00, stock: 40 },
      { name: "Lamb Rack", unit: "kg", cost: 25.00, stock: 20 },
      { name: "Pork Loin", unit: "kg", cost: 10.00, stock: 30 },
      { name: "Salmon Fillet", unit: "kg", cost: 16.00, stock: 25 },
      { name: "Sea Bass", unit: "kg", cost: 18.00, stock: 20 },
      { name: "Shrimp", unit: "kg", cost: 20.00, stock: 25 },
      { name: "Lobster", unit: "kg", cost: 40.00, stock: 15 },
      { name: "Mussels", unit: "kg", cost: 8.00, stock: 30 },
      { name: "Calamari", unit: "kg", cost: 14.00, stock: 20 },
      { name: "Potatoes", unit: "kg", cost: 0.80, stock: 100 },
      { name: "Pasta", unit: "kg", cost: 2.00, stock: 50 },
      { name: "Rice", unit: "kg", cost: 1.50, stock: 40 },
      { name: "Arborio Rice", unit: "kg", cost: 4.00, stock: 25 },
      { name: "Romaine Lettuce", unit: "kg", cost: 3.00, stock: 30 },
      { name: "Tomatoes", unit: "kg", cost: 2.50, stock: 40 },
      { name: "Onions", unit: "kg", cost: 1.00, stock: 50 },
      { name: "Garlic", unit: "kg", cost: 5.00, stock: 15 },
      { name: "Burger Buns", unit: "pcs", cost: 0.40, stock: 150 },
      { name: "Cheese (Cheddar)", unit: "kg", cost: 8.00, stock: 25 },
      { name: "Cheese (Parmesan)", unit: "kg", cost: 15.00, stock: 15 },
      { name: "Heavy Cream", unit: "L", cost: 4.00, stock: 30 },
      { name: "Butter", unit: "kg", cost: 8.00, stock: 25 },
      { name: "Olive Oil", unit: "L", cost: 10.00, stock: 20 },
      { name: "Truffle Oil", unit: "L", cost: 50.00, stock: 5 },
      { name: "Bacon", unit: "kg", cost: 10.00, stock: 30 }
    ],
    recipes: [
      { productName: "Truffle Fries", ingredients: [{ material: "Potatoes", qty: 0.4, unit: "kg" }, { material: "Truffle Oil", qty: 0.01, unit: "L" }] },
      { productName: "Ribeye Steak", ingredients: [{ material: "Ribeye Beef", qty: 0.35, unit: "kg" }, { material: "Butter", qty: 0.02, unit: "kg" }] },
      { productName: "Grilled Salmon", ingredients: [{ material: "Salmon Fillet", qty: 0.25, unit: "kg" }, { material: "Olive Oil", qty: 0.02, unit: "L" }] },
      { productName: "Classic Burger", ingredients: [{ material: "Ground Beef", qty: 0.2, unit: "kg" }, { material: "Burger Buns", qty: 1, unit: "pcs" }] },
      { productName: "Cheese Burger", ingredients: [{ material: "Ground Beef", qty: 0.2, unit: "kg" }, { material: "Burger Buns", qty: 1, unit: "pcs" }, { material: "Cheese (Cheddar)", qty: 0.05, unit: "kg" }] },
      { productName: "Caesar Salad", ingredients: [{ material: "Romaine Lettuce", qty: 0.2, unit: "kg" }, { material: "Cheese (Parmesan)", qty: 0.03, unit: "kg" }] },
      { productName: "Mushroom Risotto", ingredients: [{ material: "Arborio Rice", qty: 0.15, unit: "kg" }, { material: "Heavy Cream", qty: 0.1, unit: "L" }, { material: "Cheese (Parmesan)", qty: 0.04, unit: "kg" }] },
      { productName: "Chicken Wings", ingredients: [{ material: "Chicken Wings", qty: 0.5, unit: "kg" }] },
      { productName: "Calamari", ingredients: [{ material: "Calamari", qty: 0.25, unit: "kg" }] },
      { productName: "Fettuccine Alfredo", ingredients: [{ material: "Pasta", qty: 0.15, unit: "kg" }, { material: "Heavy Cream", qty: 0.15, unit: "L" }, { material: "Cheese (Parmesan)", qty: 0.05, unit: "kg" }] }
    ],
    attributes: [
      {
        name: "Cooking Temp",
        inputType: "SINGLE_SELECT",
        isRequired: true,
        options: [
          { name: "Rare", price: 0 },
          { name: "Medium Rare", price: 0 },
          { name: "Medium", price: 0 },
          { name: "Medium Well", price: 0 },
          { name: "Well Done", price: 0 }
        ]
      },
      {
        name: "Side Choice",
        inputType: "SINGLE_SELECT",
        isRequired: true,
        options: [
          { name: "Fries", price: 0 },
          { name: "Mashed Potatoes", price: 0 },
          { name: "Salad", price: 0 },
          { name: "Grilled Vegetables", price: 1.50 }
        ]
      },
      {
        name: "Sauce",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "No Sauce", price: 0 },
          { name: "Peppercorn", price: 1.50 },
          { name: "Mushroom", price: 1.50 },
          { name: "Béarnaise", price: 2.00 }
        ]
      },
      {
        name: "Extras",
        inputType: "MULTI_SELECT",
        isRequired: false,
        options: [
          { name: "Extra Bacon", price: 2.00 },
          { name: "Extra Cheese", price: 1.50 },
          { name: "Fried Egg", price: 1.50 },
          { name: "Avocado", price: 2.50 }
        ]
      }
    ]
  },

  retail: {
    name: "Tech Gadgets",
    categories: [
      { name: "Smartphones", icon: "smartphone" },
      { name: "Tablets", icon: "tablet" },
      { name: "Laptops", icon: "laptop" },
      { name: "Audio", icon: "headphones" },
      { name: "Wearables", icon: "watch" },
      { name: "Cables", icon: "link" },
      { name: "Cases", icon: "box" },
      { name: "Chargers", icon: "battery" },
      { name: "Storage", icon: "hard-drive" },
      { name: "Gaming", icon: "gamepad" }
    ],
    products: [
      // Smartphones (8 items)
      { name: "iPhone 15 Pro", price: 999.00, cost: 750.00, category: "Smartphones" },
      { name: "iPhone 15", price: 799.00, cost: 600.00, category: "Smartphones" },
      { name: "Samsung S24 Ultra", price: 1199.00, cost: 900.00, category: "Smartphones" },
      { name: "Samsung S24", price: 899.00, cost: 680.00, category: "Smartphones" },
      { name: "Google Pixel 8 Pro", price: 899.00, cost: 650.00, category: "Smartphones" },
      { name: "Google Pixel 8", price: 699.00, cost: 500.00, category: "Smartphones" },
      { name: "OnePlus 12", price: 799.00, cost: 550.00, category: "Smartphones" },
      { name: "Xiaomi 14 Pro", price: 699.00, cost: 480.00, category: "Smartphones" },

      // Tablets (6 items)
      { name: "iPad Pro 12.9\"", price: 1099.00, cost: 800.00, category: "Tablets" },
      { name: "iPad Air", price: 599.00, cost: 420.00, category: "Tablets" },
      { name: "iPad Mini", price: 499.00, cost: 350.00, category: "Tablets" },
      { name: "Samsung Tab S9", price: 849.00, cost: 600.00, category: "Tablets" },
      { name: "Samsung Tab A9", price: 349.00, cost: 220.00, category: "Tablets" },
      { name: "Lenovo Tab P12", price: 399.00, cost: 260.00, category: "Tablets" },

      // Laptops (6 items)
      { name: "MacBook Pro 14\"", price: 1999.00, cost: 1500.00, category: "Laptops" },
      { name: "MacBook Air M3", price: 1099.00, cost: 800.00, category: "Laptops" },
      { name: "Dell XPS 15", price: 1499.00, cost: 1100.00, category: "Laptops" },
      { name: "HP Spectre x360", price: 1299.00, cost: 950.00, category: "Laptops" },
      { name: "Lenovo ThinkPad X1", price: 1599.00, cost: 1200.00, category: "Laptops" },
      { name: "ASUS ZenBook 14", price: 899.00, cost: 650.00, category: "Laptops" },

      // Audio (10 items)
      { name: "AirPods Pro 2", price: 249.00, cost: 170.00, category: "Audio" },
      { name: "AirPods 3", price: 169.00, cost: 110.00, category: "Audio" },
      { name: "Sony WH-1000XM5", price: 349.00, cost: 240.00, category: "Audio" },
      { name: "Bose QC45", price: 329.00, cost: 220.00, category: "Audio" },
      { name: "Samsung Buds2 Pro", price: 199.00, cost: 130.00, category: "Audio" },
      { name: "JBL Flip 6", price: 129.00, cost: 80.00, category: "Audio" },
      { name: "Sonos One", price: 219.00, cost: 150.00, category: "Audio" },
      { name: "HomePod Mini", price: 99.00, cost: 65.00, category: "Audio" },
      { name: "Beats Studio Pro", price: 349.00, cost: 230.00, category: "Audio" },
      { name: "Jabra Elite 85t", price: 229.00, cost: 150.00, category: "Audio" },

      // Wearables (6 items)
      { name: "Apple Watch Ultra 2", price: 799.00, cost: 550.00, category: "Wearables" },
      { name: "Apple Watch Series 9", price: 399.00, cost: 270.00, category: "Wearables" },
      { name: "Samsung Galaxy Watch 6", price: 299.00, cost: 200.00, category: "Wearables" },
      { name: "Garmin Fenix 7", price: 699.00, cost: 480.00, category: "Wearables" },
      { name: "Fitbit Sense 2", price: 249.00, cost: 160.00, category: "Wearables" },
      { name: "Oura Ring Gen 3", price: 299.00, cost: 180.00, category: "Wearables" },

      // Cables (8 items)
      { name: "USB-C Cable 1m", price: 15.00, cost: 3.00, category: "Cables" },
      { name: "USB-C Cable 2m", price: 20.00, cost: 4.00, category: "Cables" },
      { name: "Lightning Cable 1m", price: 19.00, cost: 4.50, category: "Cables" },
      { name: "Lightning Cable 2m", price: 25.00, cost: 5.50, category: "Cables" },
      { name: "HDMI Cable 2m", price: 25.00, cost: 6.00, category: "Cables" },
      { name: "DisplayPort Cable", price: 30.00, cost: 8.00, category: "Cables" },
      { name: "USB-C to Lightning", price: 25.00, cost: 5.00, category: "Cables" },
      { name: "Thunderbolt 4 Cable", price: 79.00, cost: 35.00, category: "Cables" },

      // Cases (8 items)
      { name: "iPhone Clear Case", price: 25.00, cost: 5.00, category: "Cases" },
      { name: "iPhone Leather Case", price: 59.00, cost: 18.00, category: "Cases" },
      { name: "iPhone Silicone Case", price: 35.00, cost: 8.00, category: "Cases" },
      { name: "Samsung Clear Case", price: 22.00, cost: 4.50, category: "Cases" },
      { name: "Samsung Leather Case", price: 49.00, cost: 15.00, category: "Cases" },
      { name: "iPad Folio Case", price: 79.00, cost: 25.00, category: "Cases" },
      { name: "MacBook Sleeve", price: 49.00, cost: 15.00, category: "Cases" },
      { name: "AirPods Case", price: 19.00, cost: 4.00, category: "Cases" },

      // Chargers (8 items)
      { name: "20W USB-C Charger", price: 25.00, cost: 8.00, category: "Chargers" },
      { name: "67W USB-C Charger", price: 59.00, cost: 20.00, category: "Chargers" },
      { name: "MagSafe Charger", price: 39.00, cost: 12.00, category: "Chargers" },
      { name: "Wireless Pad", price: 35.00, cost: 10.00, category: "Chargers" },
      { name: "Car Charger", price: 25.00, cost: 7.00, category: "Chargers" },
      { name: "Power Bank 10000mAh", price: 45.00, cost: 15.00, category: "Chargers" },
      { name: "Power Bank 20000mAh", price: 65.00, cost: 22.00, category: "Chargers" },
      { name: "3-in-1 Charging Stand", price: 99.00, cost: 35.00, category: "Chargers" },

      // Storage (6 items)
      { name: "SanDisk 128GB USB", price: 25.00, cost: 10.00, category: "Storage" },
      { name: "SanDisk 256GB USB", price: 40.00, cost: 16.00, category: "Storage" },
      { name: "Samsung T7 1TB SSD", price: 129.00, cost: 75.00, category: "Storage" },
      { name: "Samsung T7 2TB SSD", price: 199.00, cost: 120.00, category: "Storage" },
      { name: "WD 4TB External HDD", price: 109.00, cost: 65.00, category: "Storage" },
      { name: "MicroSD 256GB", price: 35.00, cost: 15.00, category: "Storage" },

      // Gaming (8 items)
      { name: "PS5 Controller", price: 69.00, cost: 45.00, category: "Gaming" },
      { name: "Xbox Controller", price: 59.00, cost: 38.00, category: "Gaming" },
      { name: "Nintendo Switch Pro Controller", price: 69.00, cost: 42.00, category: "Gaming" },
      { name: "Gaming Mouse", price: 79.00, cost: 35.00, category: "Gaming" },
      { name: "Gaming Keyboard", price: 129.00, cost: 55.00, category: "Gaming" },
      { name: "Gaming Headset", price: 99.00, cost: 45.00, category: "Gaming" },
      { name: "Mouse Pad XL", price: 35.00, cost: 10.00, category: "Gaming" },
      { name: "Webcam HD", price: 89.00, cost: 40.00, category: "Gaming" }
    ],
    rawMaterials: [],
    recipes: [],
    attributes: [
      {
        name: "Warranty",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "Standard (1 Year)", price: 0 },
          { name: "Extended (2 Years)", price: 49.00 },
          { name: "Premium (3 Years)", price: 99.00 }
        ]
      },
      {
        name: "Color",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "Black", price: 0 },
          { name: "White", price: 0 },
          { name: "Silver", price: 0 },
          { name: "Gold", price: 0 }
        ]
      },
      {
        name: "Storage Upgrade",
        inputType: "SINGLE_SELECT",
        isRequired: false,
        options: [
          { name: "Base", price: 0 },
          { name: "+128GB", price: 100.00 },
          { name: "+256GB", price: 200.00 },
          { name: "+512GB", price: 400.00 }
        ]
      }
    ]
  },

  discounts: [
    { name: "Staff Meal", percentage: 100, adminOnly: false },
    { name: "Family & Friends", percentage: 20, adminOnly: false },
    { name: "Manager Comp", percentage: 100, adminOnly: true },
    { name: "Happy Hour", percentage: 15, adminOnly: false },
    { name: "Senior Discount", percentage: 10, adminOnly: false },
    { name: "Student Discount", percentage: 15, adminOnly: false },
    { name: "Loyalty Reward", percentage: 10, adminOnly: false },
    { name: "Birthday Special", percentage: 25, adminOnly: false },
    { name: "First Visit", percentage: 10, adminOnly: false },
    { name: "VIP Member", percentage: 20, adminOnly: true }
  ],

  customRoles: [
    {
      name: "Floor Manager",
      baseRole: "MANAGER",
      allowedDiscounts: [],
      posAccess: true,
      backofficeAccess: true,
      permissions: ["accept_payments", "apply_discounts", "refunds", "view_all_receipts", "open_cash_drawer", "manage_items", "edit_order_items", "void_items"],
      backofficePermissions: ["view_reports", "manage_items", "manage_employees", "manage_customers", "view_activity_logs"]
    },
    {
      name: "Head Barista",
      baseRole: "CASHIER",
      allowedDiscounts: [],
      posAccess: true,
      backofficeAccess: true,
      permissions: ["accept_payments", "manage_items", "view_item_cost", "view_all_receipts", "apply_discounts"],
      backofficePermissions: ["view_reports", "manage_items"]
    },
    {
      name: "Junior Cashier",
      baseRole: "CASHIER",
      allowedDiscounts: [],
      posAccess: true,
      backofficeAccess: false,
      permissions: ["accept_payments", "apply_discounts"],
      backofficePermissions: []
    },
    {
      name: "Shift Lead",
      baseRole: "CASHIER",
      allowedDiscounts: [],
      posAccess: true,
      backofficeAccess: true,
      permissions: ["accept_payments", "apply_discounts", "refunds", "view_all_receipts", "open_cash_drawer", "edit_order_items"],
      backofficePermissions: ["view_reports", "manage_customers"]
    },
    {
      name: "Inventory Manager",
      baseRole: "USER",
      allowedDiscounts: [],
      posAccess: false,
      backofficeAccess: true,
      permissions: [],
      backofficePermissions: ["manage_items", "view_reports", "manage_materials", "manage_recipes"]
    },
    {
      name: "Trainee",
      baseRole: "USER",
      allowedDiscounts: [],
      posAccess: true,
      backofficeAccess: false,
      permissions: ["accept_payments"],
      backofficePermissions: []
    }
  ],

  staff: [
    // Managers
    { firstName: "Ahmed", lastName: "Al-Sayed", role: "MANAGER", customRole: "Floor Manager" },
    { firstName: "Fatima", lastName: "Hassan", role: "MANAGER", customRole: "Floor Manager" },

    // Senior Staff
    { firstName: "Sara", lastName: "Khalil", role: "CASHIER", customRole: "Head Barista" },
    { firstName: "Layla", lastName: "Nasser", role: "CASHIER", customRole: "Head Barista" },
    { firstName: "Youssef", lastName: "Ibrahim", role: "CASHIER", customRole: "Shift Lead" },

    // Regular Staff
    { firstName: "Omar", lastName: "Yousef", role: "USER", customRole: "Junior Cashier" },
    { firstName: "Karim", lastName: "Haddad", role: "USER", customRole: "Junior Cashier" },
    { firstName: "Nour", lastName: "Abbas", role: "USER", customRole: "Junior Cashier" },
    { firstName: "Rania", lastName: "Mansour", role: "USER", customRole: "Junior Cashier" },

    // Specialized
    { firstName: "Hassan", lastName: "Farouk", role: "USER", customRole: "Inventory Manager" },

    // Trainees
    { firstName: "Ali", lastName: "Mahdi", role: "USER", customRole: "Trainee" },
    { firstName: "Dana", lastName: "Salim", role: "USER", customRole: "Trainee" }
  ],

  customers: [
    // Regular Customers (High Value)
    { name: "Mohammad Al-Ahmad", phone: "+962790000001", email: "mohammad.ahmad@gmail.com", tier: "VIP", visits: 85, spent: 2450.00 },
    { name: "Sarah Johnson", phone: "+962790000002", email: "sarah.j@gmail.com", tier: "VIP", visits: 72, spent: 1890.00 },
    { name: "Amir Rashid", phone: "+962790000003", email: "amir.r@gmail.com", tier: "VIP", visits: 68, spent: 1650.00 },

    // Regular Customers (Medium Value)
    { name: "Emily Davis", phone: "+962790000004", email: "emily.d@gmail.com", tier: "Gold", visits: 45, spent: 980.00 },
    { name: "Khalid Hassan", phone: "+962790000005", email: "khalid.h@gmail.com", tier: "Gold", visits: 42, spent: 920.00 },
    { name: "Linda Chen", phone: "+962790000006", email: "linda.c@gmail.com", tier: "Gold", visits: 38, spent: 850.00 },
    { name: "Omar Farid", phone: "+962790000007", email: "omar.f@gmail.com", tier: "Gold", visits: 35, spent: 780.00 },
    { name: "Jessica Brown", phone: "+962790000008", email: "jessica.b@gmail.com", tier: "Gold", visits: 32, spent: 720.00 },

    // Regular Customers (Standard)
    { name: "Hana Youssef", phone: "+962790000009", email: "hana.y@gmail.com", tier: "Silver", visits: 25, spent: 520.00 },
    { name: "Michael Wilson", phone: "+962790000010", email: "michael.w@gmail.com", tier: "Silver", visits: 22, spent: 480.00 },
    { name: "Nadia Karam", phone: "+962790000011", email: "nadia.k@gmail.com", tier: "Silver", visits: 20, spent: 420.00 },
    { name: "James Taylor", phone: "+962790000012", email: "james.t@gmail.com", tier: "Silver", visits: 18, spent: 380.00 },
    { name: "Reem Abbas", phone: "+962790000013", email: "reem.a@gmail.com", tier: "Silver", visits: 16, spent: 340.00 },
    { name: "David Miller", phone: "+962790000014", email: "david.m@gmail.com", tier: "Silver", visits: 15, spent: 320.00 },

    // New Customers
    { name: "Yasmin Haddad", phone: "+962790000015", email: "yasmin.h@gmail.com", tier: "Bronze", visits: 8, spent: 165.00 },
    { name: "Robert Anderson", phone: "+962790000016", email: "robert.a@gmail.com", tier: "Bronze", visits: 6, spent: 125.00 },
    { name: "Lina Mansour", phone: "+962790000017", email: "lina.m@gmail.com", tier: "Bronze", visits: 5, spent: 98.00 },
    { name: "Thomas Garcia", phone: "+962790000018", email: "thomas.g@gmail.com", tier: "Bronze", visits: 4, spent: 75.00 },
    { name: "Dina Khalil", phone: "+962790000019", email: "dina.k@gmail.com", tier: "Bronze", visits: 3, spent: 52.00 },
    { name: "Jennifer Lee", phone: "+962790000020", email: "jennifer.l@gmail.com", tier: "Bronze", visits: 2, spent: 35.00 },

    // Walk-in / Occasional
    { name: "Sami Nasser", phone: "+962790000021", email: null, tier: "New", visits: 1, spent: 18.50 },
    { name: "Patricia Moore", phone: "+962790000022", email: null, tier: "New", visits: 1, spent: 22.00 },
    { name: "Tariq Saleh", phone: "+962790000023", email: "tariq.s@gmail.com", tier: "New", visits: 1, spent: 15.00 },
    { name: "Michelle White", phone: "+962790000024", email: null, tier: "New", visits: 1, spent: 28.00 },
    { name: "Ziad Hamdan", phone: "+962790000025", email: null, tier: "New", visits: 1, spent: 12.50 }
  ],

  paymentMethods: [
    { name: "Cash", weight: 35 },
    { name: "Card", weight: 40 },
    { name: "Apple Pay", weight: 15 },
    { name: "Google Pay", weight: 10 }
  ]
};
