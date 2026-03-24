import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Clock, Play, Square } from 'lucide-react'; // Ícones modernos

export const VisitaCard = ({ visita, onUpdate }) => {
  const[loading, setLoading] = useState(false);

  // Lógica nativa de Geolocalização
  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject('Geolocalização não suportada');
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
    });
  };

  const handleStatusChange = async (newStatus: 'Em Andamento' | 'Concluída') => {
    try {
      setLoading(true);
      const position = await getCurrentLocation();
      const coords = `${position.coords.latitude},${position.coords.longitude}`;
      const timestamp = new Date().toISOString();

      const updateData = newStatus === 'Em Andamento' 
        ? { status: newStatus, check_in: timestamp, check_in_local: coords }
        : { status: newStatus, check_out: timestamp, check_out_local: coords };

      const { error } = await supabase
        .from('visitas')
        .update(updateData)
        .eq('id', visita.id);

      if (error) throw error;
      onUpdate(); // Atualiza a lista Kanban
    } catch (error) {
      alert('Erro ao atualizar visita ou obter localização.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#373737] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
      {/* Cabeçalho Card */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
            {visita.clientes?.nome}
          </h4>
          <p className="text-sm text-[#BFA16A] font-medium">{visita.usuarios?.nome}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
          visita.status === 'Agendada' ? 'bg-blue-100 text-blue-700' :
          visita.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {visita.status}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{new Date(visita.data_visita).toLocaleDateString()} • {visita.hora_inicio}</span>
        </div>
        {visita.check_in_local && (
          <div className="flex items-center gap-2 text-green-600">
            <MapPin size={16} />
            <a href={`https://maps.google.com/?q=${visita.check_in_local}`} target="_blank" className="underline">
              Local de Check-in
            </a>
          </div>
        )}
      </div>

      {/* Ações (Mobile First: botões largos) */}
      <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-600">
        {visita.status === 'Agendada' && (
          <button 
            onClick={() => handleStatusChange('Em Andamento')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#BFA16A] text-white py-2.5 rounded-lg font-medium hover:bg-[#a68a5a] transition-colors active:scale-95"
          >
            <Play size={18} /> {loading ? 'Aguarde...' : 'Fazer Check-in'}
          </button>
        )}
        {visita.status === 'Em Andamento' && (
          <button 
            onClick={() => handleStatusChange('Concluída')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors active:scale-95"
          >
            <Square size={18} /> {loading ? 'Aguarde...' : 'Finalizar Visita'}
          </button>
        )}
      </div>
    </div>
  );
};