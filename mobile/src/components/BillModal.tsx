import { useRef, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { PRODUCTS, ProductRow } from '../products';
import { Qty, Summary, countText, fmt, lineTotal, paise } from '../pricing';
import { C, F, SHOP } from '../theme';
import SummaryRows from './SummaryRows';

export type Customer = { name: string; mobile: string; place: string };

type Props = { visible: boolean; onClose: () => void; qty: Qty; summary: Summary; customer: Customer };

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export default function BillModal({ visible, onClose, qty, summary, customer }: Props) {
  const card = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const sel = PRODUCTS.filter((r) => qty[r[0]]);
  const disc = sel.filter((r) => r[5]);
  const net = sel.filter((r) => !r[5]);
  const v = (s: string) => s.trim() || '—';

  const saveImage = async () => {
    if (!card.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(card, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save or share order', UTI: 'public.png' });
      } else {
        Alert.alert('Saved', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Could not create image', String(e));
    } finally {
      setBusy(false);
    }
  };

  const printPdf = async () => {
    setBusy(true);
    try {
      await Print.printAsync({ html: billHtml(qty, summary, customer, disc, net) });
    } catch {
      // user cancelled the print dialog
    } finally {
      setBusy(false);
    }
  };

  const whatsapp = () => {
    const line = (r: ProductRow) => `${r[0]}. ${r[1]} x ${qty[r[0]]} = ${fmt(lineTotal(r, qty[r[0]]))}`;
    const text = [
      `*${SHOP.name} ${SHOP.line} – Order*`,
      `Customer: ${v(customer.name)}`,
      `Mobile: ${v(customer.mobile)}`,
      `Place: ${v(customer.place)}`,
      '',
      ...(disc.length ? ['*75% OFF Items*', ...disc.map(line), ''] : []),
      ...(net.length ? ['*Net Rate Items*', ...net.map(line), ''] : []),
      `Discount Items Total: ${fmt(summary.discountTotal)}`,
      `Less 75%: − ${fmt(summary.less)}`,
      `After Discount: ${fmt(summary.afterDiscount)}`,
      `Net Rate Total: ${fmt(summary.netTotal)}`,
      `*GRAND TOTAL: ${fmt(summary.grand)}*`,
      countText(summary),
    ].join('\n');
    Linking.openURL(`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`).catch(() =>
      Alert.alert('WhatsApp not available'),
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <View style={styles.bar}>
          <Btn label="WhatsApp" color={C.whatsapp} onPress={whatsapp} />
          <Btn label="Save Image" color={C.gold} ink={C.ink} onPress={saveImage} disabled={busy} />
          <Btn label="Print / PDF" onPress={printPdf} disabled={busy} />
          <Btn label="Close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          <View ref={card} collapsable={false} style={styles.card}>
            <View style={styles.bh}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bhTitle}>{SHOP.name}</Text>
                <Text style={styles.bhLine}>{SHOP.line.toUpperCase()}</Text>
                <Text style={styles.bhSub}>
                  {SHOP.place} · Mobile {SHOP.mobile}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bhSub}>Order Estimate</Text>
                <Text style={styles.bhDate}>{today()}</Text>
              </View>
            </View>
            <View style={styles.cust}>
              <Field k="Customer" v={v(customer.name)} />
              <Field k="Mobile" v={v(customer.mobile)} />
              <Field k="Place" v={v(customer.place)} />
            </View>
            {disc.length > 0 && <Section title="75% OFF Items" rows={disc} qty={qty} />}
            {net.length > 0 && <Section title="Net Rate Items (No Discount)" rows={net} qty={qty} />}
            <View style={styles.sum}>
              <SummaryRows s={summary} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Btn(p: { label: string; onPress: () => void; color?: string; ink?: string; disabled?: boolean }) {
  return (
    <Pressable
      onPress={p.onPress}
      disabled={p.disabled}
      style={({ pressed }) => [
        styles.btn,
        p.color && { backgroundColor: p.color, borderColor: p.color },
        (pressed || p.disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.btnTxt, { color: p.ink ?? (p.color ? C.white : C.ink) }]}>{p.label}</Text>
    </Pressable>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ minWidth: 90, flexGrow: 1 }}>
      <Text style={styles.fk}>{k.toUpperCase()}</Text>
      <Text style={styles.fv}>{v}</Text>
    </View>
  );
}

function Section({ title, rows, qty }: { title: string; rows: ProductRow[]; qty: Qty }) {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
      <Text style={styles.secTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.tr, { backgroundColor: C.white }]}>
          <Text style={[styles.th, { width: 32 }]}>S.NO</Text>
          <Text style={[styles.th, { flex: 1 }]}>PRODUCT</Text>
          <Text style={[styles.th, styles.num, { width: 36 }]}>QTY</Text>
          <Text style={[styles.th, styles.num, { width: 84 }]}>TOTAL</Text>
        </View>
        {rows.map((r) => (
          <View key={r[0]} style={styles.tr}>
            <Text style={[styles.td, { width: 32, color: C.mute }]}>{r[0]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.td}>{r[1]}</Text>
              <Text style={[styles.td, { color: C.mute, fontSize: 11 }]}>@ {fmt(paise(r[4]))}</Text>
            </View>
            <Text style={[styles.td, styles.num, { width: 36 }]}>{qty[r[0]]}</Text>
            <Text style={[styles.td, styles.num, { width: 84, fontFamily: F.sansSemi }]}>
              {fmt(lineTotal(r, qty[r[0]]))}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function billHtml(qty: Qty, s: Summary, c: Customer, disc: ProductRow[], net: ProductRow[]) {
  const table = (title: string, rows: ProductRow[]) =>
    rows.length
      ? `<h3>${title}</h3><table><tr><th>S.No</th><th>Product</th><th class="n">Price</th><th class="n">Qty</th><th class="n">Total</th></tr>${rows
          .map(
            (r) =>
              `<tr><td>${r[0]}</td><td>${esc(r[1])}</td><td class="n">${fmt(paise(r[4]))}</td><td class="n">${qty[r[0]]}</td><td class="n">${fmt(lineTotal(r, qty[r[0]]))}</td></tr>`,
          )
          .join('')}</table>`
      : '';
  const row = (k: string, v: string, cls = '') => `<div class="sr ${cls}"><span>${k}</span><span>${v}</span></div>`;
  const val = (x: string) => esc(x.trim() || '—');
  return `<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,Roboto,sans-serif;color:#241a12;margin:24px}
.bh{background:#bb0916;color:#fff;padding:16px;border-bottom:5px solid #fbd530;display:flex;justify-content:space-between}
.bh h2{margin:0;color:#fbd530;font-family:Georgia,serif}.cu{display:flex;gap:24px;background:#ffefb1;padding:10px 16px;font-size:14px}
.cu small{display:block;color:#6e5f50;font-weight:600}h3{color:#bb0916;margin:16px 0 6px;font-family:Georgia,serif}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #eadaae;padding:5px 8px;text-align:left}th{font-size:11px;color:#6e5f50}.n{text-align:right}
.sum{margin-top:16px;border:1px solid #eadaae}.sr{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #eadaae}
.less{color:#bb0916;font-weight:600}.g{background:#bb0916;color:#fbd530;font-size:18px;font-weight:700}
</style></head><body>
<div class="bh"><div><h2>${SHOP.name}</h2><b>CRACKERS SHOP</b><div>${SHOP.place} · Mobile ${SHOP.mobile}</div></div><div style="text-align:right">Order Estimate<br><b style="color:#fbd530">${today()}</b></div></div>
<div class="cu"><div><small>CUSTOMER</small>${val(c.name)}</div><div><small>MOBILE</small>${val(c.mobile)}</div><div><small>PLACE</small>${val(c.place)}</div></div>
${table('75% OFF Items', disc)}${table('Net Rate Items (No Discount)', net)}
<div class="sum">${row('Discount Items Total', fmt(s.discountTotal))}${row('Less 75%', '− ' + fmt(s.less), 'less')}${row('After Discount', fmt(s.afterDiscount))}${row('Net Rate Total', fmt(s.netTotal))}${row('GRAND TOTAL', fmt(s.grand), 'g')}<div class="sr">${countText(s)}</div></div>
</body></html>`;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#3a2b1f' },
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, justifyContent: 'flex-end' },
  btn: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    justifyContent: 'center',
  },
  btnTxt: { fontFamily: F.sansSemi, fontSize: 14 },
  card: { backgroundColor: C.white, borderRadius: 10, overflow: 'hidden' },
  bh: {
    backgroundColor: C.brand,
    padding: 16,
    borderBottomWidth: 5,
    borderBottomColor: C.gold,
    flexDirection: 'row',
    gap: 10,
  },
  bhTitle: { fontFamily: F.serifBold, fontSize: 26, color: C.gold },
  bhLine: { fontFamily: F.sansBold, fontSize: 12, letterSpacing: 3, color: C.white },
  bhSub: { fontFamily: F.sans, fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 3 },
  bhDate: { fontFamily: F.sansBold, fontSize: 15, color: C.gold },
  cust: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: C.tint, paddingVertical: 12, paddingHorizontal: 16 },
  fk: { fontFamily: F.sansSemi, fontSize: 10, letterSpacing: 0.6, color: C.mute },
  fv: { fontFamily: F.sans, fontSize: 14, color: C.ink },
  secTitle: { fontFamily: F.serifBold, fontSize: 16, color: C.brand, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: C.line, borderBottomWidth: 0 },
  tr: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: C.line, paddingVertical: 6, paddingHorizontal: 6, gap: 4 },
  th: { fontFamily: F.sansSemi, fontSize: 10, color: C.mute, letterSpacing: 0.5 },
  td: { fontFamily: F.sans, fontSize: 13, color: C.ink },
  num: { textAlign: 'right' },
  sum: { margin: 14, marginTop: 16, borderWidth: 1, borderColor: C.line, borderRadius: 8, overflow: 'hidden' },
});
