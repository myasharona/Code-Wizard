// Variation 2: Arcade Cabinet
// One screen at a time, like an old arcade game.
// Title screen → Level 1 → Level 2 → … → Final project → Victory.
// More immersive single-focus experience. Includes a CRT bezel feel.

function ArcadeCabinet({ companion = 'owl', kidName = '', onNameChange, onCompanionChange, scanlines = true }) {
  const lessons = window.LESSONS;
  // screen: 'title' | 'pick' | 'name' | number (level idx) | 'victory'
  const [screen, setScreen] = React.useState('title');
  const [stars, setStars] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('cw.ac.stars') || '{}'); } catch { return {}; }
  });
  const [celebrate, setCelebrate] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('cw.ac.stars', JSON.stringify(stars));
  }, [stars]);

  const award = (id) => {
    if (stars[id]) return;
    setStars(s => ({ ...s, [id]: true }));
    setCelebrate(true);
  };

  const totalStars = Object.values(stars).filter(Boolean).length;
  const comp = COMPANIONS[companion];

  return (
    <div
      className={scanlines ? 'cw-scanlines' : ''}
      style={{
        width: 900,
        height: 960,
        background: '#050114',
        position: 'relative',
        fontFamily: "var(--cw-body-font, 'Nunito', system-ui, sans-serif)",
        color: '#fff',
        overflow: 'hidden',
        border: '12px solid #1a0e2e',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8), 0 0 0 4px #0a0420',
      }}
    >
      {/* Marquee */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 22px',
        background: 'linear-gradient(to bottom, #ff2e88, #b66ad9)',
        borderBottom: '3px solid #0a0420',
        display: 'flex', alignItems: 'center', gap: 14, zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 14, letterSpacing: 2, color: '#ffec3d',
          textShadow: '2px 2px 0 #0a0420',
        }}>
          ★ CODE WIZARD ★
        </div>
        <div style={{ flex: 1 }} />
        <select
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') return;
            if (v === 'all') {
              const all = {};
              lessons.forEach(l => { all[l.id] = true; });
              setStars(all);
              setScreen(lessons.length - 1);
            } else if (v === 'title') {
              setScreen('title');
            } else {
              setScreen(parseInt(v, 10));
            }
          }}
          title="Dev: jump to level"
          style={{
            background: 'transparent', color: '#ffec3d',
            border: '2px dashed rgba(255,236,61,.5)', padding: '4px 6px',
            fontFamily: "'Press Start 2P', monospace", fontSize: 9,
            marginRight: 10, cursor: 'pointer',
          }}
        >
          <option value="" style={{ color: '#000' }}>⚡ JUMP…</option>
          <option value="title" style={{ color: '#000' }}>Title</option>
          {lessons.map((l, i) => (
            <option key={l.id} value={i} style={{ color: '#000' }}>Lvl {i + 1}: {l.concept}</option>
          ))}
          <option value="all" style={{ color: '#000' }}>Unlock All + Final</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {lessons.map((l, i) => (
            <StarBadge key={l.id} filled={!!stars[l.id]} size={16} />
          ))}
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, marginLeft: 8, color: '#ffec3d' }}>
            {totalStars}/{lessons.length}
          </span>
        </div>
      </div>

      <div style={{ position: 'absolute', inset: '56px 0 0 0' }}>
        {screen === 'title' && <TitleScreen companion={companion} onStart={() => setScreen('pick')} />}
        {screen === 'pick' && (
          <PickScreen
            companion={companion}
            onPick={onCompanionChange || (() => {})}
            onContinue={() => setScreen('name')}
          />
        )}
        {screen === 'name' && (
          <NameScreen companion={companion} kidName={kidName} onNameChange={onNameChange} onContinue={() => setScreen(0)} />
        )}
        {typeof screen === 'number' && (
          lessons[screen].isBoss ? (
            <BossLevelScreen
              lesson={lessons[screen]}
              index={screen}
              total={lessons.length}
              companion={companion}
              kidName={kidName}
              starred={!!stars[lessons[screen].id]}
              onComplete={() => award(lessons[screen].id)}
              onNext={() => screen + 1 < lessons.length ? setScreen(screen + 1) : setScreen('victory')}
              onPrev={() => screen > 0 ? setScreen(screen - 1) : setScreen('name')}
            />
          ) : (
            <LevelScreen
              lesson={lessons[screen]}
              index={screen}
              total={lessons.length}
              companion={companion}
              kidName={kidName}
              starred={!!stars[lessons[screen].id]}
              onComplete={() => award(lessons[screen].id)}
              onNext={() => screen + 1 < lessons.length ? setScreen(screen + 1) : setScreen('victory')}
              onPrev={() => screen > 0 ? setScreen(screen - 1) : setScreen('name')}
            />
          )
        )}
        {screen === 'victory' && <VictoryScreen kidName={kidName} companion={companion} onReplay={() => setScreen(0)} />}
      </div>

      <Celebration show={celebrate} onDone={() => setCelebrate(false)} />
    </div>
  );
}

function TitleScreen({ companion, onStart }) {
  const [blink, setBlink] = React.useState(true);
  React.useEffect(() => {
    const i = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(i);
  }, []);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Enter' || e.key === ' ') onStart(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onStart]);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      backgroundImage: `
        radial-gradient(ellipse at center, rgba(255,46,136,.25), transparent 60%),
        linear-gradient(to bottom, #0a0420, #05020f)
      `,
    }}>
      <StarField />
      <div style={{
        animation: 'pixelFloat 2s ease-in-out infinite',
        filter: 'drop-shadow(0 0 24px rgba(255,46,136,.8))',
      }}>
        <PixelSprite kind={companion} size={340} animate />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 44, color: '#ffec3d',
        letterSpacing: 4,
        textShadow: '4px 4px 0 #ff2e88, 8px 8px 0 #0a0420',
        textAlign: 'center',
      }}>
        CODE<br/>WIZARD
      </div>
      <div style={{ fontSize: 24, color: '#4fff70', marginTop: -4 }}>
        ~ learn real Python ~
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 14, color: blink ? '#fff' : 'transparent',
        marginTop: 20, letterSpacing: 2,
        cursor: 'pointer',
      }} onClick={onStart}>
        PRESS START
      </div>
      <PixelButton onClick={onStart} color="#ff2e88" textColor="#fff" size="lg">
        ▶ INSERT COIN
      </PixelButton>
      <button
        onClick={() => {
          if (confirm('Start over from the beginning?\n\n(This clears all stars, the saved name, and the companion choice.)')) {
            try {
              localStorage.removeItem('cw.ac.stars');
              localStorage.removeItem('cw.name');
              localStorage.removeItem('cw.companion');
              localStorage.removeItem('cw.sq.picked');
              localStorage.removeItem('cw.sq.stars');
            } catch (e) {}
            window.location.reload();
          }
        }}
        style={{
          marginTop: 18,
          background: 'transparent',
          color: 'rgba(255,255,255,.4)',
          border: '1px solid rgba(255,255,255,.25)',
          padding: '6px 14px',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9, letterSpacing: 1.5,
          cursor: 'pointer',
          position: 'relative', zIndex: 2,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = '#ff6b6b'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)'; }}
      >
        ↻ RESET PROGRESS
      </button>
    </div>
  );
}

function PickScreen({ companion, onPick, onContinue }) {
  const keys = ['owl', 'dragon', 'cat'];
  return (
    <div style={{
      height: '100%', padding: '30px 40px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <StarField />
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 16,
        color: '#ffec3d', letterSpacing: 2, textAlign: 'center',
        textShadow: '3px 3px 0 #ff2e88', position: 'relative', zIndex: 2,
      }}>
        CHOOSE YOUR COMPANION
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 9,
        color: '#b0a8d0', letterSpacing: 1.5, textAlign: 'center',
        position: 'relative', zIndex: 2, marginTop: -10,
      }}>
        they'll be your guide through every level
      </div>
      <div style={{ display: 'flex', gap: 20, position: 'relative', zIndex: 2, marginTop: 10 }}>
        {keys.map((k) => {
          const c = COMPANIONS[k];
          const picked = companion === k;
          return (
            <button
              key={k}
              onClick={() => onPick(k)}
              style={{
                background: picked ? 'rgba(255,46,136,.18)' : 'rgba(10,4,32,.6)',
                border: `4px solid ${picked ? '#ffec3d' : '#ff2e88'}`,
                boxShadow: picked
                  ? '0 0 0 4px #0a0420, 0 0 32px rgba(255,236,61,.6)'
                  : '0 0 0 4px #0a0420',
                padding: '18px 14px 14px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                width: 180,
                transition: 'all 0.15s',
                transform: picked ? 'translateY(-4px)' : 'none',
              }}
            >
              <div style={{ animation: picked ? 'pixelFloat 2s ease-in-out infinite' : 'none' }}>
                <PixelSprite kind={k} size={120} animate={picked} />
              </div>
              <div style={{
                fontFamily: "'Press Start 2P', monospace", fontSize: 12,
                color: picked ? '#ffec3d' : '#fff', letterSpacing: 1,
              }}>
                {c.name}
              </div>
              <div style={{
                fontSize: 11, color: '#b0a8d0', textAlign: 'center',
                lineHeight: 1.4, minHeight: 30,
                fontFamily: "var(--cw-body-font, 'Nunito', sans-serif)",
              }}>
                {k === 'owl' && 'Wise · calm · loves patterns'}
                {k === 'dragon' && 'Bold · fiery · loves big loops'}
                {k === 'cat' && 'Curious · playful · loves tricks'}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
        <PixelButton onClick={onContinue} color="#4fff70" textColor="#0a0420" size="lg">
          THAT'S MY FRIEND ▸
        </PixelButton>
      </div>
    </div>
  );
}

function NameScreen({ companion, kidName, onNameChange, onContinue }) {
  const comp = COMPANIONS[companion];
  return (
    <div style={{
      height: '100%', padding: 40,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <StarField />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, position: 'relative', zIndex: 2 }}>
        <div style={{ animation: 'pixelFloat 2.5s ease-in-out infinite' }}>
          <PixelSprite kind={companion} size={260} animate />
        </div>
        <div style={{ paddingBottom: 30 }}>
          <SpeechBubble color="#ffec3d">
            Hi! I'm {comp.name}.<br/>What's YOUR name, wizard?
          </SpeechBubble>
        </div>
      </div>
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: '#4fff70', letterSpacing: 2 }}>
          ENTER NAME:
        </div>
        <input
          type="text"
          value={kidName}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={14}
          onKeyDown={(e) => e.key === 'Enter' && kidName && onContinue()}
          autoFocus
          style={{
            background: '#0a0420', color: '#ffec3d',
            border: '3px solid #4fff70',
            boxShadow: '0 0 0 3px #0a0420, 0 0 24px rgba(79,255,112,.5)',
            padding: '14px 20px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 20, letterSpacing: 2,
            textAlign: 'center',
            width: 320,
            outline: 'none',
            textTransform: 'uppercase',
          }}
        />
        <PixelButton onClick={onContinue} color={kidName ? '#ff2e88' : '#555'} textColor="#fff" disabled={!kidName} size="lg">
          START QUEST ▸
        </PixelButton>
      </div>
    </div>
  );
}

function LevelScreen({ lesson, index, total, companion, kidName, starred, onComplete, onNext, onPrev }) {
  const [code, setCode] = React.useState(lesson.starter);
  const [out, setOut] = React.useState({ status: 'idle', stdout: '', stderr: '' });
  const [showStory, setShowStory] = React.useState(true);
  const [showHint, setShowHint] = React.useState(false);
  const [pendingInputs, setPendingInputs] = React.useState([]);
  const [errorShown, setErrorShown] = React.useState(null);
  const [ranButNotGoal, setRanButNotGoal] = React.useState(false);

  React.useEffect(() => {
    setCode(lesson.starter);
    setOut({ status: 'idle', stdout: '', stderr: '' });
    setShowStory(true);
    setShowHint(false);
    setPendingInputs([]);
    setErrorShown(null);
    setRanButNotGoal(false);
  }, [lesson.id]);

  const [showPetWindow, setShowPetWindow] = React.useState(false);
  const needsInput = code.includes('input(') || (lesson.template && lesson.template.includes('input('));

  const run = async () => {
    setOut({ status: 'running', stdout: '', stderr: '' });
    const inputs = needsInput ? pendingInputs : [];
    const r = await window.runPython(code, inputs);
    setOut({ status: r.ok ? 'done' : 'error', stdout: r.stdout, stderr: r.stderr });
    if (!r.ok && r.stderr) {
      const friendly = window.friendlyError(r.stderr, code);
      if (friendly) setErrorShown(friendly);
    }
    if (r.ok && lesson.check(code, r.stdout)) {
      setRanButNotGoal(false);
      setTimeout(() => onComplete(), 400);
    } else if (r.ok) {
      // Code ran fine but didn't meet the lesson goal
      setRanButNotGoal(true);
    }
  };

  if (showStory) {
    return (
      <div style={{ height: '100%', padding: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12, color: '#ff2e88', letterSpacing: 2,
        }}>
          LEVEL {index + 1} / {total}
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 22, color: '#ffec3d', lineHeight: 1.3,
          textShadow: '3px 3px 0 #0a0420',
        }}>
          {lesson.title}
        </div>
        <div style={{ fontSize: 26, color: '#4fff70' }}>
          {lesson.teaser}
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ flexShrink: 0, animation: 'pixelFloat 2.5s ease-in-out infinite' }}>
            <PixelSprite kind={companion} size={220} animate />
          </div>
          <div style={{ flex: 1, paddingBottom: 30 }}>
            <SpeechBubble color="#fff">
              {lesson.story}
            </SpeechBubble>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 20 }}>
          <PixelButton onClick={onPrev} color="#555" textColor="#fff" size="sm">◂ BACK</PixelButton>
          <PixelButton onClick={() => setShowStory(false)} color="#ff2e88" textColor="#fff" size="lg">
            TRY IT ▸
          </PixelButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flexShrink: 0 }}>
          <PixelSprite kind={companion} size={96} animate />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ff2e88', letterSpacing: 2 }}>
            LVL {index + 1}/{total} · {lesson.concept.toUpperCase()}
          </div>
          <div style={{ fontSize: 20, color: '#fff' }}>{lesson.title.replace(/^Level \d+ · |^Final Quest · /, '')}</div>
        </div>
        <PixelButton onClick={() => setShowStory(true)} color="#b66ad9" textColor="#fff" size="sm">STORY</PixelButton>
      </div>

      {/* Goal */}
      <div style={{
        background: '#ffec3d', color: '#0a0420',
        padding: '6px 12px',
        border: '2px solid #0a0420',
        fontSize: 17, display: 'flex', gap: 8,
      }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9 }}>GOAL ▸</span>
        <span>{lesson.goal}</span>
      </div>

      {/* Template to copy */}
      <TemplateBlock code={lesson.template} />

      {/* Editor */}
      <CodeEditor value={code} onChange={setCode} rows={Math.max(5, code.split('\n').length)} />

      {/* Input panel */}
      {needsInput && (() => {
        const prompts = window.extractInputPrompts(code);
        return (
          <div style={{ padding: '8px 12px', background: 'rgba(79,255,112,.08)', border: '2px dashed #4fff70' }}>
            <div style={{ fontSize: 11, color: '#4fff70', marginBottom: 6, fontFamily: "'Press Start 2P', monospace", letterSpacing: 1 }}>
              ▸ YOUR ANSWERS (pretend you're the player!)
            </div>
            <div style={{ fontSize: 13, color: '#9affb0', marginBottom: 8, fontStyle: 'italic' }}>
              Your code ASKS questions with input(). Type what you'd answer, then hit RUN.
            </div>
            {prompts.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#ffec3d', fontFamily: "'Courier New', monospace", fontSize: 14, minWidth: 20 }}>
                  {i + 1}.
                </span>
                <span style={{ color: '#9affb0', fontFamily: "'Courier New', monospace", fontSize: 14, flex: '0 0 auto' }}>
                  {p}
                </span>
                <input
                  type="text"
                  value={pendingInputs[i] || ''}
                  placeholder="your answer…"
                  onChange={(e) => {
                    const next = [...pendingInputs];
                    next[i] = e.target.value;
                    setPendingInputs(next);
                  }}
                  style={{
                    flex: 1, background: '#0a0420', color: '#4fff70',
                    border: '1px solid #4fff70', padding: '4px 8px',
                    fontFamily: "'Courier New', monospace", fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        );
      })()}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <PixelButton onClick={run} color="#4fff70">▶ RUN</PixelButton>
        {needsInput && (
          <PixelButton onClick={() => setShowPetWindow(true)} color="#ff2e88" textColor="#fff">
            🎮 PLAY LIVE
          </PixelButton>
        )}
        <PixelButton onClick={() => setCode(lesson.starter)} color="#b66ad9" textColor="#fff" size="sm">RESET</PixelButton>
        <PixelButton onClick={() => setShowHint(v => !v)} color="#ffec3d" size="sm">HINT?</PixelButton>
        <div style={{ flex: 1 }} />
        {starred && (
          <PixelButton onClick={onNext} color="#ff2e88" textColor="#fff">
            {index + 1 < total ? 'NEXT ▸' : 'FINISH ★'}
          </PixelButton>
        )}
      </div>

      {showHint && (
        <div style={{
          padding: 8,
          background: 'rgba(255,236,61,.08)',
          border: '1px dashed #ffec3d',
          color: '#ffec3d',
          fontFamily: "'Courier New', monospace", fontSize: 15,
          whiteSpace: 'pre-wrap',
        }}>
          💡 {lesson.hint}
        </div>
      )}

      {/* Output */}
      <OutputConsole state={out} onShowError={setErrorShown} />
      {ranButNotGoal && out.status === 'done' && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          background: 'rgba(255,236,61,.15)',
          border: '2px dashed #ffec3d',
          color: '#ffec3d',
          fontFamily: "var(--cw-body-font, sans-serif)",
          fontSize: 14,
        }}>
          💡 Your code ran! But it didn't match the <strong>goal</strong> yet. Re-read the GOAL above and tweak your code.
        </div>
      )}
      <ErrorPopup error={errorShown} onClose={() => setErrorShown(null)} />
      <PetWindow open={showPetWindow} code={code} onClose={() => setShowPetWindow(false)} />

      {/* Nav */}
      <div style={{ display: 'flex', gap: 8 }}>
        <PixelButton onClick={onPrev} color="#555" textColor="#fff" size="sm">◂ BACK</PixelButton>
        <div style={{ flex: 1 }} />
        {!starred && index > 0 && (
          <PixelButton onClick={onNext} color="#333" textColor="#888" size="sm">SKIP ▸</PixelButton>
        )}
      </div>
    </div>
  );
}

function VictoryScreen({ kidName, companion, onReplay }) {
  const [now, setNow] = React.useState(() => new Date());
  const [confetti, setConfetti] = React.useState(true);
  const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div style={{
      height: '100%', padding: 30,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      backgroundImage: `radial-gradient(ellipse at center, rgba(255,236,61,.3), transparent 60%), linear-gradient(to bottom, #0a0420, #05020f)`,
      overflow: 'auto',
    }}>
      <StarField />
      <Celebration show={confetti} noBadge onDone={() => setConfetti(false)} />
      <div style={{ display: 'flex', gap: 14, zIndex: 2 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ animation: `pixelFloat 1.5s ease-in-out ${i*0.15}s infinite` }}>
            <StarBadge filled size={44} />
          </div>
        ))}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 26, color: '#ffec3d',
        letterSpacing: 3, textAlign: 'center',
        textShadow: '3px 3px 0 #ff2e88, 6px 6px 0 #0a0420',
        zIndex: 2,
      }}>
        CHAMPION!
      </div>
      {/* Certificate */}
      <div style={{
        zIndex: 2,
        background: 'linear-gradient(to bottom, #fff9e0, #ffebbf)',
        color: '#0a0420',
        border: '6px double #8a5a0a',
        boxShadow: '0 0 0 3px #0a0420, 0 12px 0 rgba(0,0,0,.5), 0 0 40px rgba(255,236,61,.4)',
        padding: '22px 30px',
        width: 560,
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10, letterSpacing: 3, color: '#8a5a0a', marginBottom: 4,
        }}>
          ★  OFFICIAL CERTIFICATE  ★
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 18, color: '#ff2e88', letterSpacing: 2,
          textShadow: '2px 2px 0 rgba(0,0,0,.15)',
          marginBottom: 10,
        }}>
          CERTIFIED PYTHON WIZARD
        </div>
        <div style={{ fontSize: 16, color: '#4a3410', marginBottom: 6, fontStyle: 'italic' }}>
          This certifies that
        </div>
        <div style={{
          fontSize: 30, fontWeight: 800, color: '#0a0420',
          letterSpacing: 1, marginBottom: 6,
          textTransform: 'uppercase',
          borderBottom: '2px solid #8a5a0a',
          paddingBottom: 6, display: 'inline-block', minWidth: 280,
        }}>
          {kidName || 'Wizard'}
        </div>
        <div style={{ fontSize: 15, color: '#4a3410', lineHeight: 1.4, margin: '10px 8px' }}>
          has completed all 10 levels of the Code Wizard quest,
          cast real Python spells, defeated the Final Boss,
          and built their own virtual pet game.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#8a5a0a', letterSpacing: 1 }}>DATE</div>
            <div style={{ fontSize: 13, color: '#0a0420' }}>{dateStr}</div>
          </div>
          <div style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
            <PixelSprite kind={companion} size={100} animate />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#8a5a0a', letterSpacing: 1 }}>LEVELS</div>
            <div style={{ fontSize: 13, color: '#0a0420' }}>10 / 10 ★</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, zIndex: 2 }}>
        <PixelButton onClick={() => window.print()} color="#ffec3d" size="sm">🖨 PRINT</PixelButton>
        <PixelButton onClick={onReplay} color="#ff2e88" textColor="#fff" size="sm">PLAY AGAIN</PixelButton>
      </div>
    </div>
  );
}

function BossLevelScreen({ lesson, index, total, companion, kidName, starred, onComplete, onNext, onPrev }) {
  // Phase: 'story' | 'build' | 'code'
  const [phase, setPhase] = React.useState('story');
  const [petName, setPetName] = React.useState(kidName ? kidName + "'s Pet" : 'Zap');
  const [picked, setPicked] = React.useState(['feed', 'play', 'sleep']);
  const [code, setCode] = React.useState('');
  const [out, setOut] = React.useState({ status: 'idle', stdout: '', stderr: '' });
  const [showPetWindow, setShowPetWindow] = React.useState(false);
  const [errorShown, setErrorShown] = React.useState(null);
  const [showHint, setShowHint] = React.useState(false);
  const [hasPlayed, setHasPlayed] = React.useState(false);

  // Regenerate the template when picks change (only while in build phase)
  const template = React.useMemo(
    () => window.buildBossTemplate(petName, picked),
    [petName, picked]
  );

  const onStartCoding = () => {
    setCode(template);
    setPhase('code');
  };

  const togglePick = (id) => {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const run = async () => {
    setOut({ status: 'running', stdout: '', stderr: '' });
    const r = await window.runPython(code, ['quit']); // sim: type quit to exit
    setOut({ status: r.ok ? 'done' : 'error', stdout: r.stdout, stderr: r.stderr });
    if (!r.ok && r.stderr) {
      const friendly = window.friendlyError(r.stderr, code);
      if (friendly) setErrorShown(friendly);
    }
  };

  const playLive = () => { setShowPetWindow(true); setHasPlayed(true); };

  // After first live play, check the goal & award
  React.useEffect(() => {
    if (!hasPlayed || starred) return;
    // Try running once to validate structure (static check on code only)
    if (lesson.check(code, 'ok')) {
      setTimeout(() => onComplete(), 500);
    }
  }, [hasPlayed, code]);

  // ═════════ PHASE: STORY ═════════
  if (phase === 'story') {
    return (
      <div style={{ height: '100%', padding: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <StarField />
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12, color: '#ff2e88', letterSpacing: 2, zIndex: 2,
        }}>
          ⚠ FINAL BOSS ⚠ LEVEL {index + 1} / {total}
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 22, color: '#ffec3d', lineHeight: 1.3,
          textShadow: '3px 3px 0 #ff2e88, 6px 6px 0 #0a0420',
          zIndex: 2,
        }}>
          {lesson.title}
        </div>
        <div style={{ fontSize: 26, color: '#4fff70', zIndex: 2 }}>
          {lesson.teaser}
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', marginTop: 10, zIndex: 2 }}>
          <div style={{ flexShrink: 0, animation: 'pixelFloat 2.5s ease-in-out infinite' }}>
            <PixelSprite kind={companion} size={220} animate />
          </div>
          <div style={{ flex: 1, paddingBottom: 30 }}>
            <SpeechBubble color="#fff">
              {lesson.story}
            </SpeechBubble>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 20, zIndex: 2 }}>
          <PixelButton onClick={onPrev} color="#555" textColor="#fff" size="sm">◂ BACK</PixelButton>
          <PixelButton onClick={() => setPhase('build')} color="#ff2e88" textColor="#fff" size="lg">
            START BUILDING ▸
          </PixelButton>
        </div>
      </div>
    );
  }

  // ═════════ PHASE: BUILD (pick chips) ═════════
  if (phase === 'build') {
    return (
      <div style={{ height: '100%', padding: '14px 24px 18px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <PixelSprite kind={companion} size={80} animate />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ff2e88', letterSpacing: 2 }}>
              BOSS BUILDER · STEP 1
            </div>
            <div style={{ fontSize: 20, color: '#fff' }}>Design YOUR pet</div>
          </div>
        </div>

        {/* Name input */}
        <div style={{
          background: 'rgba(255,236,61,.08)', border: '2px dashed #ffec3d',
          padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffec3d', letterSpacing: 1 }}>
            PET NAME ▸
          </span>
          <input
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={18}
            style={{
              flex: 1, background: '#0a0420', color: '#ffec3d',
              border: '1px solid #ffec3d', padding: '6px 10px',
              fontFamily: "'Courier New', monospace", fontSize: 17,
              outline: 'none',
            }}
          />
        </div>

        {/* Action chips */}
        <div style={{
          background: 'rgba(79,255,112,.08)', border: '2px dashed #4fff70',
          padding: '10px 14px',
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#4fff70',
            letterSpacing: 1, marginBottom: 4,
          }}>
            PICK YOUR PET'S ACTIONS ▸ (tap to add/remove)
          </div>
          <div style={{ fontSize: 13, color: '#9affb0', marginBottom: 10, fontStyle: 'italic' }}>
            Pick at least 3. Each one becomes an elif in your code!
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {window.BOSS_ACTIONS.map(a => {
              const active = picked.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => togglePick(a.id)}
                  style={{
                    background: active ? '#4fff70' : 'transparent',
                    color: active ? '#0a0420' : '#4fff70',
                    border: '2px solid #4fff70',
                    padding: '6px 12px',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 10, letterSpacing: 1,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span>{a.label.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 13 }}>{a.face}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: '#ffec3d' }}>
            {picked.length < 3 ? `Pick ${3 - picked.length} more…` : `Nice! ${picked.length} actions selected.`}
          </div>
        </div>

        {/* Live code preview */}
        <div style={{ flexShrink: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ff2e88',
            letterSpacing: 1, marginBottom: 6,
          }}>
            ▸ YOUR CODE WILL LOOK LIKE THIS: <span style={{ color: '#b0a8d0', fontSize: 8 }}>(scroll to see all)</span>
          </div>
          <pre style={{
            margin: 0,
            background: '#0a0420',
            border: '2px solid #ff2e88',
            padding: '10px 14px',
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            lineHeight: '16px',
            color: '#e9ffe9',
            whiteSpace: 'pre-wrap',
            maxHeight: 160,
            overflow: 'auto',
          }}>{template}</pre>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 'auto' }}>
          <PixelButton onClick={() => setPhase('story')} color="#555" textColor="#fff" size="sm">◂ BACK</PixelButton>
          <PixelButton
            onClick={onStartCoding}
            color={picked.length >= 3 ? '#ff2e88' : '#555'}
            textColor="#fff"
            size="lg"
            disabled={picked.length < 3}
          >
            TYPE THE CODE ▸
          </PixelButton>
        </div>
      </div>
    );
  }

  // ═════════ PHASE: CODE (editor + play live) ═════════
  return (
    <div style={{ height: '100%', padding: '12px 24px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <PixelSprite kind={companion} size={72} animate />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ff2e88', letterSpacing: 2 }}>
            ⚠ FINAL BOSS · STEP 2
          </div>
          <div style={{ fontSize: 18, color: '#fff' }}>Type + run your game</div>
        </div>
        <PixelButton onClick={() => setPhase('build')} color="#b66ad9" textColor="#fff" size="sm">⟲ REBUILD</PixelButton>
      </div>

      <div style={{
        background: '#ffec3d', color: '#0a0420',
        padding: '6px 12px', border: '2px solid #0a0420',
        fontSize: 14, display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9 }}>GOAL ▸</span>
        <span>{lesson.goal}</span>
      </div>

      {/* Template + editor: side-by-side in a scrollable middle region */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        <div style={{ maxHeight: 140, overflow: 'auto', flexShrink: 0 }}>
          <TemplateBlock code={template} />
        </div>
        <div className="cw-scroll" style={{ maxHeight: 340, overflow: 'auto' }}>
          <CodeEditor value={code} onChange={setCode} rows={Math.min(14, Math.max(10, code.split('\n').length))} />
        </div>
        {showHint && (
          <div style={{
            padding: 8, background: 'rgba(255,236,61,.08)',
            border: '1px dashed #ffec3d', color: '#ffec3d',
            fontFamily: "'Courier New', monospace", fontSize: 14,
          }}>
            💡 {lesson.hint}
          </div>
        )}
        <OutputConsole state={out} onShowError={setErrorShown} />
      </div>

      {/* Pinned control bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, borderTop: '2px solid rgba(255,46,136,.3)', paddingTop: 8 }}>
        <PixelButton onClick={onPrev} color="#555" textColor="#fff" size="sm">◂ BACK</PixelButton>
        <PixelButton onClick={run} color="#4fff70">▶ RUN</PixelButton>
        <PixelButton onClick={playLive} color="#ff2e88" textColor="#fff">🎮 PLAY LIVE</PixelButton>
        <PixelButton onClick={() => setCode(template)} color="#b66ad9" textColor="#fff" size="sm">RESET</PixelButton>
        <PixelButton onClick={() => setShowHint(v => !v)} color="#ffec3d" size="sm">HINT?</PixelButton>
        <div style={{ flex: 1 }} />
        {starred && (
          <PixelButton onClick={onNext} color="#ff2e88" textColor="#fff">FINISH ★</PixelButton>
        )}
      </div>

      <ErrorPopup error={errorShown} onClose={() => setErrorShown(null)} />
      <PetWindow open={showPetWindow} code={code} onClose={() => setShowPetWindow(false)} />
    </div>
  );
}

window.ArcadeCabinet = ArcadeCabinet;
