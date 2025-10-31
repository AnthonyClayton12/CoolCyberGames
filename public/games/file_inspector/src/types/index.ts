export interface FileItem {
    name: string;
    size: number;
    type: string;
    date: string;
    icon: string;
    correct: string;
    explanation: string;
}

export interface DatabaseEntry {
    id: string;
    name: string;
    type: string;
    tag: string;
    note: string;
    size: number;
    date: string;
}