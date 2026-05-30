type NavigationLike = {
  canGoBack: () => boolean;
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
};

export function goBackSafe(
  navigation: NavigationLike,
  fallback?: { name: string; params?: object },
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (fallback) {
    navigation.navigate(fallback.name, fallback.params);
  }
}
