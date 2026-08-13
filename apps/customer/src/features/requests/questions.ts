import type { ServiceId } from '@/constants/services';

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

export const SERVICE_QUESTIONS: Record<ServiceId, ServiceQuestionConfig> = {
  battery: {
    mode: 'options',
    promptKey: 'request.battery.prompt',
    prompt: 'რა პრობლემა აქვს?',
    options: [
      { id: 'wont_start', label: 'არ იქოქება' },
      { id: 'dead_battery', label: 'აკუმულატორი დაჯდა' },
      { id: 'slow_starter', label: 'სტარტერი ნელა ატრიალებს' },
      { id: 'other', label: 'სხვა' },
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
    prompt: 'რა გინდა შეამოწმო?',
    options: [
      { id: 'check_engine', label: 'Check Engine' },
      { id: 'electrical', label: 'ელექტრო სისტემა' },
      { id: 'engine', label: 'ძრავი' },
      { id: 'other', label: 'სხვა' },
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
    prompt: 'რა პრობლემა გაქვს გასაღებთან?',
    options: [
      { id: 'locked_in', label: 'მანქანაში დამრჩა გასაღები' },
      { id: 'lost', label: 'გასაღები დავკარგე' },
      { id: 'not_working', label: 'გასაღები არ მუშაობს' },
      { id: 'other', label: 'სხვა' },
    ],
  },
};

/** Mock estimated ranges — clearly labeled as approximate in UI */
export const ESTIMATED_PRICE: Record<ServiceId, string> = {
  battery: '30–40 ₾',
  fuel: '25–50 ₾',
  mechanic: '40–80 ₾',
  diagnostics: '35–60 ₾',
  tow: '50–120 ₾',
  keys: '40–90 ₾',
};

export const MOCK_LOCATION_LABEL = 'ბათუმი';
