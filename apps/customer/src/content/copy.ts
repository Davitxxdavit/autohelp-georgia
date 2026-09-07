import { DEFAULT_LANGUAGE, type LanguageId } from '@/constants/languages';

type OnboardingSlideCopy = {
  id: 'problem' | 'services' | 'safe';
  title: string;
  description: string;
  caption?: string;
};

export type AppCopy = {
  language: {
    title: string;
    continue: string;
  };
  onboarding: {
    skip: string;
    next: string;
    start: string;
    slides: readonly [OnboardingSlideCopy, OnboardingSlideCopy, OnboardingSlideCopy];
  };
  login: {
    title: string;
    subtitle: string;
    countryCode: string;
    phonePlaceholder: string;
    continue: string;
    legal: string;
    terms: string;
    privacy: string;
    invalidPhone: string;
    passwordPlaceholder: string;
    invalidPassword: string;
    signInFailed: string;
    signingIn: string;
  };
  otp: {
    title: string;
    subtitle: string;
    resend: string;
    verify: string;
    invalid: string;
    /**
     * DEV ONLY — replace with real backend OTP verification later.
     * Mock code accepted in development: 123456
     */
    mockHint: string;
  };
};

const ka: AppCopy = {
  language: {
    title: 'აირჩიე ენა',
    continue: 'გაგრძელება',
  },
  onboarding: {
    skip: 'გამოტოვება',
    next: 'შემდეგი',
    start: 'დაწყება',
    slides: [
      {
        id: 'problem',
        title: 'მანქანასთან პრობლემა გაქვს?',
        description: 'AutoHelp სპეციალისტს შენთან მოიყვანს.',
      },
      {
        id: 'services',
        title: 'ყველაფერი ერთ აპში',
        description: 'მექანიკოსი, დიაგნოსტიკა, ევაკუატორი და სხვა.',
      },
      {
        id: 'safe',
        title: 'უსაფრთხოდ და მარტივად',
        description:
          'შეუკვეთე დახმარება, აკონტროლე სპეციალისტი და მიიღე შესრულებული სამუშაოს ანგარიში.',
        caption: 'სპეციალისტი გზაშია',
      },
    ],
  },
  login: {
    title: 'კეთილი იყოს შენი მობრძანება AutoHelp-ში',
    subtitle: 'შეიყვანე ტელეფონის ნომერი დასაწყებად.',
    countryCode: '+995',
    phonePlaceholder: '5XX XX XX XX',
    continue: 'გაგრძელება',
    legal:
      'გაგრძელებით ეთანხმები მომსახურების პირობებსა და კონფიდენციალურობის პოლიტიკას.',
    terms: 'მომსახურების პირობები',
    privacy: 'კონფიდენციალურობის პოლიტიკა',
    invalidPhone: 'შეიყვანე სწორი მობილურის ნომერი',
    passwordPlaceholder: 'პაროლი',
    invalidPassword: 'შეიყვანე პაროლი',
    signInFailed: 'შესვლა ვერ მოხერხდა. შეამოწმე ნომერი, პაროლი და კავშირი.',
    signingIn: 'შესვლა…',
  },
  otp: {
    title: 'შეიყვანე SMS კოდი',
    subtitle: 'კოდი გამოგზავნილია ნომერზე',
    resend: 'კოდის ხელახლა გაგზავნა',
    verify: 'დადასტურება',
    invalid: 'არასწორი კოდი',
    mockHint: 'DEV: გამოიყენე კოდი 123456',
  },
};

const en: AppCopy = {
  language: {
    title: 'Choose language',
    continue: 'Continue',
  },
  onboarding: {
    skip: 'Skip',
    next: 'Next',
    start: 'Get started',
    slides: [
      {
        id: 'problem',
        title: 'Car trouble?',
        description: 'AutoHelp brings a specialist to you.',
      },
      {
        id: 'services',
        title: 'Everything in one app',
        description: 'Mechanic, diagnostics, tow truck, and more.',
      },
      {
        id: 'safe',
        title: 'Safe and simple',
        description:
          'Request help, follow the specialist, and get a report of the completed work.',
        caption: 'Specialist on the way',
      },
    ],
  },
  login: {
    title: 'Welcome to AutoHelp',
    subtitle: 'Enter your phone number to get started.',
    countryCode: '+995',
    phonePlaceholder: '5XX XX XX XX',
    continue: 'Continue',
    legal: 'By continuing you agree to the Terms of Service and Privacy Policy.',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    invalidPhone: 'Enter a valid mobile number',
    passwordPlaceholder: 'Password',
    invalidPassword: 'Enter your password',
    signInFailed: 'Couldn’t sign in. Check your phone, password, and connection.',
    signingIn: 'Signing in…',
  },
  otp: {
    title: 'Enter the SMS code',
    subtitle: 'The code was sent to',
    resend: 'Resend code',
    verify: 'Verify',
    invalid: 'Invalid code',
    mockHint: 'DEV: use code 123456',
  },
};

const ru: AppCopy = {
  language: {
    title: 'Выберите язык',
    continue: 'Продолжить',
  },
  onboarding: {
    skip: 'Пропустить',
    next: 'Далее',
    start: 'Начать',
    slides: [
      {
        id: 'problem',
        title: 'Проблема с машиной?',
        description: 'AutoHelp привезёт специалиста к вам.',
      },
      {
        id: 'services',
        title: 'Всё в одном приложении',
        description: 'Механик, диагностика, эвакуатор и другое.',
      },
      {
        id: 'safe',
        title: 'Безопасно и просто',
        description:
          'Закажите помощь, следите за специалистом и получите отчёт о выполненной работе.',
        caption: 'Специалист в пути',
      },
    ],
  },
  login: {
    title: 'Добро пожаловать в AutoHelp',
    subtitle: 'Введите номер телефона, чтобы начать.',
    countryCode: '+995',
    phonePlaceholder: '5XX XX XX XX',
    continue: 'Продолжить',
    legal:
      'Продолжая, вы соглашаетесь с Условиями использования и Политикой конфиденциальности.',
    terms: 'Условия использования',
    privacy: 'Политика конфиденциальности',
    invalidPhone: 'Введите корректный номер мобильного',
    passwordPlaceholder: 'Пароль',
    invalidPassword: 'Введите пароль',
    signInFailed: 'Не удалось войти. Проверьте номер, пароль и соединение.',
    signingIn: 'Вход…',
  },
  otp: {
    title: 'Введите SMS-код',
    subtitle: 'Код отправлен на номер',
    resend: 'Отправить код ещё раз',
    verify: 'Подтвердить',
    invalid: 'Неверный код',
    mockHint: 'DEV: используйте код 123456',
  },
};

const tr: AppCopy = {
  language: {
    title: 'Dil seçin',
    continue: 'Devam',
  },
  onboarding: {
    skip: 'Atla',
    next: 'İleri',
    start: 'Başla',
    slides: [
      {
        id: 'problem',
        title: 'Aracınızla ilgili bir sorun mu var?',
        description: 'AutoHelp uzmanı size getirir.',
      },
      {
        id: 'services',
        title: 'Hepsi tek uygulamada',
        description: 'Tamirci, diagnostik, çekici ve daha fazlası.',
      },
      {
        id: 'safe',
        title: 'Güvenli ve kolay',
        description:
          'Yardım çağırın, uzmanı takip edin ve tamamlanan işin raporunu alın.',
        caption: 'Uzman yolda',
      },
    ],
  },
  login: {
    title: "AutoHelp'e hoş geldiniz",
    subtitle: 'Başlamak için telefon numaranızı girin.',
    countryCode: '+995',
    phonePlaceholder: '5XX XX XX XX',
    continue: 'Devam',
    legal:
      'Devam ederek Hizmet Şartları ve Gizlilik Politikasını kabul etmiş olursunuz.',
    terms: 'Hizmet Şartları',
    privacy: 'Gizlilik Politikası',
    invalidPhone: 'Geçerli bir cep telefonu numarası girin',
    passwordPlaceholder: 'Şifre',
    invalidPassword: 'Şifrenizi girin',
    signInFailed: 'Giriş yapılamadı. Telefon, şifre ve bağlantıyı kontrol edin.',
    signingIn: 'Giriş yapılıyor…',
  },
  otp: {
    title: 'SMS kodunu girin',
    subtitle: 'Kod şu numaraya gönderildi',
    resend: 'Kodu yeniden gönder',
    verify: 'Doğrula',
    invalid: 'Geçersiz kod',
    mockHint: 'DEV: 123456 kodunu kullanın',
  },
};

export const COPY: Record<LanguageId, AppCopy> = {
  ka,
  en,
  ru,
  tr,
};

export function getCopy(language: LanguageId = DEFAULT_LANGUAGE): AppCopy {
  return COPY[language] ?? COPY[DEFAULT_LANGUAGE];
}

/** Georgian fallback — prefer getCopy(session.language). */
export const copy = ka;
