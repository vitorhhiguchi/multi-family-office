'use client';

import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import type { Insurance } from '@/types';

interface InsuranceCardProps {
    insurance: Insurance;
    onEdit?: (insurance: Insurance) => void;
    onDelete?: (insurance: Insurance) => void;
}

export function InsuranceCard({ insurance, onEdit, onDelete }: InsuranceCardProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const durationYears = insurance.durationMonths ? Math.floor(insurance.durationMonths / 12) : 15;

    return (
        <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#48F7A1] relative flex flex-col justify-between group min-h-[160px]">
            {/* Action buttons - show on hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <button
                        onClick={() => onEdit(insurance)}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-[#333] text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(insurance)}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-red-900/50 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div>
                <h3 className="text-lg font-normal text-[#e5e5e5] mb-2">{insurance.name}</h3>

                <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                        Seguro de {insurance.type === 'LIFE' ? 'Vida' : 'Invalidez'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Duração: <span className="text-[#e5e5e5]">{durationYears} anos</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Prêmio: <span className="text-[#e5e5e5]">{formatCurrency(insurance.premium)}/mês</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center self-end mt-4">
                <span className="text-lg font-medium text-[#a855f7]">
                    {formatCurrency(insurance.insuredValue)}
                </span>
            </div>
        </div>
    );
}

