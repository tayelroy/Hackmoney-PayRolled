import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary/50"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down';
}

export function StatsCard({ title, value, subtitle, trend }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col space-y-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <div className="flex items-baseline space-x-2">
          <h2 className="font-mono text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h2>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs font-semibold",
                trend === 'up' ? "text-emerald-500" : "text-destructive"
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trend === 'up' ? '+2.5%' : '-1.2%'}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground/80">
            {subtitle}
          </p>
        )}
      </div>
      <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
