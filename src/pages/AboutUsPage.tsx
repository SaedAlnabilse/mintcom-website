import { motion } from 'framer-motion';
import { Target, Shield, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const AboutUsPage = () => {
    const values = [
        {
            icon: Target,
            title: 'Affordable. Transparent. Complete.',
            description: 'PayMint offers one of the most competitive POS solutions in the market when considering the full range of included services. Our pricing is transparent, with no hidden fees or unexpected costs—just a complete, all-in-one system at an accessible monthly rate.'
        },
        {
            icon: Zap,
            title: 'Built for Simplicity',
            description: 'We developed PayMint in close collaboration with business owners and frontline staff. The result is an intuitive system that can be learned in minutes, not days. Guided in-app tours and clear workflows ensure users always know what to do and how to do it.'
        },
        {
            icon: Shield,
            title: 'Performance-Driven Design',
            description: 'Speed, reliability, and usability are central to everything we build. PayMint is engineered for fast transactions and smooth daily operations. Our UI and workflows are designed using behavioral insights and user interaction analysis, ensuring that critical actions are easy to access and setup is quick and effortless.'
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white overflow-x-hidden font-sans">
            <Navbar />

            {/* About PayMint - Main Introduction */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-paymint-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">
                            About PayMint
                        </h1>
                        <div className="prose prose-lg dark:prose-invert mx-auto">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                PayMint LLC is a technology solutions company specializing in Point of Sale (POS) systems and digital business management platforms. Our products are designed to simplify daily operations—from fast, reliable sales processing on digital devices to automated management tools that give businesses full operational visibility.
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                At the core of PayMint is one clear goal: to give business owners accurate, real-time access to their data while enabling faster, smoother checkout experiences for their customers.
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
                                The PayMint app is available on both iOS and Android and can be downloaded for free. Businesses can create a PayMint account and complete setup directly through the POS app or via the online management dashboard.
                            </p>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                                PayMint also supports multi-branch operations. Owners and account managers can add, merge, or separate establishments as needed, all from a single universal dashboard. This allows centralized control over sales, staff, products, and performance across multiple locations, with discounted pricing for additional branches.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Our Value Proposition */}
            <div className="py-24 bg-gray-50 dark:bg-[#1E293B]/50 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Value Proposition</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-paymint-green/30 transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-paymint-green/10">
                                    <value.icon className="w-7 h-7 text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Story */}
            <div className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                            Our Story
                        </h2>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-6 leading-relaxed text-center max-w-3xl mx-auto">
                            PayMint LLC is a Jordanian company operating globally. The platform officially launched in 2025, built on insights gathered from years of research into the POS and retail technology space.
                        </p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
                            Development spanned more than three years, with a strong focus on security, performance, and scalability. Every feature was designed to meet real-world business needs and compete confidently with leading global POS solutions. Today, PayMint stands as a modern, secure, and scalable system built to support businesses of all sizes—anywhere in the world.
                        </p>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};
