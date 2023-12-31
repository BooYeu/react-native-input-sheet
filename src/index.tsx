import React, {
  useCallback,
  useEffect,
  useRef,
  memo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleProp,
} from 'react-native';
import { useStateRef } from 'react-hooks-extension';

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
  },
  container: {
    padding: 16,
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
  },
  input: {
    minHeight: 100,
    maxHeight: 250,
    fontSize: 15,
    lineHeight: 18,
    padding: 8,
    textAlignVertical: 'top',
  },
  btn: {
    alignSelf: 'flex-end',
    color: '#fff',
    fontSize: 15,
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
});

export type InputSheetType = {
  defaultValue?: string;
  onSubmit?: (_?: string) => Promise<any> | void;
  placeholder?: string;
  buttonText?: string;
  required?: boolean;
  maskStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  buttonTextStyle?: StyleProp<TextStyle>;
  autoClearText?: boolean;
  inputProps?: TextInputProps;
  keyboardVerticalOffset?: number;
};

export type InputSheetRef = { show: () => void; hide: () => void; setValue: (_: string) => void };

const InputSheet = forwardRef<InputSheetRef, InputSheetType>(
  (
    {
      defaultValue = '',
      onSubmit,
      placeholder,
      buttonText = 'submit',
      required = true,
      maskStyle,
      style,
      inputStyle,
      buttonTextStyle,
      autoClearText = true,
      inputProps,
      keyboardVerticalOffset = 102,
    },
    ref,
  ) => {
    const [show, setShow] = useState(false);
    const [flag, setFlag, flagRef] = useStateRef(true);
    const [value, setValue, valueRef] = useStateRef<string>(defaultValue);
    const input = useRef<TextInput>(null);

    const hideMask = useCallback(() => {
      setShow(false);
    }, []);
    const submit = useCallback(() => {
      if (!flagRef.current && (!required || valueRef.current)) {
        return;
      }
      setFlag(false);
      const lastPromise = onSubmit?.(valueRef.current);
      if (typeof lastPromise?.then === 'function') {
        lastPromise
          .then(() => {
            autoClearText && setValue('');
            setShow(false);
          })
          .finally(() => {
            setFlag(true);
          });
      } else {
        autoClearText && setValue('');
        setShow(false);
        setFlag(true);
      }
    }, [flagRef, onSubmit, setFlag, valueRef, required, autoClearText]);

    useEffect(() => {
      if (show) {
        input.current?.focus();
      } else {
        input.current?.blur();
      }
    }, [show]);
    useEffect(() => {
      setValue(defaultValue);
    }, [defaultValue, setValue]);

    useImperativeHandle(ref, () => ({
      show: () => setShow(true),
      hide: () => setShow(false),
      setValue,
    }));

    return (
      <Modal visible={show} transparent onRequestClose={hideMask}>
        <TouchableOpacity activeOpacity={1} onPress={hideMask} style={[styles.mask, maskStyle]} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={[styles.container, { backgroundColor: 'white' }, style]}
        >
          <TextInput
            ref={input}
            style={[styles.input, { backgroundColor: '#eee' }, inputStyle]}
            value={value}
            placeholder={placeholder}
            onChangeText={setValue}
            multiline
            editable={flag}
            {...(inputProps || {})}
          />
          <Pressable onPress={submit}>
            <Text
              style={[
                styles.btn,
                {
                  color: '#000',
                  backgroundColor: '#eee',
                  opacity: (value || !required) && flag ? 1 : 0.5,
                },
                buttonTextStyle,
              ]}
            >
              {buttonText}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

export default memo(InputSheet);
