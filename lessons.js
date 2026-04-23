// Lesson data for Code Wizard — shared by both variations.
// Each lesson has:
//   story:    what the companion explains
//   template: the EXAMPLE code, shown above the editor as read-only reference
//   starter:  what pre-fills the code editor — kept MINIMAL (just a comment)
//             so the kid has to type the whole thing themselves.
//   goal:     the specific challenge
//   check:    inspects (code, output) and returns true/false

window.LESSONS = [
  {
    id: 'hello',
    title: 'Level 1 · The Talking Spell',
    concept: 'print()',
    teaser: 'Make the computer say something!',
    story: "Every wizard's first spell is print(). It makes the computer SPEAK. Whatever you put inside the () appears like magic!",
    template: "print('hello world')",
    hint: "Don't forget the quotes '...' around your word, and the ( ) around everything!",
    starter: "",
    goal: "Use print() to make the computer say any word.",
    check: (code, out) => /\bprint\s*\(/.test(code) && out.trim().length > 0 && !out.toLowerCase().includes('error'),
  },
  {
    id: 'strings',
    title: 'Level 2 · Word Potions',
    concept: 'strings',
    teaser: 'Words in Python are called strings.',
    story: "Words go inside 'quotes'. You can even ADD strings together with + to make longer words. Like mixing potions!",
    template: "print('dra' + 'gon')",
    hint: "Two words in quotes, glued with a + sign.",
    starter: "",
    goal: "Print a word at least 5 letters long by adding two strings with +.",
    check: (code, out) => {
      const cleaned = out.trim();
      return cleaned.length >= 5 && code.includes('+') && /['"]/.test(code) && !out.toLowerCase().includes('error');
    },
  },
  {
    id: 'variables',
    title: 'Level 3 · Memory Crystals',
    concept: 'variables',
    teaser: 'Save stuff in a box with a name.',
    story: "A variable is a magic box with a NAME. You put something in, and Python remembers it. Like: pet = 'dragon'",
    template: "name = 'Alex'\nprint(name)",
    hint: "Pick a name on the left of =, a word in quotes on the right. Then print the name (no quotes).",
    starter: "",
    goal: "Make a variable and print its value.",
    check: (code, out) => /\w+\s*=\s*['"][^'"]+['"]/.test(code) && /\bprint\s*\(/.test(code) && out.trim().length > 0 && !out.toLowerCase().includes('error'),
  },
  {
    id: 'numbers',
    title: 'Level 4 · Number Magic',
    concept: 'numbers & math',
    teaser: 'Python is a calculator too!',
    story: "Python can do math! Use + - * / . Try print(2 + 2). Numbers don't need quotes.",
    template: "print(10 * 5)",
    hint: "Numbers have NO quotes. Use *  for times, + for plus, - for minus.",
    starter: "",
    goal: "Print a number BIGGER than 20 using math.",
    check: (code, out) => {
      const n = parseFloat(out.trim());
      return !isNaN(n) && n > 20 && /[+\-*/]/.test(code) && /\bprint\s*\(/.test(code);
    },
  },
  {
    id: 'input',
    title: 'Level 5 · The Asking Spell',
    concept: 'input()',
    teaser: 'Ask the user a question!',
    story: "input() is a spell that ASKS a question. Whatever the user types comes back to you. Save it in a variable!",
    template: "color = input('Favorite color? ')\nprint('Cool, ' + color)",
    hint: "Put input('question? ') on the right of =, a name on the left. Then print something using that name.",
    starter: "",
    goal: "Use input() to ask something, and print() to reply.",
    check: (code, out) => /\binput\s*\(/.test(code) && /\bprint\s*\(/.test(code),
  },
  {
    id: 'ifelse',
    title: 'Level 6 · The Choosing Spell',
    concept: 'if / else',
    teaser: 'Make the computer decide!',
    story: "if lets the computer CHOOSE. IF something is true, do this, ELSE do something different. Use == to compare.",
    template: "pet = 'cat'\nif pet == 'cat':\n    print('meow')\nelse:\n    print('woof')",
    hint: "Don't forget the : at the end of if and else. Indent the next line with 4 spaces!",
    starter: "",
    goal: "Use if AND else. Print something either way.",
    check: (code, out) => /\bif\b/.test(code) && /\belse\b/.test(code) && /\bprint\s*\(/.test(code) && out.trim().length > 0,
  },
  {
    id: 'loops',
    title: 'Level 7 · The Repeat Spell',
    concept: 'for loops',
    teaser: 'Do something over and over.',
    story: "for loops REPEAT. 'for i in range(5)' runs 5 times. Great for making lots of something!",
    template: "for i in range(3):\n    print('star')",
    hint: "for <name> in range(<number>): and indent the next line 4 spaces.",
    starter: "",
    goal: "Print something at least 3 times using a for loop.",
    check: (code, out) => {
      const lines = out.trim().split('\n').filter(l => l.length > 0);
      return /\bfor\b/.test(code) && /range\s*\(/.test(code) && lines.length >= 3;
    },
  },
  {
    id: 'functions',
    title: 'Level 8 · Your Own Spells',
    concept: 'functions',
    teaser: 'Make your own spell!',
    story: "A function is a spell YOU invent. Use def to make one. Then call it by its name!",
    template: "def greet(name):\n    print('Hi ' + name)\ngreet('Sam')",
    hint: "def <name>(<slot>): on one line, indent 4 spaces, then CALL it like name('...').",
    starter: "",
    goal: "Define a function with def and call it (make it print something).",
    check: (code, out) => /\bdef\s+\w+\s*\(/.test(code) && out.trim().length > 0 && !out.toLowerCase().includes('error'),
  },
  {
    id: 'project',
    title: 'Level 9 · Your First Pet!',
    concept: 'PROJECT',
    teaser: 'Put it ALL together.',
    story: "Time to build YOUR OWN virtual pet! Your pet lives in the OUTPUT box — it's a TEXT pet (no picture). Use input() to ask the player what to name it and what to do with it (feed, play, sleep). Use if/elif/else to print a different reaction for each choice. Run your code and watch your pet come alive in the output!",
    template: `pet = input("Name your pet: ")
print(pet + " appears! (^_^)")

action = input("What do you do? ")

if action == "feed":
    print(pet + " munches! *nom nom*")
elif action == "play":
    print(pet + " bounces! :D")
elif action == "sleep":
    print(pet + " curls up. zZz")
else:
    print(pet + " tilts its head. ???")`,
    hint: "This one is BIG! Take it slow, type carefully, and copy the pattern. Then make it YOURS — add more actions, change the messages!",
    starter: "",
    goal: "Build the pet: use input() + if/elif/else + print(). Run it and play!",
    check: (code, out) => /\binput\s*\(/.test(code) && /\bif\b/.test(code) && /\bprint\s*\(/.test(code) && out.trim().length > 0,
  },
  {
    id: 'boss',
    isBoss: true,
    title: 'LEVEL 10 · FINAL BOSS · Your Pet Game!',
    concept: 'BOSS LEVEL',
    teaser: 'Design a REAL game. Make it yours.',
    story: "This is IT — the Final Boss. You're going to build a full pet game with a forever loop so the player can feed, play, and talk to your pet AGAIN and AGAIN. Pick the actions you want, give your pet a face, type the code, and RUN IT. When it works, you're a CERTIFIED PYTHON WIZARD.",
    // The template is assembled from chip picks — see bossTemplate() below.
    template: null,
    hint: "Pick 3+ actions from the chips. Each action needs its own elif block. Remember: while True: keeps the game going until the player types 'quit'.",
    starter: "",
    goal: "Build a pet game with while + if/elif + 3+ actions. Run it!",
    check: (code, out) => {
      const hasLoop = /\bwhile\b/.test(code);
      const hasIf = /\bif\b/.test(code);
      const hasElif = (code.match(/\belif\b/g) || []).length >= 2;
      const hasInput = /\binput\s*\(/.test(code);
      return hasLoop && hasIf && hasElif && hasInput && out.trim().length > 0 && !out.toLowerCase().includes('error');
    },
  },
];

// ── Boss template assembler ───────────────────────────────────
// Given a pet name and a list of action ids, produces a Python program
// with a while-True loop + if/elif/else for each action + a sensible
// emoticon reaction. Called from the Boss level UI when chips change.
window.BOSS_ACTIONS = [
  { id: 'feed',  label: 'feed',  face: '(*\u00b4\u25bd\uff40*)',  msg: 'munches happily!' },   // (*´▽`*)
  { id: 'play',  label: 'play',  face: '\\(^\u25bd^)/',           msg: 'bounces around!' },     // \(^▽^)/
  { id: 'pet',   label: 'pet',   face: '(\u2022\u1d25\u2022)',    msg: 'purrs softly...' },    // (•ᴥ•)
  { id: 'talk',  label: 'talk',  face: '(o_O)?',                   msg: 'tilts its head.' },
  { id: 'sleep', label: 'sleep', face: '(-_-) zZ',                 msg: 'curls up and snores.' },
  { id: 'sing',  label: 'sing',  face: '\u266a(\u25cf\u02d8\u25bd\u02d8\u25cf)\u266a', msg: 'hums a silly tune!' }, // ♪(●˘▽˘●)♪
  { id: 'teach', label: 'teach', face: '(\u0ca0_\u0ca0)\u2728',   msg: 'learns a new trick!' }, // (ಠ_ಠ)✨
  { id: 'hug',   label: 'hug',   face: '(\u3065 \uff40\u25bf\u00b4)\u3065', msg: 'hugs you back!' }, // (づ｀▿´)づ
];

window.buildBossTemplate = function (petName, selectedIds) {
  const acts = window.BOSS_ACTIONS.filter(a => selectedIds.includes(a.id));
  if (acts.length === 0) return `# Pick some actions from the chips above!`;
  const name = petName || 'pet';
  const lines = [];
  lines.push(`# ${name.toUpperCase()}'s adventure!`);
  lines.push(`pet = "${name}"`);
  // Use r"..." raw strings so emoticons like \(^▽^)/ don't trigger SyntaxWarning
  lines.push(`print(pet + r" appears! (^_^)")`);
  lines.push(``);
  lines.push(`while True:`);
  lines.push(`    action = input("What do you do? ")`);
  lines.push(``);
  lines.push(`    if action == "quit":`);
  lines.push(`        print(pet + r" waves goodbye! (o/^_^)/")`);
  lines.push(`        break`);
  acts.forEach((a, i) => {
    lines.push(`    elif action == "${a.id}":`);
    lines.push(`        print(pet + r" ${a.msg} ${a.face}")`);
  });
  lines.push(`    else:`);
  lines.push(`        print(pet + r" doesn't know that one! ???")`);
  return lines.join('\n');
};
