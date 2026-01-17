'use client';

import { cn } from '@/lib/utils';

interface PatrimonyCardProps {
    year: number;
    label?: string;
    age: number;
    value: number;
    percentChange?: number;
    variant?: 'default' | 'highlight' | 'blue';
}

export function PatrimonyCard({
    year,
    label,
    age,
    value,
    percentChange,
    variant = 'default',
}: PatrimonyCardProps) {
    const isPositive = percentChange && percentChange > 0;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 2,
        }).format(val);
    };

    const getGradientStyle = () => {
        switch (variant) {
            case 'highlight':
                return 'bg-gradient-to-b from-emerald-600 to-emerald-800';
            case 'blue':
                return 'bg-gradient-to-b from-blue-600 to-blue-800';
            default:
                return 'bg-gradient-to-b from-zinc-700 to-zinc-800';
        }
    };

    return (
        <div className="flex flex-col items-center min-w-[120px]">
            {/* Value and percent */}
            <div className="text-center mb-2">
                <div className="text-sm font-medium text-foreground">
                    {formatCurrency(value)}
                    {percentChange !== undefined && (
                        <span
                            className={cn(
                                'ml-1 text-xs',
                                isPositive ? 'text-green-400' : 'text-red-400'
                            )}
                        >
                            {isPositive ? '+' : ''}
                            {percentChange.toFixed(2)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Gradient bar */}
            <div className={cn('w-full h-16 rounded-lg overflow-hidden relative', getGradientStyle())}>
                {/* Striped pattern for non-current years */}
                {variant !== 'highlight' && (
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                    }} />
                )}
            </div>

            {/* Year and age */}
            <div className="text-center mt-2">
                <div className="text-xs text-muted-foreground">
                    {year} {label && <span className="text-primary">{label}</span>}
                </div>
                <div className="text-sm font-medium text-foreground">{age} anos</div>
            </div>
        </div>
    );
}
