import { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import UserDetailPanel from './UserDetailPanel';
import { searchUsers } from '../../services/user.service';
import { useAuth } from '../../context/useAuth';
import type { User } from '../../types/user';

const UsersSection = () => {
  const { user: currentAdmin } = useAuth();
  const [searchMode, setSearchMode] = useState<'dni' | 'email' | 'name'>(
    'name',
  );
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const query = {
        [searchMode]: searchMode === 'dni' ? Number(searchValue) : searchValue,
      };
      const data = await searchUsers(query);
      setResults(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'No se pudo buscar.');
    } finally {
      setIsSearching(false);
    }
  };

  const refreshSearch = () => {
    if (hasSearched) handleSearch();
  };

  const columns: DataTableColumn<User>[] = [
    { header: 'DNI', cell: (u) => u.dni },
    { header: 'Nombre', cell: (u) => `${u.name} ${u.surname}` },
    { header: 'Email', cell: (u) => u.email },
    {
      header: 'Rol',
      cell: (u) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
            u.role === 'admin'
              ? 'bg-primary/10 text-primary'
              : 'bg-surface text-text-muted'
          }`}
        >
          {u.role}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (u) => (
        <span className={u.deleted ? 'text-red-400' : 'text-primary'}>
          {u.deleted ? 'Dado de baja' : 'Activo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-text">Usuarios</h3>

      <div className="flex items-end gap-2">
        <div className="w-32 shrink-0">
          <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
            Buscar por
          </label>
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as typeof searchMode)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
          >
            <option value="name">Nombre</option>
            <option value="dni">DNI</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div className="flex-1">
          <InputField
            label="Buscar"
            placeholder={
              searchMode === 'dni'
                ? 'Ej: 40123456'
                : searchMode === 'email'
                  ? 'Ej: nombre@mail.com'
                  : 'Nombre o apellido'
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          className="flex shrink-0 items-center gap-1.5"
        >
          <Search className="h-4 w-4" />
          Buscar
        </Button>
      </div>

      <FormAlert type="error" message={searchError} />

      {hasSearched && (
        <DataTable
          columns={columns}
          rows={results}
          rowKey={(u) => u.dni}
          isLoading={isSearching}
          emptyMessage="No se encontraron usuarios con ese criterio."
          onRowClick={setSelectedUser}
        />
      )}

      {selectedUser && currentAdmin && (
        <UserDetailPanel
          user={selectedUser}
          currentAdminDni={currentAdmin.dni}
          onClose={() => setSelectedUser(null)}
          onChanged={refreshSearch}
        />
      )}
    </div>
  );
};

export default UsersSection;
