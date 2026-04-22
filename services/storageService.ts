
import { LifeCompanionData } from '@/types';

const STORAGE_KEY = 'lifeCompanionData';

export const storageService = {
  loadData: (): LifeCompanionData => {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEY);
      if (serializedState === null) {
        return { currentUser: null, users: {} };
      }
      return JSON.parse(serializedState);
    } catch (err) {
      console.error("Could not load data from localStorage", err);
      return { currentUser: null, users: {} };
    }
  },

  saveData: (data: LifeCompanionData): void => {
    try {
      const serializedState = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (err) {
      console.error("Could not save data to localStorage", err);
    }
  },

  resetData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Could not reset data in localStorage", err);
    }
  },
};
