import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

const AdminMarcas = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = async () => {
    const { data } = await supabase
      .from('vehicle_models')
      .select('*, brand:vehicle_brands(*), category:vehicle_categories(*)')
      .order('name');
    if (data) setModels(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'consult': return <AlertCircle className="text-orange-500" size={16} />;
      case 'restricted': return <XCircle className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'consult': return 'Consultar';
      case 'restricted': return 'Não Faz';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-secondary uppercase tracking-tight italic">
            Marcas e <span className="text-primary">Modelos</span>
          </h1>
          <p className="text-gray-500 font-medium">Cadastre veículos e regras de aceitação.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          <span className="hidden sm:inline">Novo Modelo</span>
        </button>
      </header>

      <div className="card bg-white border-gray-100 p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Filtrar por marca ou modelo..." className="input-field pl-10 py-2 text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modelo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {models.map(model => (
                <tr key={model.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-400 uppercase">{model.brand?.name}</td>
                  <td className="px-6 py-4 font-bold text-secondary">{model.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-50 text-primary rounded font-black text-[10px] uppercase">{model.category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-gray-600">
                      {getStatusIcon(model.status)}
                      {getStatusText(model.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary font-bold hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
              
              {models.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                    Nenhum veículo cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMarcas;
