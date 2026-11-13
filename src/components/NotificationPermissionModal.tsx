import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles, CheckCircle2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface NotificationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onAllow,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Gradient Badge */}
          <LinearGradient
            colors={['#1E3A8A', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Bell size={28} color="#FFFFFF" />
          </LinearGradient>

          <View style={styles.badgePill}>
            <Sparkles size={11} color="#2563EB" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>STAY UPDATED</Text>
          </View>

          <Text style={styles.title}>Enable Push Notifications</Text>
          <Text style={styles.subtitle}>
            Get instant updates on official college circulars, urgent administrative notices, and upcoming campus events.
          </Text>

          {/* Value Perks */}
          <View style={styles.perksList}>
            <View style={styles.perkItem}>
              <CheckCircle2 size={15} color="#16A34A" style={styles.perkIcon} />
              <Text style={styles.perkText}>Instant alerts for urgent student circulars</Text>
            </View>
            <View style={styles.perkItem}>
              <CheckCircle2 size={15} color="#16A34A" style={styles.perkIcon} />
              <Text style={styles.perkText}>Live updates for campus events & workshops</Text>
            </View>
            <View style={styles.perkItem}>
              <CheckCircle2 size={15} color="#16A34A" style={styles.perkIcon} />
              <Text style={styles.perkText}>Real-time fee deadlines & academic reminders</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryBtn}
              onPress={onAllow}
            >
              <Text style={styles.primaryBtnText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.secondaryBtn}
              onPress={onDismiss}
            >
              <Text style={styles.secondaryBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    width: Math.min(width - 40, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  perksList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
    marginBottom: 20,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIcon: {
    marginRight: 8,
  },
  perkText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default NotificationPermissionModal;

