import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Laptop, BarChart2, Play } from 'lucide-react';
import WhiteLogo from '../assets/white-green-full-logo.png';
import GreenLogo from '../assets/green-full-logo.png';

export const AdminControl = () => {
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
    <section id="admin" className="py-24 lg:py-32 bg-white dark:bg-[#0f0f0f] overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-8 md:px-16 lg:px-24">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">

          {/* Right Side: Video Preview (Mobile App Style) - Lazy Loaded */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative flex justify-center lg:justify-end"
          >
            {/* Phone Frame Mockup */}
            <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20" />
              <div className="w-full h-full bg-black relative">
                {isVideoVisible ? (
                  <iframe
                    src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&background=1&muted=1&loop=1"
                    className="absolute top-1/2 left-1/2 w-[300%] h-[100%] -translate-x-1/2 -translate-y-1/2"
                    allow="autoplay; fullscreen; picture-in-picture"
                    style={{ pointerEvents: 'none' }}
                    loading="lazy"
                    title="PayMint Admin App Demo"
                  />
                ) : (
                  // Placeholder while video loads
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-paymint-green/20 flex items-center justify-center mx-auto mb-3">
                        <Play className="w-6 h-6 text-paymint-green" fill="currentColor" />
                      </div>
                      <p className="text-white/40 text-xs">Loading...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-paymint-green rounded-full flex items-center justify-center">
                    <BarChart2 size={20} className="text-black" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Daily Revenue</p>
                    <p className="text-white font-bold text-lg">$2,450.00</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-paymint-green/20 rounded-full -z-10 animate-[spin_20s_linear_infinite]" />
          </motion.div>

          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-paymint-green/10 rounded-lg">
                <Laptop size={20} className="text-paymint-green" />
              </span>
              <span className="text-paymint-green font-bold tracking-wide text-sm">Owner & Admin Portal</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
              Full Visibility. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-paymint-green to-blue-500">Full Control.</span> <br />
              From Your Pocket.
            </h2>

            {/* Logo Lockup */}
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 w-fit">
              <img src={WhiteLogo} alt="PayMint Logo" className="h-8 w-auto object-contain hidden dark:block" loading="lazy" />
              <img src={GreenLogo} alt="PayMint Logo" className="h-8 w-auto object-contain block dark:hidden" loading="lazy" />
              <div className="h-8 w-px bg-gray-300 dark:bg-white/20"></div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Smartphone size={16} />
                <span>Admin App</span>
              </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              With the PayMint Admin Mobile App, you can monitor and manage your business anytime, anywhere—right from your phone.
            </p>

            <ul className="space-y-4">
              {['Shift Alerts', 'Stock Alerts', 'Live Sales & Performance Reports'].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <div className="w-6 h-6 rounded-full bg-paymint-green/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-paymint-green" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
