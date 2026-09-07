import { apiRequest } from './client';
import type { ApiService, Paginated } from './types';

export async function listActiveServices(): Promise<ApiService[]> {
  const page = await apiRequest<Paginated<ApiService> | ApiService[]>(
    '/services/',
    { auth: false },
  );
  const services = Array.isArray(page) ? page : page.results ?? [];
  return services.filter((service) => service.active !== false);
}
