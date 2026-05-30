import { VolunteerFeedItem } from '../../screens/volunteer/volunteerFeedTypes';
import { useHelpRequestWatch } from '../../hooks/useHelpRequestWatch';
import { useFeedback } from '../../providers/FeedbackProvider';
import { VolunteerRequestCard } from './VolunteerRequestCard';

type Props = {
  request: VolunteerFeedItem;
  onPress?: () => void;
  onHelpPress?: () => void;
  onCarouselInteractionChange?: (active: boolean) => void;
};

export function WatchableVolunteerRequestCard({
  request,
  onPress,
  onHelpPress,
  onCarouselInteractionChange,
}: Props) {
  const { showError } = useFeedback();
  const { watched, toggling, toggleWatch } = useHelpRequestWatch(request.id, request.isWatched);

  const handleToggleWatch = () => {
    void toggleWatch().catch((err) => {
      showError(err instanceof Error ? err.message : 'Не удалось обновить избранное');
    });
  };

  return (
    <VolunteerRequestCard
      request={request}
      onPress={onPress}
      onHelpPress={onHelpPress}
      onCarouselInteractionChange={onCarouselInteractionChange}
      isWatched={watched}
      watchDisabled={toggling}
      onToggleWatch={handleToggleWatch}
    />
  );
}
