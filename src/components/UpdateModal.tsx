import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, RefreshCw, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface UpdateModalProps {
  visible: boolean;
  isPending?: boolean; // True if update is downloaded and ready to reload
  isApplying?: boolean; // True while download or reload is executing
  onConfirm: () => void;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  isPending = false,
  isApplying = false,
  onConfirm,
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
          {/* Top Decorative Header with Gradient Circle */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#1E3A8A', '#2563EB', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Sparkles size={28} color="#FFFFFF" strokeWidth={2.2} />
            </LinearGradient>

            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {isPending ? '🚀 UPDATE READY' : '✨ NEW UPDATE AVAILABLE'}
              </Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>
            {isPending ? 'New Version Ready!' : 'App Update Available'}
          </Text>
          <Text style={styles.subtitle}>
            {isPending
              ? 'The latest update has been downloaded. Restart now to enjoy the refreshed interface and newest features.'
              : 'A new version of Campo Student App is available with performance improvements and UI refinements.'}
          </Text>

          {/* Highlight Bullets */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Zap size={14} color="#2563EB" strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Faster loading times & smoother navigation</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#F0FDF4' }]}>
                <CheckCircle2 size={14} color="#16A34A" strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Redesigned login screen & highlighted inputs</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FAF5FF' }]}>
                <ShieldCheck size={14} color="#9333EA" strokeWidth={2.5} />
              </View>
              <Text style={styles.featureText}>Latest security & stability updates</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isApplying}
              style={[styles.primaryButton, isApplying && styles.buttonDisabled]}
              onPress={onConfirm}
            >
              <LinearGradient
                colors={isApplying ? ['#94A3B8', '#94A3B8'] : ['#1E3A8A', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isApplying ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {isPending ? 'Restarting...' : 'Downloading Update...'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <RefreshCw size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.primaryButtonText}>
                      {isPending ? 'Restart & Apply Now' : 'Update Now'}
                    </Text>
                    <ArrowRight size={16} color="#93C5FD" style={{ marginLeft: 2 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {!isApplying && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.secondaryButton}
                onPress={onDismiss}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
              </TouchableOpacity>
            )}
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
    width: Math.min(width - 40, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  badgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  gradientButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UpdateModal;

