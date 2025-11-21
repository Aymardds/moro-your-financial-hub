/**
 * Service de scoring IA pour l'évaluation des demandes de financement
 * Utilise des algorithmes d'analyse pour déterminer le score de crédit
 */

interface EntrepreneurProfile {
  id: string;
  operations_count: number;
  total_income: number;
  total_expenses: number;
  projects_count: number;
  completed_projects: number;
  savings_amount: number;
  account_age_days: number;
  transaction_frequency: number;
  average_transaction_amount: number;
}

interface ScoringFactors {
  financial_stability: number; // 0-100
  business_activity: number; // 0-100
  savings_behavior: number; // 0-100
  project_success_rate: number; // 0-100
  account_maturity: number; // 0-100
}

interface ScoringResult {
  total_score: number; // 0-100
  factors: ScoringFactors;
  risk_level: 'low' | 'medium' | 'high';
  recommendation: 'approve' | 'review' | 'reject';
  reasoning: string[];
}

/**
 * Calculer le score de financement pour un entrepreneur
 */
export const calculateFinancingScore = async (
  entrepreneurId: string,
  requestedAmount: number
): Promise<ScoringResult> => {
  try {
    // Récupérer le profil de l'entrepreneur depuis Supabase
    const profile = await fetchEntrepreneurProfile(entrepreneurId);

    if (!profile) {
      throw new Error('Profil entrepreneur introuvable');
    }

    // Calculer les différents facteurs
    const factors: ScoringFactors = {
      financial_stability: calculateFinancialStability(profile),
      business_activity: calculateBusinessActivity(profile),
      savings_behavior: calculateSavingsBehavior(profile),
      project_success_rate: calculateProjectSuccessRate(profile),
      account_maturity: calculateAccountMaturity(profile),
    };

    // Calculer le score total (pondération)
    const totalScore = calculateTotalScore(factors, requestedAmount, profile.total_income);

    // Déterminer le niveau de risque
    const riskLevel = determineRiskLevel(totalScore);

    // Générer la recommandation
    const recommendation = generateRecommendation(totalScore, riskLevel);

    // Générer le raisonnement
    const reasoning = generateReasoning(factors, totalScore, riskLevel);

    return {
      total_score: Math.round(totalScore),
      factors,
      risk_level: riskLevel,
      recommendation,
      reasoning,
    };
  } catch (error: any) {
    console.error('Scoring calculation error:', error);
    throw error;
  }
};

/**
 * Récupérer le profil de l'entrepreneur
 */
async function fetchEntrepreneurProfile(entrepreneurId: string): Promise<EntrepreneurProfile | null> {
  // En production, vous feriez un appel à Supabase
  // Pour l'instant, on simule les données
  const { supabase } = await import('@/integrations/supabase/client');

  // Récupérer les opérations
  const { data: operations } = await supabase
    .from('operations')
    .select('*')
    .eq('user_id', entrepreneurId);

  const income = operations?.filter((o: any) => o.type === 'income') || [];
  const expenses = operations?.filter((o: any) => o.type === 'expense') || [];

  const totalIncome = income.reduce((sum: number, o: any) => sum + o.amount, 0);
  const totalExpenses = expenses.reduce((sum: number, o: any) => sum + o.amount, 0);

  // Récupérer les projets
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', entrepreneurId);

  const completedProjects = projects?.filter((p: any) => p.status === 'completed') || [];

  // Récupérer l'épargne
  const { data: savings } = await supabase
    .from('savings')
    .select('*')
    .eq('user_id', entrepreneurId);

  const savingsAmount = savings?.reduce((sum: number, s: any) => sum + s.amount, 0) || 0;

  // Récupérer la date de création du compte
  const { data: user } = await supabase.auth.getUser();
  const accountAgeDays = user?.user?.created_at
    ? Math.floor((Date.now() - new Date(user.user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const transactionFrequency = operations?.length || 0;
  const averageTransactionAmount =
    operations?.length > 0
      ? (totalIncome + totalExpenses) / operations.length
      : 0;

  return {
    id: entrepreneurId,
    operations_count: operations?.length || 0,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    projects_count: projects?.length || 0,
    completed_projects: completedProjects.length,
    savings_amount: savingsAmount,
    account_age_days: accountAgeDays,
    transaction_frequency: transactionFrequency,
    average_transaction_amount: averageTransactionAmount,
  };
}

/**
 * Calculer la stabilité financière (0-100)
 */
function calculateFinancialStability(profile: EntrepreneurProfile): number {
  const balance = profile.total_income - profile.total_expenses;
  const incomeExpenseRatio =
    profile.total_expenses > 0 ? profile.total_income / profile.total_expenses : 1;

  // Score basé sur le solde positif
  const balanceScore = Math.min(50, (balance / 100000) * 50); // Max 50 points pour solde

  // Score basé sur le ratio revenus/dépenses
  const ratioScore = Math.min(50, incomeExpenseRatio * 25); // Max 50 points pour ratio

  return Math.min(100, balanceScore + ratioScore);
}

/**
 * Calculer l'activité commerciale (0-100)
 */
function calculateBusinessActivity(profile: EntrepreneurProfile): number {
  // Score basé sur la fréquence des transactions
  const frequencyScore = Math.min(40, (profile.transaction_frequency / 50) * 40);

  // Score basé sur le montant moyen des transactions
  const amountScore = Math.min(30, (profile.average_transaction_amount / 50000) * 30);

  // Score basé sur le nombre d'opérations
  const operationsScore = Math.min(30, (profile.operations_count / 100) * 30);

  return Math.min(100, frequencyScore + amountScore + operationsScore);
}

/**
 * Calculer le comportement d'épargne (0-100)
 */
function calculateSavingsBehavior(profile: EntrepreneurProfile): number {
  // Score basé sur le montant total épargné
  const savingsAmountScore = Math.min(60, (profile.savings_amount / 500000) * 60);

  // Score basé sur la régularité (présence d'épargne)
  const consistencyScore = profile.savings_amount > 0 ? 40 : 0;

  return Math.min(100, savingsAmountScore + consistencyScore);
}

/**
 * Calculer le taux de succès des projets (0-100)
 */
function calculateProjectSuccessRate(profile: EntrepreneurProfile): number {
  if (profile.projects_count === 0) {
    return 50; // Score neutre si aucun projet
  }

  const successRate = (profile.completed_projects / profile.projects_count) * 100;
  return Math.min(100, successRate);
}

/**
 * Calculer la maturité du compte (0-100)
 */
function calculateAccountMaturity(profile: EntrepreneurProfile): number {
  // Score basé sur l'ancienneté du compte
  const ageScore = Math.min(100, (profile.account_age_days / 365) * 100);
  return ageScore;
}

/**
 * Calculer le score total pondéré
 */
function calculateTotalScore(
  factors: ScoringFactors,
  requestedAmount: number,
  totalIncome: number
): number {
  // Pondération des facteurs
  const weights = {
    financial_stability: 0.30,
    business_activity: 0.25,
    savings_behavior: 0.20,
    project_success_rate: 0.15,
    account_maturity: 0.10,
  };

  let baseScore =
    factors.financial_stability * weights.financial_stability +
    factors.business_activity * weights.business_activity +
    factors.savings_behavior * weights.savings_behavior +
    factors.project_success_rate * weights.project_success_rate +
    factors.account_maturity * weights.account_maturity;

  // Ajustement basé sur le montant demandé par rapport aux revenus
  if (totalIncome > 0) {
    const amountRatio = requestedAmount / totalIncome;
    if (amountRatio > 3) {
      baseScore *= 0.7; // Pénalité si demande trop élevée
    } else if (amountRatio > 2) {
      baseScore *= 0.85;
    } else if (amountRatio < 0.5) {
      baseScore *= 1.1; // Bonus si demande raisonnable
    }
  }

  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Déterminer le niveau de risque
 */
function determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'low';
  if (score >= 50) return 'medium';
  return 'high';
}

/**
 * Générer la recommandation
 */
function generateRecommendation(
  score: number,
  riskLevel: 'low' | 'medium' | 'high'
): 'approve' | 'review' | 'reject' {
  if (score >= 70) return 'approve';
  if (score >= 50) return 'review';
  return 'reject';
}

/**
 * Générer le raisonnement détaillé
 */
function generateReasoning(
  factors: ScoringFactors,
  totalScore: number,
  riskLevel: 'low' | 'medium' | 'high'
): string[] {
  const reasoning: string[] = [];

  if (factors.financial_stability >= 70) {
    reasoning.push('Stabilité financière solide avec un bon équilibre revenus/dépenses');
  } else if (factors.financial_stability < 50) {
    reasoning.push('Stabilité financière à améliorer, déséquilibre détecté');
  }

  if (factors.business_activity >= 70) {
    reasoning.push('Activité commerciale régulière et soutenue');
  } else if (factors.business_activity < 50) {
    reasoning.push('Activité commerciale limitée, nécessite plus de transactions');
  }

  if (factors.savings_behavior >= 70) {
    reasoning.push('Bon comportement d\'épargne démontré');
  } else if (factors.savings_behavior < 50) {
    reasoning.push('Épargne insuffisante, recommandation d\'amélioration');
  }

  if (factors.project_success_rate >= 70) {
    reasoning.push('Taux de réussite des projets élevé');
  } else if (factors.project_success_rate < 50) {
    reasoning.push('Taux de réussite des projets à améliorer');
  }

  if (totalScore >= 70) {
    reasoning.push('Score global excellent, faible risque de défaut');
  } else if (totalScore < 50) {
    reasoning.push('Score global faible, risque élevé identifié');
  }

  return reasoning;
}

