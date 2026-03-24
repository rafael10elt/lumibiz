import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  toggleSidebar: () => void;
  pageTitle: string;
}

export function Navbar({ toggleSidebar, pageTitle }: NavbarProps) {
  const { perfil, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between h-20 px-4 sm:px-6 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden mr-4"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          {pageTitle}
        </h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {perfil?.nome}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {perfil?.role}
          </p>
        </div>
        <img
          className="w-10 h-10 rounded-full object-cover"
          src={perfil?.foto_url || `https://ui-avatars.com/api/?name=${perfil?.nome}&background=BFA16A&color=fff`}
          alt="Avatar do usuário"
        />
        <button
          onClick={signOut}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}