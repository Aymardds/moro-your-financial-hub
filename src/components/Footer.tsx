import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-dark text-dark-foreground py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center font-bold shadow-soft">
                M
              </div>
              <span className="text-xl font-bold">MORO</span>
            </div>
            <p className="text-dark-foreground/70 text-sm">
              La plateforme de gestion financière pour entrepreneurs africains
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#features" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="#pricing" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Sécurité
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#about" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="#contact" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Carrières
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-dark-foreground/70">
            © 2024 MORO. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
              Confidentialité
            </Link>
            <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
              Conditions
            </Link>
            <Link to="#" className="text-dark-foreground/70 hover:text-dark-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
