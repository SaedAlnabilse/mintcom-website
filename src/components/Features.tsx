import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Settings, Store, Play } from 'lucide-react';

const features = [
  {
    icon: <Store className="w-6 h-6 text-white" />,
    title: "A Complete Solution — No Hidden Costs",
    description: "PayMint is more than a checkout system. You get a powerful reporting engine with advanced filters, staff and role management, customer profiles and loyalty programs, discounts, raw material and stock tracking, and much more—all included in one fixed monthly plan."
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Designed for Real Users",
    description: "PayMint is built for business owners, cashiers, and managers—not tech experts. We worked closely with real users to design an intuitive experience that minimizes training time. From login to first sale in under 10 minutes."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-white" />,
    title: "Enterprise-Grade Security",
    description: "Your data is fully encrypted, securely stored, and automatically archived. We've invested heavily in top-tier security standards to ensure your business information is protected at all times."
  },
  {
    icon: <Settings className="w-6 h-6 text-white" />,
    title: "Multi-Branch Management",
    description: "Run one store or many—PayMint supports multiple merged branches or separate stores under one unified dashboard. Manage staff, products, sales, and performance across all locations from a single control panel."
  }
];

export const Features = () => {
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  // Lazy load video when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoLoaded) {
            setIsVideoVisible(true);
            setIsVideoLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [isVideoLoaded]);

  return (
    <section id="features" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />

      <div className="container mx-auto px-8 md:px-16 lg:px-24">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left Side: Video Preview - Lazy Loaded */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-paymint-green/30 to-blue-500/30 rounded-[2rem] blur-2xl opacity-50" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 aspect-video bg-gray-900">
              {isVideoVisible ? (
                <iframe
                  src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&background=1&muted=1&loop=1"
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                  loading="lazy"
                  title="PayMint Demo Video"
                />
              ) : (
                // Placeholder while video loads
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-paymint-green/20 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-paymint-green" fill="currentColor" />
                    </div>
                    <p className="text-white/60 text-sm">Loading video...</p>
                  </div>
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 text-white">
                <p className="font-bold text-lg">See PayMint in Action</p>
                <p className="text-sm text-white/80">Real-time sync across all devices</p>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-6 tracking-tight">
                Why <span className="text-paymint-green">PayMint?</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
                At PayMint, we believe in keeping things simple: simple onboarding, simple installation, simple setup, and simple pricing.
              </p>
            </motion.div>

            <div className="grid gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-5 p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-paymint-green/30 transition-all group"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-paymint-green transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
