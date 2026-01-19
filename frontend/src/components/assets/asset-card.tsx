'use client';

import { Asset } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Pencil, Trash2, Building2, Wallet } from 'lucide-react';
import { differenceInMonths, parseISO } from 'date-fns';

interface AssetCardProps {
    asset: Asset;
    date: Date; // Usado para executar calculo de valor atual ou progresso
    onEdit?: (asset: Asset) => void;
    onDelete?: (asset: Asset) => void;
    onClick?: () => void;
}

export function AssetCard({ asset, date, onEdit, onDelete, onClick }: AssetCardProps) {
    const isRealEstate = asset.type === 'REAL_ESTATE';

    // Obter o valor final (último registro)
    // No futuro, isso pode ser filtrado pela data selecionada
    const lastRecord = asset.records && asset.records.length > 0
        ? asset.records[asset.records.length - 1]
        : null;

    const currentValue = lastRecord ? lastRecord.value : 0;

    // Lógica para financiamento (progresso)
    const renderFinancingStatus = () => {
        if (!asset.financing) return null;

        const startDate = parseISO(asset.financing.startDate);
        const monthsPassed = differenceInMonths(date, startDate);
        const totalInstallments = asset.financing.installments;
        const progress = Math.min(monthsPassed, totalInstallments);

        // Se ainda não começou
        if (monthsPassed < 0) {
            return (
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-medium flex items-center gap-1">
                        $ Financiado
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Início em {asset.financing.startDate.substring(0, 10)}
                    </span>
                </div>
            );
        }

        // Se já terminou
        if (monthsPassed >= totalInstallments) {
            return (
                <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#48F7A1]/10 text-[#48F7A1] font-medium">
                        Quitado
                    </span>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white text-black font-bold flex items-center gap-1">
                        $ Financiado
                    </span>
                    {/* Valor total do financiamento ou parcela? O Figma mostra "R$ 148.666 de R$ 2.123.800"
                        Assumindo que o valor exibido no card (currentValue) é o valor JÁ PAGO (Equity).
                        E o valor total do imóvel é outra coisa?
                        Normalmente em Assets coloca-se o valor de mercado (Market Value).
                        O passivo (Dívida) é calculado separadamente.
                        
                        Mas seguindo o Figma "Progresso: 14/200 parcelas"
                     */}
                    <span className="text-xs text-muted-foreground">
                        Progresso: {progress}/{totalInstallments} parcelas
                    </span>
                </div>
            </div>
        );
    };

    const borderColor = isRealEstate ? 'border-[#03B6AD]' : 'border-[#6777FA]';
    const valueColor = isRealEstate ? 'text-[#03B6AD]' : 'text-[#6777FA]';

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-5 rounded-2xl bg-[#1a1a1a] border relative flex flex-col justify-between group min-h-[160px] cursor-pointer transition-all hover:bg-[#222]",
                borderColor
            )}>
            {/* Action buttons - show on hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onEdit && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(asset); }}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-[#333] text-muted-foreground hover:text-white transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
                        className="p-1.5 rounded-md bg-[#262626] hover:bg-red-900/50 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            <div>
                <h3 className="text-lg font-normal text-[#e5e5e5] mb-2 truncate" title={asset.name}>
                    {asset.name}
                </h3>

                <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                        {isRealEstate ? 'Imóvel' : 'Renda Fixa / Invest.'}
                    </div>

                    {isRealEstate && renderFinancingStatus()}
                </div>
            </div>

            <div className="flex items-center self-end mt-4 gap-2">
                {isRealEstate ? <Building2 className="h-4 w-4 text-[#03B6AD]" /> : <Wallet className="h-4 w-4 text-[#6777FA]" />}
                <span className={cn("text-lg font-medium", valueColor)}>
                    {formatCurrency(currentValue)}
                </span>
                {asset.financing && (
                    <span className="text-xs text-muted-foreground ml-2">
                        {/* Optional extra info */}
                    </span>
                )}
            </div>
        </div>
    );
}
