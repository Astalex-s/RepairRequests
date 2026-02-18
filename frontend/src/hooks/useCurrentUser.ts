import { useState, useEffect } from "react";
import { api } from "../api/client";
import { isAuthenticated } from "../api/client";
import type { UserRead } from "../api/types";

export function useCurrentUser() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    api
      .get<UserRead>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
