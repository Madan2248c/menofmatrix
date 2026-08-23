import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AccountContext = createContext(null);

/** Tracks connected IG accounts and which one is currently selected. */
export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(
    () => Number(localStorage.getItem('accountId')) || null
  );
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.accounts();
      setAccounts(data || []);
      setSelectedId((prev) => {
        const valid = prev && (data || []).some((a) => a.id === prev);
        const next = valid ? prev : ((data || [])[0]?.id ?? null);
        if (next) localStorage.setItem('accountId', String(next));
        else localStorage.removeItem('accountId');
        return next;
      });
    } catch {
      /* backend down or not migrated yet */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const select = (id) => {
    localStorage.setItem('accountId', String(id));
    setSelectedId(Number(id));
  };

  return (
    <AccountContext.Provider value={{ accounts, selectedId, select, refresh, loading }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccounts = () => useContext(AccountContext);
