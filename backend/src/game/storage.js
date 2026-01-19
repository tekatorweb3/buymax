import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');
const STATE_FILE = join(DATA_DIR, 'gamestate.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory exists
  }
}

export async function saveGameState(state) {
  try {
    await ensureDataDir();
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save game state:', error.message);
  }
}

export async function loadGameState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function appendToHistory(entry) {
  const historyFile = join(DATA_DIR, 'history.json');

  try {
    await ensureDataDir();
    let history = [];

    try {
      const data = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    history.push(entry);

    // Keep last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to append to history:', error.message);
  }
}
