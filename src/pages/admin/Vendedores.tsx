import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { Mail, Phone, MoreVertical, ShieldCheck, UserPlus } from 'lucide-react';

const AdminVendedores = () => {
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'seller')
      .order('name');
    if (data) setSellers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight italic">
            Gestão de <span className="text-primary">Vendedores</span>
          </h1>
          <p className="text-gray-500 font-medium">Controle o acesso da sua equipe.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <UserPlus size={20} />
          <span className="hidden sm:inline">Novo Vendedor</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map(seller => (
          <div key={seller.id} className="card relative group">
            <button className="absolute top-4 right-4 p-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                {seller.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-secondary text-lg">{seller.name}</h3>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Ativo</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail size={16} />
                <span className="truncate">{seller.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Phone size={16} />
                <span>{seller.whatsapp || '---'}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cotações</p>
                <p className="font-black text-secondary text-lg">24</p>
              </div>
              <div className="text-center border-l border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Conversão</p>
                <p className="font-black text-primary text-lg">68%</p>
              </div>
            </div>
          </div>
        ))}

        {sellers.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">Nenhum vendedor cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendedores;
