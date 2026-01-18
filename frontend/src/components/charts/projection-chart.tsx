'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { YearProjection } from '@/types';

// Anka Design System Colors
// Anka Design System Colors
const ANKA_CHART_COLORS = {
    yellow: '#F7B748',  // Realizado (linha pontilhada amarela)
    blue: '#67AEFA',    // Plano Original (linha contínua azul)
    green: '#48F7A1',   // Situação Atual (linha tracejada verde)
};

interface ProjectionChartProps {
    projections: {
        simulationId: number;
        simulationName: string;
        projections: YearProjection[];
        color?: string;
        isOriginal?: boolean;
        isDashed?: boolean;
        isRealized?: boolean;
    }[];
}

// Format currency for Y axis
const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value}`;
};

// Custom tooltip
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

export function ProjectionChart({ projections }: ProjectionChartProps) {
    // Transform data for Recharts
    const chartData = projections[0]?.projections.map((p, index) => {
        const dataPoint: Record<string, any> = {
            year: p.year,
            age: p.age,
        };

        projections.forEach((sim) => {
            const projection = sim.projections[index];
            if (projection) {
                dataPoint[sim.simulationName] = projection.patrimonyEnd;
            }
        });

        return dataPoint;
    }) || [];

    const getColor = (sim: ProjectionChartProps['projections'][0]) => {
        if (sim.isRealized) return ANKA_CHART_COLORS.yellow;
        if (sim.isOriginal) return ANKA_CHART_COLORS.blue;
        if (sim.simulationName.toLowerCase().includes('situação')) return ANKA_CHART_COLORS.green;
        return ANKA_CHART_COLORS.blue; // Fallback
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#333333"
                        horizontal={true}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="year"
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 11 }}
                        tickLine={{ stroke: '#666' }}
                        axisLine={{ stroke: '#333333' }}
                        interval={4}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 11 }}
                        tickLine={{ stroke: '#666' }}
                        axisLine={{ stroke: '#333333' }}
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
                    {projections.map((sim) => (
                        <Line
                            key={sim.simulationId}
                            type="monotone"
                            dataKey={sim.simulationName}
                            stroke={getColor(sim)}
                            strokeWidth={3}
                            strokeDasharray={
                                sim.isRealized ? "0 6" :
                                    sim.isDashed ? "8 4" : undefined
                            }
                            strokeLinecap={sim.isRealized ? "round" : "butt"}
                            dot={false}
                            activeDot={{ r: 6, fill: getColor(sim), stroke: '#0f0f0f', strokeWidth: 2 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
