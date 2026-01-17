'use client';

import { cn } from '@/lib/utils';
import type { Insurance } from '@/types';

interface InsuranceCardProps {
    insurance: Insurance;
    onClick?: () => void;
}

export function InsuranceCard({ insurance, onClick }: InsuranceCardProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'LIFE':
                return 'Seguro de Vida';
            case 'DISABILITY':
                return 'Seguro de Invalidez';
            case 'HEALTH':
                return 'Seguro Saúde';
            case 'PROPERTY':
                return 'Seguro Patrimonial';
            default:
                return type;
        }
    };

    const getDurationLabel = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years > 0 && remainingMonths > 0) {
            return `${years} anos e ${remainingMonths} meses`;
        }
        if (years > 0) {
            return `${years} anos`;
        }
        return `${remainingMonths} meses`;
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
                    <h4 className="font-medium text-foreground">{insurance.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {getTypeLabel(insurance.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Duração: <span className="text-foreground">{getDurationLabel(insurance.durationMonths)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Prêmio: <span className="text-foreground">R$ {insurance.premium}/mês</span>
                    </p>
                </div>
                <div className="text-lg font-semibold text-primary">
                    {formatCurrency(insurance.insuredValue)}
                </div>
            </div>
        </div>
    );
}
