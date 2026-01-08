import { motion } from 'framer-motion';
import { Store, Zap, Settings, ShieldCheck } from 'lucide-react';

const features = [
  {
    title: "Multi-Establishment",
    description: "Effortlessly manage multiple locations, separate menus, and aggregated reports from a single powerful login.",
    icon: <Store className="w-8 h-8" />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  },
  {
    title: "Lightning Speed",
    description: "Our core engine is optimized for performance, ensuring your checkout process is fluid even during peak rush hours.",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-paymint-green/10 text-paymint-green"
  },
  {
    title: "Full Customization",
    description: "Configure workflows, payment methods, and receipt templates to match your specific business requirements.",
    icon: <Settings className="w-8 h-8" />,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
  },
  {
    title: "Enterprise Security",
    description: "Bank-level encryption and secure role-based access controls keep your business and customer data protected 24/7.",
    icon: <ShieldCheck className="w-8 h-8" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  }
];

export const KeySellingPoints = () => {
  return (
    <section className="py-24 bg-white dark:bg-[#050505] transition-colors duration-300">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            Built for <span className="text-paymint-green">Growth</span>
          </motion.h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg lg:text-xl font-medium leading-relaxed">
            PayMint provides the essential tools you need to scale your operations without the overhead of traditional hardware systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-paymint-green/30 transition-all group"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-paymint-green transition-colors">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};