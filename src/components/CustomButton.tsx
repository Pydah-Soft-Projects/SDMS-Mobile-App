import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  style,
  textStyle,
  icon,
  disabled,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled || isLoading) return '#94A3B8';
    switch (variant) {
      case 'secondary':
        return '#0284C7';
      case 'danger':
        return '#EF4444';
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return '#1E3A8A'; // Pydah Navy Blue
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return '#1E3A8A';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#1E3A8A' : '#FFFFFF'} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
    gap: 8,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomButton;

