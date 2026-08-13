import { Easing, type WithTimingConfig } from 'react-native-reanimated';

import { timing } from './timing';

const easeStandard = Easing.bezier(0.2, 0.0, 0.0, 1);
const easeEntrance = Easing.bezier(0.16, 1, 0.3, 1);
const easePress = Easing.bezier(0.2, 0.0, 0.38, 1);
const easeExit = Easing.bezier(0.4, 0.0, 1, 1);

export type MotionPresetName =
  | 'fadeIn'
  | 'fadeOut'
  | 'fadeInUp'
  | 'fadeInDown'
  | 'slideIn'
  | 'slideOut'
  | 'scaleIn'
  | 'scaleOut'
  | 'pressScale'
  | 'subtlePulse';

export type MotionPreset = {
  from: {
    opacity?: number;
    translateX?: number;
    translateY?: number;
    scale?: number;
  };
  to: {
    opacity?: number;
    translateX?: number;
    translateY?: number;
    scale?: number;
  };
  config: WithTimingConfig;
  /** Optional reverse / secondary pulse target */
  pulseTo?: number;
};

export const presets: Record<MotionPresetName, MotionPreset> = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: timing.normal, easing: easeEntrance },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    config: { duration: timing.fast, easing: easeExit },
  },
  fadeInUp: {
    from: { opacity: 0, translateY: 16 },
    to: { opacity: 1, translateY: 0 },
    config: { duration: timing.entrance, easing: easeEntrance },
  },
  fadeInDown: {
    from: { opacity: 0, translateY: -16 },
    to: { opacity: 1, translateY: 0 },
    config: { duration: timing.entrance, easing: easeEntrance },
  },
  slideIn: {
    from: { opacity: 0, translateX: 28 },
    to: { opacity: 1, translateX: 0 },
    config: { duration: timing.entrance, easing: easeEntrance },
  },
  slideOut: {
    from: { opacity: 1, translateX: 0 },
    to: { opacity: 0, translateX: -28 },
    config: { duration: timing.normal, easing: easeExit },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.94 },
    to: { opacity: 1, scale: 1 },
    config: { duration: timing.normal, easing: easeEntrance },
  },
  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.96 },
    config: { duration: timing.fast, easing: easeExit },
  },
  pressScale: {
    from: { scale: 1 },
    to: { scale: 0.97 },
    config: { duration: timing.instant, easing: easePress },
  },
  subtlePulse: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 1.02, opacity: 0.92 },
    pulseTo: 1,
    config: { duration: timing.slow, easing: easeStandard },
  },
};

export const pressScaleTarget = 0.97;
