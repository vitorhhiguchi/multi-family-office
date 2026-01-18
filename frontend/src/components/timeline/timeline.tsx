'use client';

import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export interface TimelineEvent {
    year: number;
    label?: string;
    type: 'income' | 'expense';
    value?: number;
}

interface TimelineProps {
    startYear?: number;
    endYear?: number;
    clientBirthYear?: number;
    events?: TimelineEvent[];
    className?: string;
    onAddClick?: () => void;
}

export function Timeline({
    startYear = 2025,
    endYear = 2060,
    clientBirthYear = 1980,
    events = [],
    className,
    onAddClick,
}: TimelineProps) {
    const years: number[] = [];
    for (let year = startYear; year <= endYear; year++) {
        years.push(year);
    }

    const getAge = (year: number) => year - clientBirthYear;

    const getIncomeEvent = (year: number) =>
        events.find((e) => e.year === year && e.type === 'income');

    const getExpenseEvent = (year: number) =>
        events.find((e) => e.year === year && e.type === 'expense');

    const COLORS = {
        green: '#00C900',
        red: '#FF5151',
        blue: '#67AEFA',
        greyLine: '#334155',
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
        }).format(Math.abs(val));
    };

    return (
        <div className={cn('w-full py-6 select-none bg-[#1a1a1a]', className)}>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between px-2">
                <h3
                    className="text-2xl font-normal font-serif"
                    style={{ color: COLORS.blue }}
                >
                    Timeline
                </h3>
                <button
                    onClick={onAddClick}
                    className="flex items-center gap-2 rounded-full border border-slate-700 bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
                >
                    <Plus size={14} /> Adicionar
                </button>
            </div>

            {/* Container com Scroll Horizontal */}
            <div className="relative w-full overflow-x-auto pb-4 no-scrollbar">

                {/* Grid de layout da timeline */}
                <div
                    className="grid w-full"
                    style={{
                        // Coluna 1: Labels fixos (80px)
                        // Resto: minmax(40px, 1fr) -> Estica se der (1fr), mas garante mínimo de 40px
                        gridTemplateColumns: `80px repeat(${years.length}, minmax(40px, 1fr))`
                    }}
                >

                    {/* === FAIXA 1: SALÁRIO / RENDA === */}

                    {/* Rótulo Esquerdo */}
                    <div className="flex items-end pb-3 pr-4 sticky left-0 bg-[#1a1a1a] z-10">
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
                            <span className="text-sm font-medium" style={{ color: COLORS.green }}>Salário</span>
                        </div>
                    </div>

                    {/* Linha do Tempo de Renda */}
                    {years.map((year) => {
                        const event = getIncomeEvent(year);
                        return (
                            <div key={`inc-${year}`} className="relative flex flex-col items-center justify-end h-24">
                                <div className="absolute bottom-[11px] left-0 w-full border-b" style={{ borderColor: COLORS.greyLine }} />
                                <div className="absolute bottom-1 h-3 w-px bg-slate-700" />

                                {event && (
                                    <div className="absolute bottom-[7px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 w-max">
                                        {event.label && (
                                            <span
                                                className="mb-2 text-center text-xs font-semibold leading-tight whitespace-nowrap"
                                                style={{ color: COLORS.green }}
                                            >
                                                {event.label.split('\n').map((line, idx) => (
                                                    <span key={idx} className="block">{line}</span>
                                                ))}
                                            </span>
                                        )}
                                        <div
                                            className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(0,201,0,0.5)] ring-4 ring-[#1a1a1a]"
                                            style={{ backgroundColor: COLORS.green }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}


                    {/* === FAIXA 2: RÉGUA CENTRAL (ANO / IDADE) === */}

                    <div className="flex flex-col justify-center gap-1 sticky left-0 bg-[#1a1a1a] z-10 pr-4">
                        <span className="text-xs text-slate-500 font-medium">Ano</span>
                        <span className="text-xs text-slate-500 font-medium">Idade</span>
                    </div>

                    {years.map((year) => {
                        const isMajorYear = year % 5 === 0;
                        return (
                            <div key={`ruler-${year}`} className="flex flex-col items-center justify-center py-4 gap-1 relative">
                                {isMajorYear ? (
                                    <>
                                        <span className="text-sm font-bold text-slate-100">{year}</span>
                                        <span className="text-xs text-slate-500">{getAge(year)}</span>
                                    </>
                                ) : (
                                    <div className="w-1 h-8" />
                                )}
                            </div>
                        );
                    })}


                    {/* === FAIXA 3: CUSTO DE VIDA === */}

                    <div className="flex items-start pt-3 pr-4 sticky left-0 bg-[#1a1a1a] z-10">
                        <div className="flex flex-col items-start gap-0.5">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
                                <span className="text-sm font-medium leading-none" style={{ color: COLORS.red }}>Custo</span>
                            </div>
                            <span className="text-xs font-medium ml-4.5 pl-[18px]" style={{ color: COLORS.red }}>de vida</span>
                        </div>
                    </div>

                    {years.map((year) => {
                        const event = getExpenseEvent(year);
                        return (
                            <div key={`exp-${year}`} className="relative flex flex-col items-center justify-start h-24">
                                <div className="absolute top-[11px] left-0 w-full border-t" style={{ borderColor: COLORS.greyLine }} />
                                <div className="absolute top-1 h-3 w-px bg-slate-700" />

                                {event && (
                                    <div className="absolute top-[7px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 w-max">
                                        <div
                                            className="h-3 w-3 rounded-full shadow-[0_0_8px_rgba(255,81,81,0.5)] ring-4 ring-[#1a1a1a]"
                                            style={{ backgroundColor: COLORS.red }}
                                        />
                                        {event.value && (
                                            <span
                                                className="mt-2 text-xs font-semibold whitespace-nowrap"
                                                style={{ color: COLORS.red }}
                                            >
                                                {formatCurrency(event.value)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}
