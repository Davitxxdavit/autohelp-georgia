export const SERVICE_IDS = [
  'battery',
  'fuel',
  'mechanic',
  'diagnostics',
  'tow',
  'keys',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

/** Customer MVP — only these appear in the Home services UI */
export const CUSTOMER_MVP_SERVICE_IDS = [
  'battery',
  'diagnostics',
  'keys',
] as const;

export type CustomerMvpServiceId = (typeof CUSTOMER_MVP_SERVICE_IDS)[number];

export type PromoFeatureId = 'inspection';

/** Stable product IDs — UI copy is separate for future i18n (ka/en/ru/tr). */
export type ServiceCatalogItem = {
  id: ServiceId;
  /** Temporary Georgian copy until i18n lands */
  title: string;
  description: string;
  /** Display glyph / emoji label for MVP UI only */
  emoji: string;
  /** Longer title used on request screens */
  requestTitle: string;
};

export const SERVICES: ServiceCatalogItem[] = [
  {
    id: 'battery',
    title: 'Battery',
    description: 'Jump start or battery help',
    emoji: '🔋',
    requestTitle: 'Battery assistance',
  },
  {
    id: 'fuel',
    title: 'საწვავის მიტანა',
    description: 'საწვავი ადგილზე',
    emoji: '⛽',
    requestTitle: 'საწვავის მიტანა',
  },
  {
    id: 'mechanic',
    title: 'მობილური მექანიკოსი',
    description: 'სპეციალისტი ადგილზე',
    emoji: '🔧',
    requestTitle: 'მობილური მექანიკოსი',
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
    description: 'On-site computer check',
    emoji: '💻',
    requestTitle: 'Computer diagnostics',
  },
  {
    id: 'tow',
    title: 'ევაკუატორი',
    description: 'მანქანის გადაყვანა',
    emoji: '🚚',
    requestTitle: 'ევაკუატორი',
  },
  {
    id: 'keys',
    title: 'Auto Key',
    description: 'Locked out or key issues',
    emoji: '🔑',
    requestTitle: 'Auto key assistance',
  },
];

export const CUSTOMER_MVP_SERVICES: ServiceCatalogItem[] = SERVICES.filter(
  (service): service is ServiceCatalogItem & { id: CustomerMvpServiceId } =>
    (CUSTOMER_MVP_SERVICE_IDS as readonly string[]).includes(service.id),
);

export function getServiceById(id: string): ServiceCatalogItem | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function isServiceId(value: string): value is ServiceId {
  return (SERVICE_IDS as readonly string[]).includes(value);
}

export function isCustomerMvpServiceId(
  value: string,
): value is CustomerMvpServiceId {
  return (CUSTOMER_MVP_SERVICE_IDS as readonly string[]).includes(value);
}
