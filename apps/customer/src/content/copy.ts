/**
 * Temporary Georgian copy keyed for future i18n replacement.
 * Do not scatter raw product strings across screens when avoidable.
 */
export const copy = {
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
  },
  otp: {
    title: 'შეიყვანე SMS კოდი',
    subtitle: 'კოდი გამოგზავნილია ნომერზე',
    resend: 'კოდის ხელახლა გაგზავნა',
    verify: 'დადასტურება',
    invalid: 'არასწორი კოდი',
    /**
     * DEV ONLY — replace with real backend OTP verification later.
     * Mock code accepted in development: 123456
     */
    mockHint: 'DEV: გამოიყენე კოდი 123456',
  },
} as const;
