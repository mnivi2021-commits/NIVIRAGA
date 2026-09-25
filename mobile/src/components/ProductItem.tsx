import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductRow } from '../products';
import { fmt, lineTotal, paise } from '../pricing';
import { C, F } from '../theme';

type Props = { row: ProductRow; qty: number; onChange: (sno: number, q: number) => void };

function ProductItem({ row, qty, onChange }: Props) {
  const [sno, name, per, contents, price] = row;
  const [text, setText] = useState(qty ? String(qty) : '');

  // Keep the field in sync when qty changes from outside (stepper, Clear).
  useEffect(() => {
    setText(qty ? String(qty) : '');
  }, [qty]);

  const set = (q: number) => onChange(sno, Math.max(0, Math.floor(q || 0)));

  return (
    <View style={[styles.row, qty > 0 && styles.sel]}>
      <Text style={styles.sno}>{sno}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>
          {per} · {contents}
        </Text>
        <Text style={styles.price}>
          {fmt(paise(price))}
          {qty > 0 ? <Text style={styles.total}>{'   = ' + fmt(lineTotal(row, qty))}</Text> : null}
        </Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => set(qty - 1)}
          style={({ pressed }) => [styles.step, pressed && styles.pressed]}
          hitSlop={4}
          accessibilityLabel={`Decrease ${name}`}
        >
          <Text style={styles.stepTxt}>−</Text>
        </Pressable>
        <TextInput
          value={text}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9]/g, '');
            setText(clean);
            set(+clean);
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor="#b8a98f"
          maxLength={4}
          selectTextOnFocus
          style={styles.input}
          accessibilityLabel={`Qty ${name}`}
        />
        <Pressable
          onPress={() => set(qty + 1)}
          style={({ pressed }) => [styles.step, styles.plus, pressed && styles.pressed]}
          hitSlop={4}
          accessibilityLabel={`Increase ${name}`}
        >
          <Text style={[styles.stepTxt, { color: C.white }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(ProductItem);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    gap: 8,
  },
  sel: { backgroundColor: C.sel },
  sno: { width: 30, color: C.mute, fontFamily: F.sans, fontSize: 13 },
  info: { flex: 1 },
  name: { fontFamily: F.sansSemi, fontSize: 15, color: C.ink },
  meta: { fontFamily: F.sans, fontSize: 12, color: C.mute, marginTop: 1 },
  price: { fontFamily: F.sansMed, fontSize: 14, color: C.ink, marginTop: 2 },
  total: { fontFamily: F.sansBold, color: C.brand },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: 34,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { backgroundColor: C.brand, borderColor: C.brand },
  pressed: { opacity: 0.6 },
  stepTxt: { fontFamily: F.sansBold, fontSize: 20, color: C.ink, lineHeight: 24 },
  input: {
    width: 48,
    height: 40,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    backgroundColor: C.white,
    textAlign: 'center',
    fontFamily: F.sansSemi,
    fontSize: 15,
    color: C.ink,
    padding: 0,
  },
});
