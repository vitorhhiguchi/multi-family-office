'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { MovementModal, MovementFormData } from '@/components/dashboard/movement-modal';
import { InsuranceModal, InsuranceFormData } from '@/components/dashboard/insurance-modal';
import { SimulationModal, SimulationFormData } from '@/components/dashboard/simulation-modal';
import { ClientSelector, PatrimonyCard, MovementCard, InsuranceCard, SimulationSelector, AddSimulationModal } from '@/components/dashboard';
import { ProjectionChart } from '@/components/charts';
import { Timeline, TimelineEvent } from '@/components/timeline';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, Simulation, Insurance, Movement } from '@/types';

import {
    useClients,
    useSimulations,
    useCreateSimulation,
    useUpdateSimulation,
    useDeleteSimulation,
    useCreateSimulationVersion,
    useDuplicateSimulation,
    useMovements,
    useCreateMovement,
    useUpdateMovement,
    useDeleteMovement,
    useInsurances,
    useCreateInsurance,
    useUpdateInsurance,
    useDeleteInsurance,
    useProjections
} from '@/hooks';

// Helper to create patrimony summaries from projection data
const createPatrimonySummaries = (
    projections: { year: number; age: number; patrimonyEnd: number }[],
    targetYears: number[]
) => {
    if (!projections || projections.length === 0) return [];

    const firstYear = projections[0];
    const labels = ['Curto Prazo', 'Médio Prazo', 'Aposentadoria'];

    return targetYears.map((targetYear, index) => {
        const yearData = projections.find(p => p.year === targetYear);
        if (!yearData) return null;

        const percentChange = firstYear.patrimonyEnd > 0
            ? ((yearData.patrimonyEnd - firstYear.patrimonyEnd) / firstYear.patrimonyEnd) * 100
            : 0;

        return {
            year: yearData.year,
            label: labels[index] || `Ano ${yearData.year}`,
            age: yearData.age,
            value: yearData.patrimonyEnd,
            percentChange,
            isHighlight: index === targetYears.length - 1,
        };
    }).filter(Boolean);
};

export default function ProjectionPage() {
    // Selection state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedSimulationIds, setSelectedSimulationIds] = useState<number[]>([]);
    const [lifeStatus, setLifeStatus] = useState<'ALIVE' | 'DEAD' | 'INVALID'>('ALIVE');
    const [movementFilter, setMovementFilter] = useState<'financial' | 'immobilized'>('financial');

    // Data Fetching
    const { data: clients, isLoading: isLoadingClients } = useClients();
    const { data: simulations, isLoading: isLoadingSimulations } = useSimulations(selectedClient?.id);

    // Select first client by default
    useEffect(() => {
        if (clients && clients.length > 0 && !selectedClient) {
            setSelectedClient(clients[0]);
        }
    }, [clients, selectedClient]);

    // Select first two simulations by default when simulations load
    useEffect(() => {
        if (simulations && simulations.length > 0 && selectedSimulationIds.length === 0) {
            // Prefer current situation + one other
            const current = simulations.find(s => s.isCurrentSituation);
            const others = simulations.filter(s => !s.isCurrentSituation).slice(0, 1);
            if (current) {
                setSelectedSimulationIds([current.id, ...others.map(s => s.id)]);
            } else {
                setSelectedSimulationIds(simulations.slice(0, 2).map(s => s.id));
            }
        }
    }, [simulations, selectedSimulationIds]);

    // Derived state for default simulation (usually the "Current Situation" or the first selected)
    // We use this for adding movements/insurances context
    const activeSimulationId = selectedSimulationIds.length > 0 ? selectedSimulationIds[0] : undefined;

    // Fetch dependent data
    const { data: movements } = useMovements(activeSimulationId);
    const { data: insurances } = useInsurances(activeSimulationId);
    const { data: projectionsData, isLoading: isLoadingProjections } = useProjections(selectedSimulationIds, 2060, lifeStatus);

    // Modals & Mutation Hooks
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
    const [isAddSimulationModalOpen, setIsAddSimulationModalOpen] = useState(false);

    // Editing State
    const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);

    // Mutation Hooks
    const createSimulation = useCreateSimulation();
    const updateSimulation = useUpdateSimulation();
    const deleteSimulation = useDeleteSimulation();
    const createVersion = useCreateSimulationVersion();
    const duplicateSimulation = useDuplicateSimulation();

    const createMovement = useCreateMovement();
    const updateMovement = useUpdateMovement();
    const deleteMovement = useDeleteMovement();

    const createInsurance = useCreateInsurance();
    const updateInsurance = useUpdateInsurance();
    const deleteInsurance = useDeleteInsurance();

    // Handlers
    const toggleSimulation = (id: number) => {
        setSelectedSimulationIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSaveMovement = async (data: MovementFormData) => {
        if (!activeSimulationId) {
            toast.error("Selecione uma simulação para adicionar movimentações.");
            return;
        }

        try {
            if (editingMovement) {
                // Update existing movement
                await updateMovement.mutateAsync({
                    id: editingMovement.id,
                    data: {
                        name: data.name,
                        type: data.type,
                        value: data.value,
                        frequency: data.frequency,
                        startDate: data.startDate.toISOString().split('T')[0],
                        endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
                    }
                });
                toast.success("Movimentação atualizada com sucesso!");
                setEditingMovement(null);
            } else {
                // Create new movement
                await createMovement.mutateAsync({
                    ...data,
                    simulationId: activeSimulationId,
                    category: 'OTHER',
                    endDate: data.endDate ? data.endDate.toISOString().split('T')[0] : undefined,
                    startDate: data.startDate.toISOString().split('T')[0],
                });
                toast.success("Movimentação criada com sucesso!");
            }
            setIsMovementModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar movimentação.");
        }
    };

    const handleEditMovement = (movement: Movement) => {
        setEditingMovement(movement);
        setIsMovementModalOpen(true);
    };

    const handleDeleteMovement = async (movement: Movement) => {
        if (!activeSimulationId) return;
        if (confirm(`Tem certeza que deseja excluir a movimentação "${movement.name}"?`)) {
            try {
                await deleteMovement.mutateAsync({ id: movement.id, simulationId: activeSimulationId });
                toast.success("Movimentação excluída com sucesso!");
            } catch (error) {
                toast.error("Erro ao excluir movimentação.");
            }
        }
    };

    const handleSaveInsurance = async (data: InsuranceFormData) => {
        if (!activeSimulationId) {
            toast.error("Selecione uma simulação para adicionar seguros.");
            return;
        }

        try {
            if (editingInsurance) {
                // Update existing insurance
                await updateInsurance.mutateAsync({
                    id: editingInsurance.id,
                    data: {
                        name: data.name,
                        startDate: data.startDate.toISOString().split('T')[0],
                        durationMonths: data.durationMonths,
                        premium: data.premiumValue,
                        insuredValue: data.insuredValue,
                    }
                });
                toast.success("Seguro atualizado com sucesso!");
                setEditingInsurance(null);
            } else {
                // Create new insurance
                await createInsurance.mutateAsync({
                    ...data,
                    type: 'LIFE',
                    simulationId: activeSimulationId,
                    premium: data.premiumValue,
                    startDate: data.startDate.toISOString().split('T')[0],
                });
                toast.success("Seguro criado com sucesso!");
            }
            setIsInsuranceModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar seguro.");
        }
    };

    const handleEditInsurance = (insurance: Insurance) => {
        setEditingInsurance(insurance);
        setIsInsuranceModalOpen(true);
    };

    const handleDeleteInsurance = async (insurance: Insurance) => {
        if (!activeSimulationId) return;
        if (confirm(`Tem certeza que deseja excluir o seguro "${insurance.name}"?`)) {
            try {
                await deleteInsurance.mutateAsync({ id: insurance.id, simulationId: activeSimulationId });
                toast.success("Seguro excluído com sucesso!");
            } catch (error) {
                toast.error("Erro ao excluir seguro.");
            }
        }
    };

    const handleSaveSimulation = async (data: SimulationFormData) => {
        if (!selectedClient) {
            toast.error("Selecione um cliente primeiro.");
            return;
        }

        try {
            if (editingSimulation) {
                await updateSimulation.mutateAsync({
                    id: editingSimulation.id,
                    data: {
                        name: data.name,
                        startDate: data.startDate.toISOString().split('T')[0],
                        realRate: data.inflationRate
                    }
                });
                toast.success("Simulação atualizada com sucesso!");
                setEditingSimulation(null);
            } else {
                await createSimulation.mutateAsync({
                    name: data.name,
                    startDate: data.startDate.toISOString().split('T')[0],
                    realRate: data.inflationRate,
                    clientId: selectedClient.id
                });
                toast.success("Simulação criada com sucesso!");
            }
            setIsSimulationModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar simulação.");
        }
    };

    const handleEditSimulation = (sim: Simulation) => {
        setEditingSimulation(sim);
        setIsSimulationModalOpen(true);
    };

    const handleDuplicateSimulation = async (sim: Simulation) => {
        try {
            await createVersion.mutateAsync(sim.id);
            toast.success("Nova versão criada com sucesso!");
        } catch (error) {
            toast.error("Erro ao duplicar simulação.");
        }
    };

    const handleAddNewSimulation = async (name: string) => {
        if (!selectedClient) {
            toast.error("Selecione um cliente primeiro.");
            return;
        }

        // If no simulations exist, create from scratch
        if (!activeSimulationId) {
            try {
                const newSim = await createSimulation.mutateAsync({
                    name,
                    startDate: new Date().toISOString().split('T')[0],
                    realRate: 0.04,
                    clientId: selectedClient.id
                });
                toast.success(`Simulação "${name}" criada com sucesso!`);
                setSelectedSimulationIds([newSim.id]);
            } catch (error: any) {
                toast.error(error?.response?.data?.error || "Erro ao criar simulação.");
            }
            return;
        }

        // Otherwise duplicate from active simulation
        try {
            const newSim = await duplicateSimulation.mutateAsync({ id: activeSimulationId, name });
            toast.success(`Simulação "${name}" criada com sucesso!`);
            setSelectedSimulationIds(prev => [...prev, newSim.id]);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Erro ao criar simulação.");
        }
    };

    const handleDeleteSimulation = async (sim: Simulation) => {
        if (confirm(`Tem certeza que deseja excluir a simulação "${sim.name}"?`)) {
            try {
                await deleteSimulation.mutateAsync(sim.id);
                setSelectedSimulationIds(prev => prev.filter(id => id !== sim.id));
                toast.success("Simulação excluída.");
            } catch (error) {
                toast.error("Erro ao excluir simulação.");
            }
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 2,
        }).format(val);
    };

    // Filter movements by type (using backend data)
    const activeMovements = movements || [];
    const financialMovements = activeMovements.filter(
        // Logic: Not immobilized (TODO: Add explicit 'immobilized' check if added to schema, for now name-based hack or type)
        (m) => m.type === 'INCOME' || (m.type === 'EXPENSE' && m.name !== 'Compra de Imóvel')
    );
    const immobilizedMovements = activeMovements.filter(
        (m) => m.name === 'Compra de Imóvel' // TODO: Better filtering strategy
    );

    // Client birth year for timeline
    const clientBirthYear = selectedClient ? new Date(selectedClient.birthDate).getFullYear() : 1985;

    // Prepare chart data
    // Map projectionsData (ProjectionResult[]) to the format expected by ProjectionChart
    const chartProjections = (projectionsData || []).map(p => {
        const sim = simulations?.find(s => s.id === p.simulationId);
        return {
            simulationId: p.simulationId,
            simulationName: p.simulationName,
            projections: p.projections,
            isOriginal: sim?.isCurrentSituation,
            isRealized: p.simulationName === 'Realizado',
            isDashed: !sim?.isCurrentSituation && p.simulationName !== 'Realizado',
        };
    });

    // Create patrimony summaries from first projection
    const firstProjection = projectionsData?.[0]?.projections || [];
    const currentYear = new Date().getFullYear();
    const patrimonySummaries = createPatrimonySummaries(
        firstProjection,
        [currentYear + 1, currentYear + 5, currentYear + 20]
    );

    // Map movements to timeline events
    const timelineEvents: TimelineEvent[] = (movements || []).map(m => ({
        year: new Date(m.startDate).getFullYear(),
        label: m.name,
        type: m.type === 'INCOME' ? 'income' as const : 'expense' as const,
        value: m.value,
    }));

    if (isLoadingClients) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center bg-background text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MainLayout>
        );
    }

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
                        {clients && (
                            <ClientSelector
                                clients={clients}
                                selectedClient={selectedClient || clients[0]}
                                onSelect={setSelectedClient}
                            />
                        )}
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
                        {patrimonySummaries.length > 0 ? patrimonySummaries.map((summary: any) => (
                            <PatrimonyCard
                                key={summary.year}
                                year={summary.year}
                                label={summary.label}
                                age={summary.age}
                                value={summary.value}
                                percentChange={summary.percentChange}
                                isHighlight={summary.isHighlight}
                            />
                        )) : (
                            <div className="text-muted-foreground text-sm">Crie uma simulação para ver projeções</div>
                        )}
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
                        projections={chartProjections}
                    />

                    {/* Simulation Pills - CENTERED */}
                    <div className="mt-6 pt-6 border-t border-[#333333]">
                        {simulations && (
                            <SimulationSelector
                                simulations={simulations}
                                selectedIds={selectedSimulationIds}
                                onToggle={toggleSimulation}
                                onAddClick={() => setIsAddSimulationModalOpen(true)}
                                onEditSimulation={handleEditSimulation}
                                onDuplicateSimulation={handleDuplicateSimulation}
                                onDeleteSimulation={handleDeleteSimulation}
                            />
                        )}
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 mb-6">
                    <Timeline
                        events={timelineEvents}
                        startYear={currentYear}
                        endYear={currentYear + 35}
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
                                <MovementCard
                                    key={movement.id}
                                    movement={movement}
                                    onEdit={handleEditMovement}
                                    onDelete={handleDeleteMovement}
                                />
                            ))}
                        {(!activeMovements || activeMovements.length === 0) && (
                            <div className="col-span-full text-center text-muted-foreground py-8">
                                Nenhuma movimentação cadastrada nesta simulação.
                            </div>
                        )}
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
                        {insurances && insurances.map((insurance) => (
                            <InsuranceCard
                                key={insurance.id}
                                insurance={insurance}
                                onEdit={handleEditInsurance}
                                onDelete={handleDeleteInsurance}
                            />
                        ))}
                    </div>
                </div>

                {/* Modals */}
                <MovementModal
                    open={isMovementModalOpen}
                    onOpenChange={(open) => {
                        setIsMovementModalOpen(open);
                        if (!open) setEditingMovement(null);
                    }}
                    onSubmit={handleSaveMovement}
                    initialData={editingMovement ? {
                        name: editingMovement.name,
                        type: editingMovement.type,
                        value: editingMovement.value,
                        frequency: editingMovement.frequency,
                        startDate: new Date(editingMovement.startDate),
                        endDate: editingMovement.endDate ? new Date(editingMovement.endDate) : null,
                        inflationAdjusted: true,
                    } : null}
                />

                <InsuranceModal
                    open={isInsuranceModalOpen}
                    onOpenChange={(open) => {
                        setIsInsuranceModalOpen(open);
                        if (!open) setEditingInsurance(null);
                    }}
                    onSubmit={handleSaveInsurance}
                    initialData={editingInsurance ? {
                        name: editingInsurance.name,
                        startDate: new Date(editingInsurance.startDate),
                        durationMonths: editingInsurance.durationMonths,
                        premiumValue: editingInsurance.premium,
                        insuredValue: editingInsurance.insuredValue,
                    } : null}
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

                <AddSimulationModal
                    open={isAddSimulationModalOpen}
                    onOpenChange={setIsAddSimulationModalOpen}
                    onSubmit={handleAddNewSimulation}
                    sourceSimulationName={simulations?.find(s => s.id === activeSimulationId)?.name}
                />
            </div>
        </MainLayout>
    );
}
