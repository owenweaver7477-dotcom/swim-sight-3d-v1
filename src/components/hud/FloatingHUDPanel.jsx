import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Maximize2 } from 'lucide-react';

const dockMotion = {
  left: { x: -280, y: 0 },
  right: { x: 280, y: 0 },
  top: { x: 0, y: -220 },
  bottom: { x: 0, y: 220 },
};

const dockTabClass = {
  left: 'left-3 top-1/2 -translate-y-1/2',
  right: 'right-3 top-1/2 -translate-y-1/2',
  top: 'top-3 left-1/2 -translate-x-1/2',
  bottom: 'bottom-3 left-1/2 -translate-x-1/2',
};

export default function FloatingHUDPanel({
  title,
  label,
  children,
  className = '',
  dock = 'right',
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const offset = dockMotion[dock] || dockMotion.right;

  return (
    <>
      <motion.section
        layout
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={
          collapsed
            ? { opacity: 0.08, scale: 0.94, ...offset }
            : { opacity: 1, x: 0, y: 0, scale: 1 }
        }
        transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.8 }}
        className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 text-slate-100 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl ${className}`}
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden={collapsed}
      >
        <div className="pointer-events-none absolute left-3 top-3 text-[10px] font-light leading-none text-cyan-300/45">+</div>
        <div className="pointer-events-none absolute right-3 top-3 text-[10px] font-light leading-none text-cyan-300/45">+</div>
        <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] font-light leading-none text-cyan-300/45">+</div>
        <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] font-light leading-none text-cyan-300/45">+</div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/45 to-transparent" />
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            {label && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                [ {label} ]
              </div>
            )}
            <h2 className="mt-1 truncate text-sm font-semibold tracking-wide text-white">{title}</h2>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, backgroundColor: 'rgba(14, 165, 233, 0.18)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:text-cyan-100"
            aria-label={`Minimize ${title}`}
          >
            <Minus className="h-4 w-4" />
          </motion.button>
        </div>
        <motion.div
          initial="hidden"
          animate={collapsed ? 'hidden' : 'show'}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.045, delayChildren: 0.04 },
            },
          }}
          className="px-4 py-4"
        >
          {children}
        </motion.div>
      </motion.section>

      <AnimatePresence>
        {collapsed && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={() => setCollapsed(false)}
            className={`pointer-events-auto fixed z-[90] flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/75 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-xl shadow-cyan-950/30 backdrop-blur-xl ${dockTabClass[dock]}`}
            aria-label={`Restore ${title}`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {label || title}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
