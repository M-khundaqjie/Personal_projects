import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Easing,
  Dimensions, ActivityIndicator, StatusBar,
} from 'react-native';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';

// ============================================================
//  ANIMIX  —  native iPhone app (Expo / React Native)
//  Spin a wheel of your MyAnimeList plan-to-watch / plan-to-read.
// ============================================================

// 👉 SET THIS to your Mac's IP. In Terminal run:  ipconfig getifaddr en0
//    Then put it here, e.g. 'http://192.168.1.42:8000'
const BACKEND_URL = 'http://YOUR_IP_HERE:8000';

const NEON = ['#00F0FF', '#FF2E97', '#7A5CFF', '#00FFA3', '#FFB000'];
const mod = (n, m) => ((n % m) + m) % m;
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const tag = (title, k) => ({ title, kind: k, key: `${k}:${title}` });

export default function App() {
  const [dark, setDark] = useState(true);
  const [data, setData] = useState({ anime: [], manga: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState('anime'); // anime | manga | both
  const [mode, setMode] = useState('all'); // all | count | pick
  const [count, setCount] = useState(8);
  const [picked, setPicked] = useState({});
  const [result, setResult] = useState(null);

  const t = theme(dark);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(BACKEND_URL + '/lists')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e.message || e));
        setLoading(false);
      });
  };
  useEffect(load, []);

  const source = useMemo(() => {
    if (tab === 'anime') return (data.anime || []).map((x) => tag(x, 'A'));
    if (tab === 'manga') return (data.manga || []).map((x) => tag(x, 'M'));
    return [
      ...(data.anime || []).map((x) => tag(x, 'A')),
      ...(data.manga || []).map((x) => tag(x, 'M')),
    ];
  }, [tab, data]);

  const wheelItems = useMemo(() => {
    if (mode === 'all') return source;
    if (mode === 'count') return source.slice(0, Math.min(count, source.length));
    const sel = source.filter((i) => picked[i.key]);
    return sel.length ? sel : source.slice(0, Math.min(4, source.length));
  }, [source, mode, count, picked]);

  useEffect(() => {
    setPicked({});
    setResult(null);
  }, [tab]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      {/* top bar */}
      <View style={{ paddingTop: 56, paddingHorizontal: 18, paddingBottom: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 38 }} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: t.accent, fontSize: 22, fontWeight: '800', letterSpacing: 6 }}>
            ANIMIX
          </Text>
          <Text style={{ color: t.faint, fontSize: 10, letterSpacing: 2 }}>
            what's next?
          </Text>
        </View>
        <TouchableOpacity onPress={() => setDark((d) => !d)} style={t.iconBtn}>
          <Text style={{ color: t.text, fontSize: 18 }}>{dark ? '☾' : '☀'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Center><ActivityIndicator color={t.accent} size="large" />
          <Text style={{ color: t.muted, marginTop: 14, letterSpacing: 2 }}>LOADING YOUR LISTS</Text>
        </Center>
      ) : error ? (
        <Center>
          <Text style={{ color: t.accent, fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
            Can't reach the backend
          </Text>
          <Text style={{ color: t.muted, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 }}>
            Make sure animix_server.py is running on your Mac and BACKEND_URL points to your Mac's IP, on the same wifi.
          </Text>
          <Text style={{ color: t.faint, fontSize: 11, marginTop: 12 }}>{error}</Text>
          <TouchableOpacity onPress={load} style={[t.tabActive, { marginTop: 20, paddingHorizontal: 24 }]}>
            <Text style={{ color: t.accent, fontWeight: '700', letterSpacing: 2 }}>RETRY</Text>
          </TouchableOpacity>
        </Center>
      ) : (
        <>
          {/* tabs */}
          <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 6 }}>
            {[['anime', 'ANIME'], ['manga', 'MANGA'], ['both', 'BOTH']].map(([k, label]) => (
              <TouchableOpacity key={k} onPress={() => setTab(k)}
                style={tab === k ? t.tabActive : t.tab}>
                <Text style={{ color: tab === k ? t.accent : t.muted, fontWeight: '700',
                  letterSpacing: 2, fontSize: 12 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* wheel */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Wheel t={t} items={wheelItems} onResult={setResult} />
          </View>

          {/* result */}
          <View style={{ minHeight: 60, alignItems: 'center', paddingHorizontal: 20 }}>
            {result ? (
              <>
                <Text style={{ color: t.muted, fontSize: 10, letterSpacing: 3 }}>NEXT UP</Text>
                <Text style={{ color: t.accent, fontSize: 19, fontWeight: '800', textAlign: 'center',
                  marginTop: 2 }}>{result.title}</Text>
              </>
            ) : (
              <Text style={{ color: t.faint, fontSize: 12, paddingTop: 14, letterSpacing: 1 }}>
                {wheelItems.length} titles · tap the core to spin
              </Text>
            )}
          </View>

          {/* options */}
          <View style={t.panel}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[['all', 'Everything'], ['count', 'Pick a number'], ['pick', 'Choose titles']].map(([k, label]) => (
                <TouchableOpacity key={k} onPress={() => setMode(k)} style={mode === k ? t.segActive : t.seg}>
                  <Text style={{ color: mode === k ? '#04141A' : t.muted, fontSize: 11,
                    fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'count' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 16, paddingHorizontal: 6 }}>
                <Text style={{ color: t.muted, fontSize: 12, letterSpacing: 1 }}>TITLES ON WHEEL</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                  <Stepper t={t} label="−" onPress={() => setCount((c) => Math.max(2, c - 1))} />
                  <Text style={{ color: t.accent, fontSize: 20, fontWeight: '800', minWidth: 30,
                    textAlign: 'center' }}>{Math.min(count, source.length)}</Text>
                  <Stepper t={t} label="+" onPress={() => setCount((c) => Math.min(source.length, c + 1))} />
                </View>
              </View>
            )}

            {mode === 'pick' && (
              <ScrollView style={{ maxHeight: 150, marginTop: 12 }} showsVerticalScrollIndicator={false}>
                {source.map((i) => {
                  const on = !!picked[i.key];
                  return (
                    <TouchableOpacity key={i.key}
                      onPress={() => setPicked((p) => ({ ...p, [i.key]: !p[i.key] }))}
                      style={[on ? t.pickOn : t.pickOff, { marginBottom: 6, flexDirection: 'row',
                        justifyContent: 'space-between' }]}>
                      <Text style={{ color: on ? t.accent : t.muted, fontSize: 13 }}>
                        <Text style={{ opacity: 0.5, fontSize: 10 }}>{i.kind}  </Text>{trunc(i.title, 30)}
                      </Text>
                      <Text style={{ color: on ? t.accent : t.muted }}>{on ? '◉' : '○'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function Center({ children }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

function Stepper({ t, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 40, height: 40, borderRadius: 12,
      borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.accent, fontSize: 22, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ------------------------- WHEEL -------------------------
function Wheel({ t, items, onResult }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);

  const W = Math.min(Dimensions.get('window').width * 0.88, 330);
  const C = W / 2;
  const R = C - 6;
  const n = items.length;
  const seg = n ? 360 / n : 360;

  const spin = () => {
    if (spinning || n === 0) return;
    onResult(null);
    const w = Math.floor(Math.random() * n);
    const center = w * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * seg * 0.5;
    const target = rotationRef.current + 360 * 6 + mod(-center - jitter - rotationRef.current, 360);
    setSpinning(true);
    Animated.timing(spinAnim, {
      toValue: target, duration: 4200, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(() => {
      rotationRef.current = target;
      setSpinning(false);
      onResult(items[w]);
    });
  };

  const rotate = spinAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });
  const showLabel = n <= 16;

  return (
    <View style={{ width: W, height: W, alignItems: 'center', justifyContent: 'center' }}>
      {/* pointer */}
      <View style={{ position: 'absolute', top: -2, zIndex: 3, width: 0, height: 0,
        borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 20,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: t.accent }} />

      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
          {items.map((it, i) => {
            const a0 = ((i * seg - 90) * Math.PI) / 180;
            const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
            const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
            const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
            const large = seg > 180 ? 1 : 0;
            const mid = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
            const tr = R * 0.62;
            const tx = C + tr * Math.cos(mid), ty = C + tr * Math.sin(mid);
            const labelAngle = i * seg + seg / 2;
            return (
              <G key={it.key}>
                <Path d={`M${C},${C} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`}
                  fill={NEON[i % NEON.length]} fillOpacity={dark(t) ? 0.85 : 0.9}
                  stroke={t.bg} strokeWidth={2} />
                {showLabel && (
                  <G rotation={labelAngle} originX={tx} originY={ty}>
                    <SvgText x={tx} y={ty} fill="#0A0A12" fontSize={n > 10 ? 9 : 11}
                      fontWeight="700" textAnchor="middle">
                      {trunc(it.title, n > 10 ? 14 : 18)}
                    </SvgText>
                  </G>
                )}
              </G>
            );
          })}
          <Circle cx={C} cy={C} r={R} fill="none" stroke={t.accent} strokeWidth={2} strokeOpacity={0.5} />
          <Circle cx={C} cy={C} r={40} fill={t.bg} stroke={t.accent} strokeWidth={2} />
        </Svg>
      </Animated.View>

      {/* spin core */}
      <TouchableOpacity onPress={spin} disabled={spinning}
        style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40,
          alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.accent, fontWeight: '800', letterSpacing: 2, fontSize: 15 }}>
          {spinning ? '···' : 'SPIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// helper so the wheel can read dark mode from theme object
function dark(t) { return t._dark; }

// ------------------------- THEME -------------------------
function theme(isDark) {
  const accent = '#00F0FF';
  const bg = isDark ? '#08080C' : '#EEF0F4';
  const surface = isDark ? '#101018' : '#FFFFFF';
  const text = isDark ? '#E8E8F2' : '#14141C';
  const muted = isDark ? '#8A8AA0' : '#5A5A70';
  const faint = isDark ? '#55556A' : '#9A9AB0';
  const border = isDark ? '#1E1E2C' : '#D8D8E2';
  return {
    _dark: isDark, accent, bg, surface, text, muted, faint, border,
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: surface,
      borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center' },
    tab: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: border, borderRadius: 10,
      alignItems: 'center' },
    tabActive: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: accent, borderRadius: 10,
      alignItems: 'center', backgroundColor: isDark ? '#0C1A1E' : '#E2FBFF' },
    panel: { backgroundColor: surface, borderTopWidth: 1, borderTopColor: border,
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30,
      borderTopLeftRadius: 18, borderTopRightRadius: 18 },
    seg: { flex: 1, paddingVertical: 9, borderWidth: 1, borderColor: border, borderRadius: 9,
      alignItems: 'center' },
    segActive: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center',
      backgroundColor: accent },
    pickOff: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: border,
      borderRadius: 8, backgroundColor: isDark ? '#0B0B12' : '#F4F5F8' },
    pickOn: { paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: accent,
      borderRadius: 8, backgroundColor: isDark ? '#0C1A1E' : '#E2FBFF' },
  };
}
