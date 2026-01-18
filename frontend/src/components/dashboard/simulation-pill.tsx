'use client';

import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import type { Simulation } from '@/types';

// Anka Design System Colors
const ANKA_COLORS = {
    blue: '#67AEFA',    // Plano Original
    green: '#48F7A1',   // Situação Atual
    yellow: '#F7B748',  // Realizado
    gray: '#C9C9C9',    // Adicionar
};

interface SimulationPillProps {
    simulation: Simulation;
    isSelected: boolean;
    variant: 'original' | 'current' | 'realized';
    onClick: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
}

export function SimulationPill({
    simulation,
    isSelected,
    variant,
    onClick,
    onEdit,
    onDuplicate,
    onDelete,
}: SimulationPillProps) {
    const getColor = () => {
        switch (variant) {
            case 'original':
                return ANKA_COLORS.blue;
            case 'current':
                return ANKA_COLORS.green;
            case 'realized':
                return ANKA_COLORS.yellow;
            default:
                return ANKA_COLORS.gray;
        }
    };

    const color = getColor();

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick();
                }
            }}
            className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer select-none',
                'text-sm font-medium',
                isSelected
                    ? 'bg-transparent'
                    : 'bg-transparent border-[#333333] text-muted-foreground hover:border-[#444444]'
            )}
            style={isSelected ? { borderColor: color } : undefined}
        >
            <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                    borderColor: color,
                    backgroundColor: isSelected ? color : 'transparent',
                }}
            />
            <span style={{ color: isSelected ? color : undefined }}>
                {simulation.name}
            </span>

            {(onEdit || onDuplicate || onDelete) && (
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="ml-1 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                            {onEdit && (
                                <DropdownMenuItem onClick={onEdit} className="focus:bg-[#262626] focus:text-white cursor-pointer">
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                </DropdownMenuItem>
                            )}
                            {onDuplicate && (
                                <DropdownMenuItem onClick={onDuplicate} className="focus:bg-[#262626] focus:text-white cursor-pointer">
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Criar versão</span>
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem onClick={onDelete} className="focus:bg-[#262626] focus:text-red-400 text-red-500 cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Deletar</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}

interface SimulationSelectorProps {
    simulations: Simulation[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onAddClick?: () => void;
    onEditSimulation?: (simulation: Simulation) => void;
    onDuplicateSimulation?: (simulation: Simulation) => void;
    onDeleteSimulation?: (simulation: Simulation) => void;
}

export function SimulationSelector({
    simulations,
    selectedIds,
    onToggle,
    onAddClick,
    onEditSimulation,
    onDuplicateSimulation,
    onDeleteSimulation,
}: SimulationSelectorProps) {
    return (
        <div className="flex items-center justify-center gap-3 flex-wrap">
            {simulations.map((sim, index) => (
                <SimulationPill
                    key={sim.id}
                    simulation={sim}
                    isSelected={selectedIds.includes(sim.id)}
                    variant={sim.isCurrentSituation ? 'current' : 'original'}
                    onClick={() => onToggle(sim.id)}
                    onEdit={onEditSimulation ? () => onEditSimulation(sim) : undefined}
                    onDuplicate={onDuplicateSimulation ? () => onDuplicateSimulation(sim) : undefined}
                    onDelete={onDeleteSimulation ? () => onDeleteSimulation(sim) : undefined}
                />
            ))}
            <div
                className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors cursor-default select-none"
                style={{
                    borderColor: ANKA_COLORS.yellow,
                    color: ANKA_COLORS.yellow,
                }}
            >
                <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                        borderColor: ANKA_COLORS.yellow,
                        backgroundColor: ANKA_COLORS.yellow,
                    }}
                />
                Realizado (Aporte+Rent.)
            </div>
            {onAddClick && (
                <button
                    onClick={onAddClick}
                    className="px-4 py-2 text-sm transition-colors hover:text-white"
                    style={{ color: ANKA_COLORS.gray }}
                >
                    + Adicionar Simulação
                </button>
            )}
        </div>
    );
}
