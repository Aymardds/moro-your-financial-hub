import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export const Header = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const signOut = authContext?.signOut || (() => {});

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground shadow-soft">
              M
            </div>
            <span className="text-xl font-bold text-foreground">MORO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </Link>
            <Link to="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              À propos
            </Link>
            <Link to="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <Link to="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="hidden md:inline-flex">
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={signOut} className="hidden md:inline-flex">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden md:inline-flex">
                  Se connecter
                </Button>
                <Button variant="hero" onClick={() => navigate("/login")}>
                  Commencer
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
