import { useState } from 'react';
import { Search } from 'lucide-react';
import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import { searchUsers } from '../../services/user.service';
import type { User } from '../../types/user';

interface MemberSearchFieldProps {
  onSelect: (user: User) => void;
}

const MemberSearchField = ({ onSelect }: MemberSearchFieldProps) => {
  const [searchMode, setSearchMode] = useState<'dni' | 'email' | 'name'>('dni');
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    const value = searchValue.trim();
    if (!value) return;

    // A DNI written the way it is printed — 40.123.456 — used to become NaN and
    // come back as the first 50 members of the gym. Same rule the new-member
    // wizard already applies to the same field.
    if (searchMode === 'dni' && !/^\d+$/.test(value)) {
      setSearchError('El DNI tiene que ser solo números, sin puntos ni espacios.');
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const query =
        searchMode === 'dni' ? { dni: Number(value) } : { [searchMode]: value };
      const data = await searchUsers(query);
      setResults(data);
      if (data.length === 0) {
        setSearchError('No se encontraron usuarios con ese criterio.');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'No se pudo buscar.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="w-28 shrink-0">
          <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
            Buscar por
          </label>
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as typeof searchMode)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
          >
            <option value="dni">DNI</option>
            <option value="email">Email</option>
            <option value="name">Nombre</option>
          </select>
        </div>
        <div className="flex-1">
          <InputField
            label="Buscar socio"
            placeholder="Buscar socio..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching}
          size="sm"
          className="shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <FormAlert type="error" message={searchError} />
      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(u);
                  setResults([]);
                  setSearchValue('');
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-text hover:bg-surface"
              >
                <span>
                  {u.name} {u.surname} — {u.email}
                </span>
                <span className="text-text-muted">DNI {u.dni ?? 'Sin DNI'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MemberSearchField;
