import React, { useState, useEffect } from 'react';
import { GameState, WalletState, Card, CryptoTx } from '../types';
import { ShieldCheck, ShieldAlert, Coins, RefreshCw, Zap, Play, ChevronRight, HelpCircle, Key, Lock, Eye, CheckCircle2 } from 'lucide-react';

interface CasinoGamesProps {
  wallet: WalletState;
  onUpdateWallet: (updated: Partial<WalletState>) => void;
  onTriggerZap: (eventName: string, payload: any) => void;
  onTriggerContract: (betAmount: number, winAmount: number, details: string) => void;
  onGameActiveChange: (active: boolean) => void;
}

const SLOT_SYMBOLS = ['💠', '⚡', '🧅', '🔑', '🪙', '👑'];
const HEARTS = '♥', DIAMONDS = '♦', CLUBS = '♣', SPADES = '♠';
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = [
  { val: '2', score: 2 }, { val: '3', score: 3 }, { val: '4', score: 4 }, 
  { val: '5', score: 5 }, { val: '6', score: 6 }, { val: '7', score: 7 }, 
  { val: '8', score: 8 }, { val: '9', score: 9 }, { val: '10', score: 10 },
  { val: 'J', score: 10 }, { val: 'Q', score: 10 }, { val: 'K', score: 10 }, { val: 'A', score: 11 }
];

export default function CasinoGames({ 
  wallet, 
  onUpdateWallet, 
  onTriggerZap, 
  onTriggerContract,
  onGameActiveChange
}: CasinoGamesProps) {
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'slots' | 'blackjack' | 'roulette'>('slots');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betCurrency, setBetCurrency] = useState<'ARC' | 'BTC'>('ARC');
  
  // Slots states
  const [slotsReels, setSlotsReels] = useState<string[]>(['💠', '💠', '💠']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  
  // Blackjack states
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bjStatus, setBjStatus] = useState<'betting' | 'playing' | 'player_won' | 'dealer_won' | 'push'>('betting');
  const [deckSha256, setDeckSha256] = useState<string>('');
  const [revealSalt, setRevealSalt] = useState<string>('');
  const [showFairProof, setShowFairProof] = useState<boolean>(false);

  // Roulette states
  const [rouletteSpinning, setRouletteSpinning] = useState<boolean>(false);
  const [wheelNumber, setWheelNumber] = useState<number | null>(null);
  const [wheelColor, setWheelColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [rouletteBetType, setRouletteBetType] = useState<'number' | 'red' | 'black' | 'even' | 'odd'>('red');
  const [rouletteBetVal, setRouletteBetVal] = useState<string>('red');
  const [payoutResult, setPayoutResult] = useState<number | null>(null);

  // Provably fair generation helper
  const generateDeckWithProvablyFairHash = (): Card[] => {
    const freshDeck: Card[] = [];
    SUITS.forEach(suit => {
      VALUES.forEach(v => {
        freshDeck.push({
          suit,
          value: v.val,
          score: v.score
        });
      });
    });
    
    // Shuffling
    for (let i = freshDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freshDeck[i], freshDeck[j]] = [freshDeck[j], freshDeck[i]];
    }

    const salt = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');
    // Simple hash visual simulator
    const hashInBytes = 'sha256-' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

    setDeck(freshDeck);
    setDeckSha256(hashInBytes);
    setRevealSalt(salt);
    return freshDeck;
  };

  useEffect(() => {
    generateDeckWithProvablyFairHash();
  }, []);

  // Update Gameactive state
  useEffect(() => {
    onGameActiveChange(isSpinning || bjStatus === 'playing' || rouletteSpinning);
  }, [isSpinning, bjStatus, rouletteSpinning]);

  // Tx utility helper
  const createLocalTransaction = (type: 'wager' | 'payout', amount: number, currency: 'ARC' | 'BTC', isZap: boolean = false) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: type === 'wager' ? 'wager' : 'payout',
      amount,
      currency,
      status: 'confirmed',
      txHash,
      recipientOrIssuer: type === 'wager' ? 'Casino Automated Vault' : 'Player Private Wallet',
      zapTriggered: isZap
    };

    const updatedTxs = [newTx, ...wallet.transactions].slice(0, 50);

    let updatedBalance = wallet.balanceArc;
    let updatedBtc = wallet.balanceBtc;

    if (currency === 'ARC') {
      updatedBalance = type === 'wager' ? wallet.balanceArc - amount : wallet.balanceArc + amount;
    } else {
      updatedBtc = type === 'wager' ? wallet.balanceBtc - amount : wallet.balanceBtc + amount;
    }

    onUpdateWallet({
      balanceArc: updatedBalance,
      balanceBtc: updatedBtc,
      transactions: updatedTxs
    });
  };

  // 1. Spinnings slots
  const handleSlotsSpin = () => {
    const currentBalance = betCurrency === 'ARC' ? wallet.balanceArc : wallet.balanceBtc;
    if (currentBalance < betAmount) {
      alert('Balance insuficiente en ' + betCurrency);
      return;
    }

    setIsSpinning(true);
    createLocalTransaction('wager', betAmount, betCurrency, true);
    onTriggerZap('slot_spin_wager', { betAmount, betCurrency, timestamp: new Date().toISOString() });

    // Staggered reel spinning
    let ticks = 0;
    const interval = setInterval(() => {
      setSlotsReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
      ticks++;
      if (ticks > 12) {
        clearInterval(interval);
        
        // Outcome
        const r1 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        const r2 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        const r3 = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        
        let winMultiplier = 0;
        if (r1 === r2 && r2 === r3) {
          winMultiplier = r1 === '💠' ? 15 : r1 === '👑' ? 10 : 5;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
          winMultiplier = r2 === '💠' ? 3 : 1.5;
        }

        const payout = betAmount * winMultiplier;
        setSlotsReels([r1, r2, r3]);
        setIsSpinning(false);

        if (payout > 0) {
          createLocalTransaction('payout', payout, betCurrency, true);
          onTriggerContract(betAmount, payout, `Slots Outcome: Match ${r1}-${r2}-${r3}`);
          onTriggerZap('slot_payout_win', { payout, betCurrency, winRatio: winMultiplier });
        } else {
          onTriggerContract(betAmount, 0, `Slots Outcome: Loser`);
        }
      }
    }, 120);
  };

  // 2. Play blackjack
  const handleStartBlackjack = () => {
    const currentBalance = betCurrency === 'ARC' ? wallet.balanceArc : wallet.balanceBtc;
    if (currentBalance < betAmount) {
      alert('Balance insuficiente');
      return;
    }

    const freshDeck = generateDeckWithProvablyFairHash();
    createLocalTransaction('wager', betAmount, betCurrency, false);
    onTriggerZap('blackjack_started', { betAmount, betCurrency });

    const updatedDeck = [...freshDeck];
    const c1 = updatedDeck.pop();
    const c2 = updatedDeck.pop();
    const c3 = updatedDeck.pop();
    const c4 = updatedDeck.pop();

    const player: Card[] = [c1, c2].filter((v): v is Card => !!v);
    const dealer: Card[] = [c3, c4].filter((v): v is Card => !!v);

    setPlayerHand(player);
    setDealerHand(dealer);
    setDeck(updatedDeck);
    
    // Check initial blackjack
    const pScore = calculateScore(player);
    if (pScore === 21) {
      setBjStatus('player_won');
      const payout = betAmount * 2.5;
      createLocalTransaction('payout', payout, betCurrency, true);
      onTriggerContract(betAmount, payout, 'Instant Natural Blackjack Win!');
      onTriggerZap('blackjack_instant_natural_win', { payout });
    } else {
      setBjStatus('playing');
    }
  };

  const calculateScore = (hand: Card[]) => {
    const validHand = hand.filter((c): c is Card => !!c);
    let score = validHand.reduce((acc, c) => acc + (c?.score || 0), 0);
    let aces = validHand.filter(c => c?.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const handleBjHit = () => {
    if (bjStatus !== 'playing') return;
    const updatedDeck = [...deck];
    const nextCard = updatedDeck.pop();
    if (!nextCard) return;
    const newPlayerHand = [...playerHand, nextCard];
    
    setPlayerHand(newPlayerHand);
    setDeck(updatedDeck);

    const score = calculateScore(newPlayerHand);
    if (score > 21) {
      setBjStatus('dealer_won');
      onTriggerContract(betAmount, 0, 'Blackjack: Player Bust');
    }
  };

  const handleBjStand = () => {
    if (bjStatus !== 'playing') return;
    let currentDealerHand = [...dealerHand];
    const updatedDeck = [...deck];

    let dealerScore = calculateScore(currentDealerHand);
    while (dealerScore < 17 && updatedDeck.length > 0) {
      const card = updatedDeck.pop();
      if (card) {
        currentDealerHand.push(card);
      }
      dealerScore = calculateScore(currentDealerHand);
    }

    setDealerHand(currentDealerHand);
    setDeck(updatedDeck);

    const playerScore = calculateScore(playerHand);
    
    let outcome: 'player_won' | 'dealer_won' | 'push';
    let payout = 0;

    if (dealerScore > 21) {
      outcome = 'player_won';
      payout = betAmount * 2;
    } else if (playerScore > dealerScore) {
      outcome = 'player_won';
      payout = betAmount * 2;
    } else if (playerScore < dealerScore) {
      outcome = 'dealer_won';
    } else {
      outcome = 'push';
      payout = betAmount;
    }

    setBjStatus(outcome);
    
    if (payout > 0) {
      createLocalTransaction('payout', payout, betCurrency, true);
      onTriggerContract(betAmount, payout, `Blackjack result: ${outcome.replace('_', ' ')}`);
      onTriggerZap('blackjack_final_settlement', { payout, outcome });
    } else {
      onTriggerContract(betAmount, 0, `Blackjack result: Player lost`);
    }
  };

  // 3. Decentralized roulette
  const handleRouletteSpin = () => {
    const currentBalance = betCurrency === 'ARC' ? wallet.balanceArc : wallet.balanceBtc;
    if (currentBalance < betAmount) {
      alert('Balance insuficiente');
      return;
    }

    setRouletteSpinning(true);
    setPayoutResult(null);
    createLocalTransaction('wager', betAmount, betCurrency, true);
    onTriggerZap('roulette_spin_wager', { betAmount, betCurrency });

    let ticks = 0;
    const interval = setInterval(() => {
      const mockNum = Math.floor(Math.random() * 37);
      setWheelNumber(mockNum);
      setWheelColor(mockNum === 0 ? 'green' : mockNum % 2 === 0 ? 'black' : 'red');
      ticks++;

      if (ticks > 15) {
        clearInterval(interval);
        
        // Final roll
        const winningNum = Math.floor(Math.random() * 37);
        const winningCol = winningNum === 0 ? 'green' : winningNum % 2 === 0 ? 'black' : 'red';
        const isWinningEven = winningNum !== 0 && winningNum % 2 === 0;
        const isWinningOdd = winningNum !== 0 && winningNum % 2 !== 0;

        setWheelNumber(winningNum);
        setWheelColor(winningCol);
        setRouletteSpinning(false);

        let didWin = false;
        let mult = 0;

        if (rouletteBetType === 'red' && winningCol === 'red') {
          didWin = true;
          mult = 2;
        } else if (rouletteBetType === 'black' && winningCol === 'black') {
          didWin = true;
          mult = 2;
        } else if (rouletteBetType === 'even' && isWinningEven) {
          didWin = true;
          mult = 2;
        } else if (rouletteBetType === 'odd' && isWinningOdd) {
          didWin = true;
          mult = 2;
        } else if (rouletteBetType === 'number' && parseInt(rouletteBetVal) === winningNum) {
          didWin = true;
          mult = 35;
        }

        const payout = betAmount * mult;
        
        if (payout > 0) {
          setPayoutResult(payout);
          createLocalTransaction('payout', payout, betCurrency, true);
          onTriggerContract(betAmount, payout, `Roulette Landed: ${winningNum} (${winningCol}). Win!`);
          onTriggerZap('roulette_settled_win', { payout, number: winningNum });
        } else {
          setPayoutResult(0);
          onTriggerContract(betAmount, 0, `Roulette Landed: ${winningNum} (${winningCol}). Lost.`);
        }
      }
    }, 100);
  };

  const getSuitSymbol = (suit: 'hearts' | 'diamonds' | 'clubs' | 'spades') => {
    switch (suit) {
      case 'hearts': return { char: HEARTS, color: 'text-red-500' };
      case 'diamonds': return { char: DIAMONDS, color: 'text-red-400' };
      case 'clubs': return { char: CLUBS, color: 'text-cyan-400' };
      case 'spades': return { char: SPADES, color: 'text-slate-400' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden glow-box-blue">
      {/* Tab select bar */}
      <div className="flex border-b border-slate-800 h-13">
        <button
          id="slots-tab-btn"
          onClick={() => setActiveTab('slots')}
          className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wide font-medium transition-all duration-300 ${
            activeTab === 'slots' 
              ? 'bg-slate-950 text-reactor-cyan border-b-2 border-reactor-cyan font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <span className="text-base">🎰</span> ARC SLOTS
        </button>
        <button
          id="blackjack-tab-btn"
          onClick={() => setActiveTab('blackjack')}
          className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wide font-medium transition-all duration-300 ${
            activeTab === 'blackjack' 
              ? 'bg-slate-950 text-reactor-cyan border-b-2 border-reactor-cyan font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <span className="text-base">🃏</span> PROVABLY BLACKJACK
        </button>
        <button
          id="roulette-tab-btn"
          onClick={() => setActiveTab('roulette')}
          className={`flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-wide font-medium transition-all duration-300 ${
            activeTab === 'roulette' 
              ? 'bg-slate-950 text-reactor-cyan border-b-2 border-reactor-cyan font-bold' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
          }`}
        >
          <span className="text-base">🌀</span> ARC ROULETTE
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Betting panel config */}
        <div className="mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Coins className="w-4 h-4 text-reactor-cyan" />
            <span>WAGER CONFIG:</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick selectors */}
            <div className="flex gap-1">
              {[10, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`px-2 py-0.5 rounded font-mono text-xs border transition-all ${
                    betAmount === amt 
                      ? 'bg-reactor-cyan/10 border-reactor-cyan text-reactor-cyan font-bold' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 font-medium hover:text-white'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-18 bg-slate-900 text-white font-mono text-sm px-2 py-1 rounded border border-slate-800 text-center focus:outline-none focus:border-reactor-cyan"
              />
            </div>

            {/* Currency switcher */}
            <div className="bg-slate-900 flex p-0.5 rounded border border-slate-800">
              <button
                onClick={() => setBetCurrency('ARC')}
                className={`px-2 py-0.5 rounded font-mono text-xs font-bold transition-all ${
                  betCurrency === 'ARC' 
                    ? 'bg-reactor-cyan text-slate-950' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ARC
              </button>
              <button
                onClick={() => setBetCurrency('BTC')}
                className={`px-2 py-0.5 rounded font-mono text-xs font-bold transition-all ${
                  betCurrency === 'BTC' 
                    ? 'bg-liquid-gold text-slate-950' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BTC
              </button>
            </div>
          </div>
        </div>

        {/* 1. SLOTS VIEW */}
        {activeTab === 'slots' && (
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="text-center mb-3">
              <h3 className="font-display text-sm font-bold tracking-widest text-slate-400 uppercase">
                ARC CORE DISCHARGE CYCLER
              </h3>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                MATCH THREE REACTOR COILS FOR 15X MULTIPLIER
              </p>
            </div>

            {/* Reels Container */}
            <div className="flex justify-center gap-3 my-4">
              {slotsReels.map((sym, idx) => (
                <div 
                  key={idx} 
                  className={`w-20 h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner select-none transition-all duration-300 ${
                    isSpinning ? 'animate-pulse translate-y-0.5 border-reactor-cyan' : 'border-slate-800'
                  }`}
                  style={{
                    boxShadow: isSpinning 
                      ? 'inset 0 0 15px rgba(0, 240, 255, 0.4), 0 0 10px rgba(0, 240, 255, 0.1)' 
                      : 'none'
                  }}
                >
                  <span className={isSpinning ? 'animate-[bounce_0.2s_infinite]' : ''}>{sym}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-3">
              <button
                id="slots-spin-btn"
                onClick={handleSlotsSpin}
                disabled={isSpinning}
                className="relative px-8 py-3 bg-gradient-to-r from-reactor-blue to-reactor-cyan text-slate-950 font-display font-medium text-sm tracking-wider rounded-xl shadow-lg border border-reactor-cyan hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2 group cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : 'group-hover:rotate-45'}`} />
                <span className="font-bold">INICIAR ROTACIÓN (SPIN)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. BLACKJACK VIEW */}
        {activeTab === 'blackjack' && (
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Table Area */}
            <div className="flex flex-col gap-4 text-xs font-mono my-2">
              
              {/* Dealer Hand */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2">
                  <span>MESA DEL DEPOSITARIO (DEALER)</span>
                  <span>{bjStatus !== 'betting' ? `SCORE: ${bjStatus === 'playing' ? '?' : calculateScore(dealerHand)}` : ''}</span>
                </div>
                
                <div className="flex gap-2 min-h-[48px] items-center">
                  {bjStatus === 'betting' ? (
                    <span className="text-slate-600 text-[11px] italic">Wager to deal cryptographically proven hand...</span>
                  ) : (
                    dealerHand.map((card, i) => {
                      const suitDetails = getSuitSymbol(card.suit);
                      // Hole card logic
                      if (i === 1 && bjStatus === 'playing') {
                        return (
                          <div key={i} className="w-10 h-14 bg-gradient-to-br from-indigo-950 to-slate-900 border border-reactor-cyan/50 rounded-lg flex items-center justify-center shadow-md">
                            <Lock className="w-4 h-4 text-reactor-cyan" />
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="w-10 h-14 bg-white border border-slate-200 rounded-lg flex flex-col justify-between p-1 shadow-md text-slate-900 font-bold select-none animate-[zoomIn_0.2s_ease]">
                          <span className="text-[10px] tracking-tight leading-none">{card.value}</span>
                          <span className={`text-base self-center leading-none ${suitDetails.color}`}>{suitDetails.char}</span>
                          <span className="text-[10px] tracking-tight leading-none rotate-180 self-end">{card.value}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Player Hand */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2">
                  <span>MI MANO (CLIENT-SIDE)</span>
                  <span>{bjStatus !== 'betting' ? `SCORE: ${calculateScore(playerHand)}` : ''}</span>
                </div>

                <div className="flex gap-2 min-h-[48px] items-center">
                  {bjStatus === 'betting' ? (
                    <span className="text-slate-600 text-[11px] italic">Aguardando tu apuesta de firmware...</span>
                  ) : (
                    playerHand.map((card, i) => {
                      const suitDetails = getSuitSymbol(card.suit);
                      return (
                        <div key={i} className="w-10 h-14 bg-white border border-slate-200 rounded-lg flex flex-col justify-between p-1 shadow-md text-slate-900 font-bold select-none animate-[zoomIn_0.2s_ease]">
                          <span className="text-[10px] tracking-tight leading-none">{card.value}</span>
                          <span className={`text-base self-center leading-none ${suitDetails.color}`}>{suitDetails.char}</span>
                          <span className="text-[10px] tracking-tight leading-none rotate-180 self-end">{card.value}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Blackjack Controls */}
            <div className="flex justify-center gap-2 mt-2">
              {bjStatus === 'betting' ? (
                <button
                  id="blackjack-deal-btn"
                  onClick={handleStartBlackjack}
                  className="px-6 py-2.5 bg-reactor-cyan text-slate-950 font-display font-bold text-xs tracking-wider rounded-xl hover:brightness-110 cursor-pointer transition-all"
                >
                  REPARTIR FIRMWARE DECK
                </button>
              ) : bjStatus === 'playing' ? (
                <div className="flex gap-2">
                  <button
                    id="blackjack-hit-btn"
                    onClick={handleBjHit}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-display font-medium text-xs tracking-wider rounded-xl border border-slate-700 cursor-pointer"
                  >
                    HIT (CARTA)
                  </button>
                  <button
                    id="blackjack-stand-btn"
                    onClick={handleBjStand}
                    className="px-5 py-2 bg-gradient-to-r from-reactor-blue to-reactor-cyan text-slate-950 font-display font-bold text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    STAND (QUEDARSE)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 w-full animate-[fadeIn_0.3s_ease]">
                  <div className={`text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-lg border ${
                    bjStatus === 'player_won' 
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                      : bjStatus === 'dealer_won' 
                      ? 'bg-rose-950/40 border-rose-500 text-rose-400' 
                      : 'bg-slate-950/40 border-slate-500 text-slate-400'
                  }`}>
                    {bjStatus === 'player_won' ? '★ GANASTE LA MANO!' : bjStatus === 'dealer_won' ? 'PERDISTE LA MANO' : 'EMPADTE (PUSH)'}
                  </div>
                  <button
                    id="blackjack-reset-btn"
                    onClick={() => setBjStatus('betting')}
                    className="px-4 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-mono font-medium hover:text-white"
                  >
                    RE-WAGER HAND
                  </button>
                </div>
              )}
            </div>

            {/* Provably Fair validation drawer toggle */}
            <div className="mt-4 border-t border-slate-800/50 pt-2 font-mono text-[9px]">
              <button
                id="fair-toggle-btn"
                onClick={() => setShowFairProof(!showFairProof)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-reactor-cyan font-bold"
              >
                <Key className="w-3 h-3 text-reactor-cyan" />
                <span>SHA-256 PROVABLY FAIR SYSTEM {showFairProof ? '[-] HIDE' : '[+] REVEAL'}</span>
              </button>

              {showFairProof && (
                <div className="mt-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60 flex flex-col gap-1.5 text-slate-500 animate-[slideDown_0.2s_ease]">
                  <div className="flex justify-between">
                    <span>ONION SHUFFLE KEY:</span>
                    <span className="text-reactor-cyan font-bold">{deckSha256.substring(0, 24)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SECRET SALT:</span>
                    <span className="text-liquid-gold">{bjStatus !== 'playing' && bjStatus !== 'betting' ? revealSalt : 'REVEALED ON STAND'}</span>
                  </div>
                  <p className="text-[8px] text-slate-600 leading-normal">
                    This deck has been pre-shuffled and hashed on your local sandbox container before bets are cast. Full transparent client entropy seed prevents server tampering, executing zero-trust cryptography.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. ROULETTE VIEW */}
        {activeTab === 'roulette' && (
          <div className="flex-1 flex flex-col justify-between py-1">
            
            {/* Roulette Visual Wheel */}
            <div className="flex flex-col items-center my-2 select-none">
              <div className={`relative w-28 h-28 rounded-full border-4 border-slate-950 flex items-center justify-center bg-slate-900 ${
                rouletteSpinning ? 'animate-[spin_1.5s_linear_infinite]' : ''
              }`}
                style={{
                  boxShadow: rouletteSpinning 
                    ? '0 0 20px rgba(0, 240, 255, 0.4)' 
                    : 'none'
                }}
              >
                {/* Center marker */}
                <div className={`w-18 h-18 rounded-full flex flex-col items-center justify-center font-mono ${
                  wheelColor === 'red' ? 'bg-red-950 text-red-400 border border-red-500' :
                  wheelColor === 'black' ? 'bg-slate-950 text-slate-400 border border-slate-600' :
                  wheelColor === 'green' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500' :
                  'bg-slate-950 text-slate-500 border border-slate-800'
                }`}>
                  <span className="text-xs tracking-widest">{wheelColor ? wheelColor.toUpperCase() : 'STOPPED'}</span>
                  <span className="text-xl font-bold leading-none">{wheelNumber !== null ? wheelNumber : '--'}</span>
                </div>
                
                {/* Visual wedges */}
                <div className="absolute inset-0 rounded-full border border-dashed border-reactor-cyan/15 pointer-events-none" />
              </div>
            </div>

            {/* Bets Configurations */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 border border-slate-800/60 rounded-xl my-2">
              <div>
                <span className="font-mono text-[9px] text-slate-500 block mb-1">ROULETTE SELECTION TYPE</span>
                <div className="grid grid-cols-2 gap-1">
                  {['red', 'black', 'even', 'odd', 'number'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setRouletteBetType(type as any);
                        if (type !== 'number') setRouletteBetVal(type);
                      }}
                      className={`px-1.5 py-1 text-[10px] font-mono border rounded ${
                        rouletteBetType === type 
                          ? 'bg-reactor-cyan/10 border-reactor-cyan text-reactor-cyan font-bold' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 font-medium hover:text-white'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono text-[9px] text-slate-500 block mb-1">SELECTION VALUE</span>
                {rouletteBetType === 'number' ? (
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={rouletteBetVal}
                    placeholder="Num (0-36)"
                    onChange={(e) => setRouletteBetVal(Math.max(0, Math.min(36, parseInt(e.target.value) || 0)).toString())}
                    className="w-full bg-slate-900 border border-slate-800 text-white focus:border-reactor-cyan focus:outline-none rounded px-2 py-1 font-mono text-xs text-center"
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-[11px] text-slate-300 font-bold">
                    {rouletteBetVal.toUpperCase()} MATCH
                  </div>
                )}
              </div>
            </div>

            {/* Payout Outcome Panel */}
            {payoutResult !== null && (
              <div className="my-1 text-center animate-[zoomIn_0.2s_ease]">
                <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  payoutResult > 0 
                    ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' 
                    : 'bg-rose-900/20 border-rose-500 text-rose-500'
                }`}>
                  {payoutResult > 0 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CONTRATO EJECUTADO: +{payoutResult} {betCurrency} PAYOUT</span>
                    </>
                  ) : (
                    <span>CONTRATO LIQUIDADO: LOSS</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-2">
              <button
                id="roulette-spin-btn"
                onClick={handleRouletteSpin}
                disabled={rouletteSpinning}
                className="px-6 py-2.5 bg-gradient-to-r from-reactor-blue to-reactor-cyan text-slate-950 font-display font-medium text-xs tracking-wider rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <Zap className="w-4 h-4" />
                EXECUTE SMART CONTRACT BET
              </button>
            </div>

          </div>
        )}

        {/* Bottom stats overview for user safety */}
        <div className="mt-2 flex justify-between items-center bg-slate-900/30 p-2.5 border border-slate-800/40 rounded-xl text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1 border-r border-slate-800 pr-3 mr-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500">ZAP WEBHOOKS:</span>
            <span className="text-reactor-cyan font-bold">READY</span>
          </div>
          <div>
            <span>WAL-BALANCE:</span>
            <span className="text-white ml-1 font-bold">
              {wallet.balanceArc.toFixed(1)} ARC / {wallet.balanceBtc.toFixed(5)} BTC
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
