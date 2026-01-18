'use client';

import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react';
import type { Movement } from '@/types';

interface MovementCardProps {
    movement: Movement;
    onEdit?: (movement: Movement) => void;
    onDelete?: (movement: Movement) => void;
}

export function MovementCard({ movement, onEdit, onDelete }: MovementCardProps) {
    // Use type field to determine income vs expense
    const isIncome = movement.type === 'INCOME';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(Math.abs(val));
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        }).format(date);
    };

    const frequencyLabel = {
        'MONTHLY': 'Mensal',
        'YEARLY': 'Anual',
        'ONCE': 'Única',
    }[movement.frequency] || movement.frequency;

    return (
        <div className={cn(
            "p-5 rounded-2xl bg-[#1a1a1a] border relative flex flex-col justify-between group min-h-[160px]",
            isIncome ? "border-[#48F7A1]" : "border-[#FF5151]"
        )}>
            {/* Action buttons - show on hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onEdit && (
                    <button
                        onClick={() => onEdit(movement)}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-[#333] text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(movement)}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-red-900/50 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div>
                <h3 className="text-lg font-normal text-[#e5e5e5] mb-2">{movement.name}</h3>
                <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                        {formatDate(movement.startDate)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Frequência: <span className="text-[#e5e5e5]">{frequencyLabel}</span>
                    </div>
                    {movement.category && (
                        <div className="text-sm text-muted-foreground">
                            {movement.category === 'WORK' ? 'Trabalho' : movement.category === 'PASSIVE' ? 'Passiva' : 'Outros'}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 self-end mt-4">
                {isIncome ? (
                    <ArrowUp className="h-4 w-4 text-[#48F7A1]" />
                ) : (
                    <ArrowDown className="h-4 w-4 text-[#FF5151]" />
                )}
                <span
                    className={cn(
                        "text-lg font-medium",
                        isIncome ? "text-[#48F7A1]" : "text-[#FF5151]"
                    )}
                >
                    {formatCurrency(movement.value)}
                </span>
            </div>
        </div>
    );
}


