import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';
import type {
    CreateSimulationInput,
    UpdateSimulationInput,
    DuplicateSimulationInput
} from '../schemas/simulation.schema.js';

type TransactionClient = Prisma.TransactionClient;

export class SimulationService {
    async create(data: CreateSimulationInput) {
        // Check if simulation with same name already exists for this client
        const existing = await prisma.simulation.findFirst({
            where: {
                clientId: data.clientId,
                name: data.name,
            },
        });

        if (existing) {
            throw new Error('A simulation with this name already exists for this client');
        }

        return prisma.simulation.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                realRate: data.realRate ?? 0.04,
                clientId: data.clientId,
            },
        });
    }

    async findAll(clientId?: number, includeAllVersions = false) {
        if (includeAllVersions) {
            return prisma.simulation.findMany({
                where: clientId ? { clientId } : undefined,
                orderBy: [{ name: 'asc' }, { version: 'desc' }],
                include: {
                    client: true,
                    assets: {
                        include: {
                            records: {
                                orderBy: { date: 'desc' },
                            },
                            financing: true,
                        },
                    },
                    movements: {
                        orderBy: { startDate: 'asc' },
                    },
                    insurances: true,
                },
            });
        }

        // Only get latest version of each simulation name
        const simulations = await prisma.simulation.findMany({
            where: clientId ? { clientId } : undefined,
            orderBy: [{ name: 'asc' }, { version: 'desc' }],
            include: {
                client: true,
                assets: {
                    include: {
                        records: {
                            orderBy: { date: 'desc' },
                        },
                        financing: true,
                    },
                },
                movements: {
                    orderBy: { startDate: 'asc' },
                },
                insurances: true,
            },
        });

        // Group by name and get the latest version (highest version number)
        const latestVersions = new Map<string, typeof simulations[0]>();
        for (const sim of simulations) {
            const key = `${sim.clientId}-${sim.name}`;
            if (!latestVersions.has(key)) {
                latestVersions.set(key, sim);
            }
        }

        return Array.from(latestVersions.values());
    }

    async findById(id: number) {
        return prisma.simulation.findUnique({
            where: { id },
            include: {
                client: true,
                assets: {
                    include: {
                        records: {
                            orderBy: { date: 'desc' },
                        },
                        financing: true,
                    },
                },
                movements: {
                    orderBy: { startDate: 'asc' },
                },
                insurances: true,
            },
        });
    }

    async update(id: number, data: UpdateSimulationInput) {
        const simulation = await prisma.simulation.findUnique({ where: { id } });

        if (!simulation) {
            throw new Error('Simulation not found');
        }

        if (simulation.isCurrentSituation) {
            throw new Error('Cannot edit the Current Situation simulation');
        }

        return prisma.simulation.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.realRate !== undefined && { realRate: data.realRate }),
            },
        });
    }

    async delete(id: number) {
        const simulation = await prisma.simulation.findUnique({ where: { id } });

        if (!simulation) {
            throw new Error('Simulation not found');
        }

        if (simulation.isCurrentSituation) {
            throw new Error('Cannot delete the Current Situation simulation');
        }

        return prisma.simulation.delete({
            where: { id },
        });
    }

    async createVersion(id: number) {
        const source = await this.findById(id);

        if (!source) {
            throw new Error('Simulation not found');
        }

        // Get the highest version for this simulation name
        const maxVersion = await prisma.simulation.aggregate({
            where: {
                clientId: source.clientId,
                name: source.name,
            },
            _max: {
                version: true,
            },
        });

        const newVersion = (maxVersion._max.version ?? 0) + 1;

        // Create new simulation with incremented version
        return prisma.$transaction(async (tx: TransactionClient) => {
            const newSimulation = await tx.simulation.create({
                data: {
                    name: source.name,
                    startDate: source.startDate,
                    realRate: source.realRate,
                    clientId: source.clientId,
                    version: newVersion,
                },
            });

            // Copy assets with their records
            for (const asset of source.assets) {
                const newAsset = await tx.asset.create({
                    data: {
                        name: asset.name,
                        type: asset.type,
                        simulationId: newSimulation.id,
                    },
                });

                // Copy records
                for (const record of asset.records) {
                    await tx.assetRecord.create({
                        data: {
                            assetId: newAsset.id,
                            value: record.value,
                            date: record.date,
                        },
                    });
                }

                // Copy financing if exists
                if (asset.financing) {
                    await tx.financing.create({
                        data: {
                            assetId: newAsset.id,
                            startDate: asset.financing.startDate,
                            installments: asset.financing.installments,
                            interestRate: asset.financing.interestRate,
                            downPayment: asset.financing.downPayment,
                        },
                    });
                }
            }

            // Copy movements
            for (const movement of source.movements) {
                await tx.movement.create({
                    data: {
                        name: movement.name,
                        type: movement.type,
                        category: movement.category,
                        value: movement.value,
                        frequency: movement.frequency,
                        startDate: movement.startDate,
                        endDate: movement.endDate,
                        simulationId: newSimulation.id,
                    },
                });
            }

            // Copy insurances
            for (const insurance of source.insurances) {
                await tx.insurance.create({
                    data: {
                        name: insurance.name,
                        type: insurance.type,
                        startDate: insurance.startDate,
                        durationMonths: insurance.durationMonths,
                        premium: insurance.premium,
                        insuredValue: insurance.insuredValue,
                        simulationId: newSimulation.id,
                    },
                });
            }

            return newSimulation;
        });
    }

    async duplicate(id: number, data: DuplicateSimulationInput) {
        // Check if simulation with new name already exists
        const source = await this.findById(id);

        if (!source) {
            throw new Error('Simulation not found');
        }

        const existing = await prisma.simulation.findFirst({
            where: {
                clientId: source.clientId,
                name: data.name,
            },
        });

        if (existing) {
            throw new Error('A simulation with this name already exists');
        }

        // Create duplicate with new name
        return prisma.$transaction(async (tx: TransactionClient) => {
            const newSimulation = await tx.simulation.create({
                data: {
                    name: data.name,
                    startDate: source.startDate,
                    realRate: source.realRate,
                    clientId: source.clientId,
                    version: 1,
                },
            });

            // Copy assets with their records (same logic as createVersion)
            for (const asset of source.assets) {
                const newAsset = await tx.asset.create({
                    data: {
                        name: asset.name,
                        type: asset.type,
                        simulationId: newSimulation.id,
                    },
                });

                for (const record of asset.records) {
                    await tx.assetRecord.create({
                        data: {
                            assetId: newAsset.id,
                            value: record.value,
                            date: record.date,
                        },
                    });
                }

                if (asset.financing) {
                    await tx.financing.create({
                        data: {
                            assetId: newAsset.id,
                            startDate: asset.financing.startDate,
                            installments: asset.financing.installments,
                            interestRate: asset.financing.interestRate,
                            downPayment: asset.financing.downPayment,
                        },
                    });
                }
            }

            for (const movement of source.movements) {
                await tx.movement.create({
                    data: {
                        name: movement.name,
                        type: movement.type,
                        category: movement.category,
                        value: movement.value,
                        frequency: movement.frequency,
                        startDate: movement.startDate,
                        endDate: movement.endDate,
                        simulationId: newSimulation.id,
                    },
                });
            }

            for (const insurance of source.insurances) {
                await tx.insurance.create({
                    data: {
                        name: insurance.name,
                        type: insurance.type,
                        startDate: insurance.startDate,
                        durationMonths: insurance.durationMonths,
                        premium: insurance.premium,
                        insuredValue: insurance.insuredValue,
                        simulationId: newSimulation.id,
                    },
                });
            }

            return newSimulation;
        });
    }

    async createCurrentSituation(clientId: number, sourceSimulationId: number) {
        const source = await this.findById(sourceSimulationId);

        if (!source) {
            throw new Error('Source simulation not found');
        }

        // Delete existing current situation if exists
        await prisma.simulation.deleteMany({
            where: {
                clientId,
                isCurrentSituation: true,
            },
        });

        // Create new current situation with today's date
        return prisma.$transaction(async (tx: TransactionClient) => {
            const newSimulation = await tx.simulation.create({
                data: {
                    name: 'Situação Atual',
                    startDate: new Date(),
                    realRate: source.realRate,
                    clientId,
                    isCurrentSituation: true,
                    version: 1,
                },
            });

            // Copy all data from source (same as duplicate)
            for (const asset of source.assets) {
                const newAsset = await tx.asset.create({
                    data: {
                        name: asset.name,
                        type: asset.type,
                        simulationId: newSimulation.id,
                    },
                });

                for (const record of asset.records) {
                    await tx.assetRecord.create({
                        data: {
                            assetId: newAsset.id,
                            value: record.value,
                            date: record.date,
                        },
                    });
                }

                if (asset.financing) {
                    await tx.financing.create({
                        data: {
                            assetId: newAsset.id,
                            startDate: asset.financing.startDate,
                            installments: asset.financing.installments,
                            interestRate: asset.financing.interestRate,
                            downPayment: asset.financing.downPayment,
                        },
                    });
                }
            }

            for (const movement of source.movements) {
                await tx.movement.create({
                    data: {
                        name: movement.name,
                        type: movement.type,
                        category: movement.category,
                        value: movement.value,
                        frequency: movement.frequency,
                        startDate: movement.startDate,
                        endDate: movement.endDate,
                        simulationId: newSimulation.id,
                    },
                });
            }

            for (const insurance of source.insurances) {
                await tx.insurance.create({
                    data: {
                        name: insurance.name,
                        type: insurance.type,
                        startDate: insurance.startDate,
                        durationMonths: insurance.durationMonths,
                        premium: insurance.premium,
                        insuredValue: insurance.insuredValue,
                        simulationId: newSimulation.id,
                    },
                });
            }

            return newSimulation;
        });
    }
}

export const simulationService = new SimulationService();
