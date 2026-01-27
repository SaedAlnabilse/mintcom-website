import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "Paymint makes rush hours easy. New staff learn it in 15 minutes. It's very reliable.",
    author: "Omar Khaled",
    role: "Founder, Terra Cafe",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
  },
  {
    id: 2,
    text: "Managing multiple locations is easy. I can see all my branches on my phone. The reports helped us cut waste by 25% quickly.",
    author: "Sara Ibrahim",
    role: "Ceo, Ibrahim Retail Group",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
  }
];

export const FeaturedTestimonial = () => {
  const [index, setIndex] = useState(0);
  const testimonial = testimonials[index];

  const next = () => setIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 lg:py-32 bg-gray-50 dark:bg-[#050505] transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
              >
                {/* Image Section */}
                <div className="lg:w-1/2 relative group">
                  <div className="absolute inset-0 bg-paymint-green rounded-[3rem] rotate-3 opacity-10 group-hover:rotate-6 transition-transform duration-500" />
                  <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                    <img
                      src={testimonial.image}
                      alt={testimonial.author}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 hidden md:block">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="#7CC39F" className="text-paymint-green" />
                      ))}
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white tracking-widest">Verified Partner</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
                  <div className="w-16 h-16 bg-paymint-green/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0">
                    <Quote size={32} className="text-paymint-green" fill="currentColor" />
                  </div>

                  <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                    "{testimonial.text}"
                  </blockquote>

                  <div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-gray-500 dark:text-gray-400 font-bold tracking-widest text-xs mt-1">{testimonial.role}</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                    <button
                      onClick={prev}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all shadow-sm active:scale-90"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={next}
                      className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white hover:bg-paymint-green hover:text-black hover:border-paymint-green transition-all shadow-sm active:scale-90"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="ml-4 flex gap-2">
                      {testimonials.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? 'w-8 bg-paymint-green' : 'w-2 bg-gray-200 dark:bg-white/10'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
