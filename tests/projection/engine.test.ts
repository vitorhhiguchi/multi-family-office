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

        it('deve ignorar movimentações MONTHLY e YEARLY', () => {
            const simulation = createTestSimulation({
                startYear: 2024,
                endYear: 2024,
                annualRealRate: 0,
                initialPatrimony: { financial: 100000, realEstate: 0 },
                movements: [
                    createTestMovement({
                        frequency: MovementFrequency.MONTHLY,
                        amount: 5000,
                        startYear: 2024,
                    }),
                    createTestMovement({
                        id: 'mov-2',
                        frequency: MovementFrequency.YEARLY,
                        amount: 10000,
                        startYear: 2024,
                    }),
                ],
            });

            const result = runProjection(simulation);
            const yearResult = result.yearlyResults[0];

            // Movimentações MONTHLY e YEARLY devem ser ignoradas
            expect(yearResult.totalInflows).toBe(0);
            expect(yearResult.totalOutflows).toBe(0);
            expect(yearResult.patrimonyEnd.financial).toBe(100000);
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
});
