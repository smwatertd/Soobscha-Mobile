import { Dimensions } from 'react-native';

/** Высота фото-героя на экране заявки (~42% экрана) */
export const HELP_REQUEST_DETAIL_HERO_HEIGHT = Math.round(
  Dimensions.get('window').height * 0.42,
);
