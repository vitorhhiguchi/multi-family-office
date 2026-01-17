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
} from 'recharts';
import { YearProjection } from '@/types';

interface ProjectionChartProps {
    projections: {
        simulationId: number;
        simulationName: string;
        projections: YearProjection[];
        color?: string;
        isOriginal?: boolean;
    }[];
}

const COLORS = {
    original: '#3b82f6', // blue for original plan
    current: '#22c55e', // green
    comparison: '#f59e0b', // yellow/orange
    negative: '#ef4444', // red
};

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
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
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

        projections.forEach((sim, simIndex) => {
            const projection = sim.projections[index];
            if (projection) {
                dataPoint[sim.simulationName] = projection.patrimonyEnd;
            }
        });

        return dataPoint;
    }) || [];

    const getColor = (index: number, isOriginal?: boolean) => {
        if (isOriginal) return COLORS.original;
        const colors = [COLORS.current, COLORS.comparison, '#a855f7', '#14b8a6'];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        {projections.map((sim, index) => (
                            <linearGradient
                                key={sim.simulationId}
                                id={`gradient-${sim.simulationId}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={getColor(index, sim.isOriginal)}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={getColor(index, sim.isOriginal)}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                        dataKey="year"
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                        tickFormatter={formatCurrency}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => (
                            <span className="text-sm text-muted-foreground">{value}</span>
                        )}
                    />
                    {projections.map((sim, index) => (
                        <Area
                            key={sim.simulationId}
                            type="monotone"
                            dataKey={sim.simulationName}
                            stroke={getColor(index, sim.isOriginal)}
                            strokeWidth={2}
                            fill={`url(#gradient-${sim.simulationId})`}
                            strokeDasharray={sim.isOriginal ? '5 5' : undefined}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
