'use client';

import { cn } from '@/lib/utils';

interface TimelineEvent {
    id: number;
    year: number;
    label: string;
    value: number;
    type: 'income' | 'expense';
}

interface TimelineProps {
    incomeEvents: TimelineEvent[];
    expenseEvents: TimelineEvent[];
    startYear: number;
    endYear: number;
    clientBirthYear: number;
    onAddClick?: () => void;
}

export function Timeline({
    incomeEvents,
    expenseEvents,
    startYear,
    endYear,
    clientBirthYear,
    onAddClick,
}: TimelineProps) {
    const years = Array.from(
        { length: Math.ceil((endYear - startYear) / 5) + 1 },
        (_, i) => startYear + i * 5
    );

    const getPosition = (year: number) => {
        return ((year - startYear) / (endYear - startYear)) * 100;
    };

    const getAge = (year: number) => year - clientBirthYear;

    return (
        <div className="w-full space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Timeline</h3>
                {onAddClick && (
                    <button
                        onClick={onAddClick}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 border border-border rounded-lg hover:border-primary"
                    >
                        + Adicionar
                    </button>
                )}
            </div>

            {/* Income Track (Green) */}
            <div className="relative">
                <div className="absolute left-12 right-0 flex items-center">
                    <span className="absolute -left-12 text-xs text-green-400 font-medium w-10">
                        Salário
                    </span>
                    {/* Track line */}
                    <div className="w-full h-0.5 bg-green-500/30 relative">
                        {/* Events */}
                        {incomeEvents.map((event) => (
                            <div
                                key={event.id}
                                className="absolute top-1/2 -translate-y-1/2 group"
                                style={{ left: `${getPosition(event.year)}%` }}
                            >
                                <div className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:scale-125 transition-transform" />
                                {/* Label */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-card border border-border rounded px-2 py-1 text-xs whitespace-pre-line text-center min-w-max">
                                        <span className="text-green-400">{event.label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Lines connecting events */}
                        {incomeEvents.slice(0, -1).map((event, index) => {
                            const nextEvent = incomeEvents[index + 1];
                            const startPos = getPosition(event.year);
                            const endPos = getPosition(nextEvent.year);
                            return (
                                <div
                                    key={`line-${event.id}`}
                                    className="absolute h-0.5 bg-green-500"
                                    style={{
                                        left: `${startPos}%`,
                                        width: `${endPos - startPos}%`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="h-8" />
            </div>

            {/* Year Scale */}
            <div className="relative pl-12">
                <div className="flex justify-between text-xs text-muted-foreground">
                    {years.map((year) => (
                        <div
                            key={year}
                            className="flex flex-col items-center"
                            style={{
                                position: 'absolute',
                                left: `calc(${getPosition(year)}% + 48px)`,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <span className="text-muted-foreground">Ano</span>
                            <span className="font-medium text-foreground">{year}</span>
                            <span className="text-muted-foreground">Idade</span>
                            <span className="font-medium text-foreground">{getAge(year)}</span>
                        </div>
                    ))}
                </div>
                <div className="h-12" />
            </div>

            {/* Expense Track (Red) */}
            <div className="relative">
                <div className="absolute left-12 right-0 flex items-center">
                    <span className="absolute -left-12 text-xs text-red-400 font-medium w-10 leading-tight">
                        Custo<br />de vida
                    </span>
                    {/* Track line */}
                    <div className="w-full h-0.5 bg-red-500/30 relative">
                        {/* Events */}
                        {expenseEvents.map((event) => (
                            <div
                                key={event.id}
                                className="absolute top-1/2 -translate-y-1/2 group"
                                style={{ left: `${getPosition(event.year)}%` }}
                            >
                                <div className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:scale-125 transition-transform" />
                                {/* Label */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap">
                                        <span className="text-red-400">{event.label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Lines connecting events */}
                        {expenseEvents.slice(0, -1).map((event, index) => {
                            const nextEvent = expenseEvents[index + 1];
                            const startPos = getPosition(event.year);
                            const endPos = getPosition(nextEvent.year);
                            return (
                                <div
                                    key={`line-${event.id}`}
                                    className="absolute h-0.5 bg-red-500"
                                    style={{
                                        left: `${startPos}%`,
                                        width: `${endPos - startPos}%`,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="h-8" />
            </div>

            {/* Expense values */}
            <div className="relative pl-12 text-xs">
                {expenseEvents.map((event) => (
                    <span
                        key={event.id}
                        className="absolute text-red-400"
                        style={{
                            left: `calc(${getPosition(event.year)}% + 48px)`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {event.label}
                    </span>
                ))}
                <div className="h-6" />
            </div>
        </div>
    );
}
