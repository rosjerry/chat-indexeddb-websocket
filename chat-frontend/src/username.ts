import { faker } from '@faker-js/faker';

const USERNAME_STORAGE_KEY = 'chat_username';

export interface UsernameData {
  username: string;
  createdAt: number;
}

export class UsernameManager {
  private static generateRandomUsername(): string {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const randomNumber = faker.number.int({ min: 100, max: 999 });
    
    return `${firstName}${lastName}${randomNumber}`;
  }

  static getUsername(): string {
    const stored = localStorage.getItem(USERNAME_STORAGE_KEY);
    
    if (stored) {
      try {
        const usernameData: UsernameData = JSON.parse(stored);
        return usernameData.username;
      } catch (error) {
        console.error('Error parsing stored username:', error);
        // If parsing fails, generate a new one
        return this.generateAndSaveUsername();
      }
    }
    
    // No username stored, generate a new one
    return this.generateAndSaveUsername();
  }

  static generateAndSaveUsername(): string {
    const username = this.generateRandomUsername();
    const usernameData: UsernameData = {
      username,
      createdAt: Date.now()
    };
    
    localStorage.setItem(USERNAME_STORAGE_KEY, JSON.stringify(usernameData));
    return username;
  }

  static setUsername(username: string): void {
    const usernameData: UsernameData = {
      username,
      createdAt: Date.now()
    };
    
    localStorage.setItem(USERNAME_STORAGE_KEY, JSON.stringify(usernameData));
  }

  static clearUsername(): void {
    localStorage.removeItem(USERNAME_STORAGE_KEY);
  }

  static getUsernameData(): UsernameData | null {
    const stored = localStorage.getItem(USERNAME_STORAGE_KEY);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored username data:', error);
        return null;
      }
    }
    
    return null;
  }
} 