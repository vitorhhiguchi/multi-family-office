import { runProjection } from '../../src/projection/engine';
import {
    LifeStatus,
    Movement,
    MovementCategory,
    MovementDirection,
    MovementFrequency,
    Simulation,
} from '../../domain/projection.types';

/**
 * Helper para criar uma simulação mínima para testes.
 */
function createTestSimulation(overrides: Partial<Simulation> = {}): Simulation {
    return {
        id: 'test-sim-1',
        name: 'Test Simulation',
        startYear: 2024,
        endYear: 2026,
        annualRealRate: 0.05,
        initialPatrimony: {
            financial: 100000,
            realEstate: 50000,
        },
        movements: [],
        insurances: [],
        initialLifeStatus: LifeStatus.ALIVE,
        lifeStatusEvents: [],
        includeInsurance: false,
        ...overrides,
    };
}

describe('runProjection', () => {
    describe('projeção de 1 ano', () => {
        it('deve aplicar taxa real composta corretamente', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.05,
                initialPatrimony: { financial: 100000, realEstate: 0 },
            });

            const result = runProjection(simulation);

            expect(result.yearlyResults).toHaveLength(1);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.year).toBe(2024);
            expect(yearResult.patrimonyStart.financial).toBe(100000);
            expect(yearResult.patrimonyStart.total).toBe(100000);
            expect(yearResult.investmentReturn).toBe(5000); // 100000 * 0.05
            expect(yearResult.patrimonyEnd.financial).toBe(105000);
            expect(yearResult.patrimonyEnd.total).toBe(105000);
        });

        it('deve distribuir rendimento proporcionalmente entre financeiro e imobilizado', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.10,
                initialPatrimony: { financial: 60000, realEstate: 40000 }, // 60% / 40%
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Total: 100000, rendimento: 10000
            expect(yearResult.investmentReturn).toBe(10000);

            // Financeiro: 60000 + (10000 * 0.6) = 66000
            expect(yearResult.patrimonyEnd.financial).toBe(66000);

            // Imobilizado: 40000 + (10000 * 0.4) = 44000
            expect(yearResult.patrimonyEnd.realEstate).toBe(44000);

            expect(yearResult.patrimonyEnd.total).toBe(110000);
        });
    });

    describe('projeção de múltiplos anos', () => {
        it('deve aplicar juros compostos ao longo dos anos', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026, // 3 anos
                annualRealRate: 0.10,
                initialPatrimony: { financial: 100000, realEstate: 0 },
            });

            const result = runProjection(simulation);

            expect(result.yearlyResults).toHaveLength(3);

            // Ano 1: 100000 * 1.10 = 110000
            expect(result.yearlyResults[0].patrimonyEnd.financial).toBe(110000);

            // Ano 2: 110000 * 1.10 = 121000
            expect(result.yearlyResults[1].patrimonyStart.financial).toBe(110000);
            expect(result.yearlyResults[1].patrimonyEnd.financial).toBe(121000);

            // Ano 3: 121000 * 1.10 = 133100
            expect(result.yearlyResults[2].patrimonyStart.financial).toBe(121000);
            expect(result.yearlyResults[2].patrimonyEnd.financial).toBe(133100);
        });

        it('deve manter continuidade entre anos', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2025,
                annualRealRate: 0.05,
            });

            const result = runProjection(simulation);

            // patrimonyEnd do ano 1 deve ser igual a patrimonyStart do ano 2
            const year1End = result.yearlyResults[0].patrimonyEnd;
            const year2Start = result.yearlyResults[1].patrimonyStart;

            expect(year2Start.financial).toBe(year1End.financial);
            expect(year2Start.realEstate).toBe(year1End.realEstate);
            expect(year2Start.total).toBe(year1End.total);
        });
    });

    describe('taxa 0% (patrimônio constante)', () => {
        it('deve manter patrimônio constante quando taxa é 0', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2030, // 7 anos
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 50000 },
            });

            const result = runProjection(simulation);

            // Todos os anos devem ter o mesmo patrimônio
            for (const yearResult of result.yearlyResults) {
                expect(yearResult.patrimonyStart.financial).toBe(100000);
                expect(yearResult.patrimonyStart.realEstate).toBe(50000);
                expect(yearResult.patrimonyEnd.financial).toBe(100000);
                expect(yearResult.patrimonyEnd.realEstate).toBe(50000);
                expect(yearResult.investmentReturn).toBe(0);
            }
        });
    });

    describe('casos de borda', () => {
        it('deve lidar com patrimônio inicial zero', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.10,
                initialPatrimony: { financial: 0, realEstate: 0 },
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.patrimonyStart.total).toBe(0);
            expect(yearResult.patrimonyEnd.total).toBe(0);
            expect(yearResult.investmentReturn).toBe(0);
        });

        it('deve retornar simulationId correto', () => {
            const simulation = createTestSimulation({ id: 'my-custom-id' });

            const result = runProjection(simulation);

            expect(result.simulationId).toBe('my-custom-id');
        });

        it('deve retornar lifeStatus ALIVE para todos os anos (versão base)', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
            });

            const result = runProjection(simulation);

            for (const yearResult of result.yearlyResults) {
                expect(yearResult.lifeStatus).toBe(LifeStatus.ALIVE);
            }
        });

        it('deve retornar zero para inflows, outflows e insuranceImpact (versão base)', () => {
            const simulation = createTestSimulation();

            const result = runProjection(simulation);

            for (const yearResult of result.yearlyResults) {
                expect(yearResult.insuranceImpact).toBe(0);
            }
        });
    });

    describe('movimentações ONE_TIME', () => {
        /**
         * Helper para criar uma movimentação de teste.
         */
        function createTestMovement(overrides: Partial<Movement> = {}): Movement {
            return {
                id: 'mov-1',
                name: 'Test Movement',
                direction: MovementDirection.INFLOW,
                category: MovementCategory.OTHER_INCOME,
                frequency: MovementFrequency.ONE_TIME,
                amount: 10000,
                startYear: 2024,
                ...overrides,
            };
        }

        it('deve aplicar entrada única (INFLOW) no ano correto', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 20000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.totalInflows).toBe(20000);
            expect(yearResult.totalOutflows).toBe(0);
            expect(yearResult.patrimonyEnd.financial).toBe(120000);
        });

        it('deve aplicar saída única (OUTFLOW) no ano correto', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        direction: MovementDirection.OUTFLOW,
                        amount: 30000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.totalInflows).toBe(0);
            expect(yearResult.totalOutflows).toBe(30000);
            expect(yearResult.patrimonyEnd.financial).toBe(70000);
        });

        it('deve aplicar movimentação ANTES do cálculo dos juros', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.10, // 10%
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 50000, // Adiciona 50k
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Patrimônio após movimento: 100000 + 50000 = 150000
            // Juros: 150000 * 0.10 = 15000
            // Final: 150000 + 15000 = 165000
            expect(yearResult.investmentReturn).toBe(15000);
            expect(yearResult.patrimonyEnd.financial).toBe(165000);
        });

        it('deve ignorar movimentações fora do período da simulação', () => {
            const simulation = createTestSimulation({
                startYear: 2025,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 50000,
                        startYear: 2024, // Antes do início da simulação
                    }),
                    createTestMovement({
                        id: 'mov-2',
                        direction: MovementDirection.OUTFLOW,
                        amount: 30000,
                        startYear: 2027, // Depois do fim da simulação
                    }),
                ],
            });

            const result = runProjection(simulation);

            // Nenhuma movimentação deve ser aplicada
            for (const yearResult of result.yearlyResults) {
                expect(yearResult.totalInflows).toBe(0);
                expect(yearResult.totalOutflows).toBe(0);
            }
            expect(result.yearlyResults[1].patrimonyEnd.financial).toBe(100000);
        });

        it('deve garantir que patrimônio não fique negativo após saída', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 50000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        direction: MovementDirection.OUTFLOW,
                        amount: 100000, // Maior que o patrimônio
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Patrimônio deve ser limitado a zero
            expect(yearResult.patrimonyEnd.financial).toBe(0);
            expect(yearResult.patrimonyEnd.total).toBe(0);
        });

        it('deve aplicar múltiplas movimentações no mesmo ano', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        id: 'mov-1',
                        direction: MovementDirection.INFLOW,
                        amount: 30000,
                        startYear: 2024,
                    }),
                    createTestMovement({
                        id: 'mov-2',
                        direction: MovementDirection.OUTFLOW,
                        amount: 10000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.totalInflows).toBe(30000);
            expect(yearResult.totalOutflows).toBe(10000);
            // 100000 + 30000 - 10000 = 120000
            expect(yearResult.patrimonyEnd.financial).toBe(120000);
        });
    });

    describe('movimentações MONTHLY', () => {
        /**
         * Helper para criar uma movimentação MONTHLY de teste.
         */
        function createMonthlyMovement(overrides: Partial<Movement> = {}): Movement {
            return {
                id: 'mov-monthly',
                name: 'Monthly Movement',
                direction: MovementDirection.INFLOW,
                category: MovementCategory.OTHER_INCOME,
                frequency: MovementFrequency.MONTHLY,
                amount: 1000, // Por mês
                startYear: 2024,
                ...overrides,
            };
        }

        it('deve aplicar valor * 12 por ano para MONTHLY', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createMonthlyMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 1000, // 1000 * 12 = 12000 por ano
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.totalInflows).toBe(12000); // 1000 * 12
            expect(yearResult.patrimonyEnd.financial).toBe(112000);
        });

        it('deve aplicar MONTHLY ao longo de múltiplos anos', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026, // 3 anos
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createMonthlyMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 1000,
                        startYear: 2024,
                        // Sem endYear = continua até o fim
                    }),
                ],
            });

            const result = runProjection(simulation);

            // Ano 1: 100000 + 12000 = 112000
            expect(result.yearlyResults[0].totalInflows).toBe(12000);
            expect(result.yearlyResults[0].patrimonyEnd.financial).toBe(112000);

            // Ano 2: 112000 + 12000 = 124000
            expect(result.yearlyResults[1].totalInflows).toBe(12000);
            expect(result.yearlyResults[1].patrimonyEnd.financial).toBe(124000);

            // Ano 3: 124000 + 12000 = 136000
            expect(result.yearlyResults[2].totalInflows).toBe(12000);
            expect(result.yearlyResults[2].patrimonyEnd.financial).toBe(136000);
        });

        it('deve respeitar endYear para MONTHLY', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createMonthlyMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 1000,
                        startYear: 2024,
                        endYear: 2025, // Para em 2025
                    }),
                ],
            });

            const result = runProjection(simulation);

            // 2024: aplica
            expect(result.yearlyResults[0].totalInflows).toBe(12000);
            // 2025: aplica
            expect(result.yearlyResults[1].totalInflows).toBe(12000);
            // 2026: NÃO aplica (após endYear)
            expect(result.yearlyResults[2].totalInflows).toBe(0);
        });

        it('deve ignorar MONTHLY antes de startYear', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createMonthlyMovement({
                        startYear: 2025, // Começa em 2025
                    }),
                ],
            });

            const result = runProjection(simulation);

            // 2024: NÃO aplica (antes de startYear)
            expect(result.yearlyResults[0].totalInflows).toBe(0);
            // 2025: aplica
            expect(result.yearlyResults[1].totalInflows).toBe(12000);
            // 2026: aplica
            expect(result.yearlyResults[2].totalInflows).toBe(12000);
        });
    });

    describe('movimentações YEARLY', () => {
        /**
         * Helper para criar uma movimentação YEARLY de teste.
         */
        function createYearlyMovement(overrides: Partial<Movement> = {}): Movement {
            return {
                id: 'mov-yearly',
                name: 'Yearly Movement',
                direction: MovementDirection.INFLOW,
                category: MovementCategory.OTHER_INCOME,
                frequency: MovementFrequency.YEARLY,
                amount: 10000,
                startYear: 2024,
                ...overrides,
            };
        }

        it('deve aplicar valor integral por ano para YEARLY', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createYearlyMovement({
                        direction: MovementDirection.INFLOW,
                        amount: 20000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.totalInflows).toBe(20000);
            expect(yearResult.patrimonyEnd.financial).toBe(120000);
        });

        it('deve aplicar YEARLY ao longo de múltiplos anos', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createYearlyMovement({
                        amount: 10000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);

            // Cada ano adiciona 10000
            expect(result.yearlyResults[0].patrimonyEnd.financial).toBe(110000);
            expect(result.yearlyResults[1].patrimonyEnd.financial).toBe(120000);
            expect(result.yearlyResults[2].patrimonyEnd.financial).toBe(130000);
        });

        it('deve respeitar endYear para YEARLY', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createYearlyMovement({
                        amount: 10000,
                        startYear: 2024,
                        endYear: 2024, // Apenas em 2024
                    }),
                ],
            });

            const result = runProjection(simulation);

            // 2024: aplica
            expect(result.yearlyResults[0].totalInflows).toBe(10000);
            // 2025: NÃO aplica
            expect(result.yearlyResults[1].totalInflows).toBe(0);
            // 2026: NÃO aplica
            expect(result.yearlyResults[2].totalInflows).toBe(0);
        });
    });

    describe('combinação de frequências', () => {
        it('deve combinar ONE_TIME + MONTHLY + YEARLY no mesmo ano', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    {
                        id: 'one-time',
                        name: 'One Time',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.OTHER_INCOME,
                        frequency: MovementFrequency.ONE_TIME,
                        amount: 5000,
                        startYear: 2024,
                    },
                    {
                        id: 'monthly',
                        name: 'Monthly',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.OTHER_INCOME,
                        frequency: MovementFrequency.MONTHLY,
                        amount: 1000, // 12000 por ano
                        startYear: 2024,
                    },
                    {
                        id: 'yearly',
                        name: 'Yearly',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 3000,
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Inflows: 5000 (one-time) + 12000 (monthly) = 17000
            expect(yearResult.totalInflows).toBe(17000);
            // Outflows: 3000 (yearly)
            expect(yearResult.totalOutflows).toBe(3000);
            // Net: 17000 - 3000 = 14000
            // Final: 100000 + 14000 = 114000
            expect(yearResult.patrimonyEnd.financial).toBe(114000);
        });

        it('deve aplicar movimentações antes dos juros na combinação', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.10, // 10%
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    {
                        id: 'monthly',
                        name: 'Monthly Income',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.OTHER_INCOME,
                        frequency: MovementFrequency.MONTHLY,
                        amount: 5000, // 60000 por ano
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Após movimentações: 100000 + 60000 = 160000
            // Juros: 160000 * 0.10 = 16000
            // Final: 160000 + 16000 = 176000
            expect(yearResult.investmentReturn).toBe(16000);
            expect(yearResult.patrimonyEnd.financial).toBe(176000);
        });
    });

    describe('status de vida', () => {
        it('ALIVE deve aplicar movimentações normalmente', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.ALIVE,
                lifeStatusEvents: [],
                movements: [
                    {
                        id: 'income',
                        name: 'Salary',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.WORK_INCOME,
                        frequency: MovementFrequency.YEARLY,
                        amount: 20000,
                        startYear: 2024,
                    },
                    {
                        id: 'expense',
                        name: 'Living Cost',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 10000,
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.lifeStatus).toBe(LifeStatus.ALIVE);
            expect(yearResult.totalInflows).toBe(20000);
            expect(yearResult.totalOutflows).toBe(10000);
            expect(yearResult.patrimonyEnd.financial).toBe(110000); // 100k + 20k - 10k
        });

        it('DECEASED deve ignorar entradas e aplicar 50% das despesas', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.DECEASED,
                lifeStatusEvents: [],
                movements: [
                    {
                        id: 'income',
                        name: 'Salary',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.WORK_INCOME,
                        frequency: MovementFrequency.YEARLY,
                        amount: 20000,
                        startYear: 2024,
                    },
                    {
                        id: 'expense',
                        name: 'Living Cost',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 10000,
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.lifeStatus).toBe(LifeStatus.DECEASED);
            expect(yearResult.totalInflows).toBe(0); // Entradas ignoradas
            expect(yearResult.totalOutflows).toBe(5000); // 50% de 10000
            expect(yearResult.patrimonyEnd.financial).toBe(95000); // 100k - 5k
        });

        it('DISABLED deve ignorar entradas e manter despesas integrais', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.DISABLED,
                lifeStatusEvents: [],
                movements: [
                    {
                        id: 'income',
                        name: 'Salary',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.WORK_INCOME,
                        frequency: MovementFrequency.YEARLY,
                        amount: 20000,
                        startYear: 2024,
                    },
                    {
                        id: 'expense',
                        name: 'Living Cost',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 10000,
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            expect(yearResult.lifeStatus).toBe(LifeStatus.DISABLED);
            expect(yearResult.totalInflows).toBe(0); // Entradas ignoradas
            expect(yearResult.totalOutflows).toBe(10000); // Despesas integrais
            expect(yearResult.patrimonyEnd.financial).toBe(90000); // 100k - 10k
        });

        it('deve respeitar mudança de status via lifeStatusEvents', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.ALIVE,
                lifeStatusEvents: [
                    { year: 2025, status: LifeStatus.DISABLED },
                    { year: 2026, status: LifeStatus.DECEASED },
                ],
                movements: [
                    {
                        id: 'income',
                        name: 'Salary',
                        direction: MovementDirection.INFLOW,
                        category: MovementCategory.WORK_INCOME,
                        frequency: MovementFrequency.YEARLY,
                        amount: 10000,
                        startYear: 2024,
                    },
                    {
                        id: 'expense',
                        name: 'Living Cost',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 6000,
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);

            // 2024: ALIVE - entrada normal, despesa normal
            expect(result.yearlyResults[0].lifeStatus).toBe(LifeStatus.ALIVE);
            expect(result.yearlyResults[0].totalInflows).toBe(10000);
            expect(result.yearlyResults[0].totalOutflows).toBe(6000);
            // 100k + 10k - 6k = 104k
            expect(result.yearlyResults[0].patrimonyEnd.financial).toBe(104000);

            // 2025: DISABLED - sem entrada, despesa integral
            expect(result.yearlyResults[1].lifeStatus).toBe(LifeStatus.DISABLED);
            expect(result.yearlyResults[1].totalInflows).toBe(0);
            expect(result.yearlyResults[1].totalOutflows).toBe(6000);
            // 104k - 6k = 98k
            expect(result.yearlyResults[1].patrimonyEnd.financial).toBe(98000);

            // 2026: DECEASED - sem entrada, despesa 50%
            expect(result.yearlyResults[2].lifeStatus).toBe(LifeStatus.DECEASED);
            expect(result.yearlyResults[2].totalInflows).toBe(0);
            expect(result.yearlyResults[2].totalOutflows).toBe(3000); // 50% de 6000
            // 98k - 3k = 95k
            expect(result.yearlyResults[2].patrimonyEnd.financial).toBe(95000);
        });

        it('juros devem ser aplicados após movimentações ajustadas por status', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0.10, // 10%
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.DECEASED,
                lifeStatusEvents: [],
                movements: [
                    {
                        id: 'expense',
                        name: 'Living Cost',
                        direction: MovementDirection.OUTFLOW,
                        category: MovementCategory.EXPENSE,
                        frequency: MovementFrequency.YEARLY,
                        amount: 20000, // 50% = 10000
                        startYear: 2024,
                    },
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Patrimônio após movimentação: 100000 - 10000 (50% de 20000) = 90000
            // Juros: 90000 * 0.10 = 9000
            // Final: 90000 + 9000 = 99000
            expect(yearResult.totalOutflows).toBe(10000);
            expect(yearResult.investmentReturn).toBe(9000);
            expect(yearResult.patrimonyEnd.financial).toBe(99000);
        });

        it('deve usar status inicial quando não há eventos', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2026,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.DISABLED,
                lifeStatusEvents: [], // Sem eventos
                movements: [],
            });

            const result = runProjection(simulation);

            // Todos os anos devem ter status DISABLED
            for (const yearResult of result.yearlyResults) {
                expect(yearResult.lifeStatus).toBe(LifeStatus.DISABLED);
            }
        });

        it('evento de status deve persistir para anos subsequentes', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2028,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                initialLifeStatus: LifeStatus.ALIVE,
                lifeStatusEvents: [
                    { year: 2025, status: LifeStatus.DECEASED },
                ],
                movements: [],
            });

            const result = runProjection(simulation);

            expect(result.yearlyResults[0].lifeStatus).toBe(LifeStatus.ALIVE); // 2024
            expect(result.yearlyResults[1].lifeStatus).toBe(LifeStatus.DECEASED); // 2025
            expect(result.yearlyResults[2].lifeStatus).toBe(LifeStatus.DECEASED); // 2026
            expect(result.yearlyResults[3].lifeStatus).toBe(LifeStatus.DECEASED); // 2027
            expect(result.yearlyResults[4].lifeStatus).toBe(LifeStatus.DECEASED); // 2028
        });
    });
});
