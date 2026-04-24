// Shared components for Code Wizard — pixel companion, code editor,
// Pyodide runner, star badges, celebration overlay.

// ── Pyodide runner ─────────────────────────────────────────────
// Loads Pyodide once, lazily. Calls to runPython() queue until ready.
const pyState = { py: null, loading: null };

window.ensurePyodide = async function () {
  if (pyState.py) return pyState.py;
  if (pyState.loading) return pyState.loading;
  pyState.loading = (async () => {
    if (!window.loadPyodide) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const py = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    pyState.py = py;
    return py;
  })();
  return pyState.loading;
};

// Run python. Returns {ok, stdout, stderr}.
// inputs: array of pre-canned replies for input() calls (we inject a shim).
// Suppress SyntaxWarning noise so escape-sequence warnings in emoticon strings
// don't show up in kids' output.
window.runPython = async function (code, inputs = []) {
  const py = await window.ensurePyodide();
  const pyInputs = JSON.stringify(inputs);
  const wrapped = `
import sys, io, builtins, warnings
warnings.filterwarnings('ignore')
_inputs = ${pyInputs}
_i = [0]
_orig_input = builtins.input
def _fake_input(prompt=''):
    sys.stdout.write(str(prompt))
    if _i[0] < len(_inputs):
        val = _inputs[_i[0]]
        _i[0] += 1
        sys.stdout.write(val + '\\n')
        return val
    sys.stdout.write('\\n')
    return ''
builtins.input = _fake_input
_buf = io.StringIO()
_err = io.StringIO()
sys.stdout = _buf
sys.stderr = _err
try:
    exec(compile(${JSON.stringify(code)}, '<code>', 'exec'), {'__name__':'__main__'})
    _ok = True
except Exception as e:
    import traceback
    _err.write(traceback.format_exc())
    _ok = False
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
builtins.input = _orig_input
(_ok, _buf.getvalue(), _err.getvalue())
`;
  try {
    const result = py.runPython(wrapped);
    const [ok, stdout, stderr] = result.toJs();
    result.destroy && result.destroy();
    return { ok, stdout, stderr };
  } catch (e) {
    return { ok: false, stdout: '', stderr: String(e) };
  }
};

// Interactive run. `askInput(prompt)` returns a Promise<string>.
// `onOutput(text)` is called whenever stdout is written.
// Returns final {ok, stderr}.
window.runPythonInteractive = async function (code, askInput, onOutput) {
  const py = await window.ensurePyodide();
  window.__cwAsk = async (prompt) => {
    const ans = await askInput(String(prompt));
    return String(ans == null ? '' : ans);
  };
  window.__cwOut = (text) => { onOutput(String(text)); };
  const wrapped = `
import sys, io, builtins, js, traceback, warnings
warnings.filterwarnings('ignore')
_cw_ask = js.__cwAsk
_cw_out = js.__cwOut
class _LiveOut:
    def write(self, s):
        if s:
            _cw_out(s)
        return len(s) if s else 0
    def flush(self):
        pass
async def _cw_input(prompt=''):
    s = str(prompt)
    if s:
        _cw_out(s)
    ans = await _cw_ask(s)
    if ans is None:
        ans = ''
    ans = str(ans)
    _cw_out(ans + '\\n')
    return ans

# Transform sync input() calls → await _cw_input() by compiling code as a coroutine body
import ast, textwrap
_src = ${JSON.stringify(code)}
# Wrap user code in an async function body, replacing input(...) with await _cw_input(...)
class _T(ast.NodeTransformer):
    def visit_Call(self, node):
        self.generic_visit(node)
        if isinstance(node.func, ast.Name) and node.func.id == 'input':
            return ast.Await(value=ast.Call(func=ast.Name(id='_cw_input', ctx=ast.Load()), args=node.args, keywords=node.keywords))
        return node
_tree = ast.parse(_src, mode='exec')
_tree = _T().visit(_tree)
ast.fix_missing_locations(_tree)
_async_fn = ast.AsyncFunctionDef(
    name='_cw_main',
    args=ast.arguments(posonlyargs=[], args=[], kwonlyargs=[], kw_defaults=[], defaults=[]),
    body=_tree.body or [ast.Pass()],
    decorator_list=[],
    returns=None,
)
_module = ast.Module(body=[_async_fn], type_ignores=[])
ast.fix_missing_locations(_module)
_ns = {'_cw_input': _cw_input, '__name__':'__main__'}
exec(compile(_module, '<cw>', 'exec'), _ns)
_err_buf = io.StringIO()
_prev_out = sys.stdout
sys.stdout = _LiveOut()
_prev_err = sys.stderr
sys.stderr = _err_buf
try:
    await _ns['_cw_main']()
    _ok = True
except Exception:
    _err_buf.write(traceback.format_exc())
    _ok = False
sys.stdout = _prev_out
sys.stderr = _prev_err
(_ok, _err_buf.getvalue())
`;
  try {
    const result = await py.runPythonAsync(wrapped);
    const [ok, stderr] = result.toJs();
    result.destroy && result.destroy();
    return { ok, stderr };
  } catch (e) {
    return { ok: false, stderr: String(e) };
  } finally {
    delete window.__cwAsk;
    delete window.__cwOut;
  }
};

// ── Pixel companion sprites ────────────────────────────────────
// Tiny pixel-grid drawings, rendered as CSS grids of colored cells.
// Each sprite is a 12x12 grid. '.' = transparent.
// 24×24 sprites — "16-bit era" size. Recognizable silhouettes.
// Palette keys vary per animal.

// OWL — big round body, horn tufts, huge yellow eyes, beak, feet
const OWL_FRAMES = [
  [
    '........................',
    '........................',
    '.......dd......dd.......',
    '......dddd....dddd......',
    '.....dddddddddddddd.....',
    '....dddddddddddddddd....',
    '...dddddddddddddddddd...',
    '..dddddddddddddddddddd..',
    '..ddwwwwddddddddwwwwdd..',
    '..ddwyywwdddddwwyywwdd..',
    '..ddwykwwdddddwwkywwdd..',
    '..ddwwwwddddddddwwwwdd..',
    '..ddddddddyyyyyddddddd..',
    '..dddddddddyyyddddddddd.',
    '..llldddddddddddddddlll.',
    '..lllddlllddddlllldllll.',
    '...dldlllddddllllldldl..',
    '...ddllllllllllllllddd..',
    '....ddddddllllllddddd...',
    '.....dddddddddddddd.....',
    '......ddd......ddd......',
    '......yy........yy......',
    '.....yyy........yyy.....',
    '........................',
  ],
  // blink
  [
    '........................',
    '........................',
    '.......dd......dd.......',
    '......dddd....dddd......',
    '.....dddddddddddddd.....',
    '....dddddddddddddddd....',
    '...dddddddddddddddddd...',
    '..dddddddddddddddddddd..',
    '..ddwwwwddddddddwwwwdd..',
    '..ddkkkkwdddddwkkkkwdd..',
    '..ddwwwwddddddddwwwwdd..',
    '..dddddddddddddddddddd..',
    '..ddddddddyyyyyddddddd..',
    '..dddddddddyyyddddddddd.',
    '..llldddddddddddddddlll.',
    '..lllddlllddddlllldllll.',
    '...dldlllddddllllldldl..',
    '...ddllllllllllllllddd..',
    '....ddddddllllllddddd...',
    '.....dddddddddddddd.....',
    '......ddd......ddd......',
    '......yy........yy......',
    '.....yyy........yyy.....',
    '........................',
  ],
];
const OWL_PALETTE = {
  d: '#a97440',    // dark brown body
  l: '#d9a86a',    // light belly feathers
  w: '#ffffff',    // eye whites
  y: '#ffcf3a',    // yellow beak/feet
  k: '#0f0920',    // pupils
};

// DRAGON — side-profile baby dragon: horn, long snout, neck, wing, tail, feet.
// Silhouette reads dragon, not frog: tall horn + extended snout + bat wing.
const DRAGON_FRAMES = [
  [
    '........................',
    '............rr..........',
    '............rrr.........',
    '...........rrrr.........',
    '......ggggrrrrr.........',
    '.....gggggggggg.........',
    '....gggggggggggg........',
    '...ggggwwggggggg........',
    '...gggwkkwggggggg.......',
    '...ggggwwgggggggg.......',
    '..gggggggggssssgg.......',
    '..ggggggggssnnsggvvv....',
    '...gggggggsssssggvwwv...',
    '....ggggggggggggvwwwv...',
    '.....gggggggggggvwwwvv..',
    '.....gggggggggggvvvvv...',
    '......gggggggggggggg....',
    '.......ggggggggggggggg..',
    '.......ggggggggggrrrgggr',
    '.......ggggggggggrrrgrr.',
    '.......gg.gg.ggggggrr...',
    '.......gg.gg.gg.........',
    '......ygy.ygy.ygy.......',
    '........................',
  ],
  [
    '........................',
    '............rr..........',
    '............rrr.........',
    '...........rrrr.........',
    '......ggggrrrrr.........',
    '.....gggggggggg.........',
    '....gggggggggggg........',
    '...gggggkggggggg........',
    '...ggggkkkggggggg.......',
    '...ggggggggggggg........',
    '..gggggggggssssgg.......',
    '..ggggggggssnnsggvvv....',
    '...gggggggsssssggvwwv...',
    '....ggggggggggggvwwwv...',
    '.....gggggggggggvwwwvv..',
    '.....gggggggggggvvvvv...',
    '......gggggggggggggg....',
    '.......ggggggggggggggg..',
    '.......ggggggggggrrrgggr',
    '.......ggggggggggrrrgrr.',
    '.......gg.gg.ggggggrr...',
    '.......gg.gg.gg.........',
    '......ygy.ygy.ygy.......',
    '........................',
  ],
];
const DRAGON_PALETTE = {
  g: '#3dc15c',    // body bright green
  r: '#2a7a3a',    // horn / tail spikes
  w: '#ffffff',    // eye white / wing highlight
  k: '#0f1a0d',    // pupil
  s: '#ff6a5a',    // snout nostril area
  n: '#b03a3a',    // nostril dot
  v: '#66e088',    // wing edges
  y: '#ffd34a',    // foot claws
};

// CAT — front-facing sitting cat. Triangle ears UP, round face, front paws,
// whiskers, pink triangle nose, tall slit pupils, tail curling to right.
const CAT_FRAMES = [
  [
    '........................',
    '....mm............mm....',
    '...mnnm..........mnnm...',
    '...mnkkm........mkknm...',
    '..mnkkkkm......mkkkknm..',
    '..mnkkkkkmmmmmmkkkkkknm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    '..mkkkkwwwkkkkkkwwwkkkm.',
    '..mkkkkwcwkkkkkkwcwkkkm.',
    '..mkkkkwwwkkkkkkwwwkkkm.',
    'wwmkkkkkkkkkrrrkkkkkkkmww',
    '..mkkkkkkkkrrrkkkkkkkm..',
    '..wwmkkkkkknrnkkkkkkmww.',
    '..mkkkkkkkknnnkkkkkkkkm.',
    '.mkkkkkkkkkkkkkkkkkkkkkm',
    '.mkkkkkkkkkkkkkkkkkkkkkm',
    'mkkkkkkkkkkkkkkkkkkkkkkm',
    'mkkkkkkmmmmmmmmmmkkkkkkm',
    'mkkkkkm..........mkkkkkm',
    'mkkkkkm..........mkkmkmm',
    'mkkkkkm..........mkmmmmm',
    '.mmmmm............mmmmm.',
    '........................',
  ],
  // blink
  [
    '........................',
    '....mm............mm....',
    '...mnnm..........mnnm...',
    '...mnkkm........mkknm...',
    '..mnkkkkm......mkkkknm..',
    '..mnkkkkkmmmmmmkkkkkknm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    '..mkkkkcccckkkkccccckkm.',
    '..mkkkkkkkkkkkkkkkkkkkm.',
    'wwmkkkkkkkkkrrrkkkkkkkmww',
    '..mkkkkkkkkrrrkkkkkkkm..',
    '..wwmkkkkkknrnkkkkkkmww.',
    '..mkkkkkkkknnnkkkkkkkkm.',
    '.mkkkkkkkkkkkkkkkkkkkkkm',
    '.mkkkkkkkkkkkkkkkkkkkkkm',
    'mkkkkkkkkkkkkkkkkkkkkkkm',
    'mkkkkkkmmmmmmmmmmkkkkkkm',
    'mkkkkkm..........mkkkkkm',
    'mkkkkkm..........mkkmkmm',
    'mkkkkkm..........mkmmmmm',
    '.mmmmm............mmmmm.',
    '........................',
  ],
];
const CAT_PALETTE = {
  k: '#b96ed9',    // main purple body
  m: '#5a2577',    // dark purple outline / tail
  n: '#ffb8e8',    // inner ear pink
  w: '#ffffff',    // eye whites / whiskers
  c: '#1a0920',    // pupil (slit)
  r: '#ff8ad0',    // pink nose
};

const COMPANIONS = {
  owl: { name: 'Hoot', frames: OWL_FRAMES, palette: OWL_PALETTE, greet: "Hoo hoo! I'm Hoot. Let's learn magic!" },
  dragon: { name: 'Ember', frames: DRAGON_FRAMES, palette: DRAGON_PALETTE, greet: "Rawr! I'm Ember. Ready to cast code spells?" },
  cat: { name: 'Pixel', frames: CAT_FRAMES, palette: CAT_PALETTE, greet: "Mrow! I'm Pixel. Let's code together!" },
};

const SPRITE_IMAGES = {
  cat: 'sprites/kitty.png',
  owl: 'sprites/owl.png',
  dragon: 'sprites/dragon.png',
};

// Companion brand color for the background glow — uniform pink across all companions
// (higher contrast than each companion's own color; reads as a consistent halo).
const SPRITE_GLOW = {
  cat: 'rgba(100, 80, 180, .45)',
  owl: 'rgba(100, 80, 180, .45)',
  dragon: 'rgba(100, 80, 180, .45)',
};

function PixelSprite({ kind = 'owl', size = 96, animate = true, glow = true }) {
  const src = SPRITE_IMAGES[kind] || SPRITE_IMAGES.owl;
  const glowColor = SPRITE_GLOW[kind] || SPRITE_GLOW.owl;
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: animate ? 'spriteBreathe 3.2s ease-in-out infinite' : 'none',
      backgroundImage: glow ? `radial-gradient(circle at center, ${glowColor} 0%, transparent 65%)` : 'none',
    }}>
      <img
        src={src}
        alt={kind}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.3))',
          position: 'relative',
          zIndex: 1,
        }}
      />
      <style>{`
        @keyframes spriteBreathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

// ── Code editor: monospace textarea with line numbers ────────
function CodeEditor({ value, onChange, rows = 10, theme = 'dark' }) {
  const ref = React.useRef(null);
  const lines = value.split('\n').length;
  const handleKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const nv = value.slice(0, s) + '    ' + value.slice(en);
      onChange(nv);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 4; }, 0);
    }
    // auto-indent after : at end of line
    if (e.key === 'Enter') {
      const ta = e.target;
      const s = ta.selectionStart;
      const before = value.slice(0, s);
      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.slice(lineStart);
      const indentMatch = currentLine.match(/^(\s*)/);
      let indent = indentMatch ? indentMatch[1] : '';
      if (currentLine.trimEnd().endsWith(':')) indent += '    ';
      if (indent) {
        e.preventDefault();
        const nv = value.slice(0, s) + '\n' + indent + value.slice(ta.selectionEnd);
        onChange(nv);
        setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 1 + indent.length; }, 0);
      }
    }
  };
  const bg = theme === 'dark' ? '#0a0420' : '#1a0e2e';
  return (
    <div style={{
      display: 'flex',
      flexShrink: 0,
      background: bg,
      border: '3px solid #ff2e88',
      borderRadius: 0,
      boxShadow: '0 0 0 3px #0a0420, 0 0 24px rgba(255,46,136,.4)',
      fontFamily: "'VT323', 'Courier New', monospace",
      fontSize: 20,
      lineHeight: '24px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 10px 10px 14px',
        color: 'rgba(255,255,255,0.3)',
        userSelect: 'none',
        textAlign: 'right',
        borderRight: '1px solid rgba(255,46,136,0.3)',
        minWidth: 36,
      }}>
        {Array.from({ length: Math.max(rows, lines) }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        spellCheck={false}
        rows={Math.max(rows, lines)}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#e9ffe9',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          padding: '10px 12px',
          resize: 'none',
          caretColor: '#ffec3d',
        }}
      />
    </div>
  );
}

// ── Extract input() prompt strings from Python source ───────
// Returns array of prompt strings (in order of appearance).
// Handles single or double quoted literals inside input(...).
function extractInputPrompts(code) {
  if (!code) return [];
  const prompts = [];
  const re = /input\s*\(\s*(?:(['"])((?:\\.|(?!\1).)*?)\1)?\s*\)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    prompts.push(m[2] != null ? m[2] : '(no prompt)');
  }
  return prompts;
}

// ── Pet Play Window — interactive pop-up for the virtual pet project ──
function PetWindow({ open, code, onClose }) {
  const [lines, setLines] = React.useState([]); // {kind:'out'|'you'|'prompt', text}
  const [input, setInput] = React.useState('');
  const [waiting, setWaiting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [bounce, setBounce] = React.useState(0);
  const [happyUntil, setHappyUntil] = React.useState(0);
  const [actionMood, setActionMood] = React.useState('happy');
  const [now, setNow] = React.useState(Date.now());
  const resolveRef = React.useRef(null);
  const scrollRef = React.useRef(null);

  // Tick while a happy flash is active, so mood re-derives when it expires
  React.useEffect(() => {
    if (now >= happyUntil) return;
    const t = setTimeout(() => setNow(Date.now()), happyUntil - now + 20);
    return () => clearTimeout(t);
  }, [happyUntil, now]);

  // Derive pet mood + emoticon face from current state.
  // During the happy flash window, the mood matches the specific action the kid typed
  // (feed → yum, pet → love, play → bouncy, teach → proud, sleep → zzz, quit → wave).
  const happyActive = now < happyUntil;
  const petMood = done
    ? 'sleep'
    : happyActive
      ? actionMood
      : waiting
        ? 'ask'
        : lines.length === 0 ? 'idle' : 'happy';
  const petFace = {
    idle:  '(\u00b7\u0305\u203f\u00b7\u0305)',           // (·‿·)
    ask:   '(\u2022\u1d25\u2022)?',                       // (•ᴥ•)?
    happy: '(^\u25e1^)/',                                 // (^◡^)/
    feed:  '(*\u00b4\u2207`*)',                           // (*´∇`*)   happy eating
    pet:   '(\u2022\u25cf\u203f\u25cf\u2022)',            // (•●‿●•)   love eyes
    play:  '\\(^\u25bd^)/',                               // \(^▽^)/   bouncy
    teach: '(\u0298\u203f\u0298)\u2728',                  // (ʘ‿ʘ)✨   proud
    sleep: '(-_-) zZ',                                    // sleeping
    wave:  '(o/^_^)/',                                    // waving goodbye
  }[petMood];
  const petColor = {
    idle: '#4fff70', ask: '#ffec3d',
    happy: '#ff7ac0',
    feed: '#4fff70', pet: '#ff7ac0', play: '#ffec3d', teach: '#b66ad9',
    sleep: '#b0a8d0', wave: '#ff7ac0',
  }[petMood];

  React.useEffect(() => {
    if (!open) return;
    setLines([]); setDone(false); setInput(''); setWaiting(false);
    let buf = '';
    const flushBuf = (kind = 'out') => {
      if (!buf) return;
      const parts = buf.split('\n');
      setLines(prev => {
        const next = [...prev];
        parts.forEach((p, i) => {
          if (i === 0 && next.length && next[next.length - 1].kind === kind) {
            next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + p };
          } else if (p !== '' || i < parts.length - 1) {
            next.push({ kind, text: p });
          }
        });
        return next;
      });
      buf = '';
    };
    const onOutput = (s) => {
      buf += s;
      if (buf.includes('\n')) flushBuf('out');
    };
    const askInput = (prompt) => {
      flushBuf('out');
      setWaiting(true);
      return new Promise((res) => { resolveRef.current = res; });
    };
    (async () => {
      const r = await window.runPythonInteractive(code, askInput, onOutput);
      flushBuf('out');
      if (!r.ok && r.stderr) {
        setLines(prev => [...prev, { kind: 'err', text: r.stderr.trim().split('\n').slice(-1)[0] }]);
      }
      setDone(true);
    })();
  }, [open, code]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setBounce(b => b + 1);
  }, [lines, waiting]);

  const submitInput = () => {
    if (!waiting) return;
    const val = input;
    setLines(prev => [...prev, { kind: 'you', text: val }]);
    setInput(''); setWaiting(false);
    // Pick a mood based on what the kid typed — each known action gets its own face.
    const v = val.trim().toLowerCase();
    let mood = 'happy';
    if (/^(feed|eat|food|snack|treat)/.test(v)) mood = 'feed';
    else if (/^(pet|cuddle|hug|love|scratch)/.test(v)) mood = 'pet';
    else if (/^(play|jump|bounce|run|fetch|dance)/.test(v)) mood = 'play';
    else if (/^(teach|learn|trick|train|study)/.test(v)) mood = 'teach';
    else if (/^(sleep|nap|rest|bed|dream)/.test(v)) mood = 'sleep';
    else if (/^(quit|bye|goodbye|exit|stop|leave)/.test(v)) mood = 'wave';
    setActionMood(mood);
    const until = Date.now() + 2200;
    setHappyUntil(until); setNow(Date.now());
    resolveRef.current && resolveRef.current(val);
    resolveRef.current = null;
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'rgba(10,4,32,.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 520, maxHeight: '90%',
        background: '#0a0420',
        border: '4px solid #ff2e88',
        boxShadow: '0 0 0 4px #050114, 0 0 40px rgba(255,46,136,.5)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "var(--cw-body-font, 'Nunito', sans-serif)",
      }}>
        <div style={{
          padding: '10px 14px',
          background: 'linear-gradient(to bottom, #ff2e88, #b66ad9)',
          borderBottom: '3px solid #0a0420',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: '#ffec3d', letterSpacing: 2 }}>
            ★ PET PLAY WINDOW ★
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            background: '#0a0420', color: '#fff', border: '2px solid #fff',
            padding: '3px 10px', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace", fontSize: 10,
          }}>✕ CLOSE</button>
        </div>
        {/* Emoticon pet — top center, reacts to state */}
        <div style={{
          padding: '28px 14px 22px',
          background: 'radial-gradient(ellipse at center, rgba(255,46,136,.15), transparent 70%), #0a0420',
          borderBottom: '3px solid #1a0a3a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          minHeight: 110,
        }}>
          <div
            key={bounce}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 28,
              color: petColor,
              textShadow: `0 0 12px ${petColor}, 2px 2px 0 #0a0420`,
              letterSpacing: 1,
              animation: 'petPop 0.4s ease-out',
              lineHeight: 1.6,
              padding: '2px 0',
            }}
          >
            {petFace}
          </div>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#b0a8d0',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {petMood === 'idle' && '· booting up ·'}
            {petMood === 'ask' && '· waiting for you ·'}
            {petMood === 'happy' && '· playing ·'}
            {petMood === 'feed' && '· yum yum ·'}
            {petMood === 'pet' && '· so loved ·'}
            {petMood === 'play' && '· bouncing ·'}
            {petMood === 'teach' && '· learning ·'}
            {petMood === 'wave' && '· bye! ·'}
            {petMood === 'sleep' && '· zzz ·'}
          </div>
        </div>
        <style>{`
          @keyframes petPop {
            0% { transform: scale(0.85) translateY(-4px); }
            60% { transform: scale(1.1) translateY(0); }
            100% { transform: scale(1) translateY(0); }
          }
        `}</style>
        <div ref={scrollRef} className="cw-scroll" style={{
          flex: 1, overflow: 'auto', padding: '14px 18px',
          minHeight: 220, maxHeight: 360,
          background: '#001a00',
          fontFamily: "'Courier New', monospace", fontSize: 16,
          lineHeight: '22px',
          color: '#4fff70',
        }}>
          {lines.map((l, i) => {
            if (l.kind === 'you') return <div key={i} style={{ color: '#ffec3d' }}>▸ {l.text}</div>;
            if (l.kind === 'err') return <div key={i} style={{ color: '#ff6b6b' }}>⚠ {l.text}</div>;
            return <div key={i} style={{ color: '#4fff70', whiteSpace: 'pre-wrap' }}>{l.text}</div>;
          })}
          {done && !waiting && (
            <div style={{ marginTop: 10, color: '#b0a8d0', fontStyle: 'italic', fontSize: 14 }}>
              — your pet went to sleep. Close and RUN again to play more! —
            </div>
          )}
        </div>
        {/* Fixed input footer — always visible, never scrolls away */}
        {waiting && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: '#002600',
            borderTop: '3px solid #4fff70',
            fontFamily: "'Courier New', monospace", fontSize: 16,
          }}>
            <span style={{ color: '#ffec3d', fontWeight: 'bold' }}>▸</span>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitInput(); }}
              placeholder="type here…"
              style={{
                flex: 1, minWidth: 0,
                background: '#001a00', border: '2px solid #ffec3d',
                color: '#ffec3d',
                fontFamily: 'inherit', fontSize: 'inherit', outline: 'none',
                padding: '6px 10px',
              }}
            />
            <button onClick={submitInput} style={{
              background: '#ffec3d', color: '#0a0420', border: '2px solid #0a0420',
              padding: '7px 14px', cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace", fontSize: 10,
              flexShrink: 0,
            }}>OK ↵</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Friendly error translator ─────────────────────────────────
// Takes a raw Python traceback string and returns:
//   { title, tip, line } — a kid-friendly explanation + optional line number
// Keep tone warm. Suggest a concrete thing to check.
function friendlyError(stderr, code = '') {
  if (!stderr) return null;
  const s = stderr;
  // Try to extract line number from "line N"
  const lineMatch = s.match(/line (\d+)/);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : null;

  // Unterminated / missing quote
  if (/unterminated string literal|EOL while scanning string literal/i.test(s)) {
    return { icon: '🔤', title: 'Missing quote!', tip: "A word is missing its closing ' or \". Strings need quotes on BOTH sides. Like: 'hello' — not just 'hello", line };
  }
  // Missing closing paren/bracket
  if (/'\(' was never closed|unexpected EOF while parsing|was never closed/i.test(s)) {
    return { icon: '🔒', title: 'Missing ) or ]', tip: "You opened a ( but didn't close it. Every ( needs a matching ). Count them!", line };
  }
  // Missing colon (expected ':')
  if (/expected ':'/i.test(s)) {
    return { icon: '❗', title: 'Missing the : (colon)', tip: "Lines that start with if, else, for, while, or def need a : at the END. Like: if x == 1:", line };
  }
  // Indentation error
  if (/IndentationError: expected an indented block/i.test(s)) {
    return { icon: '⬅️', title: 'Need to indent!', tip: "After if/else/for/def with a :, the next line needs 4 spaces at the start (TAB works too).", line };
  }
  if (/IndentationError|unexpected indent/i.test(s)) {
    return { icon: '🎯', title: 'Spacing problem', tip: "Python cares about spaces at the start of a line. Match the indent of other lines in the same block — 4 spaces or a TAB.", line };
  }
  // Name not defined
  const nameMatch = s.match(/NameError: name ['"]([^'"]+)['"] is not defined/);
  if (nameMatch) {
    const n = nameMatch[1];
    const tip = /print|input|range|len|int|str/.test(n)
      ? `The word "${n}" is a Python spell — maybe it's misspelled? Check the capital letters too!`
      : `Python doesn't know "${n}" yet. Did you forget quotes around a word? Strings need 'quotes': '${n}'. Or maybe you forgot to make a variable first.`;
    return { icon: '❓', title: `What is "${n}"?`, tip, line };
  }
  // Syntax error — generic
  if (/SyntaxError: invalid syntax/i.test(s)) {
    return { icon: '🧩', title: 'Something in the code isn\'t quite right', tip: "Check for a missing ), quote, or : at the end of a line. Read line by line carefully — compare with the TYPE THIS example!", line };
  }
  if (/SyntaxError: f-string|SyntaxError: cannot assign/i.test(s)) {
    return { icon: '🧩', title: 'Syntax mix-up', tip: 'Re-read the line — something is in a spot Python wasn\'t expecting. Compare with the example above!', line };
  }
  // TypeError (e.g. str + int)
  if (/TypeError: can only concatenate str.*int|unsupported operand type.*str.*int/i.test(s)) {
    return { icon: '🧪', title: "Can't mix words and numbers", tip: "You used + to add a word and a number together. Wrap the number in str(number), like: 'I am ' + str(7)", line };
  }
  if (/TypeError/i.test(s)) {
    return { icon: '🧪', title: 'Wrong type of thing', tip: "Python got a word where it expected a number (or the other way around). Check what's inside your () and + signs.", line };
  }
  // ZeroDivisionError
  if (/ZeroDivisionError/i.test(s)) {
    return { icon: '➗', title: "Can't divide by zero!", tip: "Dividing by 0 breaks math. Use a number bigger than 0 on the right of /.", line };
  }
  // Index / Key
  if (/IndexError/i.test(s)) {
    return { icon: '📏', title: 'That item doesn\'t exist', tip: "You tried to grab an item from a list that doesn't have that many. Remember lists start at 0!", line };
  }
  // EOFError (input with no answer)
  if (/EOFError/i.test(s)) {
    return { icon: '⌨️', title: 'Need an answer for input()', tip: "Your code asks a question with input(), but there's no answer given. Type an answer in the ANSWERS box below the code, then RUN again.", line };
  }
  // Generic fallback — try to grab the last non-empty line
  const lines = s.trim().split('\n').filter(l => l.trim().length > 0);
  const last = lines[lines.length - 1] || 'Unknown error';
  return { icon: '🐛', title: 'Oops, a small bug', tip: last.length > 140 ? last.slice(0, 140) + '…' : last, line };
}

// ── Error popup — friendly modal over the code ──────────────
function ErrorPopup({ error, onClose }) {
  if (!error) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(10,4,32,.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'popIn .25s ease',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff',
        color: '#0a0420',
        border: '4px solid #ff6b6b',
        boxShadow: '0 0 0 4px #0a0420, 0 12px 0 rgba(0,0,0,.4)',
        padding: '22px 24px 20px',
        maxWidth: 460,
        fontFamily: "var(--cw-body-font, 'Nunito', system-ui, sans-serif)",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{error.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 11, color: '#ff2e88', letterSpacing: 2, marginBottom: 4,
            }}>
              OOPS!
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {error.title}
            </div>
            {error.line && (
              <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                (check around line {error.line})
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.35, marginBottom: 16, color: '#2a1a40' }}>
          {error.tip}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <PixelButton onClick={onClose} color="#4fff70">
            TRY AGAIN
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

// ── Output console ─────────────────────────────────────────────
function OutputConsole({ state, onShowError }) {
  // state: { status: 'idle'|'running'|'done'|'error', stdout, stderr }
  const bg = '#001a00';
  const hasError = state.status === 'error';
  const color = hasError ? '#ff6b6b' : '#4fff70';
  const friendly = hasError ? friendlyError(state.stderr) : null;
  return (
    <div style={{
      background: bg,
      border: `3px solid ${hasError ? '#ff6b6b' : '#4fff70'}`,
      boxShadow: `0 0 0 3px #0a0420, 0 0 24px ${hasError ? 'rgba(255,107,107,.4)' : 'rgba(79,255,112,.3)'}`,
      fontFamily: "'Courier New', monospace",
      fontSize: 15,
      lineHeight: '20px',
      padding: '10px 14px',
      color,
      minHeight: 80,
      flexShrink: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: 0.9, fontSize: 12, letterSpacing: 1, marginBottom: 6,
        fontFamily: "'Press Start 2P', monospace",
      }}>
        <span>▸ OUTPUT {state.status === 'running' && '· running…'}</span>
        {hasError && friendly && (
          <button onClick={() => onShowError && onShowError(friendly)} style={{
            marginLeft: 'auto',
            background: '#ff6b6b', color: '#fff',
            border: 'none', padding: '4px 10px',
            fontFamily: "'Press Start 2P', monospace", fontSize: 10,
            letterSpacing: 1, cursor: 'pointer',
          }}>
            ❓ WHAT HAPPENED?
          </button>
        )}
      </div>
      {state.status === 'idle' && <span style={{ opacity: 0.5, fontFamily: "var(--cw-body-font, sans-serif)", fontSize: 16 }}>Click RUN to cast your spell ✨</span>}
      {state.stdout && <span>{state.stdout}</span>}
      {hasError && friendly && (
        <div style={{ marginTop: 4, color: '#ffb0b0', fontFamily: "var(--cw-body-font, sans-serif)", fontSize: 16 }}>
          {friendly.icon} <strong>{friendly.title}</strong> — {friendly.tip}
        </div>
      )}
      {state.stderr && !friendly && <span style={{ color: '#ff6b6b' }}>{state.stderr}</span>}
    </div>
  );
}

// ── Pixel button ───────────────────────────────────────────────
function PixelButton({ children, onClick, color = '#ffec3d', textColor = '#0a0420', disabled, size = 'md', style }) {
  const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 20px';
  const fs = size === 'sm' ? 11 : size === 'lg' ? 16 : 13;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color,
        color: textColor,
        border: 'none',
        padding: pad,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: fs,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: `inset -3px -3px 0 rgba(0,0,0,.3), inset 3px 3px 0 rgba(255,255,255,.3), 0 4px 0 rgba(0,0,0,.4)`,
        transition: 'transform .05s',
        letterSpacing: 1,
        textShadow: 'none',
        ...style,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(2px)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {children}
    </button>
  );
}

// ── Star badge ─────────────────────────────────────────────────
function StarBadge({ filled, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ filter: filled ? 'drop-shadow(0 0 6px #ffec3d)' : 'none' }}>
      <path d="M12 2 L14.6 8.5 L21.5 9 L16.3 13.6 L18 20.3 L12 16.7 L6 20.3 L7.7 13.6 L2.5 9 L9.4 8.5 Z"
        fill={filled ? '#ffec3d' : 'rgba(255,255,255,0.15)'}
        stroke={filled ? '#ff9a00' : 'rgba(255,255,255,0.3)'}
        strokeWidth="1.5" />
    </svg>
  );
}

// ── Celebration sound (chiptune arpeggio via Web Audio API) ────
function playLevelUpSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    // Resume in case it's suspended (autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // Classic "you did it!" arpeggio: C5 E5 G5 C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const t = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';           // chiptune voice
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
    // Sparkle tail: high C two octaves up, quick shimmer
    const tailStart = now + notes.length * 0.09 + 0.02;
    const tailOsc = ctx.createOscillator();
    const tailGain = ctx.createGain();
    tailOsc.type = 'triangle';
    tailOsc.frequency.setValueAtTime(1568, tailStart);         // G6
    tailOsc.frequency.exponentialRampToValueAtTime(2093, tailStart + 0.35); // C7
    tailGain.gain.setValueAtTime(0, tailStart);
    tailGain.gain.linearRampToValueAtTime(0.12, tailStart + 0.02);
    tailGain.gain.exponentialRampToValueAtTime(0.001, tailStart + 0.5);
    tailOsc.connect(tailGain).connect(ctx.destination);
    tailOsc.start(tailStart);
    tailOsc.stop(tailStart + 0.55);
    // Auto-close context after sound finishes so we don't leak
    setTimeout(() => { try { ctx.close(); } catch {} }, 1200);
  } catch (e) { /* audio is non-critical */ }
}

// ── Celebration overlay ────────────────────────────────────────
function Celebration({ show, onDone, noBadge, silent }) {
  React.useEffect(() => {
    if (!show) return;
    if (!silent) playLevelUpSound();
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [show, onDone, silent]);
  if (!show) return null;
  const bits = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 20, overflow: 'hidden',
    }}>
      {bits.map(i => {
        const left = 10 + Math.random() * 80;
        const delay = Math.random() * 0.3;
        const dur = 1.2 + Math.random() * 0.5;
        const hue = [0, 60, 180, 300][i % 4];
        const size = 10 + Math.random() * 8;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${left}%`, top: '-20px',
            width: size, height: size,
            background: `hsl(${hue}, 100%, 60%)`,
            animation: `confettiFall ${dur}s ${delay}s linear forwards`,
            boxShadow: `0 0 6px hsl(${hue}, 100%, 60%)`,
          }} />
        );
      })}
      {!noBadge && <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'popIn .4s ease',
      }}>
        <div style={{
          background: '#ffec3d',
          padding: '20px 36px',
          border: '4px solid #0a0420',
          boxShadow: '0 0 0 4px #ff2e88, 0 8px 0 rgba(0,0,0,.4)',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 24,
          color: '#0a0420',
          letterSpacing: 2,
          transform: 'rotate(-3deg)',
        }}>
          LEVEL UP!
        </div>
      </div>}
    </div>
  );
}

// Inject celebration styles once
if (typeof document !== 'undefined' && !document.getElementById('cw-anim-styles')) {
  const s = document.createElement('style');
  s.id = 'cw-anim-styles';
  s.textContent = `
    @keyframes confettiFall {
      to { transform: translateY(120vh) rotate(720deg); opacity: 0; }
    }
    @keyframes popIn {
      0% { transform: scale(0) rotate(-20deg); opacity: 0; }
      60% { transform: scale(1.2) rotate(-3deg); opacity: 1; }
      100% { transform: scale(1) rotate(-3deg); opacity: 1; }
    }
    @keyframes pixelFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 12px rgba(255,236,61,.5), 0 0 0 3px #ff2e88; }
      50% { box-shadow: 0 0 24px rgba(255,236,61,.9), 0 0 0 3px #ff2e88; }
    }
    @keyframes scanlines {
      0% { background-position: 0 0; }
      100% { background-position: 0 4px; }
    }
    .cw-scanlines::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        to bottom,
        rgba(0,0,0,0) 0px,
        rgba(0,0,0,0) 2px,
        rgba(0,0,0,.15) 2px,
        rgba(0,0,0,.15) 4px
      );
      z-index: 100;
      mix-blend-mode: multiply;
    }
    .cw-crt-flicker {
      animation: crtFlicker 3s infinite;
    }
    @keyframes crtFlicker {
      0%, 95%, 100% { opacity: 1; }
      97% { opacity: 0.92; }
    }
  `;
  document.head.appendChild(s);
}

// ── Speech bubble ──────────────────────────────────────────────
function SpeechBubble({ children, dir = 'left', color = '#fff', textColor = '#0a0420' }) {
  return (
    <div style={{
      position: 'relative',
      background: color,
      color: textColor,
      padding: '14px 18px',
      border: '3px solid #0a0420',
      boxShadow: '0 4px 0 rgba(0,0,0,.4)',
      fontFamily: "var(--cw-body-font, 'Nunito', system-ui, sans-serif)",
      fontWeight: 600,
      fontSize: 18,
      lineHeight: '24px',
      maxWidth: 360,
    }}>
      {children}
      <div style={{
        position: 'absolute',
        [dir]: 20,
        bottom: -14,
        width: 0, height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: `14px solid ${color}`,
      }} />
      <div style={{
        position: 'absolute',
        [dir]: 17,
        bottom: -18,
        width: 0, height: 0,
        borderLeft: '13px solid transparent',
        borderRight: '13px solid transparent',
        borderTop: `17px solid #0a0420`,
        zIndex: -1,
      }} />
    </div>
  );
}

// ── Template block — shows reference code above the editor ──
function TemplateBlock({ code }) {
  const [copied, setCopied] = React.useState(false);
  if (!code) return null;
  const copy = () => {
    try { navigator.clipboard.writeText(code); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div style={{
      background: 'rgba(255, 236, 61, 0.08)',
      border: '2px dashed #ffec3d',
      padding: '8px 12px 10px',
      marginBottom: 8,
      position: 'relative',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9, color: '#ffec3d', letterSpacing: 1,
        }}>
          ▸ TYPE THIS (don't copy — type every letter!)
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={copy} style={{
          background: copied ? '#4fff70' : 'rgba(255,236,61,0.15)',
          color: copied ? '#0a0420' : '#ffec3d',
          border: `1px solid ${copied ? '#4fff70' : '#ffec3d'}`,
          padding: '2px 8px', fontSize: 11, cursor: 'pointer',
          fontFamily: "'Press Start 2P', monospace", letterSpacing: 1,
        }}>
          {copied ? 'OK!' : 'COPY'}
        </button>
      </div>
      <pre className="cw-scroll cw-scroll-yellow" style={{
        margin: 0,
        fontFamily: "'Courier New', monospace",
        fontSize: 15,
        lineHeight: '20px',
        color: '#ffec3d',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 140,
        overflow: 'auto',
      }}>{code}</pre>
    </div>
  );
}

// ── StarField — twinkling decorative pixel stars behind title/name/pick screens ──
function StarField({ count = 40 }) {
  const stars = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 3,
        duration: 1.8 + Math.random() * 2.4,
        color: ['#ffec3d', '#ff7ac0', '#b66ad9', '#fff'][Math.floor(Math.random() * 4)],
      });
    }
    return arr;
  }, [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size,
          background: s.color,
          boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
          animation: `cwTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes cwTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, {
  PixelSprite, CodeEditor, OutputConsole, PixelButton, StarBadge, Celebration, SpeechBubble,
  TemplateBlock, ErrorPopup, friendlyError, extractInputPrompts, PetWindow,
  COMPANIONS, StarField,
});
