export const SERVICE_IDS = [
  'battery',
  'fuel',
  'mechanic',
  'diagnostics',
  'tow',
  'keys',
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export type PromoFeatureId = 'inspection';

/** Stable product IDs — UI copy is separate for future i18n (ka/en/ru/tr). */
export type ServiceCatalogItem = {
  id: ServiceId;
  /** Temporary Georgian copy until i18n lands */
  title: string;
  description: string;
  /** Display glyph / emoji label for MVP UI only */
  emoji: string;
};

export const SERVICES: ServiceCatalogItem[] = [
  {
    id: 'battery',
    title: 'აკუმულატორი',
    description: 'დაქოქვა ან დახმარება',
    emoji: '🔋',
  },
  {
    id: 'fuel',
    title: 'საწვავის მიტანა',
    description: 'საწვავი ადგილზე',
    emoji: '⛽',
  },
  {
    id: 'mechanic',
    title: 'მობილური მექანიკოსი',
    description: 'სპეციალისტი ადგილზე',
    emoji: '🔧',
  },
  {
    id: 'diagnostics',
    title: 'დიაგნოსტიკა',
    description: 'შეამოწმე პრობლემა',
    emoji: '💻',
  },
  {
    id: 'tow',
    title: 'ევაკუატორი',
    description: 'მანქანის გადაყვანა',
    emoji: '🚚',
  },
  {
    id: 'keys',
    title: 'ავტო-გასაღები',
    description: 'გასაღების დახმარება',
    emoji: '🔑',
  },
];

export function getServiceById(id: string): ServiceCatalogItem | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function isServiceId(value: string): value is ServiceId {
  return (SERVICE_IDS as readonly string[]).includes(value);
}
