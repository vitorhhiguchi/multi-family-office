'use client';

import { cn } from '@/lib/utils';
import type { YearProjection } from '@/types';

interface SimulationProjection {
    simulationId: number;
    simulationName: string;
    projections: YearProjection[];
}

interface ProjectionTableProps {
    projections: SimulationProjection[];
    className?: string;
}

const formatCurrency = (val: number) => {
    if (isNaN(val) || val === undefined || val === null) {
        return 'R$ --';
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(val);
};

export function ProjectionTable({ projections, className }: ProjectionTableProps) {
    if (!projections || projections.length === 0 || !projections[0]?.projections?.length) {
        return (
            <div className="text-center text-muted-foreground py-8">
                Nenhum dado de projeção disponível
            </div>
        );
    }

    // Get years from first simulation
    const years = projections[0].projections.map(p => p.year);

    // Sample every 5 years to keep table manageable
    const sampleYears = years.filter((year, idx) => idx === 0 || idx === years.length - 1 || year % 5 === 0);

    return (
        <div className={cn("w-full overflow-x-auto", className)}>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[#333]">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium sticky left-0 bg-[#1a1a1a]">
                            Ano
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">
                            Idade
                        </th>
                        {projections.map(sim => (
                            <th
                                key={sim.simulationId}
                                className="text-right py-3 px-4 text-muted-foreground font-medium whitespace-nowrap"
                            >
                                {sim.simulationName}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sampleYears.map(year => {
                        const firstSimYear = projections[0].projections.find(p => p.year === year);
                        return (
                            <tr key={year} className="border-b border-[#262626] hover:bg-[#262626]/50 transition-colors">
                                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-[#1a1a1a]">
                                    {year}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">
                                    {firstSimYear?.age || '--'}
                                </td>
                                {projections.map(sim => {
                                    const yearData = sim.projections.find(p => p.year === year);
                                    return (
                                        <td
                                            key={sim.simulationId}
                                            className="py-3 px-4 text-right font-medium text-foreground"
                                        >
                                            {yearData ? formatCurrency(yearData.patrimonyEnd) : '--'}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
