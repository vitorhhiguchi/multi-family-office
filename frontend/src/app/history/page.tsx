'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout, ClientNavigation } from '@/components/layout';
import { useClients, useSimulations } from '@/hooks';
import { Client, Simulation } from '@/types';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ArrowRight } from 'lucide-react';
import { ClientSelector } from '@/components/dashboard';
import { getSimulationStats } from '@/lib/projection-engine';

export default function HistoryPage() {
    const router = useRouter();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const { data: clients, isLoading: isLoadingClients } = useClients();
    const { data: allSimulations, isLoading: isLoadingSimulations } = useSimulations({
        clientId: selectedClient?.id,
        includeAllVersions: true
    });

    // Helper to group simulations by name
    const groupedSimulations = (allSimulations || []).reduce((groups, sim) => {
        const key = sim.name;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(sim);
        return groups;
    }, {} as Record<string, Simulation[]>);

    // Sort groups: "Plano original" first, then others alphabetically
    const sortedGroupKeys = Object.keys(groupedSimulations).sort((a, b) => {
        if (a === 'Plano original') return -1;
        if (b === 'Plano original') return 1;
        return a.localeCompare(b);
    });

    const handleViewProjection = (simulationId: number) => {
        router.push(`/projection?simulationId=${simulationId}`);
    };

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
            <div className="min-h-screen bg-background text-white p-6">
                <header className="flex flex-col gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <ClientSelector
                            clients={clients || []}
                            selectedClient={selectedClient}
                            onSelect={setSelectedClient}
                        />
                    </div>
                    <ClientNavigation />
                </header>

                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-serif text-[#E0E0E0]">Histórico de simulações</h2>
                    </div>

                    <div className="border-t border-[#333333] pt-6">
                        {isLoadingSimulations ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !selectedClient ? (
                            <div className="text-center text-muted-foreground py-12">
                                Selecione um cliente para visualizar o histórico
                            </div>
                        ) : sortedGroupKeys.length === 0 ? (
                            <div className="text-center text-muted-foreground py-12">
                                Nenhuma simulação encontrada para este cliente
                            </div>
                        ) : (
                            <Accordion type="multiple" className="space-y-4">
                                {sortedGroupKeys.map((groupName) => {
                                    const versions = groupedSimulations[groupName]
                                        .sort((a, b) => b.version - a.version); // Sort by version desc
                                    const latestVersion = versions[0];

                                    return (
                                        <AccordionItem
                                            key={groupName}
                                            value={groupName}
                                            className="border border-[#333333] rounded-lg px-4 bg-[#111111]"
                                        >
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                        <span className="text-lg font-bold">
                                                            {groupName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-lg font-medium text-white">{groupName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="px-2 pb-4">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b-[#333333] hover:bg-transparent">
                                                                <TableHead className="text-muted-foreground w-[120px]">Data</TableHead>
                                                                <TableHead className="text-muted-foreground w-[150px]">Patrimônio Final</TableHead>
                                                                <TableHead className="text-muted-foreground w-[180px]">Data de Aposentadoria</TableHead>
                                                                <TableHead className="text-muted-foreground w-[100px]">Versão</TableHead>
                                                                <TableHead className="text-right text-muted-foreground">Ação</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {versions.map((sim) => {
                                                                // Calculate projection stats on the fly
                                                                const stats = getSimulationStats(sim);

                                                                return (
                                                                    <TableRow key={sim.id} className="border-b-[#222222] hover:bg-[#1a1a1a]">
                                                                        <TableCell className="font-medium text-white">
                                                                            {format(new Date(sim.createdAt), "dd/MM/yy", { locale: ptBR })}
                                                                        </TableCell>
                                                                        <TableCell className="text-white">
                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.finalPatrimony)}
                                                                        </TableCell>
                                                                        <TableCell className="text-white text-center">
                                                                            {stats.retirementAge ? stats.retirementAge : '--'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="text-muted-foreground border-[#333333]">
                                                                                v{sim.version}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-muted-foreground hover:text-white hover:bg-[#333333]"
                                                                                onClick={() => handleViewProjection(sim.id)}
                                                                            >
                                                                                Ver no gráfico
                                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
