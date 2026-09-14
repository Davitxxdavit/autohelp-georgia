import type { CustomerMvpServiceId, ServiceId } from '@/constants/services';

export type QuestionOption = {
  id: string;
  label: string;
};

export type ServiceQuestionConfig =
  | {
      mode: 'options';
      promptKey: string;
      prompt: string;
      options: QuestionOption[];
    }
  | {
      mode: 'notes';
      promptKey: string;
      prompt: string;
      placeholder: string;
    }
  | {
      mode: 'location_focus';
      promptKey: string;
      prompt: string;
    };

/**
 * Full catalog kept for future services.
 * MVP customer UI only routes battery / diagnostics / keys.
 */
export const SERVICE_QUESTIONS: Record<ServiceId, ServiceQuestionConfig> = {
  battery: {
    mode: 'options',
    promptKey: 'request.battery.prompt',
    prompt: 'What do you need?',
    options: [
      { id: 'replacement', label: 'Battery replacement' },
      { id: 'wont_start', label: "Car won't start" },
      { id: 'check', label: 'Battery check' },
    ],
  },
  fuel: {
    mode: 'options',
    promptKey: 'request.fuel.prompt',
    prompt: 'რა გჭირდება?',
    options: [
      { id: 'delivery', label: 'საწვავის მიტანა' },
      { id: 'empty', label: 'საწვავი გათავდა' },
    ],
  },
  mechanic: {
    mode: 'notes',
    promptKey: 'request.mechanic.prompt',
    prompt: 'რა პრობლემა აქვს მანქანას?',
    placeholder: 'მოკლედ აღწერე პრობლემა…',
  },
  diagnostics: {
    mode: 'options',
    promptKey: 'request.diagnostics.prompt',
    prompt: 'What do you need?',
    options: [
      { id: 'onsite', label: 'On-site computer diagnostics' },
    ],
  },
  tow: {
    mode: 'location_focus',
    promptKey: 'request.tow.prompt',
    prompt: 'სად არის მანქანა?',
  },
  keys: {
    mode: 'options',
    promptKey: 'request.keys.prompt',
    prompt: 'What happened?',
    options: [
      { id: 'locked_out', label: 'Locked out of my car' },
      { id: 'lost', label: 'Lost my key' },
      { id: 'not_working', label: 'Key is not working' },
      { id: 'other', label: 'Other' },
    ],
  },
};

/** @deprecated Prefer getServicePricing — kept for non-MVP legacy paths */
export const ESTIMATED_PRICE: Record<ServiceId, string> = {
  battery: '45 ₾',
  fuel: '25–50 ₾',
  mechanic: '40–80 ₾',
  diagnostics: '50 ₾',
  tow: '50–120 ₾',
  keys: 'Price will be confirmed by the specialist',
};

export const MOCK_LOCATION = {
  label: 'Batumi, Georgia',
  shortLabel: 'Batumi',
  pinHint: 'Placeholder only — unused by Battery / Diagnostics / Auto Key',
} as const;

/** @deprecated Use MOCK_LOCATION.label */
export const MOCK_LOCATION_LABEL = MOCK_LOCATION.shortLabel;

export type FixedServicePricing = {
  kind: 'fixed';
  serviceLine: string;
  serviceAmount: number;
  callOutLine: string;
  callOutAmount: number;
  currency: '₾';
  ctaLabel: string;
};

export type ConfirmLaterPricing = {
  kind: 'confirm_later';
  message: string;
  ctaLabel: string;
};

export type ServicePricing = FixedServicePricing | ConfirmLaterPricing;

const MVP_PRICING: Record<CustomerMvpServiceId, ServicePricing> = {
  battery: {
    kind: 'fixed',
    serviceLine: 'Service',
    serviceAmount: 35,
    callOutLine: 'Call-out',
    callOutAmount: 10,
    currency: '₾',
    ctaLabel: 'Request assistance',
  },
  diagnostics: {
    kind: 'fixed',
    serviceLine: 'Diagnostics',
    serviceAmount: 40,
    callOutLine: 'Call-out',
    callOutAmount: 10,
    currency: '₾',
    ctaLabel: 'Request diagnostics',
  },
  keys: {
    kind: 'confirm_later',
    message: 'Price will be confirmed by the specialist',
    ctaLabel: 'Request assistance',
  },
};

export function getServicePricing(serviceId: ServiceId): ServicePricing {
  if (serviceId === 'battery' || serviceId === 'diagnostics' || serviceId === 'keys') {
    return MVP_PRICING[serviceId];
  }
  return {
    kind: 'confirm_later',
    message: 'Price will be confirmed by the specialist',
    ctaLabel: 'Request assistance',
  };
}

export function formatGel(amount: number): string {
  return `${amount} ₾`;
}

export function pricingTotalLabel(pricing: FixedServicePricing): string {
  return formatGel(pricing.serviceAmount + pricing.callOutAmount);
}

export function pricingSummaryLabel(pricing: ServicePricing): string {
  if (pricing.kind === 'confirm_later') return pricing.message;
  return pricingTotalLabel(pricing);
}
