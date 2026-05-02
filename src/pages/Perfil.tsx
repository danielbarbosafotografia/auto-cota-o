import { useAuth } from '../contexts/AuthContext';
import { Mail, Phone, Shield, LogOut, ChevronRight } from 'lucide-react';

const Perfil = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-secondary">Meu Perfil</h1>
        <p className="text-gray-500">Gerencie suas informações de acesso.</p>
      </header>

      <div className="flex flex-col items-center py-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm mb-8">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-primary/20 mb-4">
          {profile?.name?.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-secondary">{profile?.name}</h2>
        <span className="text-xs font-black text-primary bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest mt-2">
          {profile?.role === 'admin' ? 'Administrador' : 'Consultor'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="card space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">E-mail</p>
                <p className="font-bold text-secondary">{profile?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">WhatsApp</p>
                <p className="font-bold text-secondary">{profile?.whatsapp || 'Não informado'}</p>
              </div>
            </div>
            <button className="text-primary font-bold text-sm">Editar</button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Shield className="text-gray-400" size={20} />
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Senha</p>
                <p className="font-bold text-secondary">••••••••••••</p>
              </div>
            </div>
            <button className="text-primary font-bold text-sm">Alterar</button>
          </div>
        </div>

        <button 
          onClick={signOut}
          className="w-full flex items-center justify-between p-6 bg-red-50 rounded-[2rem] text-red-600 font-bold hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={24} />
            <span>Sair do sistema</span>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Perfil;
