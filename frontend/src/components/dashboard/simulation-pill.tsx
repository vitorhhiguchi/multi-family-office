'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Simulation } from '@/types';

interface SimulationPillProps {
    simulation: Simulation;
    isSelected: boolean;
    isOriginal?: boolean;
    onClick: () => void;
    onMenuClick?: () => void;
}

export function SimulationPill({
    simulation,
    isSelected,
    isOriginal,
    onClick,
    onMenuClick,
}: SimulationPillProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border transition-all',
                'text-sm font-medium',
                isSelected
                    ? isOriginal
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
                    : 'bg-muted/30 border-border text-muted-foreground hover:border-primary/50'
            )}
        >
            <div
                className={cn(
                    'w-3 h-3 rounded-full border-2',
                    isSelected
                        ? isOriginal
                            ? 'bg-blue-500 border-blue-400'
                            : 'bg-yellow-500 border-yellow-400'
                        : 'border-muted-foreground'
                )}
            />
            <span>{simulation.name}</span>
            {onMenuClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick();
                    }}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                >
                    ⋮
                </button>
            )}
        </button>
    );
}

interface SimulationSelectorProps {
    simulations: Simulation[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onAddClick?: () => void;
}

export function SimulationSelector({
    simulations,
    selectedIds,
    onToggle,
    onAddClick,
}: SimulationSelectorProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {simulations.map((sim) => (
                <SimulationPill
                    key={sim.id}
                    simulation={sim}
                    isSelected={selectedIds.includes(sim.id)}
                    isOriginal={sim.isCurrentSituation}
                    onClick={() => onToggle(sim.id)}
                />
            ))}
            <button
                onClick={() => { }}
                className="px-4 py-2 rounded-full bg-muted/30 border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
            >
                Realizado
            </button>
            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    + Adicionar Simulação
                </button>
            )}
        </div>
    );
}
