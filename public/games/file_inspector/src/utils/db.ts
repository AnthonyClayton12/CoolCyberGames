import { DBEntry } from '../types';

const LOCAL_STORAGE_KEY = 'mff_db';

export const getDBEntries = (): DBEntry[] => {
    const storedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedEntries ? JSON.parse(storedEntries) : [];
};

export const saveDBEntries = (entries: DBEntry[]): void => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
};

export const addDBEntry = (entry: DBEntry): void => {
    const entries = getDBEntries();
    entries.push(entry);
    saveDBEntries(entries);
};

export const updateDBEntry = (updatedEntry: DBEntry): void => {
    const entries = getDBEntries().map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
    );
    saveDBEntries(entries);
};

export const deleteDBEntry = (id: string): void => {
    const entries = getDBEntries().filter(entry => entry.id !== id);
    saveDBEntries(entries);
};