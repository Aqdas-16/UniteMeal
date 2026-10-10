import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useSpring } from 'motion/react';

export function AnimatedCounter({ value, suffix='', prefix='' }: { value: number, suffix?: string, prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const springValue = useSpring(0, {
    bounce: 0,
    duration: 1200,
  });

  useEffect(() => {
    if (inView) {
      springValue.set(value);
    }
  }, [inView, value, springValue]);

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return <span ref={ref}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function MotionSection({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className, layout = false }: { children: React.ReactNode, className?: string, layout?: boolean }) {
  return (
    <motion.div variants={itemVariants} className={className} layout={layout}>
      {children}
    </motion.div>
  );
}
