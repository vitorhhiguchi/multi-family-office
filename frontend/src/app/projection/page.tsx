'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { MovementModal, MovementFormData } from '@/components/dashboard/movement-modal';
import { InsuranceModal, InsuranceFormData } from '@/components/dashboard/insurance-modal';
import { SimulationModal, SimulationFormData } from '@/components/dashboard/simulation-modal';
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
import { ChevronDown, Plus } from 'lucide-react';
import type { Client, Simulation, Insurance } from '@/types';

export default function ProjectionPage() {
    const [selectedClient, setSelectedClient] = useState<Client>(mockClients[0]);
    const [selectedSimulationIds, setSelectedSimulationIds] = useState<number[]>([1, 2]);
    const [lifeStatus, setLifeStatus] = useState<'ALIVE' | 'DEAD' | 'INVALID'>('ALIVE');
    const [movementFilter, setMovementFilter] = useState<'financial' | 'immobilized'>('financial');

    // Modals State
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

    // Editing State
    const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null);
    const [tradingInsurance, setEditingInsurance] = useState<Insurance | null>(null); // Use later if needed

    const toggleSimulation = (id: number) => {
        setSelectedSimulationIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Handlers
    const handleSaveMovement = async (data: MovementFormData) => {
        console.log("Saving movement:", data);
        setIsMovementModalOpen(false);
    };

    const handleSaveInsurance = async (data: InsuranceFormData) => {
        console.log("Saving insurance:", data);
        setIsInsuranceModalOpen(false);
    };

    const handleSaveSimulation = async (data: SimulationFormData) => {
        console.log("Saving simulation:", data, "Editing ID:", editingSimulation?.id);
        setIsSimulationModalOpen(false);
        setEditingSimulation(null);
    };

    const handleEditSimulation = (sim: Simulation) => {
        setEditingSimulation(sim);
        setIsSimulationModalOpen(true);
    };

    const handleDuplicateSimulation = (sim: Simulation) => {
        console.log("Duplicating simulation:", sim.id);
        // Helper to eventually call API
    };

    const handleDeleteSimulation = (sim: Simulation) => {
        console.log("Deleting simulation:", sim.id);
        // Helper to eventually call API
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
                                <span className="text-sm" style={{ color: '#68AAF1' }}>+52,37%</span>
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
                                isHighlight={summary.isHighlight}
                            />
                        ))}
                    </div>
                </div>

                {/* Life Status Toggle & Suggestion - CENTERED */}
                <div className="flex items-center justify-center gap-8 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                            "w-5 h-5 rounded-full border border-muted-foreground flex items-center justify-center transition-colors",
                            lifeStatus === 'DEAD' && "border-primary bg-primary"
                        )}>
                            {lifeStatus === 'DEAD' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <input
                            type="radio"
                            name="lifeStatus"
                            checked={lifeStatus === 'DEAD'}
                            onChange={() => setLifeStatus('DEAD')}
                            className="hidden"
                        />
                        <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Morto</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                            "w-5 h-5 rounded-full border border-muted-foreground flex items-center justify-center transition-colors",
                            lifeStatus === 'INVALID' && "border-primary bg-primary"
                        )}>
                            {lifeStatus === 'INVALID' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <input
                            type="radio"
                            name="lifeStatus"
                            checked={lifeStatus === 'INVALID'}
                            onChange={() => setLifeStatus('INVALID')}
                            className="hidden"
                        />
                        <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">Inválido</span>
                    </label>

                    {/* Suggestion Select - styled like Figma */}
                    <button className="flex items-center gap-4 px-4 py-2 rounded-full border border-[#333333] bg-[#1a1a1a] hover:border-[#444444] transition-colors min-w-[160px] justify-between">
                        <span style={{ color: '#48F7A1' }} className="text-sm font-medium">Sugestão</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Projection Chart Section */}
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 mb-6">
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
                                simulationId: 99,
                                simulationName: 'Realizado',
                                projections: mockProjections.map((p) => ({
                                    ...p,
                                    patrimonyEnd: p.patrimonyEnd,
                                })).slice(0, 5),
                                isRealized: true,
                            },
                            {
                                simulationId: 2,
                                simulationName: 'Situação atual',
                                projections: mockProjections.map((p) => ({
                                    ...p,
                                    patrimonyEnd: p.patrimonyEnd * 0.75,
                                })),
                                isDashed: true,
                            },
                            {
                                simulationId: 3,
                                simulationName: 'Comparação',
                                projections: mockProjections.map((p) => ({
                                    ...p,
                                    patrimonyEnd: p.patrimonyEnd * 0.6,
                                })),
                                isDashed: true,
                            },
                        ]}
                    />

                    {/* Simulation Pills - CENTERED */}
                    <div className="mt-6 pt-6 border-t border-[#333333]">
                        <SimulationSelector
                            simulations={mockSimulations}
                            selectedIds={selectedSimulationIds}
                            onToggle={toggleSimulation}
                            onAddClick={() => {
                                setEditingSimulation(null);
                                setIsSimulationModalOpen(true);
                            }}
                            onEditSimulation={handleEditSimulation}
                            onDuplicateSimulation={handleDuplicateSimulation}
                            onDeleteSimulation={handleDeleteSimulation}
                        />
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 mb-6">
                    <Timeline
                        events={[...mockIncomeTimeline, ...mockExpenseTimeline]}
                        startYear={2025}
                        endYear={2060}
                        clientBirthYear={clientBirthYear}
                        onAddClick={() => setIsMovementModalOpen(true)}
                    />
                </div>

                {/* Movements Section */}
                <div className="mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-normal text-[#67AEFA]">Movimentações</h2>

                            <div className="flex bg-[#0f0f0f] border border-[#333333] rounded-full p-1">
                                <button
                                    onClick={() => setMovementFilter('financial')}
                                    className={cn(
                                        'px-4 py-1.5 rounded-full text-sm transition-colors',
                                        movementFilter === 'financial'
                                            ? 'bg-[#e5e5e5] text-black font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Financeiras
                                </button>
                                <button
                                    onClick={() => setMovementFilter('immobilized')}
                                    className={cn(
                                        'px-4 py-1.5 rounded-full text-sm transition-colors',
                                        movementFilter === 'immobilized'
                                            ? 'bg-[#e5e5e5] text-black font-medium'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Imobilizadas
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsMovementModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#333333] text-sm text-muted-foreground hover:text-foreground hover:border-[#444444] transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Adicionar
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
                        <h2 className="text-lg font-normal text-[#67AEFA]">Seguros</h2>
                        <button
                            onClick={() => setIsInsuranceModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#333333] text-sm text-muted-foreground hover:text-foreground hover:border-[#444444] transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Adicionar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mockInsurances.map((insurance) => (
                            <InsuranceCard key={insurance.id} insurance={insurance} />
                        ))}
                    </div>
                </div>

                {/* Modals */}
                <MovementModal
                    open={isMovementModalOpen}
                    onOpenChange={setIsMovementModalOpen}
                    onSubmit={handleSaveMovement}
                />

                <InsuranceModal
                    open={isInsuranceModalOpen}
                    onOpenChange={setIsInsuranceModalOpen}
                    onSubmit={handleSaveInsurance}
                />

                <SimulationModal
                    open={isSimulationModalOpen}
                    onOpenChange={setIsSimulationModalOpen}
                    onSubmit={handleSaveSimulation}
                    initialData={editingSimulation ? {
                        name: editingSimulation.name,
                        startDate: editingSimulation.startDate ? new Date(editingSimulation.startDate) : new Date(),
                        inflationRate: editingSimulation.realRate ?? 4,
                    } : undefined}
                />
            </div>
        </MainLayout>
    );
}
