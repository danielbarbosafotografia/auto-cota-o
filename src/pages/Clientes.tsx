import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Client } from '../types';
import { Search, MessageSquare, Phone } from 'lucide-react';

const Clientes = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('*').order('name');
      if (data) setClients(data);
      setLoading(false);
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-secondary">Meus Clientes</h1>
        <p className="text-gray-500">Gerencie sua base de contatos.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome..." 
          className="input-field pl-10"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-primary font-bold">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-secondary">{client.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone size={14} />
                  {client.whatsapp}
                </p>
              </div>
            </div>
            <a 
              href={`https://wa.me/55${client.whatsapp?.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"
            >
              <MessageSquare size={20} />
            </a>
          </div>
        ))}

        {filteredClients.length === 0 && !loading && (
          <div className="md:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">Nenhum cliente cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clientes;
