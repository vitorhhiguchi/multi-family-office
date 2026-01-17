'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { Movement } from '@/types';

interface MovementCardProps {
    movement: Movement;
    onClick?: () => void;
}

export function MovementCard({ movement, onClick }: MovementCardProps) {
    const isIncome = movement.type === 'INCOME';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'MONTHLY':
                return 'Mensal';
            case 'ANNUALLY':
                return 'Anual';
            case 'ONE_TIME':
                return 'Única';
            default:
                return freq;
        }
    };

    const getCategoryLabel = (category?: string | null) => {
        if (!category) return isIncome ? 'Crédito' : 'Dependente';
        switch (category) {
            case 'WORK':
                return 'Trabalho';
            case 'PASSIVE':
                return 'Passivo';
            case 'OTHER':
                return 'Crédito';
            default:
                return category;
        }
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-card border border-border rounded-xl p-4 cursor-pointer',
                'hover:border-primary/50 transition-colors'
            )}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-medium text-foreground">{movement.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(movement.startDate)}
                        {movement.endDate && ` - ${formatDate(movement.endDate)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Frequência: <span className="text-foreground">{getFrequencyLabel(movement.frequency)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(movement.category)}
                    </p>
                </div>
                <div className={cn(
                    'flex items-center gap-1 text-lg font-semibold',
                    isIncome ? 'text-green-400' : 'text-red-400'
                )}>
                    {isIncome ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : (
                        <ArrowDown className="h-4 w-4" />
                    )}
                    {formatCurrency(movement.value)}
                </div>
            </div>
        </div>
    );
}
