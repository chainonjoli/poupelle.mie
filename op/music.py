# 90s-anime-OP-flavored BGM, 100s, synthesized with numpy -> op.wav
import numpy as np, wave

SR = 44100
DUR = 100.0
N = int(SR * DUR)
t_all = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

BPM = 96.0
BEAT = 60.0 / BPM          # 0.625 s
BAR = BEAT * 4             # 2.5 s -> 40 bars

def midi_f(m): return 440.0 * 2 ** ((m - 69) / 12)

# D major; I V vi IV = D A Bm G
CHORDS = [
    [50, 57, 61, 66],   # D:  D3 A3 C#4 F#4
    [45, 57, 61, 64],   # A:  A2 A3 C#4 E4
    [47, 57, 62, 66],   # Bm: B2 A3 D4 F#4
    [43, 55, 62, 67],   # G:  G2 G3 D4 G4
]
ROOTS = [38, 45, 47, 43]  # D2 A2 B2 G2

def add(sig, start, stereo=0.0, gain=1.0):
    i0 = int(start * SR)
    n = len(sig)
    if i0 >= N: return
    n = min(n, N - i0)
    sl = sig[:n] * gain
    L[i0:i0+n] += sl * (1 - stereo * 0.5)
    R[i0:i0+n] += sl * (1 + stereo * 0.5)

def env_ar(n, a, r):
    e = np.ones(n)
    na = max(int(a*SR),1); nr = max(int(r*SR),1)
    e[:na] = np.linspace(0,1,na)
    e[-nr:] *= np.linspace(1,0,nr)
    return e

def bell(f, dur, gain=1.0):
    n = int(dur*SR); tt = np.arange(n)/SR
    s = np.sin(2*np.pi*f*tt) + 0.4*np.sin(2*np.pi*f*2*tt) + 0.15*np.sin(2*np.pi*f*3.01*tt)
    return s * np.exp(-tt*4.0) * gain

def pad_note(f, dur, gain=1.0):
    n = int(dur*SR); tt = np.arange(n)/SR
    s = (np.sin(2*np.pi*f*tt) + 0.5*np.sin(2*np.pi*f*1.005*tt)
         + 0.5*np.sin(2*np.pi*f*0.995*tt) + 0.25*np.sin(2*np.pi*f*2*tt))
    e = env_ar(n, 0.4, min(0.8, dur*0.4))
    return s * e * gain * 0.25

def lead_note(f, dur, gain=1.0, vib=5.0):
    n = int(dur*SR); tt = np.arange(n)/SR
    vibr = 1 + 0.006*np.sin(2*np.pi*vib*tt)*np.minimum(tt*3,1)
    ph = np.cumsum(2*np.pi*f*vibr/SR)
    s = np.sin(ph) + 0.35*np.sin(2*ph) + 0.12*np.sin(3*ph)
    e = env_ar(n, 0.02, min(0.25, dur*0.5))
    return s * e * gain

def bass_note(f, dur, gain=1.0):
    n = int(dur*SR); tt = np.arange(n)/SR
    s = np.sin(2*np.pi*f*tt) + 0.3*np.sin(2*np.pi*f*2*tt)
    e = env_ar(n, 0.008, min(0.12, dur*0.5)) * np.exp(-tt*1.5)
    return s * e * gain

def kick(gain=1.0):
    n = int(0.16*SR); tt = np.arange(n)/SR
    f = 95*np.exp(-tt*22) + 38
    return np.sin(np.cumsum(2*np.pi*f/SR)) * np.exp(-tt*17) * gain

rng = np.random.default_rng(7)
def hat(gain=1.0):
    n = int(0.05*SR)
    s = rng.standard_normal(n)
    s = np.diff(np.concatenate([[0], s]))  # crude highpass
    return s * np.exp(-np.arange(n)/SR*90) * gain

# section volumes per element, keyed by bar index (40 bars)
def sect(bar):
    ts = bar * BAR
    if ts < 10:   return dict(pad=0.7, arp=0.55, mel=0.0, bass=0.0, drum=0.0)   # title
    if ts < 20:   return dict(pad=0.8, arp=0.5,  mel=0.5, bass=0.25, drum=0.0)  # dawn
    if ts < 30:   return dict(pad=0.9, arp=0.7,  mel=0.0, bass=0.4, drum=0.3)   # henshin
    if ts < 45:   return dict(pad=0.8, arp=0.5,  mel=0.85, bass=0.6, drum=0.7)  # magic
    if ts < 60:   return dict(pad=0.75, arp=0.45, mel=0.9, bass=0.7, drum=0.85) # battle
    if ts < 75:   return dict(pad=0.85, arp=0.55, mel=0.8, bass=0.55, drum=0.6) # friends
    if ts < 90:   return dict(pad=0.6, arp=0.5,  mel=0.45, bass=0.0, drum=0.0)  # afterglow
    return          dict(pad=0.9, arp=0.6,  mel=0.7, bass=0.4, drum=0.0)        # finale

# ---- pads & bass & drums & arp per bar ----
for bar in range(40):
    ts = bar * BAR
    ch = CHORDS[bar % 4]; root = ROOTS[bar % 4]
    v = sect(bar)
    if v['pad'] > 0:
        for i, m in enumerate(ch):
            add(pad_note(midi_f(m), BAR*1.05), ts, stereo=(i-1.5)*0.3, gain=0.16*v['pad'])
    if v['arp'] > 0:
        seq = [ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3], ch[3]]
        for k, m in enumerate(seq):
            add(bell(midi_f(m+12), 0.9), ts + k*BEAT/2, stereo=np.sin(k*1.3)*0.7, gain=0.10*v['arp'])
    if v['bass'] > 0:
        pat = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] if v['drum'] > 0.5 else [0, 2]
        for b in pat:
            add(bass_note(midi_f(root), 0.45), ts + b*BEAT, gain=0.5*v['bass'])
    if v['drum'] > 0:
        for b in [0, 2]:
            add(kick(), ts + b*BEAT, gain=0.85*v['drum'])
        if v['drum'] > 0.5:
            add(kick(), ts + 3.5*BEAT, gain=0.4*v['drum'])
        for k in range(8):
            add(hat(), ts + k*BEAT/2, stereo=0.6, gain=0.5*v['drum']*(1.0 if k%2==0 else 0.6))

# ---- melody ----
# events: (start_beat_from_10s, dur_beats, midi) ; D major
MEL_A = [  # 8 bars, gentle & singable (dawn: 10-20s)
    (0,1.5,74),(1.5,0.5,73),(2,1,71),(3,1,69),      # D: F#5 E5 D5 B4? -> 74 C#? use D maj tones
    (4,1.5,73),(5.5,0.5,71),(6,2,69),               # A
    (8,1.5,71),(9.5,0.5,74),(10,1,73),(11,1,71),    # Bm
    (12,1.5,69),(13.5,0.5,67),(14,2,66),            # G
    (16,1.5,74),(17.5,0.5,76),(18,1,78),(19,1,76),  # D
    (20,1.5,73),(21.5,0.5,74),(22,2,76),            # A
    (24,1,74),(25,1,73),(26,1,71),(27,1,73),        # Bm
    (28,3,74),                                      # G -> resolve
]
MEL_B = [  # 8 bars, brighter (main/battle)
    (0,0.5,74),(0.5,0.5,76),(1,1,78),(2,1.5,81),(3.5,0.5,79),   # D
    (4,1,78),(5,1,76),(6,2,73),                                  # A
    (8,0.5,71),(8.5,0.5,73),(9,1,74),(10,1.5,78),(11.5,0.5,76),  # Bm
    (12,1,74),(13,1,71),(14,2,69),                               # G
    (16,0.5,74),(16.5,0.5,76),(17,1,78),(18,1.5,81),(19.5,0.5,83),# D
    (20,1,81),(21,1,79),(22,2,78),                               # A
    (24,1,76),(25,1,78),(26,1,79),(27,1,78),                     # Bm
    (28,1.5,76),(29.5,0.5,74),(30,2,74),                         # G
]
MEL_Q = [  # quiet music-box reprise of A (75-90s), up an octave, sparse
    (0,2,86),(2,1,85),(3,1,83),(4,2,81),(6,2,78),
    (8,2,83),(10,1,86),(11,1,85),(12,4,86),
    (16,2,81),(18,1,83),(19,1,85),(20,2,86),(22,2,85),
    (24,4,83),(28,4,86),
]

def play_mel(events, t0, gain, instr='lead'):
    for sb, db, m in events:
        st = t0 + sb*BEAT; du = db*BEAT*0.96
        if instr == 'lead':
            add(lead_note(midi_f(m), du), st, stereo=0.1, gain=0.16*gain)
            add(lead_note(midi_f(m), du), st+0.012, stereo=-0.5, gain=0.05*gain)  # slap-echo width
        else:
            add(bell(midi_f(m), min(du*1.6,2.5)), st, stereo=0.2, gain=0.14*gain)

play_mel(MEL_A, 10.0, 0.9)                 # dawn
play_mel(MEL_B, 30.0, 1.0)                 # magic
play_mel(MEL_B, 50.0, 1.0)                 # battle second half
play_mel(MEL_A, 60.0, 0.95)                # friends: reprise A warmly
play_mel(MEL_Q, 75.0, 0.9, instr='bell')   # afterglow music box
play_mel([(0,2,78),(2,1,76),(3,1,74),(4,4,74)], 90.0, 0.9)  # finale cadence

# transformation riser 20-30: ascending bells
for k in range(24):
    ts = 20 + k*(10/24)
    m = 62 + k  # chromatic-ish rise
    add(bell(midi_f(m), 0.8), ts, stereo=np.sin(k)*0.8, gain=0.06 + 0.004*k)
# sparkle at 27 (reveal flash)
for k, m in enumerate([86, 90, 93, 98]):
    add(bell(midi_f(m), 2.0), 27.0 + k*0.09, stereo=(k-1.5)*0.5, gain=0.12)

# mix: gentle master shaping
mix = np.stack([L, R])
# fade in/out
fi = int(1.5*SR); fo = int(4*SR)
mix[:, :fi] *= np.linspace(0, 1, fi)
mix[:, -fo:] *= np.linspace(1, 0, fo)
# soft clip & normalize
mix = np.tanh(mix * 1.4)
mix /= np.abs(mix).max() * 1.15

data = (mix.T * 32767).astype(np.int16)
with wave.open('op.wav', 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data.tobytes())
print('wrote op.wav', data.shape)
