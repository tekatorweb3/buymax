import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE_PATH = path.join(__dirname, '../../data/config.json');

// Default configuration
const defaultConfig = {
  token: {
    mint: null,
  },
  devWallet: {
    privateKey: null,
    publicKey: null,
  },
  updatedAt: null,
};

// In-memory config cache
let currentConfig = null;

// Event listeners for config changes
const configChangeListeners = [];

/**
 * Load configuration from config.json
 * Falls back to environment variables if config.json doesn't exist
 */
export function loadDynamicConfig() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      currentConfig = JSON.parse(fileContent);
      console.log('📁 Loaded configuration from config.json');
    } else {
      // Initialize from environment variables
      currentConfig = {
        token: {
          mint: process.env.TOKEN_MINT || null,
        },
        devWallet: {
          privateKey: process.env.DEV_WALLET_PRIVATE_KEY || null,
          publicKey: process.env.DEV_WALLET_PUBLIC_KEY || null,
        },
        updatedAt: Date.now(),
      };

      // Save initial config if env vars are present
      if (currentConfig.token.mint || currentConfig.devWallet.publicKey) {
        saveDynamicConfig(currentConfig);
      }
    }
  } catch (error) {
    console.error('Failed to load dynamic config:', error.message);
    currentConfig = { ...defaultConfig };
  }

  return currentConfig;
}

/**
 * Save configuration to config.json
 */
export function saveDynamicConfig(newConfig) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const configToSave = {
      ...newConfig,
      updatedAt: Date.now(),
    };

    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configToSave, null, 2));
    currentConfig = configToSave;
    console.log('💾 Configuration saved to config.json');

    return true;
  } catch (error) {
    console.error('Failed to save dynamic config:', error.message);
    return false;
  }
}

/**
 * Update specific configuration values
 */
export function updateDynamicConfig(updates) {
  const newConfig = {
    ...currentConfig,
    token: {
      ...currentConfig?.token,
      ...updates.token,
    },
    devWallet: {
      ...currentConfig?.devWallet,
      ...updates.devWallet,
    },
  };

  const saved = saveDynamicConfig(newConfig);

  if (saved) {
    // Notify all listeners of config change
    notifyConfigChange(newConfig);
  }

  return saved;
}

/**
 * Get current dynamic configuration
 */
export function getDynamicConfig() {
  if (!currentConfig) {
    loadDynamicConfig();
  }
  return currentConfig;
}

/**
 * Register a listener for config changes
 */
export function onConfigChange(listener) {
  configChangeListeners.push(listener);
  return () => {
    const index = configChangeListeners.indexOf(listener);
    if (index > -1) {
      configChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of config change
 */
function notifyConfigChange(newConfig) {
  configChangeListeners.forEach((listener) => {
    try {
      listener(newConfig);
    } catch (error) {
      console.error('Config change listener error:', error.message);
    }
  });
}

/**
 * Check if configuration is complete for production mode
 */
export function isConfigComplete() {
  const cfg = getDynamicConfig();
  return !!(
    cfg?.token?.mint &&
    cfg?.devWallet?.privateKey &&
    cfg?.devWallet?.publicKey
  );
}

/**
 * Get sanitized config (without sensitive data) for API responses
 */
export function getSanitizedConfig() {
  const cfg = getDynamicConfig();
  return {
    token: {
      mint: cfg?.token?.mint || null,
      isConfigured: !!cfg?.token?.mint,
    },
    devWallet: {
      publicKey: cfg?.devWallet?.publicKey || null,
      isConfigured: !!(cfg?.devWallet?.privateKey && cfg?.devWallet?.publicKey),
    },
    updatedAt: cfg?.updatedAt || null,
    isComplete: isConfigComplete(),
  };
}
