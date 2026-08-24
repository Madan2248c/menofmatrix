import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AccountContext = createContext(null);

/** Tracks connected Instagram + YouTube accounts and the selected account per platform. */
export function AccountProvider({ children }) {
  const [igAccounts, setIgAccounts] = useState([]);
  const [youtubeAccounts, setYoutubeAccounts] = useState([]);
  const [selected, setSelected] = useState(() => {
    const raw = localStorage.getItem('selectedAccount');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [{ data: ig = [] }, { data: yt = [] }] = await Promise.all([
        api.accounts(),
        api.youtubeAccounts(),
      ]);
      setIgAccounts(ig);
      setYoutubeAccounts(yt);

      // Keep current selection if it still exists; otherwise fall back to first available.
      setSelected((prev) => {
        if (prev?.platform === 'instagram' && ig.some((a) => a.id === prev.id)) return prev;
        if (prev?.platform === 'youtube' && yt.some((a) => a.id === prev.id)) return prev;
        if (ig[0]) return { id: ig[0].id, platform: 'instagram' };
        if (yt[0]) return { id: yt[0].id, platform: 'youtube' };
        return null;
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

  useEffect(() => {
    if (selected) localStorage.setItem('selectedAccount', JSON.stringify(selected));
    else localStorage.removeItem('selectedAccount');
  }, [selected]);

  const select = (id, platform) => {
    setSelected({ id: Number(id), platform });
  };

  const current =
    selected?.platform === 'instagram'
      ? igAccounts.find((a) => a.id === selected.id)
      : selected?.platform === 'youtube'
      ? youtubeAccounts.find((a) => a.id === selected.id)
      : null;

  return (
    <AccountContext.Provider
      value={{
        accounts: [...igAccounts.map((a) => ({ ...a, platform: 'instagram' })), ...youtubeAccounts.map((a) => ({ ...a, platform: 'youtube' }))],
        igAccounts,
        youtubeAccounts,
        selectedId: selected?.id ?? null,
        selectedPlatform: selected?.platform ?? null,
        selectedAccount: current,
        select,
        refresh,
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export const useAccounts = () => useContext(AccountContext);
