import { Cog, Edit, FolderOpen, Handshake, Lightbulb, MapPin, MessageCircle, Trash2 } from 'lucide-react';
import type { Cliente } from '../../hooks/useLumiBiz';

interface ClienteCardProps {
  cliente: Cliente;
  canManage: boolean;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

export function ClienteCard({ cliente, canManage, onEdit, onDelete }: ClienteCardProps) {
  const renderCategoryIcon = () => {
    switch (cliente.categoria) {
      case 'Lead':
        return <Lightbulb size={20} className="text-yellow-500" />;
      case 'Contrato':
        return <Handshake size={20} className="text-blue-500" />;
      case 'Serviço':
      case 'Servico':
        return <Cog size={20} className="text-purple-500" />;
      default:
        return null;
    }
  };

  const statusColor = cliente.status === 'ativo' || cliente.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500';

  return (
    <article className="relative flex flex-col items-center rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="absolute left-3 top-3">{renderCategoryIcon()}</div>
      <div className={`absolute right-4 top-4 h-3 w-3 rounded-full ${statusColor}`} title={`Status: ${cliente.status}`} />

      <img
        src={cliente.foto_url || `https://ui-avatars.com/api/?name=${cliente.nome}&background=f3f4f6&color=373737`}
        alt={cliente.nome}
        className="mb-4 h-20 w-20 rounded-xl border border-gray-100 object-cover shadow-sm dark:border-gray-600"
      />

      <h4 className="mb-1 text-lg font-bold leading-tight text-gray-800 dark:text-white">{cliente.nome}</h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Resp: {cliente.responsavel || 'Nao informado'}</p>

      <div className="mt-auto flex w-full items-center justify-center space-x-3 border-t border-gray-100 pt-4 dark:border-gray-700">
        {cliente.telefone && (
          <a
            href={`https://wa.me/${cliente.telefone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-green-50 p-2 text-green-500 hover:text-green-600 dark:bg-green-900/20"
          >
            <MessageCircle size={18} />
          </a>
        )}

        {cliente.endereco && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.endereco)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-blue-50 p-2 text-blue-500 hover:text-blue-600 dark:bg-blue-900/20"
          >
            <MapPin size={18} />
          </a>
        )}

        <button className="rounded-full bg-gray-50 p-2 text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-300" title="Ver Documentos">
          <FolderOpen size={18} />
        </button>

        {canManage && (
          <>
            <button onClick={() => onEdit(cliente)} className="rounded-full bg-yellow-50 p-2 text-brand-gold hover:text-[#a68a5a] dark:bg-yellow-900/20" title="Editar Cliente">
              <Edit size={18} />
            </button>
            <button onClick={() => onDelete(cliente)} className="rounded-full bg-red-50 p-2 text-red-500 hover:text-red-600 dark:bg-red-900/20" title="Apagar Cliente">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
