import { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Twitter, Linkedin, Facebook, X, Tablet, Printer, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

const hardwareItems = [
  {
    id: 'tablets',
    name: 'Pos Tablets',
    icon: Tablet,
    description: 'Recommended tablets that work great with PayMint',
    products: [
      {
        name: 'Samsung Galaxy Tab A8',
        specs: '10.5" display, 4gb Ram, Wi-fi',
        price: '~$180',
        link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+a8'
      },
      {
        name: 'Ipad 10th Gen',
        specs: '10.9" display, A14 chip, Premium option',
        price: '~$350',
        link: 'https://www.amazon.com/s?k=ipad+10th+generation'
      },
      {
        name: 'Lenovo Tab M10 Plus',
        specs: '10.3" Fhd display, 4gb Ram, Long battery',
        price: '~$150',
        link: 'https://www.amazon.com/s?k=lenovo+tab+m10+plus'
      }
    ],
    note: 'Any Android tablet (8"+ screen) or Ipad works with PayMint'
  },
  {
    id: 'printers',
    name: 'Receipt Printers',
    icon: Printer,
    description: 'Recommended thermal printers for receipts',
    products: [
      {
        name: 'Munbyn Thermal Printer',
        specs: '80mm, Usb + Bluetooth, Auto-cutter',
        price: '~$100',
        link: 'https://www.amazon.com/s?k=munbyn+thermal+receipt+printer+80mm'
      },
      {
        name: 'Epson Tm-T20III',
        specs: '80mm, Usb, Fast & reliable',
        price: '~$180',
        link: 'https://www.amazon.com/s?k=epson+tm-t20iii'
      },
      {
        name: 'Star Micronics TSP143',
        specs: '80mm, Bluetooth, Kitchen-grade',
        price: '~$250',
        link: 'https://www.amazon.com/s?k=star+micronics+tsp143'
      }
    ],
    note: 'We support most 80mm and 58mm Esc/Pos thermal printers'
  }
];

export const Footer = () => {
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState(hardwareItems[0]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const productLinks = [
    { name: 'Features', action: () => scrollToSection('features') },
    { name: 'Pricing', action: () => scrollToSection('pricing') },
    { name: 'Hardware', action: () => setShowHardwareModal(true) },
    { name: 'Contact', action: () => scrollToSection('contact') },
  ];

  const companyLinks = [
    { name: 'About Us', action: () => scrollToSection('features') },
    { name: 'Contact', action: () => scrollToSection('contact') },
  ];

  return (
    <>
      <footer className="bg-gray-50 dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 pt-20 pb-10 transition-colors duration-300">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            {/* Brand */}
            <div className="space-y-8">
              <Logo size="lg" />
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-xs">
                Simple, secure Pos for growing businesses.
              </p>
              <div className="flex gap-4">
                {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-black text-gray-400 tracking-widest mb-8">Product</h4>
              <ul className="space-y-4">
                {productLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={link.action}
                      className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-black text-gray-400 tracking-widest mb-8">Company</h4>
              <ul className="space-y-4">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={link.action}
                      className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-black text-gray-400 tracking-widest mb-8">Get in Touch</h4>
              <ul className="space-y-6">
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                    <Mail size={14} className="text-paymint-green" />
                  </div>
                  <span>hello@paymint.com</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                    <Phone size={14} className="text-paymint-green" />
                  </div>
                  <span>+962 790 000 000</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-gray-200/50 dark:bg-white/5 flex items-center justify-center">
                    <MapPin size={14} className="text-paymint-green" />
                  </div>
                  <span>Amman, Jordan</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 dark:text-gray-500 text-sm font-bold">
              © 2025 PayMint Llc. All rights reserved.
            </p>
            <div className="flex gap-8">
              {['Privacy Policy', 'Terms of Service'].map((link) => (
                <a key={link} href="#" className="text-gray-500 dark:text-gray-500 text-xs font-bold hover:text-paymint-green transition-colors tracking-widest">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Hardware Modal */}
      <AnimatePresence>
        {showHardwareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHardwareModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-white/5 max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Hardware Solutions</h3>
                  <p className="text-sm font-bold text-gray-500 mt-1">Professional equipment for your business</p>
                </div>
                <button
                  onClick={() => setShowHardwareModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row h-[calc(90vh-100px)] max-h-[600px]">
                {/* Sidebar - Hardware Categories */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 p-4 overflow-x-auto md:overflow-y-auto">
                  <div className="flex md:flex-col gap-2">
                    {hardwareItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedHardware(item)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all whitespace-nowrap md:whitespace-normal w-full text-left ${selectedHardware.id === item.id
                            ? 'bg-paymint-green text-black'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                      >
                        <item.icon size={20} />
                        <span className="text-sm font-bold">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedHardware.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center">
                          <selectedHardware.icon size={28} className="text-paymint-green" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedHardware.name}</h4>
                          <p className="text-sm font-bold text-gray-500">{selectedHardware.description}</p>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="space-y-3 mb-6">
                        {selectedHardware.products.map((product, idx) => (
                          <a
                            key={idx}
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group border border-transparent hover:border-paymint-green/30"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center group-hover:bg-paymint-green transition-colors">
                                <CheckCircle2 size={18} className="text-paymint-green group-hover:text-white transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{product.name}</p>
                                <p className="text-xs font-bold text-gray-500">{product.specs}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-paymint-green">{product.price}</p>
                              <p className="text-xs text-gray-400">View on Amazon →</p>
                            </div>
                          </a>
                        ))}
                      </div>

                      {/* Note */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          <span className="font-bold">💡 Tip:</span> {selectedHardware.note}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
