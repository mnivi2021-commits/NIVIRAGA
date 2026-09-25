import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexSerif_600SemiBold, IBMPlexSerif_700Bold } from '@expo-google-fonts/ibm-plex-serif';

import { PRODUCTS, ProductRow } from './products';
import { Qty, fmt, summarize, countText } from './pricing';
import { C, F } from './theme';
import Header from './components/Header';
import ProductItem from './components/ProductItem';
import SummaryRows from './components/SummaryRows';
import BillModal, { Customer } from './components/BillModal';

const KEY = 'niviraga-order-2026';
const CUST_KEY = KEY + '-customer';

const GROUPS = [
  { d: 1, net: false, title: '75% OFF Items' },
  { d: 0, net: true, title: 'Net Rate Items (No Discount)' },
] as const;

type Item =
  | { k: 'header' }
  | { k: 'cust' }
  | { k: 'tools' }
  | { k: 'ghead'; title: string; count: number; net: boolean }
  | { k: 'cat'; title: string; net: boolean; id: string }
  | { k: 'item'; row: ProductRow }
  | { k: 'empty'; id: string }
  | { k: 'summary' };

const TOOLS_INDEX = 2;

export default function Root() {
  const [loaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexSerif_600SemiBold,
    IBMPlexSerif_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {loaded ? (
        <OrderScreen />
      ) : (
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator color={C.brand} size="large" />
        </View>
      )}
    </SafeAreaProvider>
  );
}

function OrderScreen() {
  const insets = useSafeAreaInsets();
  const [qty, setQty] = useState<Qty>({});
  const [cust, setCust] = useState<Customer>({ name: '', mobile: '', place: '' });
  const [term, setTerm] = useState('');
  const [selOnly, setSelOnly] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const ready = useRef(false);
  const list = useRef<FlatList<Item>>(null);

  // Restore saved quantities and customer details.
  useEffect(() => {
    (async () => {
      try {
        const [q, c] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(CUST_KEY)]);
        if (q) setQty(JSON.parse(q));
        if (c) setCust(JSON.parse(c));
      } catch {}
      ready.current = true;
    })();
  }, []);

  useEffect(() => {
    if (ready.current) AsyncStorage.setItem(KEY, JSON.stringify(qty)).catch(() => {});
  }, [qty]);
  useEffect(() => {
    if (ready.current) AsyncStorage.setItem(CUST_KEY, JSON.stringify(cust)).catch(() => {});
  }, [cust]);

  const onChange = useCallback((sno: number, q: number) => {
    setQty((prev) => {
      if ((prev[sno] || 0) === q) return prev;
      const next = { ...prev };
      if (q > 0) next[sno] = q;
      else delete next[sno];
      return next;
    });
  }, []);

  const summary = useMemo(() => summarize(qty), [qty]);

  const data = useMemo<Item[]>(() => {
    const t = term.trim().toLowerCase();
    const out: Item[] = [{ k: 'header' }, { k: 'cust' }, { k: 'tools' }];
    for (const g of GROUPS) {
      const all = PRODUCTS.filter((r) => r[5] === g.d);
      out.push({ k: 'ghead', title: g.title, count: all.length, net: g.net });
      let cat: string | null = null;
      let vis = 0;
      for (const r of all) {
        const hay = `${r[0]} ${r[1]} ${r[6]}`.toLowerCase();
        if (t && !hay.includes(t)) continue;
        if (selOnly && !qty[r[0]]) continue;
        if (r[6] !== cat) {
          cat = r[6];
          out.push({ k: 'cat', title: cat, net: g.net, id: `${g.d}-${cat}` });
        }
        out.push({ k: 'item', row: r });
        vis++;
      }
      if (!vis) out.push({ k: 'empty', id: String(g.d) });
    }
    out.push({ k: 'summary' });
    return out;
    // qty only matters for the "Selected only" filter
  }, [term, selOnly, selOnly ? qty : null]);

  const clear = () =>
    Alert.alert('Clear order', 'Clear all quantities?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setQty({}) },
    ]);

  const viewBill = () => {
    if (!summary.products) {
      Alert.alert('No items', 'Please enter quantity for at least one item.');
      return;
    }
    setBillOpen(true);
  };

  const renderItem = ({ item }: { item: Item }) => {
    switch (item.k) {
      case 'header':
        return <Header />;
      case 'cust':
        return (
          <View style={styles.cust}>
            <Field label="Customer name" value={cust.name} onChange={(name) => setCust((c) => ({ ...c, name }))} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field
                label="Mobile"
                value={cust.mobile}
                keyboardType="phone-pad"
                onChange={(mobile) => setCust((c) => ({ ...c, mobile }))}
              />
              <Field label="Place" value={cust.place} onChange={(place) => setCust((c) => ({ ...c, place }))} />
            </View>
          </View>
        );
      case 'tools':
        return (
          <View style={styles.tools}>
            <TextInput
              value={term}
              onChangeText={setTerm}
              placeholder="Search products or S.No"
              placeholderTextColor="#9c8c75"
              style={[styles.input, { flex: 1 }]}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            <Pressable
              onPress={() => setSelOnly((s) => !s)}
              style={[styles.btn, selOnly && styles.btnOn]}
              accessibilityState={{ selected: selOnly }}
            >
              <Text style={[styles.btnTxt, selOnly && { color: C.white }]}>Selected only</Text>
            </Pressable>
          </View>
        );
      case 'ghead':
        return (
          <View style={[styles.ghead, item.net && { backgroundColor: C.net }]}>
            <Text style={styles.gtitle}>{item.title}</Text>
            <Text style={styles.gcount}>{item.count} items</Text>
          </View>
        );
      case 'cat':
        return (
          <View style={[styles.cat, item.net && { backgroundColor: C.netTint }]}>
            <Text style={[styles.catTxt, item.net && { color: C.net }]}>{item.title}</Text>
          </View>
        );
      case 'item':
        return <ProductItem row={item.row} qty={qty[item.row[0]] || 0} onChange={onChange} />;
      case 'empty':
        return <Text style={styles.empty}>No matching items</Text>;
      case 'summary':
        return (
          <View style={{ padding: 12, paddingBottom: 24 }}>
            <View style={styles.aside}>
              <Text style={styles.asideTitle}>Order Summary</Text>
              <SummaryRows s={summary} />
              <View style={styles.sact}>
                <Pressable style={[styles.btn, { flex: 1 }]} onPress={clear}>
                  <Text style={styles.btnTxt}>Clear</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.primary, { flex: 1 }]} onPress={viewBill}>
                  <Text style={[styles.btnTxt, { color: C.white }]}>View Final Order</Text>
                </Pressable>
              </View>
            </View>
            <Image source={require('../assets/img/rockets-yellow.png')} style={styles.sideImg} resizeMode="cover" />
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={list}
        data={data}
        renderItem={renderItem}
        keyExtractor={(it, i) =>
          it.k === 'item' ? 's' + it.row[0] : it.k === 'cat' || it.k === 'empty' ? it.k + it.id : it.k + i
        }
        extraData={qty}
        stickyHeaderIndices={[TOOLS_INDEX]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={false}
        initialNumToRender={30}
        windowSize={11}
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        style={styles.fill}
      />

      <View style={[styles.bottom, { paddingBottom: 10 + insets.bottom }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bLabel}>GRAND TOTAL</Text>
          <Text style={styles.bTotal}>{fmt(summary.grand)}</Text>
          <Text style={styles.bCount}>{countText(summary)}</Text>
        </View>
        <Pressable
          style={[styles.btn, styles.yellow]}
          onPress={() => list.current?.scrollToEnd({ animated: true })}
          accessibilityLabel="Show order summary"
        >
          <Text style={styles.btnTxt}>Summary</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.yellow]} onPress={viewBill}>
          <Text style={styles.btnTxt}>View Order</Text>
        </Pressable>
      </View>

      <BillModal visible={billOpen} onClose={() => setBillOpen(false)} qty={qty} summary={summary} customer={cust} />
    </KeyboardAvoidingView>
  );
}

function Field(p: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={styles.label}>{p.label.toUpperCase()}</Text>
      <TextInput
        value={p.value}
        onChangeText={p.onChange}
        keyboardType={p.keyboardType ?? 'default'}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  cust: { padding: 12, gap: 10 },
  label: { fontFamily: F.sansSemi, fontSize: 11, letterSpacing: 0.6, color: C.mute },
  input: {
    fontFamily: F.sans,
    fontSize: 15,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  tools: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.bg,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: { backgroundColor: C.ink, borderColor: C.ink },
  primary: { backgroundColor: C.brand, borderColor: C.brand },
  yellow: { backgroundColor: C.gold, borderColor: C.gold, paddingHorizontal: 12 },
  btnTxt: { fontFamily: F.sansSemi, fontSize: 14, color: C.ink },
  ghead: {
    marginTop: 18,
    marginHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: C.brand,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gtitle: { fontFamily: F.serifBold, fontSize: 17, color: C.white, flexShrink: 1 },
  gcount: { fontFamily: F.sansSemi, fontSize: 13, color: C.gold },
  cat: {
    marginHorizontal: 12,
    backgroundColor: C.tint,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.line,
  },
  catTxt: { fontFamily: F.sansBold, fontSize: 13, color: C.brand },
  empty: {
    marginHorizontal: 12,
    padding: 14,
    color: C.mute,
    fontFamily: F.sans,
    backgroundColor: C.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.line,
  },
  aside: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  asideTitle: {
    fontFamily: F.serifBold,
    fontSize: 17,
    color: C.ink,
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  sact: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 4 },
  sideImg: {
    width: '100%',
    aspectRatio: 400 / 390,
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: C.brand,
    backgroundColor: C.gold,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.brand,
    borderTopWidth: 4,
    borderTopColor: C.gold,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  bLabel: { fontFamily: F.sansBold, fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.85)' },
  bTotal: { fontFamily: F.sansBold, fontSize: 20, color: C.gold },
  bCount: { fontFamily: F.sans, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
});
