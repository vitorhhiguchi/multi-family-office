/**
 * Motor de Projeção Patrimonial
 *
 * Função pura que calcula a projeção ano a ano aplicando
 * taxa real composta sobre o patrimônio.
 *
 * Escopo atual:
 * - Aplica juros compostos anuais (o efeito composto emerge da aplicação
 *   recorrente da taxa sobre o patrimônio acumulado ao longo do tempo)
 * - Separa patrimônio financeiro e imobilizado
 * - Suporta movimentações ONE_TIME, MONTHLY e YEARLY
 * - Suporta status de vida (ALIVE, DECEASED, DISABLED)
 * - Suporta seguros (prêmios anuais e indenização por trigger)
 */

import {
    Insurance,
    LifeStatus,
    LifeStatusEvent,
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
 * Resolve o status de vida ativo para um determinado ano.
 * 
 * Busca o evento mais recente (ano <= year) e retorna o status correspondente.
 * Se não houver eventos aplicáveis, retorna o status inicial.
 * 
 * @param initialStatus Status de vida inicial da simulação
 * @param events Lista de eventos de mudança de status
 * @param year Ano para resolver o status
 * @returns Status de vida ativo no ano
 */
function resolveLifeStatusForYear(
    initialStatus: LifeStatus,
    events: LifeStatusEvent[],
    year: number
): LifeStatus {
    // Filtra eventos que já ocorreram (ano <= year)
    const applicableEvents = events.filter(e => e.year <= year);

    if (applicableEvents.length === 0) {
        return initialStatus;
    }

    // Pega o evento mais recente
    const latestEvent = applicableEvents.reduce((latest, current) =>
        current.year > latest.year ? current : latest
    );

    return latestEvent.status;
}

/**
 * Verifica se uma movimentação está ativa em um determinado ano.
 */
function isMovementActiveInYear(movement: Movement, year: number): boolean {
    if (year < movement.startYear) {
        return false;
    }
    if (movement.endYear !== undefined && year > movement.endYear) {
        return false;
    }
    return true;
}

/**
 * Calcula o valor anual de uma movimentação baseado na frequência.
 * - ONE_TIME: valor integral apenas no startYear
 * - MONTHLY: valor * 12 por ano
 * - YEARLY: valor integral por ano
 */
function getAnnualMovementAmount(movement: Movement, year: number): number {
    switch (movement.frequency) {
        case MovementFrequency.ONE_TIME:
            // ONE_TIME só aplica no startYear
            return movement.startYear === year ? movement.amount : 0;
        case MovementFrequency.MONTHLY:
            // MONTHLY aplica valor * 12 se estiver no período
            return isMovementActiveInYear(movement, year) ? movement.amount * 12 : 0;
        case MovementFrequency.YEARLY:
            // YEARLY aplica valor integral se estiver no período
            return isMovementActiveInYear(movement, year) ? movement.amount : 0;
        default:
            return 0;
    }
}

/**
 * Calcula o impacto líquido das movimentações em um ano,
 * considerando o status de vida ativo.
 * 
 * Regras por status:
 * - ALIVE: entradas e saídas aplicadas normalmente
 * - DECEASED: entradas ignoradas, despesas aplicadas com 50%
 * - DISABLED: entradas ignoradas, despesas aplicadas normalmente
 * 
 * @param movements Lista de movimentações
 * @param year Ano para calcular
 * @param lifeStatus Status de vida ativo no ano
 * @returns Objeto com totalInflows, totalOutflows e netImpact
 */
function calculateMovementsImpact(
    movements: Movement[],
    year: number,
    lifeStatus: LifeStatus
): { totalInflows: number; totalOutflows: number; netImpact: number } {
    let totalInflows = 0;
    let totalOutflows = 0;

    for (const movement of movements) {
        const annualAmount = getAnnualMovementAmount(movement, year);

        if (annualAmount === 0) {
            continue;
        }

        if (movement.direction === MovementDirection.INFLOW) {
            // DECEASED e DISABLED: entradas não são aplicadas
            if (lifeStatus === LifeStatus.DECEASED || lifeStatus === LifeStatus.DISABLED) {
                continue;
            }
            totalInflows += annualAmount;
        } else {
            // OUTFLOW (despesas)
            if (lifeStatus === LifeStatus.DECEASED) {
                // DECEASED: despesas com 50%
                totalOutflows += annualAmount * 0.5;
            } else {
                // ALIVE e DISABLED: despesas normais
                totalOutflows += annualAmount;
            }
        }
    }

    return {
        totalInflows,
        totalOutflows,
        netImpact: totalInflows - totalOutflows,
    };
}

/**
 * Calcula o impacto dos seguros em um ano.
 * 
 * - Prêmios: aplicados anualmente (monthlyPremium * 12) como OUTFLOW
 * - Indenização: aplicada apenas uma vez no primeiro ano em que
 *   lifeStatus === triggerCondition
 * 
 * @param insurances Lista de seguros
 * @param lifeStatus Status de vida ativo no ano
 * @param triggeredInsuranceIds Set de IDs de seguros já acionados
 * @returns Objeto com totalPremiums, totalCoverage, netImpact e newlyTriggeredIds
 */
function calculateInsuranceImpact(
    insurances: Insurance[],
    lifeStatus: LifeStatus,
    triggeredInsuranceIds: Set<string>
): {
    totalPremiums: number;
    totalCoverage: number;
    netImpact: number;
    newlyTriggeredIds: string[];
} {
    let totalPremiums = 0;
    let totalCoverage = 0;
    const newlyTriggeredIds: string[] = [];

    for (const insurance of insurances) {
        // Prêmio anual (12 meses)
        totalPremiums += insurance.monthlyPremium * 12;

        // Indenização: apenas se trigger condition matches e ainda não foi acionado
        if (
            insurance.triggerCondition === lifeStatus &&
            !triggeredInsuranceIds.has(insurance.id)
        ) {
            totalCoverage += insurance.coverageAmount;
            newlyTriggeredIds.push(insurance.id);
        }
    }

    return {
        totalPremiums,
        totalCoverage,
        netImpact: totalCoverage - totalPremiums, // Coverage é entrada, premium é saída
        newlyTriggeredIds,
    };
}

/**
 * Gera a projeção patrimonial ano a ano.
 *
 * Ordem de cálculo por ano:
 * 1. Resolve status de vida ativo para o ano
 * 2. Aplica movimentações (respeitando regras de status de vida)
 * 3. Aplica seguros (se includeInsurance = true)
 * 4. Calcula rendimento sobre patrimônio total (após movimentações e seguros)
 * 5. Distribui rendimento proporcionalmente
 *
 * @param simulation Configuração da simulação
 * @returns Resultado da projeção com lista de resultados anuais
 */
export function runProjection(simulation: Simulation): ProjectionResult {
    const {
        startYear,
        endYear,
        annualRealRate,
        initialPatrimony,
        movements,
        insurances,
        initialLifeStatus,
        lifeStatusEvents,
        includeInsurance,
    } = simulation;

    const yearlyResults: YearlyProjectionResult[] = [];

    let currentFinancial = initialPatrimony.financial;
    let currentRealEstate = initialPatrimony.realEstate;

    // Rastreia seguros que já foram acionados (indenização já paga)
    const triggeredInsuranceIds = new Set<string>();

    for (let year = startYear; year <= endYear; year++) {
        const patrimonyStart = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        // 1. Resolve status de vida para o ano
        const lifeStatus = resolveLifeStatusForYear(initialLifeStatus, lifeStatusEvents, year);

        // 2. Aplica movimentações (respeitando status de vida)
        const movementImpact = calculateMovementsImpact(movements, year, lifeStatus);

        // Movimentações afetam apenas patrimônio financeiro
        // Patrimônio não pode ficar negativo
        currentFinancial = Math.max(0, currentFinancial + movementImpact.netImpact);

        // 3. Aplica seguros (se habilitado)
        let insuranceImpact = 0;
        if (includeInsurance && insurances.length > 0) {
            const insuranceResult = calculateInsuranceImpact(
                insurances,
                lifeStatus,
                triggeredInsuranceIds
            );

            // Marca novos seguros como acionados
            for (const id of insuranceResult.newlyTriggeredIds) {
                triggeredInsuranceIds.add(id);
            }

            insuranceImpact = insuranceResult.netImpact;
            currentFinancial = Math.max(0, currentFinancial + insuranceImpact);
        }

        // 4. Calcula rendimento sobre o patrimônio total (após movimentações e seguros)
        const totalAfterAdjustments = currentFinancial + currentRealEstate;
        const investmentReturn = calculateAnnualReturn(totalAfterAdjustments, annualRealRate);

        // 5. Distribui o rendimento proporcionalmente
        let financialReturn = 0;
        let realEstateReturn = 0;

        if (totalAfterAdjustments > 0) {
            const financialRatio = currentFinancial / totalAfterAdjustments;
            const realEstateRatio = currentRealEstate / totalAfterAdjustments;
            financialReturn = investmentReturn * financialRatio;
            realEstateReturn = investmentReturn * realEstateRatio;
        }

        // Atualiza patrimônio para o final do ano
        currentFinancial += financialReturn;
        currentRealEstate += realEstateReturn;

        const patrimonyEnd = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        yearlyResults.push({
            year,
            lifeStatus,
            patrimonyStart,
            patrimonyEnd,
            totalInflows: movementImpact.totalInflows,
            totalOutflows: movementImpact.totalOutflows,
            investmentReturn,
            insuranceImpact,
        });
    }

    return {
        simulationId: simulation.id,
        yearlyResults,
    };
}
