import { Cog, Edit, FolderOpen, Handshake, Lightbulb, MapPin, MessageCircle, Trash2 } from 'lucide-react';
import type { Cliente } from '../../hooks/useLumiBiz';

interface ClienteCardProps {
  cliente: Cliente;
  canManage: boolean;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

export function ClienteCard({ cliente, canManage, onEdit, onDelete }: ClienteCardProps) {
  const categoria = cliente.categoria === 'Servico' ? 'Servico' : cliente.categoria || 'Lead';
  const statusAtivo = cliente.status === 'ativo' || cliente.status === 'Ativo' || !cliente.status;
  const initials = cliente.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('');

  const categoryMeta = {
    Lead: { icon: <Lightbulb size={16} />, tone: 'bg-yellow-500/12 text-yellow-600 dark:text-yellow-300' },
    Contrato: { icon: <Handshake size={16} />, tone: 'bg-brand-blue/12 text-brand-blue dark:text-blue-200' },
    Servico: { icon: <Cog size={16} />, tone: 'bg-brand-orange/12 text-brand-orange dark:text-orange-200' }
  }[categoria as 'Lead' | 'Contrato' | 'Servico'];

  return (
    <article className="surface-panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${categoryMeta.tone}`}>
          {categoryMeta.icon}
          {categoria}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            statusAtivo ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/12 text-rose-600 dark:text-rose-300'
          }`}
        >
          {statusAtivo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        {cliente.foto_url ? (
          <img src={cliente.foto_url} alt={cliente.nome} className="h-16 w-16 rounded-2xl object-cover shadow-soft" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange text-lg font-bold text-white shadow-glow">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <h4 className="truncate text-lg font-semibold tracking-tight text-app-primary">{cliente.nome}</h4>
          <p className="mt-1 truncate text-sm text-app-secondary">Responsavel: {cliente.responsavel || 'Nao informado'}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-app-secondary">
        <p className="truncate">Telefone: {cliente.telefone || 'Nao informado'}</p>
        <p className="truncate">Endereco: {cliente.endereco || 'Nao informado'}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {cliente.telefone && (
          <a href={`https://wa.me/${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-secondary h-10 px-3">
            <MessageCircle size={16} />
            WhatsApp
          </a>
        )}

        {cliente.endereco && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.endereco)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary h-10 px-3"
          >
            <MapPin size={16} />
            Mapa
          </a>
        )}

        <button className="btn-secondary h-10 px-3" title="Ver documentos">
          <FolderOpen size={16} />
          Docs
        </button>
      </div>

      {canManage && (
        <div className="mt-5 flex gap-2 border-t border-border-subtle pt-4">
          <button onClick={() => onEdit(cliente)} className="btn-ghost flex-1 justify-center rounded-2xl border border-border-subtle">
            <Edit size={16} />
            Editar
          </button>
          <button onClick={() => onDelete(cliente)} className="btn-ghost flex-1 justify-center rounded-2xl border border-border-subtle text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300">
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      )}
    </article>
  );
}
