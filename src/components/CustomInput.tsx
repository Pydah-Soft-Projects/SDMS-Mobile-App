import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  dark?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  dark = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const hasError = !!error;

  // Determine wrapper styles dynamically without changing elevation (to avoid Android EditText unfocus bug)
  const getWrapperStyle = () => {
    if (dark) {
      if (hasError) return styles.inputErrorDark;
      if (isFocused) return styles.inputFocusedDark;
      return styles.inputWrapperDark;
    }
    if (hasError) return styles.inputError;
    if (isFocused) return styles.inputFocused;
    return styles.inputWrapper;
  };

  const getLabelColor = () => {
    if (hasError) return '#EF4444';
    if (dark) return isFocused ? '#60A5FA' : '#E2E8F0';
    return isFocused ? '#1D4ED8' : '#334155';
  };

  // Render Left Icon with dynamic color highlight
  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    if (React.isValidElement(leftIcon)) {
      const activeColor = hasError
        ? '#EF4444'
        : isFocused
        ? (dark ? '#60A5FA' : '#2563EB')
        : (dark ? '#94A3B8' : '#64748B');

      return React.cloneElement(leftIcon as React.ReactElement<any>, {
        color: activeColor,
      });
    }
    return leftIcon;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: getLabelColor() }]}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.baseWrapper, getWrapperStyle()]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer} pointerEvents="none">
            {renderLeftIcon()}
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[styles.input, dark && styles.inputDark, style]}
          placeholderTextColor={dark ? '#64748B' : '#94A3B8'}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Pressable>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, dark && styles.helperTextDark]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  baseWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  // Light Mode States
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  inputFocused: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2563EB',
    borderWidth: 1.8,
  },
  inputError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.8,
  },
  // Dark Mode States
  inputWrapperDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  inputFocusedDark: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: '#60A5FA',
    borderWidth: 1.8,
  },
  inputErrorDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 1.8,
  },
  leftIconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 10,
  },
  inputDark: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 2,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
    marginLeft: 2,
  },
  helperTextDark: {
    color: '#94A3B8',
  },
});

export default CustomInput;
