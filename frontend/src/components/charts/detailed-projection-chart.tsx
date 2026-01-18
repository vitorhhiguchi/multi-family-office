'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Line,
    ComposedChart,
} from 'recharts';
import type { YearProjection } from '@/types';

interface SimulationProjection {
    simulationId: number;
    simulationName: string;
    projections: YearProjection[];
}

interface DetailedProjectionChartProps {
    projections: SimulationProjection[];
    showWithoutInsurance?: boolean;
}

// Anka Design System Colors
const COLORS = {
    financial: '#6777FA',      // Blue for financial assets
    realEstate: '#03B6AD',     // Teal for real estate
    totalLine: '#48F7A1',      // Green line for total
    withoutInsurance: '#F7B748', // Yellow for total without insurance
    grid: '#333333',
};

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium text-foreground mb-2">Ano: {label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-medium text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                maximumFractionDigits: 0,
                            }).format(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function DetailedProjectionChart({
    projections,
    showWithoutInsurance = true
}: DetailedProjectionChartProps) {
    if (!projections || projections.length === 0 || !projections[0]?.projections?.length) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de projeção disponível
            </div>
        );
    }

    // Use the first simulation for the detailed view
    const mainProjection = projections[0];

    // Transform data for the chart
    const chartData = mainProjection.projections.map(p => ({
        year: p.year,
        'Ativos Financeiros': p.financialAssets || 0,
        'Ativos Imobilizados': p.realEstateAssets || 0,
        'Patrimônio Total': p.totalPatrimony,
        'Total sem Seguros': p.totalPatrimonyWithoutInsurance || p.totalPatrimony,
    }));

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorFinancial" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.financial} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.financial} stopOpacity={0.2} />
                        </linearGradient>
                        <linearGradient id="colorRealEstate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.realEstate} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.realEstate} stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.grid}
                        horizontal={true}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="year"
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 11 }}
                        tickLine={{ stroke: '#666' }}
                        axisLine={{ stroke: COLORS.grid }}
                        interval={4}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 11 }}
                        tickLine={{ stroke: '#666' }}
                        axisLine={{ stroke: COLORS.grid }}
                        tickFormatter={formatCurrency}
                        width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value) => (
                            <span className="text-sm text-muted-foreground">{value}</span>
                        )}
                    />

                    {/* Stacked Areas for Asset Types */}
                    <Area
                        type="monotone"
                        dataKey="Ativos Financeiros"
                        stackId="1"
                        stroke={COLORS.financial}
                        fill="url(#colorFinancial)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="Ativos Imobilizados"
                        stackId="1"
                        stroke={COLORS.realEstate}
                        fill="url(#colorRealEstate)"
                        strokeWidth={2}
                    />

                    {/* Line for Total Patrimony */}
                    <Line
                        type="monotone"
                        dataKey="Patrimônio Total"
                        stroke={COLORS.totalLine}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: COLORS.totalLine, stroke: '#0f0f0f', strokeWidth: 2 }}
                    />

                    {/* Optional line for Total without Insurance */}
                    {showWithoutInsurance && (
                        <Line
                            type="monotone"
                            dataKey="Total sem Seguros"
                            stroke={COLORS.withoutInsurance}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
