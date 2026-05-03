import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCircle } from 'lucide-react';

const CONSULTANTS = [
  { name: 'Douglas', city: 'São Francisco do Sul' },
  { name: 'Leandro', city: 'Barra do Sul' },
  { name: 'Rafael', city: 'Garuva' },
  { name: 'Grazi', city: 'Itapoá' },
  { name: 'Guilherme', city: 'Indaial' },
  { name: 'Mikaio', city: 'Indaial' },
  { name: 'Yara', city: 'Joinville' },
];

const Dashboard = () => {
  const navigate = useNavigate();

  // Removido o redirecionamento automático para forçar a seleção do consultor a cada login

  const selectConsultant = (consultant: { name: string, city: string }) => {
    localStorage.setItem('tipo_usuario', 'consultor');
    localStorage.setItem('consultor_nome', consultant.name);
    localStorage.setItem('consultor_cidade', consultant.city);
    localStorage.setItem('consultor_estado', 'SC');
    navigate('/nova-cotacao');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldCheck className="text-primary" size={40} />
        </div>
        <h2 className="text-3xl font-black text-secondary mb-3">Selecione quem é você</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          Para acessar o sistema e gerar cotações, identifique-se abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl animate-in fade-in duration-700">
        {CONSULTANTS.map((c) => (
          <button
            key={c.name}
            onClick={() => selectConsultant(c)}
            className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400">
              <UserCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.city}/SC</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
