export const BEGINNER_LEVEL = {
  id: 'beginner-1',
  title: 'Beginner: Common file types',
  intro:
    "Welcome to your first challenge! Some files are totally fine, others hide dangers. Read the file names carefully and decide which are safe to open.",
  tip:
    "Nice work! If a file tries to *look* like something else (.pdf.exe), that’s your first red flag.",
  files: [
    {
      name: 'readme.txt',
      sizeKB: 4,
      correct: 'safe',
      facts: [
        "Plain text — cannot run code.",
        "Great for notes and instructions."
      ],
    },
    {
      name: 'photo.jpg',
      sizeKB: 245,
      correct: 'safe',
    facts: [
        "📸 Just a good ol’ photo — can’t run code, only memories.",
        "If someone says ‘open this update.jpg’, that’s sus. Images aren’t installers."
    ],

    },
    {
      name: 'screenshot.png',
      sizeKB: 512,
      correct: 'safe',
      facts: [
          "📷 Just a screenshot — can’t run code, only captures.",
          "If someone says ‘open this screenshot.png’, that’s sus. Images aren’t installers."
      ],
    },
    {
      name: 'invoice.pdf',
      sizeKB: 128,
      correct: 'safe',
      facts: [
    "📄 PDFs are read-only most of the time — no macros, no scripts.",
    "Just don’t click links inside shady PDFs. Phishers love those."
    ],
    },
    {
      name: 'report.docm',
      sizeKB: 96,
      correct: 'suspicious',
        facts: [
    "🧩 Macro-enabled Word doc — can actually *run* code when opened.",
    "Macros aren’t always bad, but hackers use them a lot to sneak malware in."
    ],
    },
    {
      name: 'numbers.xlsm',
      sizeKB: 110,
      correct: 'suspicious',
      facts: [
    "📊 Excel sheets with .xlsm can run macros.",
    "Spreadsheets shouldn’t need code unless you’re doing something fancy — be careful."
    ],
    },
    {
      name: 'readme.pdf.exe',
      sizeKB: 4300,
      correct: 'suspicious',
      facts: [
    "😈 Double extension trick! Looks like a PDF, acts like an EXE.",
    "If it ends with .exe, it’s a program — never open it unless you trust the source 100%."
    ],
    },
    {
      name: 'funny-cat-video.mp4',
      sizeKB: 15400,
      correct: 'safe',
      facts: [
    "😸 Video file — harmless to download and play.",
    "If a ‘video’ wants you to install a codec first, that’s when you run!"
    ],
    },
    {
      name: 'downloads.zip',
      sizeKB: 20480,
      correct: 'suspicious',
      facts: [
    "🧱 ZIP files are containers — could hide scripts, installers, or who-knows-what.",
    "Never unzip random stuff from strangers. Malware loves compression."
    ],
    },
    {
      name: 'setup-installer.bat',
      sizeKB: 18,
      correct: 'suspicious',
      facts: [
    "⚙️ Batch script — tells Windows to execute commands directly.",
    "One double-click can change system settings or download more files."
    ],
    },
    {
      name: 'deploy.ps1',
      sizeKB: 12,
      correct: 'suspicious',
      facts: [
    "💻 PowerShell script — basically programmer-level control over Windows.",
    "Used in IT automation… and in cyberattacks. Handle with caution."
    ],
    },
    {
      name: 'shortcut.lnk',
      sizeKB: 4,
      correct: 'suspicious',
      facts: [
    "🎯 Shortcut file — points to something else, possibly an executable.",
    "A shortcut can look harmless but lead to danger — always check its target."
    ],
    },
    {
      name: 'photo.jpg.scr',
      sizeKB: 380,
      correct: 'suspicious',
      facts: [
        "😈 Double extension trick! Looks like an image, acts like a screensaver.",
        "If it ends with .scr, it’s a program — never open it unless you trust the source 100%."
      ],
    },
  ],
};
