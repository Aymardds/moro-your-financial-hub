import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  PiggyBank, 
  Lightbulb, 
  Users, 
  Building2, 
  Sparkles 
} from "lucide-react";

const features = [
  {
    icon: LineChart,
    title: "Opérations quotidiennes",
    description: "Suivez vos ventes et dépenses en temps réel avec des rapports clairs et exportables.",
    color: "primary"
  },
  {
    icon: PiggyBank,
    title: "Épargne intelligente",
    description: "Définissez vos objectifs d'épargne et suivez votre progression automatiquement.",
    color: "success"
  },
  {
    icon: Lightbulb,
    title: "Micro-projets",
    description: "Planifiez et gérez vos projets avec suivi budgétaire et recommandations IA.",
    color: "primary"
  },
  {
    icon: Users,
    title: "Gestion coopérative",
    description: "Gérez collectivement vos membres, cotisations et projets communs.",
    color: "success"
  },
  {
    icon: Building2,
    title: "Financement accessible",
    description: "Accédez à des financements adaptés grâce à votre historique et notre scoring IA.",
    color: "primary"
  },
  {
    icon: Sparkles,
    title: "Intelligence artificielle",
    description: "Bénéficiez de recommandations personnalisées pour optimiser votre gestion.",
    color: "success"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Tous les outils pour <span className="text-primary">réussir</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            MORO vous accompagne à chaque étape de votre parcours entrepreneurial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-medium transition-all duration-300 border-border/50 hover:border-primary/20"
            >
              <div className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
