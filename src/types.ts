export interface WalletState {
  address: string;
  privateKey: string;
  publicKey: string;
  seedPhrase: string;
  balanceArc: number; // ARC Coin balance
  balanceBtc: number; // BTC balance
  isEncrypted: boolean;
  mixingEnabled: boolean;
  transactions: CryptoTx[];
}

export interface CryptoTx {
  id: string;
  timestamp: string;
  type: 'deposit' | 'withdraw' | 'wager' | 'payout' | 'zap';
  amount: number;
  currency: 'ARC' | 'BTC';
  status: 'pending' | 'signed' | 'confirmed';
  txHash: string;
  recipientOrIssuer: string;
  zapTriggered?: boolean;
}

export interface GameState {
  gameType: 'slots' | 'blackjack' | 'roulette';
  currentBet: number;
  bettingCurrency: 'ARC' | 'BTC';
  slotsSymbols: string[];
  slotsMultiplier: number;
  bjPlayerHand: Card[];
  bjDealerHand: Card[];
  bjStatus: 'betting' | 'playing' | 'player_won' | 'dealer_won' | 'push';
  rouletteNumber: number | null;
  rouletteColor: 'red' | 'black' | 'green' | null;
  rouletteBetType: 'number' | 'red' | 'black' | 'even' | 'odd';
  rouletteBetValue: string;
  winsCount: number;
  lossesCount: number;
  totalWagered: number;
  lastPayout: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  score: number;
}

export interface SmartContract {
  id: string;
  name: string;
  code: string;
  status: 'inactive' | 'deployed' | 'active';
  address: string;
  gasLimit: number;
  runs: number;
  logs: string[];
}

export interface ZapTrigger {
  id: string;
  eventName: string;
  targetWebhook: string;
  payloadTemplate: string;
  isActive: boolean;
  executionCount: number;
  recentExecutions: {
    time: string;
    payload: string;
    status: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
  isAudioPlaying?: boolean;
}
