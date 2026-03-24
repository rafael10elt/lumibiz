import { cn } from '../../lib/utils';

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue via-brand-blue-deep to-brand-orange shadow-glow">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_42%,rgba(255,255,255,0.06)_72%,transparent)]" />
        <span className="relative text-xl font-black tracking-tight text-white">LB</span>
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-semibold tracking-tight text-app-primary">LumiBiz</p>
          <p className="text-xs uppercase tracking-[0.24em] text-app-muted">Business OS</p>
        </div>
      )}
    </div>
  );
}
