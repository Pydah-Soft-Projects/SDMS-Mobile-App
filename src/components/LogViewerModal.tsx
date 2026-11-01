import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { X, Trash2, Terminal, Filter, RefreshCw } from 'lucide-react-native';
import logger, { LogEntry } from '../utils/logger';
import { ENV, setRuntimeApiUrl } from '../config/env';

interface LogViewerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LogViewerModal: React.FC<LogViewerModalProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [editingUrl, setEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState(ENV.apiUrl);

  useEffect(() => {
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      l.tag.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q) ||
      l.message.toLowerCase().includes(q)
    );
  });

  const getTagColor = (type: string) => {
    switch (type) {
      case 'API_ERR':
      case 'ERROR':
        return '#EF4444';
      case 'API_RES':
        return '#10B981';
      case 'API_REQ':
        return '#3B82F6';
      case 'WARN':
        return '#F59E0B';
      case 'INFO':
      default:
        return '#64748B';
    }
  };

  const handleSaveApiUrl = () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid backend URL');
      return;
    }
    setRuntimeApiUrl(tempUrl.trim());
    setEditingUrl(false);
    Alert.alert('Updated', `Active backend URL set to:\n${ENV.apiUrl}`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Terminal size={20} color="#1E3A8A" />
            <Text style={styles.headerTitle}>Mobile Error Logs</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => logger.clear()} style={styles.iconBtn}>
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Backend URL Quick Config */}
        <View style={styles.urlBar}>
          <Text style={styles.urlLabel}>Target API:</Text>
          {editingUrl ? (
            <View style={styles.editUrlRow}>
              <TextInput
                value={tempUrl}
                onChangeText={setTempUrl}
                style={styles.urlInput}
                autoCapitalize="none"
                placeholder="http://192.168.x.x:5000/api"
              />
              <TouchableOpacity onPress={handleSaveApiUrl} style={styles.saveUrlBtn}>
                <Text style={styles.saveUrlBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setTempUrl(ENV.apiUrl);
                setEditingUrl(true);
              }}
              style={styles.currentUrlBtn}
            >
              <Text style={styles.currentUrlText} numberOfLines={1}>
                {ENV.apiUrl}
              </Text>
              <Text style={styles.editHint}>(Tap to Change IP)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search / Filter Bar */}
        <View style={styles.filterBar}>
          <Filter size={16} color="#94A3B8" />
          <TextInput
            placeholder="Filter logs (e.g. API_ERR, POST, AUTH)..."
            value={filter}
            onChangeText={setFilter}
            style={styles.filterInput}
            autoCapitalize="none"
          />
          {filter.length > 0 && (
            <TouchableOpacity onPress={() => setFilter('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Log Entries */}
        <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No errors recorded. All operations running smoothly!</Text>
            </View>
          ) : (
            filteredLogs.map((item) => (
              <View key={item.id} style={styles.logItem}>
                <View style={styles.logItemTop}>
                  <Text style={styles.logTime}>{item.timestamp}</Text>
                  <View
                    style={[styles.badge, { backgroundColor: `${getTagColor(item.type)}20` }]}
                  >
                    <Text style={[styles.badgeText, { color: getTagColor(item.type) }]}>
                      {item.type}
                    </Text>
                  </View>
                  <Text style={styles.logTag}>[{item.tag}]</Text>
                </View>
                <Text style={styles.logMessage}>{item.message}</Text>
                {item.details && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailsText}>
                      {typeof item.details === 'object'
                        ? JSON.stringify(item.details, null, 2)
                        : String(item.details)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  urlBar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  urlLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  currentUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentUrlText: {
    fontSize: 13,
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  editHint: {
    fontSize: 11,
    color: '#FCD34D',
  },
  editUrlRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  saveUrlBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveUrlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  filterInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    padding: 0,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    padding: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  logItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  logTag: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  logMessage: {
    fontSize: 13,
    color: '#F8FAFC',
    fontFamily: 'monospace',
  },
  detailsBox: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailsText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
});

export default LogViewerModal;

