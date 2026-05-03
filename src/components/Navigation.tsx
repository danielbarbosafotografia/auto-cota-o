import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Users, 
  User, 
  Settings, 
  LogOut,
  ShieldCheck,
  Package,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';

export const Sidebar = () => {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const sellerLinks = [
    { to: '/dashboard', icon: PlusCircle, label: 'Nova Cotação' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  const adminLinks = [
    { to: '/admin', icon: ShieldCheck, label: 'Admin Dashboard' },
    { to: '/admin/vendedores', icon: Users, label: 'Vendedores' },
    { to: '/admin/regras', icon: Settings, label: 'Regras de Cálculo' },
    { to: '/admin/adicionais', icon: Package, label: 'Adicionais' },
    { to: '/admin/marcas', icon: FileText, label: 'Marcas/Modelos' },
  ];

  const links = isAdmin ? [...sellerLinks, ...adminLinks] : sellerLinks;

  return (
    <div className="hidden md:flex flex-col w-64 bg-secondary text-white h-screen sticky top-0 p-4">
      <div className="flex items-center gap-3 px-2 mb-10 mt-4">
        <img src="/logo.png" alt="Auto Excelência" className="w-44 h-auto object-contain" />
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
              isActive ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <link.icon size={20} />
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/10">
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 w-full transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export const BottomNav = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const links = [
    { to: '/dashboard', icon: PlusCircle, label: 'Cotar' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  if (isAdmin) {
    links.splice(3, 0, { to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => clsx(
            "flex flex-col items-center gap-1",
            isActive ? "text-primary" : "text-gray-400"
          )}
        >
          <link.icon size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
