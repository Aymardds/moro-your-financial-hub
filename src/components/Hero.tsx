import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Wallet } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success/20 rounded-full blur-3xl opacity-20" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-accent-foreground">
              Nouvelle génération de gestion financière
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Gérez votre <span className="bg-gradient-primary bg-clip-text text-transparent">business</span>
            <br />
            en toute simplicité
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MORO accompagne les entrepreneurs du secteur informel avec des outils simples et puissants pour 
            gérer leurs opérations, épargner et accéder au financement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="gap-2">
              Créer mon compte
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg">
              Voir la démo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-muted-foreground">Entrepreneurs actifs</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div className="text-3xl font-bold">500M+</div>
              <div className="text-sm text-muted-foreground">FCFA gérés</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
