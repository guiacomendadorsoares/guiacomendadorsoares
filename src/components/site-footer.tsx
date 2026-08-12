import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone } from "lucide-react";
import { SITE_CONTACT } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">Guia Comendador Soares</h4>
            <p className="text-xs">O guia oficial do bairro: comércio, vagas, imóveis e comunidade.</p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-foreground">Contato</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href={`https://wa.me/55${SITE_CONTACT.phoneDigits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-3.5 w-3.5" /> {SITE_CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE_CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-3.5 w-3.5" /> {SITE_CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`https://instagram.com/${SITE_CONTACT.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                  <Instagram className="h-3.5 w-3.5" /> {SITE_CONTACT.instagram}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-foreground">Navegação</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/" className="hover:text-foreground">Início</Link></li>
              <li><Link to="/planos" className="hover:text-foreground">Planos</Link></li>
              <li><Link to="/anuncie" className="hover:text-foreground">Anuncie</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Entrar</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-4 text-center text-xs space-y-1">
          <p>© {new Date().getFullYear()} Guia Comendador Soares. Todos os direitos reservados.</p>
          <p className="opacity-70 italic">by @soareshuboficial</p>
        </div>
      </div>
    </footer>
  );
}
