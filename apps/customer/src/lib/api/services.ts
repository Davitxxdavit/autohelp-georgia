import { useCallback, useEffect, useState } from 'react';

import { apiGetList } from './client';
import { isApiError, type ApiError } from './errors';
import type { ApiService } from './types';

let catalogCache: ApiService[] | null = null;
let catalogInFlight: Promise<ApiService[]> | null = null;

export async function listServices(): Promise<ApiService[]> {
  return apiGetList<ApiService>('/services/', { auth: false });
}

export async function getServiceCatalog(force = false): Promise<ApiService[]> {
  if (!force && catalogCache) return catalogCache;
  if (!force && catalogInFlight) return catalogInFlight;

  catalogInFlight = listServices()
    .then((services) => {
      catalogCache = services;
      return services;
    })
    .finally(() => {
      catalogInFlight = null;
    });

  return catalogInFlight;
}

export function useServices() {
  const [services, setServices] = useState<ApiService[]>(catalogCache ?? []);
  const [loading, setLoading] = useState(!catalogCache);
  const [error, setError] = useState<ApiError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getServiceCatalog(true);
      setServices(next);
    } catch (caught) {
      setError(isApiError(caught) ? caught : null);
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getServiceCatalog()
      .then((next) => {
        if (mounted) {
          setServices(next);
          setLoading(false);
        }
      })
      .catch((caught) => {
        if (mounted) {
          setError(isApiError(caught) ? caught : null);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { services, loading, error, refresh };
}
