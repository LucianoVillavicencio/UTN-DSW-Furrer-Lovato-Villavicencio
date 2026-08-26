import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import DataTable, { type DataTableColumn } from './DataTable';
import UserDetailPanel from './UserDetailPanel';
import NewMemberWizard from './NewMemberWizard';
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
  const [isCreating, setIsCreating] = useState(false);
  // Bumped when the wizard closes to force UserDetailPanel to remount: the
  // wizard writes the plan, class and payment through their own endpoints,
  // which the panel's id-keyed effects have no reason to re-fetch on their own.
  const [panelNonce, setPanelNonce] = useState(0);

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
    { header: 'DNI', cell: (u) => u.dni ?? 'Sin DNI' },
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
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text">
          Usuarios
        </h3>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo socio
        </Button>
      </div>

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
          rowKey={(u) => u.id}
          isLoading={isSearching}
          emptyMessage="No se encontraron usuarios con ese criterio."
          onRowClick={setSelectedUser}
        />
      )}

      {selectedUser && currentAdmin && (
        <UserDetailPanel
          key={`${selectedUser.id}-${panelNonce}`}
          user={selectedUser}
          currentAdminId={currentAdmin.id}
          onClose={() => setSelectedUser(null)}
          onChanged={refreshSearch}
        />
      )}

      {isCreating && (
        <NewMemberWizard
          onClose={() => {
            setIsCreating(false);
            setPanelNonce((n) => n + 1);
            refreshSearch();
          }}
          onCreated={setSelectedUser}
        />
      )}
    </div>
  );
};

export default UsersSection;
