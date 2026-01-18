'use client';

import { useState, useEffect } from 'react';
import { MainLayout, ClientNavigation } from '@/components/layout';
import { MovementModal, MovementFormData } from '@/components/dashboard/movement-modal';
import { InsuranceModal, InsuranceFormData } from '@/components/dashboard/insurance-modal';
import { SimulationModal, SimulationFormData } from '@/components/dashboard/simulation-modal';
import { AssetModal } from '@/components/assets';
import { ClientSelector, MovementCard, InsuranceCard, SimulationSelector, ProjectionStat } from '@/components/dashboard';
import { AssetCard } from '@/components/assets';
import { Asset, CreateAssetInput } from '@/types';
import { ProjectionChart, ProjectionTable, DetailedProjectionChart } from '@/components/charts';
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
    useProjections,
    useAssets
} from '@/hooks';

// Helper to create patrimony summaries from projection data
// Uses actual years from projection data rather than fixed offsets
const createPatrimonySummaries = (
    projections: { year: number; totalPatrimony: number }[],
    clientBirthYear: number
) => {
    if (!projections || projections.length === 0) return [];

    const currentYear = new Date().getFullYear();
    const firstProjection = projections[0];

    // Calculate max patrimony for progress bars (100% = max value in projection)
    // We consider the max value achieved across the entire projection period
    const maxPatrimony = Math.max(...projections.map(p => p.totalPatrimony));

    // Define target milestones: Hoje, Médio Prazo (10 anos), Aposentadoria (65 anos)
    const clientAge = currentYear - clientBirthYear;
    const retirementAge = 65;
    const retirementYear = currentYear + (retirementAge - clientAge);

    const milestones = [
        { year: currentYear, label: 'Hoje', isFirst: true, isHighlight: false, variant: 'solid' as const },
        { year: currentYear + 10, label: 'Médio Prazo', isFirst: false, isHighlight: false, variant: 'separated' as const },
        { year: Math.min(retirementYear, currentYear + 20), label: 'Aposentadoria', isFirst: false, isHighlight: true, variant: 'separated' as const },
    ];

    return milestones.map(milestone => {
        // Find the closest year in projections
        const yearData = projections.find(p => p.year === milestone.year) ||
            projections.find(p => p.year >= milestone.year) ||
            projections[projections.length - 1];

        if (!yearData) return null;

        const percentChange = firstProjection.totalPatrimony > 0
            ? ((yearData.totalPatrimony - firstProjection.totalPatrimony) / firstProjection.totalPatrimony) * 100
            : 0;

        // Calculate progress relative to max patrimony
        const progress = maxPatrimony > 0
            ? Math.min((yearData.totalPatrimony / maxPatrimony) * 100, 100)
            : 0;

        return {
            year: yearData.year,
            label: milestone.label,
            age: yearData.year - clientBirthYear, // Recalculate age since backend doesn't send it? or use clientBirthYear
            value: yearData.totalPatrimony,
            percentChange: milestone.isFirst ? undefined : percentChange,
            isHighlight: milestone.isHighlight,
            isFirst: milestone.isFirst,
            variant: milestone.variant,
            progress,
        };
    }).filter(Boolean);
};

export default function ProjectionPage() {
    // Selection state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedSimulationIds, setSelectedSimulationIds] = useState<number[]>([]);
    const [lifeStatus, setLifeStatus] = useState<'ALIVE' | 'DEAD' | 'INVALID'>('ALIVE');
    const [movementFilter, setMovementFilter] = useState<'financial' | 'immobilized'>('financial');
    const [viewMode, setViewMode] = useState<'chart' | 'table' | 'detailed'>('chart');

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

    // Legacy Version Detection
    // If the active simulation ID is NOT in the list of "latest" simulations (returned by default useSimulations),
    // it means we are viewing an old version extracted from the History page.
    const isLegacy = activeSimulationId && simulations && !simulations.find(s => s.id === activeSimulationId);

    // Fetch dependent data
    const { data: movements } = useMovements(activeSimulationId);
    const { data: insurances } = useInsurances(activeSimulationId);
    const { assets, createAsset, updateAsset, deleteAsset } = useAssets(activeSimulationId);
    const { data: projectionsData, isLoading: isLoadingProjections } = useProjections(selectedSimulationIds, 2060, lifeStatus);

    // Modals & Mutation Hooks
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

    // Editing State
    const [editingSimulation, setEditingSimulation] = useState<Simulation | null>(null);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

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

    const handleSaveAsset = async (data: any) => {
        if (!activeSimulationId) return;
        try {
            if (editingAsset) {
                await updateAsset.mutateAsync({ id: editingAsset.id, data });
                toast.success("Ativo atualizado!");
            } else {
                await createAsset.mutateAsync({ ...data, simulationId: activeSimulationId });
                toast.success("Ativo criado!");
            }
            setIsAssetModalOpen(false);
            setEditingAsset(null);
        } catch (error) {
            toast.error("Erro ao salvar ativo");
        }
    };

    const handleEditAsset = (asset: Asset) => {
        setEditingAsset(asset);
        setIsAssetModalOpen(true);
    };

    const handleDeleteAsset = async (asset: Asset) => {
        if (confirm(`Excluir ${asset.name}?`)) {
            await deleteAsset.mutateAsync(asset.id);
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
    // Filter movements and assets
    const activeMovements = movements || [];
    const activeAssets = assets || [];

    const financialMovements = activeMovements.filter(
        (m) => m.type === 'INCOME' || (m.type === 'EXPENSE' && m.name !== 'Compra de Imóvel')
    );
    const financialAssetsList = activeAssets.filter(a => a.type === 'FINANCIAL');

    const immobilizedMovements = activeMovements.filter(
        (m) => m.name === 'Compra de Imóvel'
    );
    const realEstateAssets = activeAssets.filter(a => a.type === 'REAL_ESTATE');

    const financialItems = [...financialMovements, ...financialAssetsList];
    const immobilizedItems = [...immobilizedMovements, ...realEstateAssets];

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

    // Detailed chart data needs a different structure (just raw projections)
    const detailedProjections = (projectionsData || []).map(p => ({
        simulationId: p.simulationId,
        simulationName: p.simulationName,
        projections: p.projections
    }));

    // Create patrimony summaries from active projection
    const activeProjection = projectionsData?.find(p => p.simulationId === activeSimulationId);
    const patrimonySummaries = createPatrimonySummaries(
        activeProjection?.projections || [],
        clientBirthYear
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
                {/* Header: Selectors & Navigation */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        {clients && (
                            <ClientSelector
                                clients={clients}
                                selectedClient={selectedClient || clients[0]}
                                onSelect={setSelectedClient}
                            />
                        )}
                        {/* Add Simulation Selector here if needed, consistent with Assets Page */}
                    </div>
                    <ClientNavigation />
                </div>

                {isLegacy && (
                    <div className="mb-6 mx-auto max-w-4xl bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                            <div>
                                <h3 className="text-yellow-500 font-semibold text-sm">Modo Histórico (Apenas Leitura)</h3>
                                <p className="text-yellow-500/80 text-xs">Você está visualizando uma versão antiga. Para editar, crie uma nova versão.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Client & Patrimony Section */}
                <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
                    {/* Left: Total */}
                    <div className="flex-1">
                        <div className="mt-0">
                            <p className="text-xs text-muted-foreground">Patrimônio Líquido Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">
                                    {formatCurrency(patrimonySummaries.find((s: any) => s?.isFirst)?.value || 0)}
                                </span>
                                {/* TODO: Calculate actual growth percentage */}
                                <span className="text-sm" style={{ color: '#68AAF1' }}>+0%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Patrimony Cards */}
                    <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {patrimonySummaries.length > 0 ? patrimonySummaries.map((summary: any) => (
                            <ProjectionStat
                                key={summary.year}
                                year={summary.year}
                                label={summary.label}
                                age={summary.age}
                                value={summary.value}
                                percentage={summary.percentChange}
                                progress={summary.progress}
                                variant={summary.variant}
                                isToday={summary.isFirst}
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
                            <button
                                onClick={() => setViewMode(viewMode === 'detailed' ? 'chart' : 'detailed')}
                                className={cn(
                                    "text-muted-foreground hover:text-foreground transition-colors",
                                    viewMode === 'detailed' && "text-foreground font-medium"
                                )}
                            >
                                {viewMode === 'detailed' ? 'Ver gráfico simples' : 'Ver com detalhes'}
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                                className={cn(
                                    "text-muted-foreground hover:text-foreground transition-colors",
                                    viewMode === 'table' && "text-foreground font-medium"
                                )}
                            >
                                {viewMode === 'table' ? 'Ver como Gráfico' : 'Ver como Tabela'}
                            </button>
                        </div>
                    </div>

                    {viewMode === 'chart' && (
                        <ProjectionChart projections={chartProjections} />
                    )}

                    {viewMode === 'detailed' && (
                        <DetailedProjectionChart projections={detailedProjections} />
                    )}

                    {viewMode === 'table' && (
                        <ProjectionTable projections={detailedProjections} />
                    )}

                    {/* Simulation Pills - CENTERED */}
                    <div className="mt-6 pt-6 border-t border-[#333333]">
                        {simulations && (
                            <SimulationSelector
                                simulations={simulations}
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
                        )}
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-6 mb-6">
                    <Timeline
                        events={timelineEvents}
                        startYear={new Date().getFullYear()}
                        endYear={new Date().getFullYear() + 35}
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
                            {!isLegacy && (
                                <button
                                    onClick={() => setIsMovementModalOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#333333] text-sm text-muted-foreground hover:text-foreground hover:border-[#444444] transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Adicionar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(movementFilter === 'financial' ? financialItems : immobilizedItems)
                            .map((item: any) => {
                                const isAsset = 'records' in item;
                                if (isAsset) {
                                    return (
                                        <AssetCard
                                            key={`asset-${item.id}`}
                                            asset={item}
                                            date={new Date()}
                                            onEdit={!isLegacy ? handleEditAsset : undefined}
                                            onDelete={!isLegacy ? handleDeleteAsset : undefined}
                                        />
                                    );
                                }
                                return (
                                    <MovementCard
                                        key={`mov-${item.id}`}
                                        movement={item}
                                        onEdit={!isLegacy ? handleEditMovement : undefined}
                                        onDelete={!isLegacy ? handleDeleteMovement : undefined}
                                    />
                                );
                            })}
                        {((movementFilter === 'financial' ? financialItems : immobilizedItems).length === 0) && (
                            <div className="col-span-full text-center text-muted-foreground py-8">
                                Nenhum item encontrado nesta categoria.
                            </div>
                        )}
                    </div>
                </div>

                {/* Insurance Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-normal text-[#67AEFA]">Seguros</h2>
                        {!isLegacy && (
                            <button
                                onClick={() => setIsInsuranceModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#333333] text-sm text-muted-foreground hover:text-foreground hover:border-[#444444] transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Adicionar
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insurances && insurances.map((insurance) => (
                            <InsuranceCard
                                key={insurance.id}
                                insurance={insurance}
                                onEdit={!isLegacy ? handleEditInsurance : undefined}
                                onDelete={!isLegacy ? handleDeleteInsurance : undefined}
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

                <AssetModal
                    open={isAssetModalOpen}
                    onOpenChange={setIsAssetModalOpen}
                    onSubmit={handleSaveAsset}
                    simulationId={activeSimulationId || 0}
                    initialData={editingAsset}
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
        </MainLayout >
    );
}
