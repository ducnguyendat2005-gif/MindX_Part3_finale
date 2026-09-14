const getLoggedInUser = () => {
  try {
    return JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  } catch {
    return null;
  }
};

export const getAccountId = (user = getLoggedInUser()) =>
  user?._id || user?.id || user?.accountId || null;

const parseArray = (value) => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getUserStorageKey = (baseKey, user) => {
  const accountId = getAccountId(user);
  return accountId ? `${baseKey}_${accountId}` : null;
};

/**
 * Read data scoped to the current account. Data from the old global key is
 * migrated once so existing carts/wishlists keep working after the fix.
 */
export const readUserCollection = (baseKey, user) => {
  const key = getUserStorageKey(baseKey, user);
  if (!key) return [];

  const scopedValue = localStorage.getItem(key);
  if (scopedValue !== null) return parseArray(scopedValue);

  const legacyValue = localStorage.getItem(baseKey);
  const legacyItems = parseArray(legacyValue);
  if (legacyValue !== null) {
    localStorage.setItem(key, JSON.stringify(legacyItems));
    localStorage.removeItem(baseKey);
  }
  return legacyItems;
};

export const writeUserCollection = (baseKey, items, user) => {
  const key = getUserStorageKey(baseKey, user);
  if (!key) return false;
  localStorage.setItem(key, JSON.stringify(Array.isArray(items) ? items : []));
  return true;
};

export const removeUserCollection = (baseKey, user) => {
  const key = getUserStorageKey(baseKey, user);
  if (key) localStorage.removeItem(key);
};

