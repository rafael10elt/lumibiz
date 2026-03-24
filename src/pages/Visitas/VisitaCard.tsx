import { useState } from 'react';
import { Clock3, MapPin, Play, Square } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { VisitaComRelacionamentos } from '../../hooks/useLumiBiz';

interface VisitaCardProps {
  visita: VisitaComRelacionamentos;
  onUpdate: () => void;
}

export const VisitaCard = ({ visita, onUpdate }: VisitaCardProps) => {
  const [saving, setSaving] = useState(false);
  const { getCurrentLocation } = useGeolocation();

  const handleStatusChange = async (newStatus: 'Em Andamento' | 'Concluída') => {
    try {
      setSaving(true);
      const position = await getCurrentLocation();
      const coords = `${position.coords.latitude},${position.coords.longitude}`;
      const timestamp = new Date().toISOString();

      const updateData =
        newStatus === 'Em Andamento'
          ? { status: newStatus, check_in: timestamp, check_in_local: coords }
          : { status: newStatus, check_out: timestamp, check_out_local: coords };

      const { error } = await supabase.from('visitas').update(updateData as never).eq('id', visita.id);

      if (error) {
        throw error;
      }

      onUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar a visita.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#1c1c1c]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">{visita.clientes?.nome || 'Cliente sem nome'}</h4>
          <p className="mt-1 text-sm text-brand-gold">{visita.perfis?.nome || 'Sem usuario responsavel'}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            visita.status === 'Agendada'
              ? 'bg-sky-100 text-sky-700'
              : visita.status === 'Em Andamento'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {visita.status}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <Clock3 size={16} />
          <span>
            {formatDate(visita.data_visita)}
            {visita.hora_inicio ? ` as ${visita.hora_inicio.slice(0, 5)}` : ''}
          </span>
        </div>
        {visita.check_in_local && (
          <a
            href={`https://maps.google.com/?q=${visita.check_in_local}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-emerald-600 underline"
          >
            <MapPin size={16} />
            <span>Ver check-in no mapa</span>
          </a>
        )}
        {visita.check_out_local && (
          <a
            href={`https://maps.google.com/?q=${visita.check_out_local}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-brand-gold underline"
          >
            <MapPin size={16} />
            <span>Ver check-out no mapa</span>
          </a>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
        {visita.status === 'Agendada' && (
          <button
            onClick={() => handleStatusChange('Em Andamento')}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 py-3 font-medium text-white transition-colors hover:bg-[#a98c57] disabled:opacity-60"
          >
            <Play size={18} />
            {saving ? 'Processando...' : 'Fazer check-in'}
          </button>
        )}
        {visita.status === 'Em Andamento' && (
          <button
            onClick={() => handleStatusChange('Concluída')}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            <Square size={18} />
            {saving ? 'Processando...' : 'Fazer check-out'}
          </button>
        )}
      </div>
    </article>
  );
};
