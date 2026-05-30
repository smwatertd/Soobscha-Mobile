import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { StoredLogEntry } from '../services/logStore';
import { logger } from '../services/logger';
import { T } from '../theme/tokens';

type Props = {
  onBack: () => void;
};

function rowStyle(level: string) {
  if (level === 'warn') return styles.rowWarn;
  if (level === 'error') return styles.rowError;
  return null;
}

export function DevLogsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<StoredLogEntry[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const refresh = useCallback(() => {
    setItems(logger.getRecent(300));
    setFilePath(logger.getFilePath());
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleShare = async () => {
    setSharing(true);
    try {
      const fromFile = await logger.readFile();
      const text = fromFile && fromFile.length > 0 ? fromFile : logger.exportText(300);
      await Share.share({
        message: text.slice(-120_000),
        title: 'Логи Сообща',
      });
    } finally {
      setSharing(false);
    }
  };

  const handleClear = () => {
    logger.clear();
    refresh();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Логи (dev)" onBack={onBack} />

      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={refresh}>
          <Text style={styles.toolText}>Обновить</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={handleClear}>
          <Text style={styles.toolText}>Очистить</Text>
        </Pressable>
        <Pressable style={styles.toolBtnPrimary} onPress={handleShare} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.toolTextPrimary}>Поделиться</Text>
          )}
        </Pressable>
      </View>

      {filePath ? (
        <Text style={styles.path} numberOfLines={2}>
          Файл: {filePath}
        </Text>
      ) : null}

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {items.length === 0 ? (
          <Text style={styles.empty}>Логов пока нет. Походите по приложению и вернитесь сюда.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.row, rowStyle(item.level)]}>
              <Text style={styles.meta}>
                {item.ts.slice(11, 23)} · {item.ns.toUpperCase()} · {item.level.toUpperCase()}
                {item.durationMs != null ? ` · ${item.durationMs}ms` : ''}
              </Text>
              <Text style={styles.message}>{item.message}</Text>
              {item.data !== undefined ? (
                <Text style={styles.data}>{JSON.stringify(item.data, null, 2)}</Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toolBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: T.surface2,
  },
  toolBtnPrimary: {
    marginLeft: 'auto',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: T.primary,
    minWidth: 110,
    alignItems: 'center',
  },
  toolText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  toolTextPrimary: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
  },
  path: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    padding: 16,
    textAlign: 'center',
  },
  row: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  rowWarn: {
    backgroundColor: T.warningSoft,
  },
  rowError: {
    backgroundColor: T.dangerSoft,
  },
  meta: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  data: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
  },
});
