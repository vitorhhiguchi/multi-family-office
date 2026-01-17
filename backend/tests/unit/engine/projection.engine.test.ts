import { ProjectionEngine } from '../../../src/engine/projection.engine';

describe('ProjectionEngine', () => {
    describe('Basic projection calculation', () => {
        it('should calculate compound growth correctly', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [{
                    id: 1,
                    name: 'Investment',
                    type: 'FINANCIAL' as const,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    records: [{
                        id: 1,
                        assetId: 1,
                        value: 100000,
                        date: new Date('2024-01-01'),
                        createdAt: new Date(),
                    }],
                    financing: null,
                }],
                movements: [],
                insurances: [],
            };

            const engine = new ProjectionEngine(simulation, 'ALIVE', 2025);
            const result = engine.run();

            expect(result.projections).toHaveLength(2);
            expect(result.projections[0].year).toBe(2024);
            // After first year: 100000 * 1.04 = 104000
            expect(result.projections[0].financialAssets).toBeCloseTo(104000, 0);
        });

        it('should handle DEAD status - divide expenses by 2', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [{
                    id: 1,
                    name: 'Investment',
                    type: 'FINANCIAL' as const,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    records: [{
                        id: 1,
                        assetId: 1,
                        value: 100000,
                        date: new Date('2024-01-01'),
                        createdAt: new Date(),
                    }],
                    financing: null,
                }],
                movements: [{
                    id: 1,
                    name: 'Expense',
                    type: 'EXPENSE' as const,
                    category: null,
                    value: 1000,
                    frequency: 'MONTHLY' as const,
                    startDate: new Date('2024-01-01'),
                    endDate: null,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
                insurances: [],
            };

            const engineAlive = new ProjectionEngine(simulation, 'ALIVE', 2024);
            const resultAlive = engineAlive.run();

            const engineDead = new ProjectionEngine(simulation, 'DEAD', 2024);
            const resultDead = engineDead.run();

            // ALIVE: expenses = 1000 * 12 = 12000
            expect(resultAlive.projections[0].totalExpenses).toBe(12000);

            // DEAD: expenses = 12000 / 2 = 6000
            expect(resultDead.projections[0].totalExpenses).toBe(6000);
        });

        it('should handle DEAD status - no income', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [],
                movements: [{
                    id: 1,
                    name: 'Salary',
                    type: 'INCOME' as const,
                    category: 'WORK' as const,
                    value: 10000,
                    frequency: 'MONTHLY' as const,
                    startDate: new Date('2024-01-01'),
                    endDate: null,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
                insurances: [],
            };

            const engineAlive = new ProjectionEngine(simulation, 'ALIVE', 2024);
            const resultAlive = engineAlive.run();

            const engineDead = new ProjectionEngine(simulation, 'DEAD', 2024);
            const resultDead = engineDead.run();

            expect(resultAlive.projections[0].totalIncome).toBe(120000);
            expect(resultDead.projections[0].totalIncome).toBe(0);
        });

        it('should handle INVALID status - only WORK income stops', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [],
                movements: [
                    {
                        id: 1,
                        name: 'Salary',
                        type: 'INCOME' as const,
                        category: 'WORK' as const,
                        value: 10000,
                        frequency: 'MONTHLY' as const,
                        startDate: new Date('2024-01-01'),
                        endDate: null,
                        simulationId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 2,
                        name: 'Dividends',
                        type: 'INCOME' as const,
                        category: 'PASSIVE' as const,
                        value: 2000,
                        frequency: 'MONTHLY' as const,
                        startDate: new Date('2024-01-01'),
                        endDate: null,
                        simulationId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                insurances: [],
            };

            const engineAlive = new ProjectionEngine(simulation, 'ALIVE', 2024);
            const resultAlive = engineAlive.run();

            const engineInvalid = new ProjectionEngine(simulation, 'INVALID', 2024);
            const resultInvalid = engineInvalid.run();

            // ALIVE: (10000 + 2000) * 12 = 144000
            expect(resultAlive.projections[0].totalIncome).toBe(144000);

            // INVALID: only passive = 2000 * 12 = 24000
            expect(resultInvalid.projections[0].totalIncome).toBe(24000);
        });
    });

    describe('Asset record selection', () => {
        it('should use most recent record before simulation date', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-06-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [{
                    id: 1,
                    name: 'Investment',
                    type: 'FINANCIAL' as const,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    records: [
                        {
                            id: 1,
                            assetId: 1,
                            value: 50000,
                            date: new Date('2023-01-01'),
                            createdAt: new Date(),
                        },
                        {
                            id: 2,
                            assetId: 1,
                            value: 75000,
                            date: new Date('2024-01-01'),
                            createdAt: new Date(),
                        },
                        {
                            id: 3,
                            assetId: 1,
                            value: 100000,
                            date: new Date('2024-12-01'),
                            createdAt: new Date(),
                        },
                    ],
                    financing: null,
                }],
                movements: [],
                insurances: [],
            };

            const engine = new ProjectionEngine(simulation, 'ALIVE', 2024);
            const result = engine.run();

            // Should use the record from 2024-01-01 (75000) as it's the most recent before 2024-06-01
            // After growth: 75000 * 1.04 = 78000
            expect(result.projections[0].financialAssets).toBeCloseTo(78000, 0);
        });
    });

    describe('Movement frequency', () => {
        it('should calculate ONCE frequency correctly', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [],
                movements: [{
                    id: 1,
                    name: 'Bonus',
                    type: 'INCOME' as const,
                    category: 'OTHER' as const,
                    value: 50000,
                    frequency: 'ONCE' as const,
                    startDate: new Date('2024-01-01'),
                    endDate: null,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
                insurances: [],
            };

            const engine = new ProjectionEngine(simulation, 'ALIVE', 2025);
            const result = engine.run();

            expect(result.projections[0].totalIncome).toBe(50000);
            expect(result.projections[1].totalIncome).toBe(0);
        });

        it('should calculate YEARLY frequency correctly', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [],
                movements: [{
                    id: 1,
                    name: 'Annual Bonus',
                    type: 'INCOME' as const,
                    category: 'OTHER' as const,
                    value: 30000,
                    frequency: 'YEARLY' as const,
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2026-12-31'),
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
                insurances: [],
            };

            const engine = new ProjectionEngine(simulation, 'ALIVE', 2026);
            const result = engine.run();

            expect(result.projections[0].totalIncome).toBe(30000);
            expect(result.projections[1].totalIncome).toBe(30000);
            expect(result.projections[2].totalIncome).toBe(30000);
        });
    });

    describe('Insurance calculations', () => {
        it('should include insurance value in total patrimony', () => {
            const simulation = {
                id: 1,
                name: 'Test',
                startDate: new Date('2024-01-01'),
                realRate: 0.04,
                clientId: 1,
                isCurrentSituation: false,
                version: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                assets: [{
                    id: 1,
                    name: 'Investment',
                    type: 'FINANCIAL' as const,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    records: [{
                        id: 1,
                        assetId: 1,
                        value: 100000,
                        date: new Date('2024-01-01'),
                        createdAt: new Date(),
                    }],
                    financing: null,
                }],
                movements: [],
                insurances: [{
                    id: 1,
                    name: 'Life Insurance',
                    type: 'LIFE' as const,
                    startDate: new Date('2024-01-01'),
                    durationMonths: 120,
                    premium: 500,
                    insuredValue: 1000000,
                    simulationId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }],
            };

            const engine = new ProjectionEngine(simulation, 'ALIVE', 2024);
            const result = engine.run();

            expect(result.projections[0].insuranceValue).toBe(1000000);
            expect(result.projections[0].totalPatrimony).toBeGreaterThan(
                result.projections[0].totalPatrimonyWithoutInsurance
            );
        });
    });
});
