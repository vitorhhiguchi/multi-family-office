/**
 * Motor de Projeção Patrimonial
 *
 * Função pura que calcula a projeção ano a ano aplicando
 * taxa real composta sobre o patrimônio.
 *
 * Escopo atual:
 * - Aplica juros compostos anuais (o efeito composto emerge da aplicação
 * - recorrente da taxa sobre o patrimônio acumulado ao longo do tempo)
 * - Separa patrimônio financeiro e imobilizado
 * - Suporta movimentações ONE_TIME (entradas e saídas pontuais)
 * - Ignora movimentações MONTHLY e YEARLY (etapa futura)
 * - Ignora seguros e mudanças de status (etapa futura)
 */

import {
    LifeStatus,
    Movement,
    MovementDirection,
    MovementFrequency,
    PatrimonyBreakdown,
    ProjectionResult,
    Simulation,
    YearlyProjectionResult,
} from '../../domain/projection.types';

/**
 * Cria um PatrimonyBreakdown a partir de valores financeiro e imobiliário.
 */
function createPatrimonyBreakdown(financial: number, realEstate: number): PatrimonyBreakdown {
    return {
        financial,
        realEstate,
        total: financial + realEstate,
    };
}

/**
 * Aplica a taxa real composta sobre um valor.
 * @param value Valor base
 * @param rate Taxa como decimal (ex: 0.05 para 5%)
 * @returns Rendimento gerado (não o valor total)
 */
function calculateAnnualReturn(value: number, rate: number): number {
    return value * rate;
}

/**
 * Calcula o impacto líquido das movimentações ONE_TIME em um ano.
 * @param movements Lista de movimentações
 * @param year Ano para filtrar
 * @returns Objeto com totalInflows, totalOutflows e netImpact
 */
function calculateOneTimeMovementsImpact(
    movements: Movement[],
    year: number
): { totalInflows: number; totalOutflows: number; netImpact: number } {
    let totalInflows = 0;
    let totalOutflows = 0;

    for (const movement of movements) {
        // Apenas movimentações ONE_TIME no ano especificado
        if (movement.frequency !== MovementFrequency.ONE_TIME) {
            continue;
        }
        if (movement.startYear !== year) {
            continue;
        }

        if (movement.direction === MovementDirection.INFLOW) {
            totalInflows += movement.amount;
        } else {
            totalOutflows += movement.amount;
        }
    }

    return {
        totalInflows,
        totalOutflows,
        netImpact: totalInflows - totalOutflows,
    };
}

/**
 * Gera a projeção patrimonial ano a ano.
 *
 * Ordem de cálculo por ano:
 * 1. Aplica movimentações ONE_TIME (afetam patrimônio financeiro)
 * 2. Calcula rendimento sobre patrimônio total (após movimentações)
 * 3. Distribui rendimento proporcionalmente
 *
 * @param simulation Configuração da simulação
 * @returns Resultado da projeção com lista de resultados anuais
 */
export function runProjection(simulation: Simulation): ProjectionResult {
    const { startYear, endYear, annualRealRate, initialPatrimony, movements } = simulation;

    const yearlyResults: YearlyProjectionResult[] = [];

    let currentFinancial = initialPatrimony.financial;
    let currentRealEstate = initialPatrimony.realEstate;

    for (let year = startYear; year <= endYear; year++) {
        const patrimonyStart = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        // 1. Aplica movimentações ONE_TIME (antes dos juros)
        const movementImpact = calculateOneTimeMovementsImpact(movements, year);

        // Movimentações afetam apenas patrimônio financeiro
        // Patrimônio não pode ficar negativo
        currentFinancial = Math.max(0, currentFinancial + movementImpact.netImpact);

        // 2. Calcula rendimento sobre o patrimônio total (após movimentações)
        const totalAfterMovements = currentFinancial + currentRealEstate;
        const investmentReturn = calculateAnnualReturn(totalAfterMovements, annualRealRate);

        // 3. Distribui o rendimento proporcionalmente
        let financialReturn = 0;
        let realEstateReturn = 0;

        if (totalAfterMovements > 0) {
            const financialRatio = currentFinancial / totalAfterMovements;
            const realEstateRatio = currentRealEstate / totalAfterMovements;
            financialReturn = investmentReturn * financialRatio;
            realEstateReturn = investmentReturn * realEstateRatio;
        }

        // Atualiza patrimônio para o final do ano
        currentFinancial += financialReturn;
        currentRealEstate += realEstateReturn;

        const patrimonyEnd = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        yearlyResults.push({
            year,
            lifeStatus: LifeStatus.ALIVE, // Status dinâmico será tratado em etapa futura
            patrimonyStart,
            patrimonyEnd,
            totalInflows: movementImpact.totalInflows,
            totalOutflows: movementImpact.totalOutflows,
            investmentReturn,
            insuranceImpact: 0, // Ignorado nesta versão
        });
    }

    return {
        simulationId: simulation.id,
        yearlyResults,
    };
}
