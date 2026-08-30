import { useCallback, useEffect, useState } from 'react';
import { API, fetchWithAuth } from '../config/api.js';

export const FRIEND_STATUS_EVENT = 'friendStatusUpdated';

export default function useFriendStatuses() {
  const [friendStatuses, setFriendStatuses] = useState({});
  const [loadingFriendStatuses, setLoadingFriendStatuses] = useState(true);

  const loadFriendStatuses = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.friendStatuses);
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Unable to load friend statuses');

      const nextStatuses = (result.data || []).reduce((statuses, item) => {
        statuses[String(item.userId)] = item;
        return statuses;
      }, {});
      setFriendStatuses(nextStatuses);
    } catch (error) {
      console.error('Could not load friend statuses:', error);
    } finally {
      setLoadingFriendStatuses(false);
    }
  }, []);

  useEffect(() => {
    loadFriendStatuses();
    window.addEventListener(FRIEND_STATUS_EVENT, loadFriendStatuses);
    const intervalId = window.setInterval(loadFriendStatuses, 15000);

    return () => {
      window.removeEventListener(FRIEND_STATUS_EVENT, loadFriendStatuses);
      window.clearInterval(intervalId);
    };
  }, [loadFriendStatuses]);

  return { friendStatuses, setFriendStatuses, loadingFriendStatuses };
}
