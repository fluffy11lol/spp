const PUZZLES = [
  {
    id: 1,
    title: 'Map 1: Web & Networking Basics',
    description: 'Fundamental client-server architecture, sockets and routing concepts.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'SERVER', clue: 'Central program or machine providing resources to clients' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'SOCKET', clue: 'Bidirectional communication endpoint across an IP network' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'ROUTER', clue: 'Hardware or software forwarding packets across networks' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'CPU', clue: 'Central processing unit executing machine instructions' },
      { id: 5, direction: 'down', x: 5, y: 3, text: 'EVENT', clue: 'Action or occurrence detected by software (e.g. click, load)' }
    ]
  },
  {
    id: 2,
    title: 'Map 2: Databases & SQL',
    description: 'Relational data structures, batch processing and secure tokens.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'TABLE', clue: 'Relational structure storing records in rows and columns' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'TOKEN', clue: 'Security credential verifying authenticated identity' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'BATCH', clue: 'Non-interactive execution of grouped data jobs' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'KIT', clue: 'Software development bundle or toolkit' },
      { id: 5, direction: 'down', x: 5, y: 3, text: 'ENTRY', clue: 'Single record or log item inside an audit table' }
    ]
  },
  {
    id: 3,
    title: 'Map 3: Data Structures & Algorithms',
    description: 'Core memory arrangements, variable scopes and indexed collections.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'STACK', clue: 'Last-in first-out (LIFO) abstract data structure' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'SCOPE', clue: 'Context region where variables and functions are visible' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'ARRAY', clue: 'Contiguous memory collection indexed by sequential integers' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'OAR', clue: 'Lever tool used to row a watercraft' },
      { id: 5, direction: 'down', x: 5, y: 3, text: 'KEY', clue: 'Unique identifier used for lookup in a hash map' }
    ]
  },
  {
    id: 4,
    title: 'Map 4: JavaScript Runtime Engine',
    description: 'Asynchronous event loop, V8 engine and node runtime.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'ASYNC', clue: 'Non-blocking concurrent execution pattern in JavaScript' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'ATOM', clue: 'Indivisible operation executed without preemption' },
      { id: 3, direction: 'down', x: 4, y: 3, text: 'NODE', clue: 'Server-side JavaScript runtime built on Chrome V8' },
      { id: 4, direction: 'across', x: 1, y: 4, text: 'TRIO', clue: 'A group or tuple consisting of three items' }
    ]
  },
  {
    id: 5,
    title: 'Map 5: Git & Distributed VCS',
    description: 'Repositories, commits, clone workflows and null references.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'CLONE', clue: 'Command creating an exact local copy of a remote repo' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'COMMIT', clue: 'Permanent snapshot recording repository history changes' },
      { id: 3, direction: 'down', x: 4, y: 3, text: 'NULL', clue: 'Literal representing intentional absence of object reference' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'MAIL', clue: 'Electronic message protocol transmitted over SMTP' }
    ]
  },
  {
    id: 6,
    title: 'Map 6: Security & Cryptography',
    description: 'Cryptographic hashing, salt randomization and network hosts.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'HASH', clue: 'Fixed-size deterministic digest of arbitrary input data' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'HOST', clue: 'Network-connected computer with an assigned IP address' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'SALT', clue: 'Random string appended to password prior to hashing' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'SOLO', clue: 'Single isolated process or execution instance' }
    ]
  },
  {
    id: 7,
    title: 'Map 7: Cloud Infrastructure & DevOps',
    description: 'Immutable images, input streams, automated agents and charts.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'IMAGE', clue: 'Immutable blueprint package used to instantiate containers' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'INPUT', clue: 'Data provided into a pipeline or standard stream' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'AGENT', clue: 'Background daemon running tasks on a cluster node' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'PIE', clue: 'Circular proportional percentage visualizer' }
    ]
  },
  {
    id: 8,
    title: 'Map 8: Operating Systems & Memory',
    description: 'Kernel threading, scheduled tasks, filesystem roots and slots.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'THREAD', clue: 'Lightweight unit of CPU scheduling sharing memory address space' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'TASK', clue: 'Dispatched execution job managed by an OS scheduler' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'ROOT', clue: 'Top-level directory node in Unix filesystem tree' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'SLOT', clue: 'Allocated memory space or hardware expansion interface' }
    ]
  },
  {
    id: 9,
    title: 'Map 9: Frontend Architecture & DOM',
    description: 'HTML5 graphic canvas, markup code and CSS dimensions.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'CANVAS', clue: 'HTML5 element providing programmable 2D/WebGL raster drawing' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'CODE', clue: 'Program source statements written by software engineers' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'NAME', clue: 'Attribute identifying variables, parameters or DOM inputs' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'DIM', clue: 'Visual property representing low luminance or muted state' }
    ]
  },
  {
    id: 10,
    title: 'Map 10: Artificial Intelligence & Logic',
    description: 'Mathematical models, dataset arrays, mesh topologies and sets.',
    gridSize: 10,
    words: [
      { id: 1, direction: 'across', x: 1, y: 3, text: 'MODEL', clue: 'Trained mathematical algorithm evaluating inputs for prediction' },
      { id: 2, direction: 'down', x: 1, y: 3, text: 'MESH', clue: 'Decentralized network topology where nodes interlink directly' },
      { id: 3, direction: 'down', x: 3, y: 3, text: 'DATA', clue: 'Raw unformatted information collected for processing' },
      { id: 4, direction: 'across', x: 1, y: 5, text: 'SET', clue: 'Mathematical collection containing only unique elements' }
    ]
  }
];

function buildPuzzleGrid(puzzle) {
  const cells = {};
  const wordNumberMap = {};
  let currentNum = 1;

  puzzle.words.forEach(w => {
    const key = `${w.x},${w.y}`;
    if (!wordNumberMap[key]) {
      wordNumberMap[key] = currentNum++;
    }
    w.number = wordNumberMap[key];
  });

  puzzle.words.forEach(w => {
    for (let i = 0; i < w.text.length; i++) {
      const cx = w.direction === 'across' ? w.x + i : w.x;
      const cy = w.direction === 'down' ? w.y + i : w.y;
      const key = `${cx},${cy}`;

      if (!cells[key]) {
        cells[key] = {
          key,
          x: cx,
          y: cy,
          solution: w.text[i],
          currentLetter: '',
          isCorrect: false,
          number: wordNumberMap[key] || null,
          words: [],
          version: 1,
          lockedBy: null,
          lockColor: null,
          lockedUntil: 0
        };
      }
      cells[key].words.push({ id: w.id, direction: w.direction, index: i });
    }
  });

  return {
    ...puzzle,
    cells
  };
}

module.exports = {
  PUZZLES,
  buildPuzzleGrid
};
