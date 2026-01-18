import { motion } from 'framer-motion';

const brands = [
  { name: "Global Eats", logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop&q=80" },
  { name: "Urban Style", logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&q=80" },
  { name: "Fresh Basket", logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop&q=80" },
  { name: "Tech Hub", logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop&q=80" },
  { name: "Prime Cuts", logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=100&h=100&fit=crop&q=80" },
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-white/0 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-12">
          Empowering the next generation of business
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
          {brands.map((brand, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
                <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
