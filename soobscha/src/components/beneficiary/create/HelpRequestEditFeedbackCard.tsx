import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../Icon';
import { ModerationFeedback } from '../../../utils/extractModerationFeedback';
import { RADIUS, T } from '../../../theme/tokens';

function formatAuthorLine(feedback: ModerationFeedback): string | undefined {
  if (!feedback.returnedAt) return undefined;
  const date = new Date(feedback.returnedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  const formatted = date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Партнёр «Добро» · ${formatted}`;
}

type Props = {
  feedback: ModerationFeedback;
};

export function HelpRequestEditFeedbackCard({ feedback }: Props) {
  const body =
    feedback.returnReason ??
    'Партнёр попросил уточнить детали — исправьте заявку и отправьте снова.';
  const author = formatAuthorLine(feedback);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="chat" size={16} color="#7A5210" strokeWidth={2.2} />
        </View>
        <Text style={styles.headerTitle}>Партнёр попросил исправить</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>{body}</Text>
        {author ? <Text style={styles.author}>{author}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: `${T.warning}33`,
    overflow: 'hidden',
    backgroundColor: T.bg,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: T.warningSoft,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#7A5210',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
  },
  author: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    marginTop: 10,
  },
});
