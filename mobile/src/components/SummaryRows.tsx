import { StyleSheet, Text, View } from 'react-native';
import { Summary, countText, fmt } from '../pricing';
import { C, F } from '../theme';

/** Summary order: Discount Items Total → Less 75% → After Discount → Net Rate Total → GRAND TOTAL. */
export default function SummaryRows({ s }: { s: Summary }) {
  return (
    <View>
      <Row label="Discount Items Total" value={fmt(s.discountTotal)} />
      <Row label="Less 75%" value={'− ' + fmt(s.less)} tone="less" />
      <Row label="After Discount" value={fmt(s.afterDiscount)} tone="bold" />
      <Row label="Net Rate Total" value={fmt(s.netTotal)} />
      <View style={styles.grand}>
        <Text style={styles.grandTxt}>GRAND TOTAL</Text>
        <Text style={styles.grandTxt}>{fmt(s.grand)}</Text>
      </View>
      <Text style={styles.count}>{countText(s)}</Text>
    </View>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'less' | 'bold' }) {
  const t = [styles.txt, tone === 'less' && styles.less, tone && styles.bold];
  return (
    <View style={styles.row}>
      <Text style={t}>{label}</Text>
      <Text style={t}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  txt: { fontFamily: F.sans, fontSize: 15, color: C.ink },
  less: { color: C.brand },
  bold: { fontFamily: F.sansSemi },
  grand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.brand,
    padding: 16,
  },
  grandTxt: { fontFamily: F.sansBold, fontSize: 19, color: C.gold },
  count: { paddingVertical: 10, paddingHorizontal: 16, color: C.mute, fontFamily: F.sans, fontSize: 13 },
});
