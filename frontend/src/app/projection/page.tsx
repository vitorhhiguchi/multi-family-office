'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { ClientSelector, PatrimonyCard, MovementCard, InsuranceCard, SimulationSelector } from '@/components/dashboard';
import { ProjectionChart } from '@/components/charts';
import { Timeline } from '@/components/timeline';
import {
    mockClients,
    mockSimulations,
    mockMovements,
    mockInsurances,
    mockProjections,
    mockIncomeTimeline,
    mockExpenseTimeline,
    mockPatrimonySummaries
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { Client } from '@/types';

export default function ProjectionPage() {
    const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0]);
    const [selectedSimulationIds, setSelectedSimulationIds] = useState<number[]>([1]);
    const [lifeStatus, setLifeStatus] = useState<'ALIVE' | 'DEAD' | 'INVALID'>('ALIVE');
    const [movementFilter, setMovementFilter] = useState<'financial' | 'immobilized'>('financial');

    const toggleSimulation = (id: number) => {
        setSelectedSimulationIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 2,
        }).format(val);
    };

    // Filter movements by type
    const financialMovements = mockMovements.filter(
        (m) => m.frequency !== 'ONE_TIME' || m.value < 500000
    );
    const immobilizedMovements = mockMovements.filter(
        (m) => m.name === 'Compra de Imóvel'
    );

    // Client birth year for timeline
    const clientBirthYear = new Date(selectedClient.birthDate).getFullYear();

    return (
        <MainLayout>
            <div className="min-h-screen bg-background p-6 lg:p-8">
                {/* Header Tabs */}
                <div className="flex items-center justify-center gap-8 mb-8">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        Alocações
                    </button>
                    <button className="text-foreground font-medium border-b-2 border-primary pb-1">
                        Projeção
                    </button>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                        Histórico
                    </button>
                </div>

                {/* Client & Patrimony Section */}
                <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
                    {/* Left: Client Selector & Total */}
                    <div className="flex-1">
                        <ClientSelector
                            clients={mockClients}
                            selectedClient={selectedClient}
                            onSelect={setSelectedClient}
                        />
                        <div className="mt-4">
                            <p className="text-xs text-muted-foreground">Patrimônio Líquido Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">
                                    {formatCurrency(2679930)}
                                </span>
                                <span className="text-green-400 text-sm">+52,37%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Patrimony Cards */}
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {mockPatrimonySummaries.map((summary, index) => (
                            <PatrimonyCard
                                key={summary.year}
                                year={summary.year}
                                label={summary.label}
                                age={summary.age}
                                value={summary.value}
                                percentChange={summary.percentChange}
                                variant={summary.isHighlight ? 'highlight' : index === 0 ? 'blue' : 'default'}
                            />
                        ))}
                    </div>
                </div>

                {/* Life Status Toggle */}
                <div className="flex items-center gap-6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="lifeStatus"
                            checked={lifeStatus === 'DEAD'}
                            onChange={() => setLifeStatus('DEAD')}
                            className="w-4 h-4 border-2 border-muted-foreground rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">Morto</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="lifeStatus"
                            checked={lifeStatus === 'INVALID'}
                            onChange={() => setLifeStatus('INVALID')}
                            className="w-4 h-4 border-2 border-muted-foreground rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">Inválido</span>
                    </label>
                    <div className="flex-1" />
                    <select className="bg-card border border-border rounded-lg px-4 py-2 text-sm">
                        <option>Sugestão</option>
                    </select>
                </div>

                {/* Projection Chart Section */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Projeção Patrimonial</h2>
                        <div className="flex gap-4 text-sm">
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                Ver com detalhes
                            </button>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                Ver como Tabela
                            </button>
                        </div>
                    </div>

                    <ProjectionChart
                        projections={[
                            {
                                simulationId: 1,
                                simulationName: 'Plano Original',
                                projections: mockProjections,
                                isOriginal: true,
                            },
                            {
                                simulationId: 2,
                                simulationName: 'Situação atual',
                                projections: mockProjections.map((p) => ({
                                    ...p,
                                    patrimonyEnd: p.patrimonyEnd * 0.85,
                                })),
                            },
                        ]}
                    />

                    {/* Simulation Pills */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <SimulationSelector
                            simulations={mockSimulations}
                            selectedIds={selectedSimulationIds}
                            onToggle={toggleSimulation}
                            onAddClick={() => { }}
                        />
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <Timeline
                        incomeEvents={mockIncomeTimeline}
                        expenseEvents={mockExpenseTimeline}
                        startYear={2025}
                        endYear={2060}
                        clientBirthYear={clientBirthYear}
                        onAddClick={() => { }}
                    />
                </div>

                {/* Movements Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-muted/30 rounded-full p-1">
                                <button
                                    onClick={() => setMovementFilter('financial')}
                                    className={cn(
                                        'px-4 py-1.5 rounded-full text-sm transition-colors',
                                        movementFilter === 'financial'
                                            ? 'bg-card text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    Financeiras
                                </button>
                                <button
                                    onClick={() => setMovementFilter('immobilized')}
                                    className={cn(
                                        'px-4 py-1.5 rounded-full text-sm transition-colors',
                                        movementFilter === 'immobilized'
                                            ? 'bg-card text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    Imobilizadas
                                </button>
                            </div>
                            <button className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
                                + Adicionar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(movementFilter === 'financial' ? financialMovements : immobilizedMovements)
                            .slice(0, 4)
                            .map((movement) => (
                                <MovementCard key={movement.id} movement={movement} />
                            ))}
                    </div>
                </div>

                {/* Insurance Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Seguros</h2>
                        <button className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
                            + Adicionar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockInsurances.map((insurance) => (
                            <InsuranceCard key={insurance.id} insurance={insurance} />
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
