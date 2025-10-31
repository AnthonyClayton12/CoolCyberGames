export const DEFAULT_FILES = [
    {
        name: "invoice.pdf.exe",
        size: 25.0,
        type: "Executable",
        date: "2025-07-28",
        icon: "data:image/svg+xml;base64,...",
        correct: "delete",
        explanation: "Double extension indicating a potential threat."
    },
    {
        name: "report.docx",
        size: 15.0,
        type: "Document",
        date: "2023-10-01",
        icon: "data:image/svg+xml;base64,...",
        correct: "keep",
        explanation: "Safe document file."
    },
    {
        name: "setup.exe",
        size: 50.0,
        type: "Executable",
        date: "2023-09-15",
        icon: "data:image/svg+xml;base64,...",
        correct: "delete",
        explanation: "Executable file that may contain malware."
    },
    {
        name: "image.png",
        size: 5.0,
        type: "Image",
        date: "2023-08-20",
        icon: "data:image/svg+xml;base64,...",
        correct: "keep",
        explanation: "Safe image file."
    },
    {
        name: "script.js",
        size: 10.0,
        type: "Script",
        date: "2023-07-10",
        icon: "data:image/svg+xml;base64,...",
        correct: "delete",
        explanation: "JavaScript file that may contain harmful code."
    }
];