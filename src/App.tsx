import React, { useState, useEffect } from 'react';
import { WalletState, GameState, SmartContract, ZapTrigger, ChatMessage, CryptoTx } from './types';
import ArcReactor from './components/ArcReactor';
import CasinoGames from './components/CasinoGames';
import CryptoWallet from './components/CryptoWallet';
import SmartContracts from './components/SmartContracts';
import ZapAutomation from './components/ZapAutomation';
import JarvisCompanion from './components/JarvisCompanion';
import { 
  Bot, Terminal, Shield, Coins, Cpu, Zap, Radio, CheckCircle, HelpCircle, 
  Mail, Share2, Twitter, MessageSquare, Flame, Globe, Sparkles, LayoutGrid, 
  Maximize2, X, Send, Inbox, MessageCircle, AlertCircle, Check, Play,
  Video, Camera, Tv, Download, Lock, LogIn, LogOut, User as UserIcon,
  Facebook, Instagram, AtSign, Search, Sliders, History, Link
} from 'lucide-react';

import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';

const INITIAL_SEED = 'reactor onion share privacy secured ledger blockchain iron jarvis tony stark nano';
const INITIAL_ADDRESS = 'onion:stark_reactor_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const INITIAL_PRIVATE_KEY = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const INITIAL_PUBLIC_KEY = '04' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// Simulated multi-window social data
interface StarkMail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  time: string;
  read: boolean;
}

interface SocialPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

export default function App() {
  
  // 1. Initial State with LocalStorage backing
  const [wallet, setWallet] = useState<WalletState>(() => {
    const cached = localStorage.getItem('arc_casino_wallet');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached wallet, restoring seed defaults');
      }
    }
    return {
      address: INITIAL_ADDRESS,
      privateKey: INITIAL_PRIVATE_KEY,
      publicKey: INITIAL_PUBLIC_KEY,
      seedPhrase: INITIAL_SEED,
      balanceArc: 1500.0,
      balanceBtc: 0.2854,
      isEncrypted: true,
      mixingEnabled: false,
      transactions: []
    };
  });

  // Track authenticated user session state
  const [user, setUser] = useState<any | null>(() => {
    const cachedUni = localStorage.getItem('stark_uniswap_user');
    if (cachedUni) {
      try {
        return JSON.parse(cachedUni);
      } catch (e) {}
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showAuthChoice, setShowAuthChoice] = useState<boolean>(false);
  const [isUniswapConnecting, setIsUniswapConnecting] = useState<boolean>(false);
  const [uniswapStepIndex, setUniswapStepIndex] = useState<number>(0);

  // Track the BTC price from ticker route
  const [btcPrice, setBtcPrice] = useState<number>(96450);
  const [btcTrend, setBtcTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [lastPrice, setLastPrice] = useState<number>(96450);
  
  // Track active gaming animation (spinning reels/wheel) to light up reactor
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [reactorIntensity, setReactorIntensity] = useState<number>(30);

  // Simplified right-hand command tab control
  const [commandTab, setCommandTab] = useState<'jarvis' | 'contracts' | 'zap'>('jarvis');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Speedforce Synchronization States
  const [isSpeedforceSyncing, setIsSpeedforceSyncing] = useState<boolean>(false);
  const [isSpeedforceActive, setIsSpeedforceActive] = useState<boolean>(false);
  const [isSynced, setIsSynced] = useState<boolean>(() => {
    return localStorage.getItem('arc_speedforce_synced') === 'true';
  });
  const [syncHistory, setSyncHistory] = useState<string[]>([]);
  
  // Multi-window widget state
  const [showMultiwindow, setShowMultiwindow] = useState<boolean>(false);
  const [multiActiveTab, setMultiActiveTab] = useState<'mails' | 'twitter' | 'discord' | 'meta' | 'social_command' | 'secure_search'>('mails');
  const [metaActiveSubTab, setMetaActiveSubTab] = useState<'facebook' | 'instagram' | 'whatsapp' | 'threads'>('facebook');

  // Unified social command and search states
  const [simulPostText, setSimulPostText] = useState<string>('');
  const [simulPostSuccess, setSimulPostSuccess] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<{
    twitter: boolean;
    facebook: boolean;
    instagram: boolean;
    threads: boolean;
    discord: boolean;
    whatsapp: boolean;
  }>({
    twitter: true,
    facebook: true,
    instagram: true,
    threads: true,
    discord: true,
    whatsapp: true
  });
  const [postReplies, setPostReplies] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>(() => {
    try {
      const saved = localStorage.getItem('stark_post_replies');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'fb-1': [
        { id: 'rep-1', author: 'Jarvis LLaMA v3', text: 'Señor Stark, he enrutado la auditoría criptográfica del Reactor Arc por los túneles seguros.', time: 'Hace 7m' }
      ],
      '1': [
        { id: 'rep-2', author: 'Barry Allen', text: '¡La fluctuación del Reactor se ve súper estable! Cuenta conmigo para monitorear ráfagas.', time: 'Hace 4m' }
      ]
    };
  });
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState<string>('');
  const [unifiedSocialFilter, setUnifiedSocialFilter] = useState<'all' | 'twitter' | 'facebook' | 'instagram' | 'threads' | 'discord' | 'whatsapp'>('all');

  // Secure search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchEngine, setSearchEngine] = useState<'tor' | 'duckduckgo'>('tor');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchLoadingProgress, setSearchLoadingProgress] = useState<number>(0);
  const [searchLoadingLogs, setSearchLoadingLogs] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('stark_search_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['planos reactor arc mk-85', 'túnel onion.share redundante', 'nodos speedforce chicago'];
  });
  const [searchResults, setSearchResults] = useState<{ title: string; url: string; snippet: string; date: string; category: string }[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  const [metaConnected, setMetaConnected] = useState<{ facebook: boolean; instagram: boolean; whatsapp: boolean; threads: boolean }>(() => {
    try {
      const saved = localStorage.getItem('stark_meta_connected');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { facebook: false, instagram: false, whatsapp: false, threads: false };
  });

  const [fbPosts, setFbPosts] = useState<{id: string; author: string; content: string; time: string; likes: number}[]>(() => {
    try {
      const saved = localStorage.getItem('stark_fb_posts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'fb-1', author: 'Tony Stark', content: 'Iniciando el protocolo de encriptación cuántica para las cuentas unificadas de Meta. Jarvis, asegura el perímetro del servidor.', time: 'Hace 10m', likes: 1420 },
      { id: 'fb-2', author: 'Pepper Potts', content: 'Tony, ¿por qué recibí una alerta de inicio de sesión de Meta desde un servidor proxy en el centro operativo de la Speedforce?', time: 'Hace 1h', likes: 532 },
      { id: 'fb-3', author: 'Mark Zuckerberg', content: 'Welcome to the Stark Decentralized Bridge, Tony. Decrypting peer-to-peer communication tunnels for Meta Suite apps.', time: 'Hace 4h', likes: 8900 }
    ];
  });

  const [igPhotos, setIgPhotos] = useState<{id: string; author: string; imageUrl: string; caption: string; likes: number; rType: string}[]>(() => {
    try {
      const saved = localStorage.getItem('stark_ig_photos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'ig-1', author: 'tonystarkofficial', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60', caption: 'Calibrando la matriz de energía para el nuevo reactor Arc integrado a Meta VR. Intensidad al 100%. 💎🔋 #OnionSecured', likes: 25400, rType: 'tech' },
      { id: 'ig-2', author: 'pepperpotts', imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=60', caption: 'Stark Industries Cloud Core Server. Cerrando enrutamiento de túneles Speedforce seguros.', likes: 4120, rType: 'building' },
      { id: 'ig-3', author: 'tonystarkofficial', imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60', caption: 'Consola Onion VM para el monitoreo en vivo de ledger cuántico. Todo inmutable.', likes: 18950, rType: 'ledger' }
    ];
  });

  const [waMessages, setWaMessages] = useState<{id: string; sender: string; text: string; time: string; isSelf: boolean}[]>(() => {
    try {
      const saved = localStorage.getItem('stark_wa_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'wa-1', sender: 'Pepper Potts', text: 'Tony, ¿te acuerdas de que hoy asistimos a la conferencia global de Meta-Shards?', time: '11:15 AM', isSelf: false },
      { id: 'wa-2', sender: 'Yo', text: 'Sí, Pepper. Solo termino de encriptar el túnel Onion.share y salgo.', time: '11:17 AM', isSelf: true },
      { id: 'wa-3', sender: 'Pepper Potts', text: 'Por favor, dile a Jarvis que no intente hackear el servidor de Mark Zuckerberg desde la limusina.', time: '11:18 AM', isSelf: false }
    ];
  });

  const [threadsFeed, setThreadsFeed] = useState<{id: string; author: string; handle: string; content: string; time: string; replies: number}[]>(() => {
    try {
      const saved = localStorage.getItem('stark_threads_feed');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'th-1', author: 'Mark Zuckerberg', handle: '@zuck', content: 'Let\'s build the future of immersive open-protocol networks. Ready to integrate with the Stark Multiwindow Deck.', time: '1h', replies: 420 },
      { id: 'th-2', author: 'Tony Stark', handle: '@tonystark', content: 'Deploying Threads secure proxy directly over Onion.share routing. Absolute encryption guaranteed. 🌐', time: '40m', replies: 12 },
      { id: 'th-3', author: 'Peter Parker', handle: '@spidey', content: 'Mr. Stark! The Meta-WhatsApp-Instagram-Facebook tunnel works perfectly inside the browser!', time: '10m', replies: 3 }
    ];
  });

  const [newFbPostText, setNewFbPostText] = useState<string>('');
  const [newIgCaption, setNewIgCaption] = useState<string>('');
  const [newWaText, setNewWaText] = useState<string>('');
  const [newThreadsText, setNewThreadsText] = useState<string>('');

  // Interactive mail states
  const [mails, setMails] = useState<StarkMail[]>([
    { id: '1', sender: 'Pepper Potts', subject: 'Reunión de balance Stark Industries', body: 'Tony, los inversionistas preguntan por la fluctuación del reactor Arc vinculada a Bitcoin. Favor de revisar.', time: '10:45 AM', read: false },
    { id: '2', sender: 'Nick Fury // S.H.I.E.L.D.', subject: '[CLASIFICADO] Enrutamiento Onion', body: 'Necesitamos usar el túnel Onion.share v2.6 para mover archivos de Hydra de forma segura. ¿Tu casino virtual está limpio?', time: '09:12 AM', read: false },
    { id: '3', sender: 'Bruce Banner', subject: 'Simulación Gamma en Solana', body: 'Los contratos Solidity BetVerifier están estables, pero la dispersión gamma genera un delay de latencia de 12ms. Resuelto.', time: 'Ayer', read: true }
  ]);
  const [newMailInput, setNewMailInput] = useState({ to: 'Pepper Potts', subject: '', body: '' });

  // Interactive social feeds
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([
    { id: '1', author: 'Tony Stark', handle: '@IronMan', avatar: '🟥', content: 'Acabo de vincular el reactor Arc directamente con la Speedforce de Barry. Flujo de Bitcoin estabilizándose al 200%. #VuelaAlto', time: '5m', likes: 24500 },
    { id: '2', author: 'Daily Bugle', handle: '@DailyBugle', avatar: '📰', content: '¿Tony Stark operando un casino virtual inmutable desde túneles cifrados? ¡Exigimos regulaciones del Senado!', time: '40m', likes: 120 },
    { id: '3', author: 'Stark Industries', handle: '@StarkIndustries', avatar: '🏢', content: 'Presentamos la pasarela Stark-Zap. Dispersión del ledger de tokens anónimos sin intermediarios tradicionales.', time: '2h', likes: 3450 }
  ]);
  const [newTweetText, setNewTweetText] = useState<string>('');

  // Interactive Discord hacker channel
  const [discordMessages, setDiscordMessages] = useState<{id?: string; user: string; text: string; time: string; avatar: string}[]>([
    { id: 'discord-d1', user: 'Happy Hogan', text: 'Tony, ¿por qué la IA de Jarvis me bloqueó en la ruleta?', time: '11:20 AM', avatar: '💼' },
    { id: 'discord-d2', user: 'Jarvis LLaMA v3', text: 'Estimado Señor Hogan, su wager excedía el límite de gas estipulado en BetVerifier.sol.', time: '11:21 AM', avatar: '🤖' },
    { id: 'discord-d3', user: 'Barry Allen', text: '¡Siento una perturbación masiva en la Speedforce roja! Alguien acaba de vincular sus cuentas Stark.', time: '11:25 AM', avatar: '⚡' }
  ]);

  // Auth observer subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthLoading(true);
        try {
          // 1. Fetch Profile
          const profileRef = doc(db, 'users', currentUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            setWallet(prev => ({
              ...prev,
              address: data.address || prev.address,
              privateKey: data.privateKey || prev.privateKey,
              publicKey: data.publicKey || prev.publicKey,
              seedPhrase: data.seedPhrase || prev.seedPhrase,
              balanceArc: data.balanceArc !== undefined ? data.balanceArc : prev.balanceArc,
              balanceBtc: data.balanceBtc !== undefined ? data.balanceBtc : prev.balanceBtc,
              isEncrypted: data.isEncrypted !== undefined ? data.isEncrypted : prev.isEncrypted,
              mixingEnabled: data.mixingEnabled !== undefined ? data.mixingEnabled : prev.mixingEnabled
            }));
            if (data.isSynced !== undefined) {
              setIsSynced(data.isSynced);
            }
          } else {
            // Write profile
            await setDoc(profileRef, {
              address: wallet.address,
              privateKey: wallet.privateKey,
              publicKey: wallet.publicKey,
              seedPhrase: wallet.seedPhrase,
              balanceArc: wallet.balanceArc,
              balanceBtc: wallet.balanceBtc,
              isEncrypted: wallet.isEncrypted,
              mixingEnabled: wallet.mixingEnabled,
              isSynced: isSynced,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }

          // 2. Load Transactions
          const txRef = collection(db, 'users', currentUser.uid, 'transactions');
          const txSnap = await getDocs(txRef);
          if (!txSnap.empty) {
            const loadedTxs: CryptoTx[] = [];
            txSnap.forEach(d => {
              loadedTxs.push(d.data() as CryptoTx);
            });
            // Sort by descending date
            loadedTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setWallet(prev => ({ ...prev, transactions: loadedTxs }));
          } else {
            // Seed local transactions
            for (const tx of wallet.transactions) {
              await setDoc(doc(db, 'users', currentUser.uid, 'transactions', tx.id), {
                ...tx,
                userId: currentUser.uid
              });
            }
          }

          // 3. Load Contracts
          const contractsRef = collection(db, 'users', currentUser.uid, 'contracts');
          const contractsSnap = await getDocs(contractsRef);
          if (!contractsSnap.empty) {
            const loadedContracts: SmartContract[] = [];
            contractsSnap.forEach(d => {
              loadedContracts.push(d.data() as SmartContract);
            });
            setContracts(loadedContracts);
          } else {
            // Seed
            for (const c of contracts) {
              await setDoc(doc(db, 'users', currentUser.uid, 'contracts', c.id), {
                ...c,
                userId: currentUser.uid
              });
            }
          }

          // 4. Load Zaps
          const zapsRef = collection(db, 'users', currentUser.uid, 'zaps');
          const zapsSnap = await getDocs(zapsRef);
          if (!zapsSnap.empty) {
            const loadedZaps: ZapTrigger[] = [];
            zapsSnap.forEach(d => {
              loadedZaps.push(d.data() as ZapTrigger);
            });
            setTriggers(loadedZaps);
          } else {
            for (const t of triggers) {
              await setDoc(doc(db, 'users', currentUser.uid, 'zaps', t.id), {
                ...t,
                userId: currentUser.uid,
                updatedAt: serverTimestamp()
              });
            }
          }

          // 5. Load Chat history
          const chatsRef = collection(db, 'users', currentUser.uid, 'chats');
          const chatsSnap = await getDocs(chatsRef);
          if (!chatsSnap.empty) {
            const loadedChats: ChatMessage[] = [];
            chatsSnap.forEach(d => {
              loadedChats.push(d.data() as ChatMessage);
            });
            loadedChats.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            setMessages(loadedChats);
          } else {
            for (const m of messages) {
              await setDoc(doc(db, 'users', currentUser.uid, 'chats', m.id), {
                ...m,
                userId: currentUser.uid
              });
            }
          }

          // 6. Load Stark Mails
          const mailsRef = collection(db, 'users', currentUser.uid, 'mails');
          const mailsSnap = await getDocs(mailsRef);
          if (!mailsSnap.empty) {
            const loadedMails: StarkMail[] = [];
            mailsSnap.forEach(d => {
              loadedMails.push(d.data() as StarkMail);
            });
            setMails(loadedMails);
          } else {
            for (const m of mails) {
              await setDoc(doc(db, 'users', currentUser.uid, 'mails', m.id), {
                ...m,
                userId: currentUser.uid
              });
            }
          }

          // 7. Load Social Posts
          const postsRef = collection(db, 'users', currentUser.uid, 'posts');
          const postsSnap = await getDocs(postsRef);
          if (!postsSnap.empty) {
            const loadedPosts: SocialPost[] = [];
            postsSnap.forEach(d => {
              loadedPosts.push(d.data() as SocialPost);
            });
            setSocialPosts(loadedPosts);
          } else {
            for (const p of socialPosts) {
              await setDoc(doc(db, 'users', currentUser.uid, 'posts', p.id), {
                ...p,
                userId: currentUser.uid
              });
            }
          }

          // 8. Load Discord Messages
          const discRef = collection(db, 'users', currentUser.uid, 'discord');
          const discSnap = await getDocs(discRef);
          if (!discSnap.empty) {
            const loadedDisc: any[] = [];
            discSnap.forEach(d => {
              loadedDisc.push(d.data());
            });
            setDiscordMessages(loadedDisc);
          } else {
            for (const dm of discordMessages) {
              const dmId = dm.id || crypto.randomUUID();
              await setDoc(doc(db, 'users', currentUser.uid, 'discord', dmId), {
                id: dmId,
                userId: currentUser.uid,
                user: dm.user,
                text: dm.text,
                time: dm.time,
                avatar: dm.avatar
              });
            }
          }

        } catch (error) {
          console.error("Error backing up or loading from Firestore user directories:", error);
        } finally {
          setAuthLoading(false);
        }
      } else {
        const cachedUni = localStorage.getItem('stark_uniswap_user');
        if (cachedUni) {
          try {
            setUser(JSON.parse(cachedUni));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  const [newDiscordText, setNewDiscordText] = useState<string>('');

  // Agamotto Video/Audio Recorder states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedTime, setRecordedTime] = useState<number>(0);
  const [recordingSuccess, setRecordingSuccess] = useState<boolean>(false);
  const [bonusPayoutClaimed, setBonusPayoutClaimed] = useState<boolean>(false);
  const [socialViews, setSocialViews] = useState<number>(0);
  const [showAgamottoWorkspace, setShowAgamottoWorkspace] = useState<boolean>(false);
  const [agamottoLogs, setAgamottoLogs] = useState<string[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [localCamAvailable, setLocalCamAvailable] = useState<boolean>(false);
  const [screenPermissionMock, setScreenPermissionMock] = useState<boolean>(true);

  // Smart Contracts states
  const [contracts, setContracts] = useState<SmartContract[]>([
    {
      id: 'bet_verifier',
      name: 'BetVerifier',
      code: '',
      status: 'active',
      address: '0xSt4rkVMBetVerifierDeployxxxxxxxxx',
      gasLimit: 120000,
      runs: 0,
      logs: []
    },
    {
      id: 'zap_payments',
      name: 'ZapPayments',
      code: '',
      status: 'active',
      address: '0xSt4rkVMZapPaymentsDeployxxxxxxxxx',
      gasLimit: 95000,
      runs: 0,
      logs: []
    }
  ]);

  // Zap trigger hooks
  const [triggers, setTriggers] = useState<ZapTrigger[]>([
    {
      id: 'wager',
      eventName: 'casino_wager_placed',
      targetWebhook: 'https://gateway.stark.zap/hooks/wager',
      payloadTemplate: '{"event":"wager", "user":"{{user}}", "amt":"{{amount}}"}',
      isActive: true,
      executionCount: 0,
      recentExecutions: []
    },
    {
      id: 'payout',
      eventName: 'casino_payout_disbursed',
      targetWebhook: 'https://gateway.stark.zap/hooks/payout',
      payloadTemplate: '{"event":"payout", "user":"{{user}}", "win":"{{amount}}"}',
      isActive: true,
      executionCount: 0,
      recentExecutions: []
    },
    {
      id: 'mix',
      eventName: 'p2p_tumbler_mix',
      targetWebhook: 'https://gateway.stark.zap/hooks/anon_mix',
      payloadTemplate: '{"event":"anon_mix", "vol":"{{amount}}"}',
      isActive: true,
      executionCount: 0,
      recentExecutions: []
    },
    {
      id: 'recharge',
      eventName: 'wallet_deposit_refilled',
      targetWebhook: 'https://gateway.stark.zap/hooks/refill',
      payloadTemplate: '{"event":"deposit", "credit":"{{amount}}"}',
      isActive: true,
      executionCount: 0,
      recentExecutions: []
    }
  ]);

  // Chat chatbot messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize messages with context check
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'jarvis',
        text: `Indeed, Stark Client. Welcome back to your secure, encrypted Virtual Onion Casino.

All systems are fully functional. The Arc Reactor is operating at 100% capacity, and our Onion.share end-to-end tunnel is secure. I am ready to process your smart contract wagers or route your token barajados (mixes) through Zapier automated nodes.

Type below to instruct me or tell me what wagers to place, Sir.`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  // Update welcome text if user has synced profiles
  useEffect(() => {
    if (isSynced && messages.length === 1) {
      setMessages([
        {
          id: 'welcome-synced',
          sender: 'jarvis',
          text: `Splendid, Señor! He detectado un acoplamiento perfecto de su pasarela Speedforce. 

Sus cuentas de correo y perfiles de X.com de Stark Industries se encuentran sincronizados en el botón multiventana flotante de su escritorio táctil. Ahora puedo monitorear sus comunicaciones de Nick Fury, Pepper Potts y el Discord de Stark en tiempo real. 

¿Procedemos a ejecutar wagers automatizados, Sir?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isSynced]);

  // Persist wallet updates on local store
  useEffect(() => {
    localStorage.setItem('arc_casino_wallet', JSON.stringify(wallet));
  }, [wallet]);

  // Polling server for real BTC index and dynamic fluctuations
  useEffect(() => {
    const fetchBtc = async () => {
      try {
        const response = await fetch('/api/btc-ticker');
        if (response.ok) {
          const data = await response.json();
          const nextPrice = data.price;
          
          if (nextPrice > lastPrice) {
            setBtcTrend('up');
            setReactorIntensity(prev => Math.min(100, prev + 15));
          } else if (nextPrice < lastPrice) {
            setBtcTrend('down');
            setReactorIntensity(prev => Math.max(10, prev - 5));
          } else {
            setBtcTrend('stable');
          }
          setLastPrice(nextPrice);
          setBtcPrice(nextPrice);
        }
      } catch (e) {
        // Fallback simulation
        const nextPrice = lastPrice + (Math.random() - 0.48) * 12;
        setBtcTrend(nextPrice > lastPrice ? 'up' : 'down');
        setLastPrice(nextPrice);
        setBtcPrice(nextPrice);
      }
    };

    fetchBtc();
    const interval = setInterval(fetchBtc, 9500);
    return () => clearInterval(interval);
  }, [lastPrice]);

  // Handle active game intensity adjustments
  useEffect(() => {
    if (isGameActive) {
      setReactorIntensity(90);
    } else {
      const resetDelay = setTimeout(() => {
        setReactorIntensity(35);
      }, 1000);
      return () => clearTimeout(resetDelay);
    }
  }, [isGameActive]);

  // Update wallet handler
  const handleUpdateWallet = (updatedFields: Partial<WalletState>) => {
    setWallet(prev => {
      const next = {
        ...prev,
        ...updatedFields
      };
      // Keep localStorage backed as fallback
      localStorage.setItem('arc_casino_wallet', JSON.stringify(next));

      if (auth.currentUser) {
        const { transactions, ...profileFields } = updatedFields;
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        
        if (Object.keys(profileFields).length > 0) {
          updateDoc(userDocRef, {
            ...profileFields,
            updatedAt: serverTimestamp()
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`);
          });
        }

        if (transactions && transactions.length > 0) {
          // Look for any new transactions
          const newTxs = transactions.filter(
            newTx => !prev.transactions.some(oldTx => oldTx.id === newTx.id)
          );
          for (const tx of newTxs) {
            setDoc(doc(db, 'users', auth.currentUser.uid, 'transactions', tx.id), {
              ...tx,
              userId: auth.currentUser.uid
            }).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/transactions/${tx.id}`);
            });
          }
        }
      }
      return next;
    });
  };

  // Start simulated Uniswap login connection
  const startUniswapLogin = () => {
    setIsUniswapConnecting(true);
    setUniswapStepIndex(0);
    
    const stepsCount = 4;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < stepsCount) {
        setUniswapStepIndex(currentStep);
      } else {
        clearInterval(interval);
        setIsUniswapConnecting(false);
        setShowAuthChoice(false);
        
        // Setup mock Uniswap user
        const uniswapAddress = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
        const dummyUser = {
          uid: 'uniswap_web3_stark_' + Math.floor(Math.random() * 1000000),
          displayName: 'Uniswap Web3 Wallet',
          photoURL: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
          email: 'uniswap_connected'
        };
        
        localStorage.setItem('stark_uniswap_user', JSON.stringify(dummyUser));
        localStorage.setItem('stark_uniswap_address', uniswapAddress);
        
        setUser(dummyUser);
        
        // Also update the active wallet address with the linked Uniswap address for maximum immersion!
        setWallet(prev => ({
          ...prev,
          address: 'eth:' + uniswapAddress + ' (Uniswap Bridged)'
        }));
        
        handleTriggerZap('uniswap_wallet_connected', { address: uniswapAddress });
      }
    }, 900);
  };

  // Automated trigger payment helper for visual dashboard
  const handleTriggerZap = (eventName: string, payload: any) => {
    const timestamp = new Date().toLocaleTimeString();
    
    setTriggers(prevTrig => {
      const nextTriggers = prevTrig.map(t => {
        // Map event patterns to internal triggers
        const nameMatch = 
          (eventName.includes('wager') && t.id === 'wager') ||
          (eventName.includes('payout') && t.id === 'payout') ||
          (eventName.includes('mix') && t.id === 'mix') ||
          (eventName.includes('deposit') && t.id === 'recharge');

        if (nameMatch && t.isActive) {
          const payloadStr = t.payloadTemplate
            .replace('{{amount}}', payload.betAmount || payload.amount || payload.mixVolume || '0')
            .replace('{{user}}', wallet.address.substring(0, 14) + '...');
          
          const updatedT = {
            ...t,
            executionCount: t.executionCount + 1,
            recentExecutions: [
              { time: timestamp, payload: payloadStr, status: 200 },
              ...t.recentExecutions
            ].slice(0, 30)
          };

          if (auth.currentUser) {
            setDoc(doc(db, 'users', auth.currentUser.uid, 'zaps', t.id), {
              ...updatedT,
              userId: auth.currentUser.uid,
              updatedAt: serverTimestamp()
            }).catch(err => {
              handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}/zaps/${t.id}`);
            });
          }

          return updatedT;
        }
        return t;
      });
      return nextTriggers;
    });
  };

  // Automated smart contracts visual runner
  const handleTriggerContract = (betAmount: number, winAmount: number, details: string) => {
    const blockHeight = 814000 + Math.floor(Math.random() * 500);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    setContracts(prevContracts => {
      const logString = `[BLOCKE #${blockHeight}] Smart Call BetVerifier (${details}) - Wager: ${betAmount} | Payout: ${winAmount} - Tx: ${txHash.substring(0, 16)}... - CONFIRMADO OK`;
      
      const nextContracts = prevContracts.map(c => {
        if (c.id === 'bet_verifier') {
          const updatedC = {
            ...c,
            runs: c.runs + 1,
            logs: [logString, ...c.logs].slice(0, 40)
          };

          if (auth.currentUser) {
            setDoc(doc(db, 'users', auth.currentUser.uid, 'contracts', 'bet_verifier'), {
              ...updatedC,
              userId: auth.currentUser.uid
            }).catch(err => {
              handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}/contracts/bet_verifier`);
            });
          }

          return updatedC;
        }
        return c;
      });
      return nextContracts;
    });
  };

  // Clear contracts history logs
  const handleClearContractLogs = () => {
    setContracts(prev => {
      const next = prev.map(c => ({ ...c, logs: [] }));
      if (auth.currentUser) {
        for (const c of next) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'contracts', c.id), {
            ...c,
            userId: auth.currentUser.uid
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}/contracts/${c.id}`);
          });
        }
      }
      return next;
    });
  };

  // Deploy custom contracts
  const handleDeployContract = (name: string) => {
    const blockHeight = 814000 + Math.floor(Math.random() * 200);
    const mockAddress = '0xSt4rkDeploy' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const newContract: SmartContract = {
      id: crypto.randomUUID(),
      name,
      code: '',
      status: 'active',
      address: mockAddress,
      gasLimit: 100000,
      runs: 0,
      logs: [`[BLOCKE #${blockHeight}] Contrato inmutable ${name}.sol desplegado exitosamente en Onion VM. Dirección de red: ${mockAddress}`]
    };

    setContracts(prev => {
      const next = [...prev, newContract];
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid, 'contracts', newContract.id), {
          ...newContract,
          userId: auth.currentUser.uid
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/contracts/${newContract.id}`);
        });
      }
      return next;
    });
  };

  // Handler toggling zap triggers active-state
  const handleToggleZapTrigger = (id: string) => {
    setTriggers(prev => {
      const next = prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t);
      if (auth.currentUser) {
        const target = next.find(t => t.id === id);
        if (target) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'zaps', id), {
            ...target,
            userId: auth.currentUser.uid,
            updatedAt: serverTimestamp()
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}/zaps/${id}`);
          });
        }
      }
      return next;
    });
  };

  // Clears active zap executions histories
  const handleClearZapHistory = () => {
    setTriggers(prev => {
      const next = prev.map(t => ({ ...t, recentExecutions: [], executionCount: 0 }));
      if (auth.currentUser) {
        for (const t of next) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'zaps', t.id), {
            ...t,
            userId: auth.currentUser.uid,
            updatedAt: serverTimestamp()
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}/zaps/${t.id}`);
          });
        }
      }
      return next;
    });
  };

  // Chat message sender communicating server-side with Gemini API key
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsGenerating(true);

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'chats', userMsg.id), {
        ...userMsg,
        userId: auth.currentUser.uid
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/chats/${userMsg.id}`);
      });
    }

    try {
      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({
            role: m.sender === 'jarvis' ? 'model' : 'user',
            parts: [{ text: m.text }]
          })),
          walletState: {
            balanceArc: wallet.balanceArc,
            balanceBtc: wallet.balanceBtc,
            address: wallet.address
          },
          btcPrice: btcPrice,
          isSynced: isSynced // Send speedforce state to assistant
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jarvisMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'jarvis',
          text: data.text,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, jarvisMsg]);

        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'chats', jarvisMsg.id), {
            ...jarvisMsg,
            userId: auth.currentUser.uid
          }).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/chats/${jarvisMsg.id}`);
          });
        }
      } else {
        throw new Error('Server returned error response');
      }
    } catch (e) {
      console.error('Error fetching voice assistant reply:', e);
      // Fail proof fallback reply in character
      const jarvisMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'jarvis',
        text: 'Mis disculpas Sir, he detectado una fluctuación de red en el puente Stark Cloud, pero he activado una simulación heurística local con sus cuentas vinculadas de Stark Mail. ¿Sería tan amable de refrescar la conexión, Sir?',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, jarvisMsg]);

      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid, 'chats', jarvisMsg.id), {
          ...jarvisMsg,
          userId: auth.currentUser.uid
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/chats/${jarvisMsg.id}`);
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================
  // GEMA DE AGAMOTTO // GRABADOR MULTI-STREAM TEMPORAL RETAILER
  // ============================================
  
  // Clean up stream resources
  const releaseCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startAgamottoRecording = async () => {
    setIsRecording(true);
    setRecordedTime(0);
    setRecordingSuccess(false);
    setSocialViews(0);
    
    setAgamottoLogs([
      '💎 Abriendo el ojo de Agamotto: Activando gema del tiempo...',
      '🌀 Entrelazando el flujo de pantalla en tiempo real con sensores de cámara...',
      '🔗 Solicitando canales multimedia para flujo cruzado de grabación...'
    ]);

    try {
      // Intentar interactuar directamente con la cámara del usuario (CÁMARA REAL)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 }, 
        audio: true 
      });
      setCameraStream(stream);
      setLocalCamAvailable(true);
      setAgamottoLogs(prev => [
        ...prev,
        '📹 CÁMARA FRONTAL ENLAZADA: Feed selfie activo (64s).',
        '🎥 Cámara trasera emulada con hilos de taquiones inyectados.',
        '🟢 GRABANDO PANTALLA + SEÑALES: Flujo inmutable transmitiéndose sobre túneles cifrados...'
      ]);
    } catch (err) {
      console.warn('Sandbox browser restricted camera stream. Initializing high fidelity simulation matrix.', err);
      setLocalCamAvailable(false);
      setAgamottoLogs(prev => [
        ...prev,
        '⚠️ El navegador restringió el acceso físico a la cámara dentro de este iframe.',
        '🔮 Modo simulador cuántico activado: Re-creando matriz de video holográfica...',
        '🟢 GRABANDO: Generando capas compuestas [Pantalla] + [Selfie IA] + [POV Trasero]'
      ]);
    }

    // Trigger Zap automatic workflow
    handleTriggerZap('recording_initiated_via_agamotto', {
      timestamp: new Date().toISOString(),
      secured_relay: 'Onion.share P2P'
    });
  };

  // Manual cancellation
  const stopAgamottoRecording = () => {
    setIsRecording(false);
    releaseCameraStream();
    setAgamottoLogs(prev => [...prev, '⏹️ Grabación terminada manualmente por el usuario.']);
  };

  // Share and claim view bonuses
  const handleShareAgamottoClip = (network: 'tiktok' | 'x' | 'discord') => {
    setAgamottoLogs(prev => [
      ...prev,
      `📣 Publicando videoclip Point-Zero en red social: ${network.toUpperCase()}...`,
      '⚡ Multiplicador temporal encendido. Contabilizando views...'
    ]);

    let views = 0;
    const viewsInterval = setInterval(() => {
      views += Math.floor(Math.random() * 95) + 145;
      setSocialViews(views);

      if (views >= 3000) {
        clearInterval(viewsInterval);
        setAgamottoLogs(prev => [
          ...prev,
          `🔥 EXPANSIÓN VIRAL: Compilado alcanzó ${views.toLocaleString()} de visualizaciones!`,
          '💎 Bono por viralización de Onion.share reclamado: +150% de regalías.'
        ]);

        // Extra viral views payout
        setWallet(prevW => {
          const arcBonus = 250;
          const btcBonus = 0.02;
          return {
            ...prevW,
            balanceArc: prevW.balanceArc + arcBonus,
            balanceBtc: prevW.balanceBtc + btcBonus,
            transactions: [
              {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                type: 'deposit',
                amount: arcBonus,
                currency: 'ARC',
                status: 'confirmed',
                txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                recipientOrIssuer: `Viral Bonus Reward (${network.toUpperCase()})`,
                zapTriggered: true
              },
              ...prevW.transactions
            ]
          };
        });

        handleTriggerZap('agamotto_viral_milestone_passed', {
          views_count: views,
          network_published: network,
          reward_arc: 250
        });
      }
    }, 200);
  };

  // Trigger when recording successfully counts down to 8s (managed in useEffect)
  useEffect(() => {
    let secondInterval: any = null;
    if (isRecording) {
      secondInterval = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= 8) {
            clearInterval(secondInterval);
            setIsRecording(false);
            setRecordingSuccess(true);
            releaseCameraStream();

            // Auto credit 500 ARC and 0.05 BTC bonus!
            setWallet(walletState => {
              const b = walletState.balanceArc + 500;
              const btc = walletState.balanceBtc + 0.055;
              const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
              
              const newTx: CryptoTx = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                type: 'deposit',
                amount: 500,
                currency: 'ARC',
                status: 'confirmed',
                txHash,
                recipientOrIssuer: 'Agamotto Gameplay Verification Bonus',
                zapTriggered: true
              };

              return {
                ...walletState,
                balanceArc: b,
                balanceBtc: btc,
                transactions: [newTx, ...walletState.transactions]
              };
            });

            setAgamottoLogs(prev => [
              ...prev,
              '⏱️ Sincronización temporal fija a 8.00s alcanzada!',
              '🎬 COMPOSICIÓN MULTI-CAPA LISTA: [Pantalla P0inT-Z3R0 + Selfie + POV Trasero] unidos en codificado SHA-512.',
              '🏆 PAGO DE ADEMÁS AUTOMÁTICO DISPERSADO: +500 ARC y +0.055 BTC agregados exitosamente!',
              '💡 Comparte a continuación para incrementar masivamente tus visualizaciones y obtener bonos extras!'
            ]);

            // Auto log in Contracts
            setContracts(prevCon => {
              const msgLog = `[AGAMOTTO #RECORDING] Compilation complete. Gameplay verified. Disbursed 500 ARC tokens to client address. Linked over anonymous Onion mixers. Block: INMUTABLE.`;
              return prevCon.map(c => {
                if (c.id === 'bet_verifier') {
                  return { ...c, logs: [msgLog, ...c.logs] };
                }
                return c;
              });
            });

            handleTriggerZap('video_record_completed_and_payout_disbursed', {
              duration: '8s',
              client_address: wallet.address,
              blockchain_network: 'P0inT-Z3R0 P2P',
              payout_arc: 500,
              payout_btc: 0.055
            });

            return 8;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (secondInterval) clearInterval(secondInterval);
    };
  }, [isRecording]);

  // 4. SPEEDFORCE SYNCHRONIZER ACTIVATION
  const handleSpeedforceSync = () => {
    setIsSpeedforceSyncing(true);
    setIsSpeedforceActive(true);
    setSyncHistory(['Inicializando conducto de Speedforce...', 'Derivando taquiones cuánticos hacia el reactor Arc...', 'Vibrando en fase con la red de Stark Enterprises...']);

    let step = 0;
    const steps = [
      '⚡ Vinculando cuenta Stark Secure Mail (tony@stark.com)... ACCESO CONCEDIDO',
      '⚡ Mapeando perfil de Nick Fury en S.H.I.E.L.D. Secure Gateway...',
      '⚡ Sincronizando feeds sociales y Onion.chat de Happy Hogan...',
      '⚡ Inyectando hashes Taquión en el enrutamiento Onion.share...',
      '⚡ Sincronización exitosa. Perfiles enlazados al Botón Multiventana!'
    ];

    const idx = setInterval(() => {
      if (step < steps.length) {
        setSyncHistory(prev => [...prev, steps[step]]);
        step++;
      } else {
        clearInterval(idx);
        setIsSpeedforceSyncing(false);
        setIsSynced(true);
        localStorage.setItem('arc_speedforce_synced', 'true');
        
        // Brief delay before removing the speedforce flash overlay
        setTimeout(() => {
          setIsSpeedforceActive(false);
        }, 1500);

        // Add automated log to Smart Contract VM
        setContracts(prev => {
          const systemMsg = `[SPEEDFORCE #SYNC] Stark Multiwindow Bridge established. Synchronized Tony Stark emails, Onion networks and Stark Industries Discord feeds. Active state: INMUTABLE.`;
          return prev.map(c => {
            if (c.id === 'bet_verifier') {
              return { ...c, logs: [systemMsg, ...c.logs] };
            }
            return c;
          });
        });
      }
    }, 450);
  };

  // Reset sync
  const handleResetSync = () => {
    setIsSynced(false);
    localStorage.removeItem('arc_speedforce_synced');
    setSyncHistory([]);
  };

  // Add interactive post to custom feed
  const handleAddTweet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTweetText.trim()) return;
    const newPost: SocialPost = {
      id: crypto.randomUUID(),
      author: 'Tony Stark',
      handle: '@IronMan',
      avatar: '🟥',
      content: newTweetText,
      time: 'Justo ahora',
      likes: 1
    };
    setSocialPosts([newPost, ...socialPosts]);
    setNewTweetText('');

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'posts', newPost.id), {
        ...newPost,
        userId: auth.currentUser.uid
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/posts/${newPost.id}`);
      });
    }
  };

  // Add interactive message to custom discord
  const handleAddDiscord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscordText.trim()) return;
    const msgId = crypto.randomUUID();
    const newMsg = {
      id: msgId,
      user: 'Tony Stark',
      text: newDiscordText,
      time: '11:26 AM',
      avatar: '🟥'
    };
    setDiscordMessages([...discordMessages, newMsg]);
    setNewDiscordText('');

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'discord', msgId), {
        ...newMsg,
        userId: auth.currentUser.uid
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/discord/${msgId}`);
      });
    }
  };

  // Add interactive mail
  const handleAddMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMailInput.subject.trim() || !newMailInput.body.trim()) return;
    const newM: StarkMail = {
      id: crypto.randomUUID(),
      sender: `Para: ${newMailInput.to}`,
      subject: newMailInput.subject,
      body: newMailInput.body,
      time: 'Justo ahora',
      read: true
    };
    setMails([newM, ...mails]);
    setNewMailInput({ to: 'Pepper Potts', subject: '', body: '' });

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'mails', newM.id), {
        ...newM,
        userId: auth.currentUser.uid
      }).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/mails/${newM.id}`);
      });
    }
  };

  // Meta Connect Handlers (Facebook, Instagram, WhatsApp, Threads)
  const handleAddFbPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFbPostText.trim()) return;
    const newPost = {
      id: 'fb-' + crypto.randomUUID(),
      author: 'Tony Stark',
      content: newFbPostText,
      time: 'Hace un momento',
      likes: 0
    };
    const updated = [newPost, ...fbPosts];
    setFbPosts(updated);
    setNewFbPostText('');
  };

  const handleAddIgPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgCaption.trim()) return;
    const newPost = {
      id: 'ig-' + crypto.randomUUID(),
      author: 'tonystarkofficial',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60',
      caption: newIgCaption,
      likes: 0,
      rType: 'tech'
    };
    const updated = [newPost, ...igPhotos];
    setIgPhotos(updated);
    setNewIgCaption('');
  };

  const handleSendWaMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaText.trim()) return;
    const textToSend = newWaText;
    const myMsg = {
      id: 'wa-' + crypto.randomUUID(),
      sender: 'Yo',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };
    const updatedWithMyMsg = [...waMessages, myMsg];
    setWaMessages(updatedWithMyMsg);
    setNewWaText('');

    // Automatic Jarvis response after a short timeout
    setTimeout(() => {
      const respMsg = {
        id: 'wa-' + crypto.randomUUID(),
        sender: 'Jarvis Meta Bridge',
        text: `Señor Stark, he procesado su mensaje WhatsApp encriptado: "${textToSend}". El túnel de datos está operando bajo máxima discreción de Onion.share.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      };
      setWaMessages(prev => [...prev, respMsg]);
    }, 1200);
  };

  const handleAddThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadsText.trim()) return;
    const newTh = {
      id: 'th-' + crypto.randomUUID(),
      author: 'Tony Stark',
      handle: '@tonystark',
      content: newThreadsText,
      time: '1s',
      replies: 0
    };
    const updated = [newTh, ...threadsFeed];
    setThreadsFeed(updated);
    setNewThreadsText('');
  };

  const toggleMetaConnected = (app: 'facebook' | 'instagram' | 'whatsapp' | 'threads') => {
    setMetaConnected(prev => ({
      ...prev,
      [app]: !prev[app]
    }));
  };

  // LocalStorage persistence for Meta Suite
  useEffect(() => {
    localStorage.setItem('stark_fb_posts', JSON.stringify(fbPosts));
  }, [fbPosts]);

  useEffect(() => {
    localStorage.setItem('stark_ig_photos', JSON.stringify(igPhotos));
  }, [igPhotos]);

  useEffect(() => {
    localStorage.setItem('stark_wa_messages', JSON.stringify(waMessages));
  }, [waMessages]);

  useEffect(() => {
    localStorage.setItem('stark_threads_feed', JSON.stringify(threadsFeed));
  }, [threadsFeed]);

  useEffect(() => {
    localStorage.setItem('stark_meta_connected', JSON.stringify(metaConnected));
  }, [metaConnected]);

  // Persistence for unified replies and search history
  useEffect(() => {
    localStorage.setItem('stark_post_replies', JSON.stringify(postReplies));
  }, [postReplies]);

  useEffect(() => {
    localStorage.setItem('stark_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // 1. Unified Simul-post handler
  const handlePerformSimulPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulPostText.trim()) return;

    const textToPublish = simulPostText;
    const publishedList: string[] = [];
    const uid = auth.currentUser?.uid;

    // A. Twitter / X
    if (selectedChannels.twitter) {
      const newPost: SocialPost = {
        id: crypto.randomUUID(),
        author: 'Tony Stark',
        handle: '@IronMan',
        avatar: '🟥',
        content: textToPublish,
        time: 'Justo ahora',
        likes: 1
      };
      setSocialPosts(prev => [newPost, ...prev]);
      publishedList.push('X/Twitter');
      
      if (uid) {
        setDoc(doc(db, 'users', uid, 'posts', newPost.id), {
          ...newPost,
          userId: uid
        }).catch(err => console.error("Error syncing Twitter simul-post:", err));
      }
    }

    // B. Facebook
    if (selectedChannels.facebook) {
      const newPost = {
        id: 'fb-' + crypto.randomUUID(),
        author: 'Tony Stark',
        content: textToPublish,
        time: 'Hace un momento',
        likes: 0
      };
      setFbPosts(prev => [newPost, ...prev]);
      publishedList.push('Facebook');
    }

    // C. Instagram
    if (selectedChannels.instagram) {
      const newPost = {
        id: 'ig-' + crypto.randomUUID(),
        author: 'tonystarkofficial',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60',
        caption: textToPublish,
        likes: 0,
        rType: 'tech'
      };
      setIgPhotos(prev => [newPost, ...prev]);
      publishedList.push('Instagram');
    }

    // D. Threads
    if (selectedChannels.threads) {
      const newTh = {
        id: 'th-' + crypto.randomUUID(),
        author: 'Tony Stark',
        handle: '@tonystark',
        content: textToPublish,
        time: '1s',
        replies: 0
      };
      setThreadsFeed(prev => [newTh, ...prev]);
      publishedList.push('Threads');
    }

    // E. Discord
    if (selectedChannels.discord) {
      const msgId = crypto.randomUUID();
      const newMsg = {
        id: msgId,
        user: 'Tony Stark',
        text: textToPublish,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '🟥'
      };
      setDiscordMessages(prev => [...prev, newMsg]);
      publishedList.push('Discord');
      
      if (uid) {
        setDoc(doc(db, 'users', uid, 'discord', msgId), {
          ...newMsg,
          userId: uid
        }).catch(err => console.error("Error syncing Discord simul-post:", err));
      }
    }

    // F. WhatsApp
    if (selectedChannels.whatsapp) {
      const myMsg = {
        id: 'wa-' + crypto.randomUUID(),
        sender: 'Yo',
        text: textToPublish,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: true
      };
      setWaMessages(prev => [...prev, myMsg]);
      publishedList.push('WhatsApp');

      setTimeout(() => {
        const respMsg = {
          id: 'wa-' + crypto.randomUUID(),
          sender: 'Jarvis Meta Bridge',
          text: `Señor Stark, he transmitido su aviso multicanal por WhatsApp: "${textToPublish}"`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        };
        setWaMessages(prev => [...prev, respMsg]);
      }, 1200);
    }

    // Clear input & Show success notification badge
    setSimulPostText('');
    setSimulPostSuccess(`Publicación simultánea exitosa en: ${publishedList.join(', ')}`);
    setTimeout(() => setSimulPostSuccess(null), 5000);
  };

  // 2. Reply in Unified Feed handler
  const handlePerformReply = (postId: string, type: string) => {
    if (!replyInputText.trim()) return;

    const newReply = {
      id: 'rep-' + crypto.randomUUID(),
      author: 'Tony Stark',
      text: replyInputText,
      time: 'Hace un momento'
    };

    setPostReplies(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newReply]
    }));

    // Trigger target network functional integration
    if (type === 'whatsapp') {
      const respMsg = {
        id: 'wa-' + crypto.randomUUID(),
        sender: 'Yo',
        text: `[Respuesta] ${replyInputText}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: true
      };
      setWaMessages(prev => [...prev, respMsg]);
    } else if (type === 'discord') {
      const msgId = crypto.randomUUID();
      const newMsg = {
        id: msgId,
        user: 'Tony Stark',
        text: `[Respuesta] ${replyInputText}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '🟥'
      };
      setDiscordMessages(prev => [...prev, newMsg]);

      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid, 'discord', msgId), {
          ...newMsg,
          userId: auth.currentUser.uid
        }).catch(err => console.error(err));
      }
    } else if (type === 'threads') {
      setThreadsFeed(prev => prev.map(t => t.id === postId ? { ...t, replies: t.replies + 1 } : t));
    }

    setReplyInputText('');
    setReplyingToId(null);
  };

  // 3. Tor & DuckDuckGo Search execution simulation
  const handlePerformSecureSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSearch = customQuery || searchQuery;
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchLoadingProgress(0);
    setSearchLoadingLogs([]);
    setSearchResults([]);

    if (!searchHistory.includes(queryToSearch)) {
      setSearchHistory(prev => [queryToSearch, ...prev].slice(0, 8));
    }

    const searchLogs = [
      searchEngine === 'tor' 
        ? '[CONFIG] Levantando proxy Onion.share local...' 
        : '[DNS] Resolviendo dns.duckduckgo.com mediante túnel DNS over HTTPS...',
      searchEngine === 'tor'
        ? '[CONEXIÓN] Buscando nodos de entrada Tor (guard)...'
        : '[ENCRIPTADO] Asegurando canal TLS v1.3 con DNS-Seeding...',
      searchEngine === 'tor'
        ? '[SALTOS] Hop 1: Dublín, Irlanda (Relay ' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.10.4)'
        : '[PROXY] Enrutando vía proxy de privacidad Stark en Múnich...',
      searchEngine === 'tor'
        ? '[SALTOS] Hop 2: Reikiavik, Islandia (Relay ' + Math.floor(Math.random() * 255) + '.91.' + Math.floor(Math.random() * 255) + '.67)'
        : '[SEGURIDAD] Anonimizando user-agent y eliminando cabeceras de rastreo...',
      searchEngine === 'tor'
        ? '[SALTOS] Hop 3 (Exit Node): Estocolmo, Suecia'
        : '[OK] Firma del protocolo de túnel verificada.',
      '[BÚSQUEDA] Transmitiendo término de consulta cifrado y decodificando respuesta...'
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < searchLogs.length) {
        setSearchLoadingLogs(prev => [...prev, searchLogs[currentLogIndex]]);
        setSearchLoadingProgress(prev => Math.min(prev + 18, 95));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setSearchLoadingProgress(100);
        
        const queryLower = queryToSearch.toLowerCase();
        let resultsList = [];

        if (queryLower.includes('reactor') || queryLower.includes('arc') || queryLower.includes('planos')) {
          resultsList = [
            {
              title: "★ Stark Arc Reactor Blueprints MK-85 (Decentralized Leak)",
              url: "onion://arc-core-blueprint-x85.onion/blueprint.pdf",
              snippet: "Fórmula matemática de confinamiento electromagnético estable para reactores Arc portátiles. Descarga del ledger inmutable v0.9 Beta. Incluye calibración de partículas theta.",
              date: "Hace 2 horas",
              category: "Física Cuántica"
            },
            {
              title: "Fusión Fría y Elementos Sintéticos Stark (Foro Tor)",
              url: "onion://tor-fusion-physics.onion/discussion/6492",
              snippet: "Discusión de física avanzada: Cómo sintetizar el nuevo elemento sin paladio metálico utilizando aceleración de partículas sincrotrónicas de baja fricción.",
              date: "Hace 1 semana",
              category: "Investigación"
            },
            {
              title: "Stark Industries Patent Office - Emergency Bypass",
              url: searchEngine === 'tor' ? "onion://patent-bypass.stark.onion" : "https://duckduckgo.com/?q=stark+reactor+patents",
              snippet: "Portal secundario de patentes de Stark Industries. Registros públicos de generadores eco-limpios de fusión por confinamiento inercial.",
              date: "Hace 3 días",
              category: "Patentes"
            }
          ];
        } else if (queryLower.includes('speedforce') || queryLower.includes('flash') || queryLower.includes('barry')) {
          resultsList = [
            {
              title: "⚡ The Speedforce Quantum Friction & Tachyon Records",
              url: "onion://speedforce-tachyon-registry.onion/records",
              snippet: "Medición en vivo de la energía de la tormenta de taquiones generada por la Speedforce de Barry Allen. Interacción con el reactor Stark Arc a nivel nano-molecular.",
              date: "En vivo",
              category: "Speedforce Logs"
            },
            {
              title: "Velocity-9 Synthesizer and Chemical Limits",
              url: "onion://v9-experimental-labs.onion/formula-limits",
              snippet: "Fórmula química experimental de Velocity-9 con estabilizador Arc-Core. Advertencia: Efecto taquiónico altamente adictivo y degradación celular reparada por nanites.",
              date: "Hace 3 semanas",
              category: "Laboratorios"
            },
            {
              title: "Multiverse Chronomoto Tunnel Routing",
              url: searchEngine === 'tor' ? "onion://multiverse-gate-routing.onion" : "https://duckduckgo.com/?q=time+dilation+speedforce",
              snippet: "Análisis de dilatación temporal y viajes espaciotemporales mediante propulsión Speedforce taquiónica coordinada. Simulaciones Stark de paradojas cuánticas.",
              date: "Hace 5 días",
              category: "Líneas de Tiempo"
            }
          ];
        } else if (queryLower.includes('casino') || queryLower.includes('blockchain') || queryLower.includes('wager') || queryLower.includes('solidity')) {
          resultsList = [
            {
              title: "🎲 Solidity BetVerifier.sol Cryptographic Integrity Schema",
              url: "onion://betverifier-stark-casino.onion/source",
              snippet: "Contrato inteligente provisto de un oráculo cuántico que asegura la inmutabilidad de cada apuesta del reactor Arc. Verificación criptográfica transparente libre de colusiones industriales.",
              date: "Hace 12 min",
              category: "Contratos Inteligentes"
            },
            {
              title: "Onion-Share Decentralized Wager Backends",
              url: "onion://onion-casino-vaults.onion/ledger",
              snippet: "Enlace ininterrumpido con bóvedas anónimas distribuidas en múltiples servidores de respaldo en la nube del reactor Stark. Resistencia a censuras federales.",
              date: "Hace 4 horas",
              category: "Servidores"
            }
          ];
        } else if (queryLower.includes('onion') || queryLower.includes('tor') || queryLower.includes('seguridad') || queryLower.includes('secure')) {
          resultsList = [
            {
              title: "🛡️ Onion-Share Tunnel redundant configuration guides",
              url: "onion://onion-setup-redundant.onion/instructions",
              snippet: "Cómo levantar nodos espejo Onion.share secundarios de baja latencia utilizando contenedores Docker ligeros y cifrado asimétrico Stark de llave elíptica.",
              date: "Hace 1 día",
              category: "Ciberseguridad"
            },
            {
              title: "Rotación de llaves cuánticas Stark-Shield",
              url: "onion://shield-keys-rotation-v3.onion/main",
              snippet: "Guía metodológica para la automatización de firmas de nodos descentralizados a nivel cuántico. Previene intrusiones gubernamentales por fuerza bruta.",
              date: "Hace 10h",
              category: "Firmas"
            }
          ];
        } else {
          resultsList = [
            {
              title: `🔍 Stark Secure Result: "${queryToSearch}"`,
              url: searchEngine === 'tor' ? `onion://stark-query-indexed.onion/search?q=${encodeURIComponent(queryToSearch)}` : `https://duckduckgo.com/?q=${encodeURIComponent(queryToSearch)}`,
              snippet: `Resultado anonimizado para la búsqueda de "${queryToSearch}". Toda la transferencia de datos e indexación se completó desde el túnel seguro Onion.share respaldado por la energía estable de nuestro Reactor Arc.`,
              date: "Hace un momento",
              category: "Búsqueda Unificada"
            },
            {
              title: "Leaked S.H.I.E.L.D. Secure Archives v4.22",
              url: "onion://shield-leaked-archives.onion/index",
              snippet: "Archivos filtrados clasificados acerca de iniciativas extraterrestres de fuente de energía ininterrumpida y protocolos de defensa satelital a nivel global.",
              date: "Hace 4 semanas",
              category: "Leaks"
            },
            {
              title: "DuckDuckGo Privacy Seeder Mode",
              url: "https://duckduckgo.com",
              snippet: "DuckDuckGo sirve como la pasarela abierta para navegaciones cifradas seguras que protegen el ledger contra intermediarios de rastreo publicitario.",
              date: "Estable",
              category: "Motores Abiertos"
            }
          ];
        }

        setSearchResults(resultsList);
        setIsSearching(false);
      }
    }, 450);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans bg-laser-grid relative flex flex-col selection:bg-stark-scarlet selection:text-white pb-8 transition-all duration-300 ${
      isSpeedforceActive ? 'animate-speedforce-flash' : ''
    }`}>
      
      {/* Stark Scarlet Gold highlight bar */}
      <div className="w-full h-1 bg-gradient-to-r from-stark-scarlet-dark via-stark-scarlet to-liquid-gold-light animate-gold-wave opacity-95" style={{ backgroundSize: '200% 100%' }} />

      {/* Main Container Header */}
      <header className="max-w-7xl w-full mx-auto px-4 pt-5 pb-3 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-onion-purple/30 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Neon Purple onion indicator */}
          <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-onion-purple flex items-center justify-center shadow-[0_0_15px_rgba(157,78,221,0.5)] animate-pulse">
            <Lock className="w-5 h-5 text-onion-purple-light" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
              P0inT-<span className="text-onion-purple-light font-black">Z3R0</span> <span className="text-[10px] font-mono font-bold bg-onion-purple/20 text-onion-purple-light px-1.5 py-0.5 rounded border border-onion-purple/30">ONION CASINO</span>
            </h1>
            <p className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              SYSTEM CONSOLE // ONION.SHARE TUNNELED // SPEEDFORCE SYNCHRONIZED
            </p>
          </div>
        </div>

        {/* Global multiwindow trigger button & Speedforce status indicators */}
        <div className="flex items-center gap-3 flex-wrap justify-center font-mono text-[10px]">
          {/* FIREBASE AUTH SEGMENT */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/25 rounded-lg px-2.5 py-1">
              <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-400 text-[8px]">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-300 truncate max-w-[80px]">
                  {user.displayName || 'Stark Agent'}
                </span>
                <span className={`text-[7px] font-semibold font-mono tracking-wider ${
                  user.email === 'uniswap_connected' ? 'text-pink-400' : 'text-emerald-400'
                }`}>
                  {user.email === 'uniswap_connected' ? 'UNISWAP BRIDGED' : 'CLOUD SYNCED'}
                </span>
              </div>
              <button 
                onClick={async () => {
                  try {
                    localStorage.removeItem('stark_uniswap_user');
                    localStorage.removeItem('stark_uniswap_address');
                    await logoutUser();
                    setUser(null);
                  } catch (e) {
                    console.error("Logout failed", e);
                  }
                }}
                className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                title="Disconnect identity"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthChoice(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-onion-purple via-indigo-600 to-indigo-500 hover:from-onion-purple-light hover:to-indigo-400 border border-onion-purple/30 text-white rounded-lg px-3 py-1 cursor-pointer transition shadow-[0_0_12px_rgba(157,78,221,0.25)] hover:shadow-[0_0_18px_rgba(157,78,221,0.4)]"
            >
              <LogIn className="w-3 h-3" />
              <span className="font-display font-bold">INICIAR SESIÓN / WALLET</span>
            </button>
          )}

          {/* MULTIWINDOW CONTROL SWITCH (Unlockable after sync or immediately) */}
          <button
            id="multiwindow-floating-trigger"
            onClick={() => setShowMultiwindow(true)}
            className={`relative px-4 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              isSynced 
                ? 'bg-stark-scarlet border-stark-scarlet text-white shadow-[0_0_15px_rgba(255,45,85,0.5)] animate-pulse hover:bg-stark-scarlet/90' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${isSynced ? 'animate-spin' : ''}`} />
            <span>ESCRITORIO MULTIVENTANA</span>
            {isSynced && (
              <span className="absolute -top-1 px-1 bg-liquid-gold text-slate-950 font-mono text-[8px] rounded font-bold right-2 animate-bounce">
                READY
              </span>
            )}
          </button>

          <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-slate-500 font-bold">TUNEL:</span>
            <span className="text-white font-bold">{wallet.mixingEnabled ? 'ANONIMIZADO' : 'DIRECTO'}</span>
          </div>

          <div className="bg-slate-900 px-3 py-1 rounded-lg border border-stark-scarlet/20 flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 bg-stark-scarlet rounded-full shadow-[0_0_8px_#ff2d55]" />
            <span className="text-slate-500 font-bold">SPEEDFORCE:</span>
            <span className={`${isSynced ? 'text-stark-scarlet' : 'text-slate-400'} font-bold`}>
              {isSynced ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Bento Grid layout */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN (Casino Games, Speedforce controller) */}
        <section className="lg:col-span-8 flex flex-col gap-6 h-full">
          
          {/* Main Casino area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* The Games container */}
            <div className="md:col-span-8 flex flex-col h-full">
              <CasinoGames 
                wallet={wallet}
                onUpdateWallet={handleUpdateWallet}
                onTriggerZap={handleTriggerZap}
                onTriggerContract={handleTriggerContract}
                onGameActiveChange={setIsGameActive}
              />
            </div>

            {/* Core Arc Reactor visual & Speedforce Sync Center */}
            <div className="md:col-span-4 flex flex-col justify-between h-full gap-5">
              
              <ArcReactor 
                btcTrend={btcTrend} 
                isActive={isGameActive} 
                intensity={reactorIntensity} 
                btcPrice={btcPrice}
              />

              {/* SPEEDFORCE STARK SYNCHRONIZATION HARDWARE */}
              <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-md font-mono text-[11px] glow-box-scarlet flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-stark-scarlet/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-stark-scarlet font-bold tracking-wider flex items-center gap-1 text-[11px]">
                    <Flame className="w-4 h-4" /> COMPONENTES SPEEDFORCE
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                    isSynced ? 'bg-stark-scarlet/20 text-stark-scarlet' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isSynced ? 'CONECTADO' : 'SIN CONFIG'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Sincroniza tus correos seguros y perfiles sociales directamente dentro de la red del casino Stark.
                </p>

                {isSpeedforceSyncing ? (
                  <div className="bg-slate-950 p-2 border border-stark-scarlet/30 rounded text-[9px] flex flex-col gap-1 max-h-28 overflow-y-auto">
                    {syncHistory.map((h, i) => (
                      <div key={i} className="text-stark-scarlet flex items-start gap-1">
                        <span className="text-liquid-gold">⚡</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      id="speedforce-lightning-sync-button"
                      onClick={handleSpeedforceSync}
                      className="w-full h-11 bg-gradient-to-r from-stark-scarlet to-liquid-gold text-slate-950 font-display font-extrabold text-xs tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,45,85,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      <Zap className="w-5 h-5 fill-current animate-bounce text-slate-950" />
                      <span>VINCULAR CUENTAS (SPEEDFORCE)</span>
                    </button>

                    {isSynced && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMultiwindow(true)}
                          className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-stark-scarlet/40 text-[10px] py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-stark-scarlet" />
                          VER MULTIVENTANA
                        </button>
                        <button
                          onClick={handleResetSync}
                          className="px-2.5 bg-slate-950 border border-slate-900 text-slate-600 hover:text-rose-400 text-[10px] py-1 rounded-lg"
                          title="Restaurar cuentas"
                        >
                          RESET
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* OJO DE AGAMOTTO // COMPILADOR DE GAMEPLAY Y REVIEWS */}
              <div className="bg-slate-900/40 border border-emerald-500/20 p-4 rounded-2xl backdrop-blur-md font-mono text-[11px] glow-box-agamotto flex flex-col gap-3 relative overflow-hidden mt-1">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Video className="w-4 h-4 animate-pulse" /> GRABADOR DE AGAMOTTO
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                    isRecording ? 'bg-rose-950 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {isRecording ? `REC ${recordedTime}s` : 'TEMPORAL MASTER'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Graba tu pantalla de juego, cámara frontal y de entorno en tiempo real sobre la red inmutable de <span className="text-onion-purple-light font-bold">onion.share</span>. ¡Gana un pago inmediato de <span className="text-emerald-400 font-bold">+500 ARC COINS + 0.05 BTC</span>!
                </p>

                {/* EMERALD GREEN AGAMOTTO GEM BUTTON ( controls time ! ) */}
                <div className="flex flex-col items-center justify-center py-2.5 bg-slate-950/60 rounded-xl border border-slate-900 relative">
                  
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* Pulsing scarlet warning light inside emerald glowing ring */}
                      <button
                        onClick={stopAgamottoRecording}
                        className="w-12 h-12 rounded-full bg-rose-650 hover:bg-rose-600 border-4 border-rose-300 shadow-[0_0_25px_#ff2d55] flex items-center justify-center animate-pulse text-white cursor-pointer"
                        title="Detener gema"
                      >
                        <X className="w-5 h-5 stroke-[3]" />
                      </button>
                      <span className="text-[10px] font-bold text-rose-400 tracking-widest animate-pulse mt-1">SINCRO TEMPORAL EN CURSO</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {/* TRUE EMERALD GREEN PULSING JEWEL OF AGAMOTTO */}
                      <button
                        onClick={startAgamottoRecording}
                        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-green-900 border-4 border-emerald-300 shadow-[0_0_30px_rgba(0,255,136,0.9)] hover:scale-105 active:scale-95 transition-all text-emerald-100 flex items-center justify-center cursor-pointer group"
                        title="Girar Ojo de Agamotto"
                      >
                        {/* Mystic spinning circle vector overlay */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-300/60 animate-[spin_10s_linear_infinite]" />
                        <Sparkles className="w-5 h-5 text-white animate-spin" />
                      </button>
                      <span className="text-[9px] font-black text-emerald-400 tracking-wider">PRESIONAR GEMA ESMERALDA</span>
                    </div>
                  )}

                  {/* Multiplier Promo Badge */}
                  <div className="absolute top-1.5 right-1.5 px-1.5 bg-emerald-500/10 text-emerald-400 text-[8px] rounded border border-emerald-500/20 font-bold">
                    BONUS +500 ARC
                  </div>
                </div>

                {/* Stream Composite Monitor (Picture-in-Picture display) */}
                {(isRecording || recordingSuccess) && (
                  <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl flex flex-col gap-2">
                    <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 border-b border-slate-900 pb-1">
                      <Tv className="w-3.5 h-3.5 text-onion-purple-light" /> MONITOR COMPUESTO DE AGAMOTTO (COMPILADO)
                    </span>

                    {/* Inner virtual viewport matrix */}
                    <div className="grid grid-cols-3 gap-1 relative overflow-hidden bg-slate-900/60 p-1 rounded border border-slate-800 h-24">
                      {/* Layout 1: Screen Gameplay Stream */}
                      <div className="col-span-2 bg-slate-950/80 border border-slate-800 rounded relative group flex items-center justify-center text-center overflow-hidden">
                        <div className="text-[8px] text-emerald-400 flex flex-col items-center">
                          <LayoutGrid className="w-4 h-4 text-emerald-400/80 mb-1 animate-pulse" />
                          <span className="font-bold text-[7px] tracking-tight">SCREEN_SHARE.LOG</span>
                        </div>
                        {isRecording && (
                          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                        )}
                        <span className="absolute bottom-1 right-1 text-[7px] text-slate-500">PANTALLA</span>
                      </div>

                      {/* Layout 2: Webcam Selfie Stream */}
                      <div className="col-span-1 flex flex-col gap-1">
                        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded relative overflow-hidden flex items-center justify-center text-center">
                          {localCamAvailable && cameraStream ? (
                            <video
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              playsInline
                              ref={(el) => {
                                if (el && cameraStream) {
                                  el.srcObject = cameraStream;
                                }
                              }}
                            />
                          ) : (
                            <div className="text-[7px] text-emerald-400/80 flex flex-col items-center">
                              <Camera className="w-3.5 h-3.5 text-emerald-400/80 animate-bounce mb-0.5" />
                              <span className="scale-90 font-bold text-[6px]">USER_CAM</span>
                            </div>
                          )}
                          <span className="absolute bottom-0 px-0.5 bg-slate-950/80 text-white text-[6px] right-0 rounded">FRONTAL</span>
                        </div>

                        {/* Layout 3: POV Environmental Stream */}
                        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded relative flex items-center justify-center text-center overflow-hidden">
                          <div className="text-[7px] text-emerald-400/80 flex flex-col items-center">
                            <Video className="w-3.5 h-3.5 text-emerald-400/80 animate-pulse mb-0.5" />
                            <span className="scale-90 font-bold text-[6px]">POV_ROOM</span>
                          </div>
                          <span className="absolute bottom-0 px-0.5 bg-slate-950/80 text-white text-[6px] right-0 rounded">TRASERA</span>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none animate-pulse" />
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1">
                      <div 
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${(recordedTime / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Console logs */}
                {agamottoLogs.length > 0 && (
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded text-[9px] flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {agamottoLogs.map((log, idx) => (
                      <div key={idx} className="text-slate-300 flex items-start gap-1 leading-normal">
                        <span className="text-emerald-400">❖</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Claiming social view rewards */}
                {recordingSuccess && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 uppercase">
                      🚀 COMPILAR EXPANSIÓN VIRAL
                    </span>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Publica este clip en redes cifradas para ganar hasta <span className="text-emerald-400 font-bold">+250 ARC</span> adicionales al rebasar 3,000 views.
                    </p>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleShareAgamottoClip('tiktok')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-[9px] py-1 px-1 rounded font-bold cursor-pointer transition-colors"
                      >
                        TikTok Reel
                      </button>
                      <button
                        onClick={() => handleShareAgamottoClip('x')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-[9px] py-1 px-1 rounded font-bold cursor-pointer transition-colors"
                      >
                        X.com Post
                      </button>
                      <button
                        onClick={() => handleShareAgamottoClip('discord')}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 text-[9px] py-1 px-1 rounded font-bold cursor-pointer transition-colors"
                      >
                        Discord Room
                      </button>
                    </div>

                    {socialViews > 0 && (
                      <div className="flex items-center justify-between border-t border-slate-900 pt-2 font-mono text-[9px]">
                        <span className="text-slate-500">Métricas de red:</span>
                        <span className="font-extrabold text-emerald-400 animate-pulse bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900">
                          📈 {socialViews.toLocaleString()} VIEWS
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Wallet Container */}
          <div className="flex flex-col">
            <CryptoWallet 
              wallet={wallet} 
              onUpdateWallet={handleUpdateWallet}
              onTriggerZap={handleTriggerZap}
            />
          </div>

        </section>

        {/* RIGHT COLUMN (Simplified tabbed Operations Console: Jarvis, Solidity, Zap) */}
        <section className="lg:col-span-4 flex flex-col gap-4 h-full">
          
          {/* Simplified operations card tabs */}
          <div className="flex flex-col h-full bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden glow-box-scarlet">
            <div className="flex bg-slate-950 p-1 border-b border-slate-800 flex-wrap">
              <button
                id="cmd-tab-jarvis"
                onClick={() => setCommandTab('jarvis')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 font-display text-[10px] sm:text-[11px] font-bold tracking-wider rounded-lg transition-all ${
                  commandTab === 'jarvis' 
                    ? 'bg-stark-scarlet/15 text-stark-scarlet border border-stark-scarlet/20 font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> J.A.R.V.I.S. AI
              </button>
              
              <button
                id="cmd-tab-contracts"
                onClick={() => setCommandTab('contracts')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 font-display text-[10px] sm:text-[11px] font-bold tracking-wider rounded-lg transition-all ${
                  commandTab === 'contracts' 
                    ? 'bg-stark-scarlet/15 text-stark-scarlet border border-stark-scarlet/20 font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> SMART CODE
              </button>

              <button
                id="cmd-tab-zap"
                onClick={() => setCommandTab('zap')}
                className={`flex-1 flex items-center justify-center gap-1 py-2 font-display text-[10px] sm:text-[11px] font-bold tracking-wider rounded-lg transition-all ${
                  commandTab === 'zap' 
                    ? 'bg-stark-scarlet/15 text-stark-scarlet border border-stark-scarlet/20 font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> ZAP WEBHOOK
              </button>
            </div>

            {/* TAB CONTAINER BODY */}
            <div className="flex-1 p-2">
              {commandTab === 'jarvis' && (
                <div className="h-[430px] lg:h-full flex flex-col justify-between">
                  <JarvisCompanion 
                    wallet={wallet}
                    btcPrice={btcPrice}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isGenerating={isGenerating}
                  />
                </div>
              )}

              {commandTab === 'contracts' && (
                <div className="h-[430px] lg:h-full">
                  <SmartContracts 
                    contracts={contracts} 
                    onDeployContract={handleDeployContract}
                    onClearLogs={handleClearContractLogs}
                  />
                </div>
              )}

              {commandTab === 'zap' && (
                <div className="h-[430px] lg:h-full">
                  <ZapAutomation 
                    triggers={triggers} 
                    onToggleTrigger={handleToggleZapTrigger}
                    onClearHistory={handleClearZapHistory}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Quick status report help */}
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[9px] font-mono text-slate-500 leading-normal flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 text-stark-scarlet shrink-0 mt-0.5" />
            <span>
              Su conexión de túnel Onion se cifra localmente. El reactor Stark destella un color escarlata al momento de invocar transustanciación taquiónica en la Speedforce.
            </span>
          </div>

        </section>

      </main>

      {/* FLOATING MULTI-WINDOW DRAWER CONTROL DECK (Stays inside the app!) */}
      {showMultiwindow && (
        <div 
          id="multiwindow-desktop-overlay"
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-[fadeIn_0.3s_ease]"
        >
          <div className="bg-slate-950 border-2 border-stark-scarlet rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-[0_0_35px_rgba(255,45,85,0.4)]">
            
            {/* Window header */}
            <div className="bg-slate-900 border-b border-stark-scarlet/30 p-4 flex justify-between items-center text-sm font-mono tracking-wider font-bold">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-stark-scarlet animate-pulse" />
                <span className="text-white">ESCRITORIO MULTIVENTANA STARK OPERATIONAL v3.6</span>
                {isSynced ? (
                  <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500 text-emerald-400 rounded text-[9px] font-bold uppercase animate-pulse">
                    SPEEDFORCE DECK SYNCED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-950/40 border border-rose-500 text-rose-400 rounded text-[9px] font-bold uppercase">
                    NO SPEEDFORCE SYNC
                  </span>
                )}
              </div>
              <button
                id="close-multiwindow-btn"
                onClick={() => setShowMultiwindow(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Split layout: Tab navigation + Interactive workspaces */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-laser-grid">
              
              {/* Vertical layout controls */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-slate-900 p-3 bg-slate-950/80 flex flex-row md:flex-col gap-2 font-mono text-[11px] shrink-0">
                <span className="hidden md:block text-slate-500 font-bold uppercase tracking-wider text-[9px] px-2 mb-1">
                  CUENTAS ENLACE
                </span>

                <button
                  onClick={() => setMultiActiveTab('mails')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'mails' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Stark Mail Inbox</span>
                </button>

                <button
                  onClick={() => setMultiActiveTab('twitter')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'twitter' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Twitter className="w-4 h-4" />
                  <span>Feed de X.com</span>
                </button>

                <button
                  onClick={() => setMultiActiveTab('discord')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'discord' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Hacker Discord</span>
                </button>

                <button
                  id="multi-active-tab-meta-btn"
                  onClick={() => setMultiActiveTab('meta')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'meta' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Facebook className="w-4 h-4 text-blue-400" />
                  <span>Meta Suite Portal</span>
                </button>

                <button
                  id="multi-active-tab-social-btn"
                  onClick={() => setMultiActiveTab('social_command')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'social_command' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Mando Social Unificado</span>
                </button>

                <button
                  id="multi-active-tab-search-btn"
                  onClick={() => setMultiActiveTab('secure_search')}
                  className={`flex-1 md:flex-none flex items-center gap-2 py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                    multiActiveTab === 'secure_search' 
                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-reactor-cyan" />
                  <span>Buscador Tor / DDG</span>
                </button>

                {/* Direct info note */}
                <div className="hidden md:block mt-auto border-t border-slate-900 pt-3 text-[9px] text-slate-600 leading-normal">
                  <p className="font-bold text-slate-400">¿Qué es multiventana?</p>
                  Permite interactuar fluida y ágilmente con cada cuenta social sin salir de la app virtual del reactor.
                </div>
              </div>

              {/* Dynamic Interactive Workspace Area */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
                
                {/* 1. EMAILS TAB */}
                {multiActiveTab === 'mails' && (
                  <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base">STARK ENCRYPTED MAIL SERVICE</h3>
                        <span className="font-mono text-[9px] text-slate-500">CORREOS VINCULADOS CON SPEEDFORCE</span>
                      </div>
                      <span className="px-2 py-0.5 bg-stark-scarlet/10 border border-stark-scarlet/30 font-mono text-[9px] text-stark-scarlet rounded font-bold">
                        tony@stark.com
                      </span>
                    </div>

                    {!isSynced ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                        <Mail className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="font-mono text-xs text-slate-400">
                          Acceso denegado. Presiona vincular cuentas (Speedforce) en el escritorio para desencriptar el correo Stark Secure.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Mail reading panel */}
                        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                          {mails.map(m => (
                            <div key={m.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 font-mono text-xs hover:border-stark-scarlet/30 transition-all">
                              <div className="flex justify-between font-bold text-slate-300">
                                <span className="text-white">{m.sender}</span>
                                <span className="text-slate-500 text-[10px]">{m.time}</span>
                              </div>
                              <div className="text-stark-scarlet text-[11px] font-bold mt-1">{m.subject}</div>
                              <p className="text-slate-400 text-[11px] mt-1 leading-normal">{m.body}</p>
                            </div>
                          ))}
                        </div>

                        {/* Send new simulated secure Stark mail */}
                        <form onSubmit={handleAddMail} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col gap-2 text-xs font-mono">
                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
                            ENVIAR CORREO ENCONSTRADO (Simulación modular)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newMailInput.to}
                              onChange={(e) => setNewMailInput({...newMailInput, to: e.target.value})}
                              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-300 focus:outline-none"
                            >
                              <option value="Pepper Potts">Pepper Potts</option>
                              <option value="Nick Fury">Nick Fury</option>
                              <option value="Bruce Banner">Bruce Banner</option>
                            </select>
                            <input
                              type="text"
                              value={newMailInput.subject}
                              placeholder="Asunto"
                              onChange={(e) => setNewMailInput({...newMailInput, subject: e.target.value})}
                              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMailInput.body}
                              placeholder="Escribe el cuerpo del mensaje confidencial Stark..."
                              onChange={(e) => setNewMailInput({...newMailInput, body: e.target.value})}
                              className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none"
                              required
                            />
                            <button
                              type="submit"
                              className="px-4 py-1 bg-stark-scarlet text-white font-bold text-xs rounded hover:brightness-110"
                            >
                              ENVIAR
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* 2. TWITTER TAB */}
                {multiActiveTab === 'twitter' && (
                  <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base">TWITTER // X.COM LIVE FEEDS</h3>
                        <span className="font-mono text-[9px] text-slate-500">MOCK FEED SECURE TUNNEL</span>
                      </div>
                      <span className="px-2 py-0.5 bg-stark-scarlet/10 border border-stark-scarlet/30 font-mono text-[9px] text-stark-scarlet rounded font-bold">
                        @IronMan_Official
                      </span>
                    </div>

                    {!isSynced ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                        <Twitter className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="font-mono text-xs text-slate-400">
                          Enlace social inactivo. Presione vincular perfiles (Speedforce) en el escritorio virtual.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Feed items */}
                        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                          {socialPosts.map(p => (
                            <div key={p.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex gap-3 text-xs font-mono">
                              <span className="text-xl bg-slate-950 w-8 h-8 rounded-full flex items-center justify-center border border-slate-800 shrink-0">
                                {p.avatar}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-bold">{p.author}</span>
                                  <span className="text-slate-500 text-[10px]">{p.handle} · {p.time}</span>
                                </div>
                                <p className="text-slate-300 text-[11px] mt-1 leading-normal">{p.content}</p>
                                <div className="mt-2 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                                  <span>❤️ {p.likes.toLocaleString()}</span>
                                  <span className="text-slate-700">|</span>
                                  <span className="text-reactor-cyan">⚡ Retuit Stark Secure</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Interactive compose mock tweet */}
                        <form onSubmit={handleAddTweet} className="flex gap-2 bg-slate-900 p-3.5 rounded-xl border border-slate-800 items-center">
                          <input
                            type="text"
                            value={newTweetText}
                            placeholder="Publicar nuevo tweet inmutable Stark..."
                            onChange={(e) => setNewTweetText(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-850 rounded px-3 py-2 text-xs text-white focus:outline-none"
                            required
                          />
                          <button
                            type="submit"
                            className="px-5 py-2 bg-stark-scarlet text-white font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all"
                          >
                            X-TWEET
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* 3. DISCORD HACKER CHANNEL TAB */}
                {multiActiveTab === 'discord' && (
                  <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base">STARK DECENTRALIZED DISCORD</h3>
                        <span className="font-mono text-[9px] text-slate-500">CHANNELS: #hacker-and-gamers</span>
                      </div>
                      <span className="px-2 py-0.5 bg-stark-scarlet/10 border border-stark-scarlet/30 font-mono text-[9px] text-stark-scarlet rounded font-bold">
                        discord.gg/stark-mansion
                      </span>
                    </div>

                    {!isSynced ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                        <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                        <p className="font-mono text-xs text-slate-400">
                          Canal bloqueado. El bridge de taquiones Speedforce requiere confirmación inmutable.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Discord messages list */}
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                          {discordMessages.map((d, i) => (
                            <div key={i} className="text-[11px] font-mono leading-relaxed pb-1.5 last:pb-0 border-b border-slate-900 last:border-0">
                              <span className="mr-1.5">{d.avatar}</span>
                              <span className="text-reactor-cyan font-bold mr-1">{d.user}</span>
                              <span className="text-[9px] text-slate-600 mr-2">[{d.time}]</span>
                              <span className="text-slate-300">{d.text}</span>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Discord Message Input */}
                        <form onSubmit={handleAddDiscord} className="flex gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 items-center">
                          <input
                            type="text"
                            value={newDiscordText}
                            placeholder="Escribe un mensaje de equipo en #discord-stark-room..."
                            onChange={(e) => setNewDiscordText(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-stark-scarlet"
                            required
                          />
                          <button
                            type="submit"
                            className="p-2 bg-stark-scarlet rounded-xl text-white hover:brightness-110 flex items-center justify-center shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* 4. META SUITE PORTAL TAB */}
                {multiActiveTab === 'meta' && (
                  <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-[fadeIn_0.2s_ease]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-900 pb-3 gap-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base">STARK DECENTRALIZED META BRIDGE</h3>
                        <span className="font-mono text-[9px] text-slate-500">SECURE TUNNELS FOR FACEBOOK, INSTAGRAM, WHATSAPP & THREADS</span>
                      </div>
                      
                      {/* Top quick state summary */}
                      <span className="px-2 py-0.5 bg-blue-950/40 border border-blue-500 text-blue-400 font-mono text-[9px] rounded font-bold uppercase animate-pulse shrink-0">
                        META-GRAPH PROTOCOL ACTIVE
                      </span>
                    </div>

                    {!isSynced ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                        <Facebook className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                        <p className="font-mono text-xs text-slate-400">
                          Enlace Meta Portal restringido. Active la sincronización de Speedforce en el escritorio del Reactor para levantar el puente taquiónico de Meta.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                        
                        {/* Interactive Meta platform Selector Bar */}
                        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] shrink-0">
                          <button
                            onClick={() => setMetaActiveSubTab('facebook')}
                            className={`py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              metaActiveSubTab === 'facebook'
                                ? 'bg-blue-950/60 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                : 'bg-slate-900/45 border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Facebook className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Facebook</span>
                          </button>

                          <button
                            onClick={() => setMetaActiveSubTab('instagram')}
                            className={`py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              metaActiveSubTab === 'instagram'
                                ? 'bg-pink-950/60 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                                : 'bg-slate-900/45 border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Instagram className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Instagram</span>
                          </button>

                          <button
                            onClick={() => setMetaActiveSubTab('whatsapp')}
                            className={`py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              metaActiveSubTab === 'whatsapp'
                                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'bg-slate-900/45 border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            onClick={() => setMetaActiveSubTab('threads')}
                            className={`py-1.5 px-2 rounded-lg border text-center font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              metaActiveSubTab === 'threads'
                                ? 'bg-slate-800 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.15)]'
                                : 'bg-slate-900/45 border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <AtSign className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">Threads</span>
                          </button>
                        </div>

                        {/* Connection status card for the active sub-tab */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs font-mono shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${metaConnected[metaActiveSubTab] ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]'}`} />
                            <span className="text-slate-300 uppercase tracking-wide text-[10px]">
                              Canal {metaActiveSubTab}: {metaConnected[metaActiveSubTab] ? 'Puente Encriptado Enlazado' : 'Requiere Encriptar'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => toggleMetaConnected(metaActiveSubTab)}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              metaConnected[metaActiveSubTab]
                                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-400 hover:bg-rose-900'
                                : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900'
                            }`}
                          >
                            {metaConnected[metaActiveSubTab] ? 'DESCONECTAR PUENTE' : 'CONECTAR A META'}
                          </button>
                        </div>

                        {/* Main Interaction Area */}
                        <div className="flex-1 overflow-hidden min-h-[180px] flex flex-col justify-between">
                          
                          {/* If app is not active linked */}
                          {!metaConnected[metaActiveSubTab] ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-900 font-mono">
                              <Shield className="w-8 h-8 text-amber-500/50 mb-2 animate-pulse" />
                              <h4 className="text-white font-bold text-xs uppercase mb-1">ACCESO CIFRADO RESTRUCTURADO</h4>
                              <p className="text-[10px] text-slate-500 max-w-sm mb-4">
                                Presione el botón 'CONECTAR A META' para encriptar el túnel Onion.share y sincronizar la base de datos distribuida Stark.
                              </p>
                              <button
                                onClick={() => toggleMetaConnected(metaActiveSubTab)}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-indigo-500 hover:brightness-110 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(99,102,241,0.25)] cursor-pointer"
                              >
                                Encender Puente {metaActiveSubTab}
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-between overflow-hidden gap-3.5">
                              
                              {/* 4a. FACEBOOK TAB */}
                              {metaActiveSubTab === 'facebook' && (
                                <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-[fadeIn_0.2s_ease]">
                                  {/* Posts Area */}
                                  <div className="flex-1 overflow-y-auto max-h-[140px] flex flex-col gap-2 p-1">
                                    {fbPosts.map(p => (
                                      <div key={p.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs font-mono">
                                        <div className="flex justify-between items-center mb-1 text-[11px]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] p-0.5 bg-blue-500 text-white rounded font-bold shrink-0">FB</span>
                                            <span className="text-white font-bold">{p.author}</span>
                                          </div>
                                          <span className="text-slate-500 text-[9px]">{p.time}</span>
                                        </div>
                                        <p className="text-slate-300 text-[11px] leading-relaxed">{p.content}</p>
                                        <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500">
                                          <button 
                                            onClick={() => {
                                              setFbPosts(prev => prev.map(old => old.id === p.id ? { ...old, likes: old.likes + 1 } : old));
                                            }}
                                            className="hover:text-blue-400 font-bold transition-colors cursor-pointer"
                                          >
                                            👍 Me gusta ({p.likes})
                                          </button>
                                          <span className="text-emerald-500/80 font-bold">✓ Cifrado de nodo completo</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Compose post */}
                                  <form onSubmit={handleAddFbPost} className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 items-center">
                                    <input
                                      type="text"
                                      value={newFbPostText}
                                      onChange={(e) => setNewFbPostText(e.target.value)}
                                      placeholder="Publicar nuevo estado criptográfico en tu muro de Facebook..."
                                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                                    >
                                      PUBLICAR
                                    </button>
                                  </form>
                                </div>
                              )}

                              {/* 4b. INSTAGRAM TAB */}
                              {metaActiveSubTab === 'instagram' && (
                                <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-[fadeIn_0.2s_ease]">
                                  {/* Grid Container */}
                                  <div className="flex-1 overflow-y-auto max-h-[145px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1">
                                    {igPhotos.map(p => (
                                      <div key={p.id} className="bg-slate-900/40 border border-slate-850 rounded-xl overflow-hidden flex flex-col font-mono text-[10px]">
                                        <div className="relative h-16 w-full bg-slate-950 overflow-hidden">
                                          <img 
                                            src={p.imageUrl} 
                                            alt="Instagram asset" 
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-all duration-300"
                                          />
                                          <span className="absolute bottom-1 right-1 px-1 bg-slate-950/80 text-[8px] text-pink-400 rounded border border-pink-500/40">
                                            {p.rType.toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="p-1.5 flex flex-col justify-between flex-1 gap-1">
                                          <div>
                                            <span className="font-bold text-white block truncate">{p.author}</span>
                                            <span className="text-slate-400 text-[9px] line-clamp-1 leading-normal">{p.caption}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-[8px] border-t border-slate-800/60 pt-1 text-slate-500 mt-1">
                                            <button 
                                              onClick={() => {
                                                setIgPhotos(prev => prev.map(old => old.id === p.id ? { ...old, likes: old.likes + 1 } : old));
                                              }}
                                              className="hover:text-pink-400 font-bold cursor-pointer"
                                            >
                                              ❤️ {p.likes}
                                            </button>
                                            <span className="text-pink-500/70">★ SECURE</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Add caption to auto-generated photo */}
                                  <form onSubmit={handleAddIgPhoto} className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 items-center">
                                    <input
                                      type="text"
                                      value={newIgCaption}
                                      onChange={(e) => setNewIgCaption(e.target.value)}
                                      placeholder="Sube un nuevo render de reactor - Escribe pie de foto de Instagram..."
                                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                                    >
                                      RENDER
                                    </button>
                                  </form>
                                </div>
                              )}

                              {/* 4c. WHATSAPP TAB */}
                              {metaActiveSubTab === 'whatsapp' && (
                                <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-[fadeIn_0.2s_ease]">
                                  {/* Chat Screen Container */}
                                  <div className="flex-1 overflow-y-auto max-h-[140px] bg-slate-950/65 rounded-xl border border-slate-900 p-2.5 flex flex-col gap-2">
                                    {waMessages.map(msg => (
                                      <div 
                                        key={msg.id} 
                                        className={`max-w-[85%] rounded-xl p-2 font-mono text-[11px] leading-relaxed ${
                                          msg.isSelf 
                                            ? 'self-end bg-emerald-950/60 border border-emerald-500/20 text-slate-100' 
                                            : 'self-start bg-slate-900 border border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <div className="flex justify-between font-bold text-[9px] mb-0.5 text-slate-400">
                                          <span>{msg.sender}</span>
                                          <span className="text-slate-600 text-[8px] ml-1.5">{msg.time}</span>
                                        </div>
                                        <p>{msg.text}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Input compose WhatsApp */}
                                  <form onSubmit={handleSendWaMessage} className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 items-center font-mono">
                                    <input
                                      type="text"
                                      value={newWaText}
                                      onChange={(e) => setNewWaText(e.target.value)}
                                      placeholder="Escribe un mensaje seguro de WhatsApp (Jarvis responderá)..."
                                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  </form>
                                </div>
                              )}

                              {/* 4d. THREADS TAB */}
                              {metaActiveSubTab === 'threads' && (
                                <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-[fadeIn_0.2s_ease]">
                                  {/* Streams Area */}
                                  <div className="flex-1 overflow-y-auto max-h-[140px] flex flex-col gap-2 p-1">
                                    {threadsFeed.map(th => (
                                      <div key={th.id} className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-xs font-mono">
                                        <div className="flex justify-between items-center mb-1 text-[11px]">
                                          <div className="flex items-center gap-1">
                                            <span className="text-white font-bold">{th.author}</span>
                                            <span className="text-slate-500 text-[9px]">{th.handle}</span>
                                          </div>
                                          <span className="text-slate-500 text-[9px]">{th.time}</span>
                                        </div>
                                        <p className="text-slate-300 text-[11px] leading-relaxed">{th.content}</p>
                                        <div className="mt-1 flex justify-between items-center text-[10px] text-slate-500">
                                          <button 
                                            onClick={() => {
                                              setThreadsFeed(prev => prev.map(old => old.id === th.id ? { ...old, replies: th.replies + 1 } : old));
                                            }}
                                            className="hover:text-white transition-colors cursor-pointer"
                                          >
                                            💬 {th.replies} respuestas
                                          </button>
                                          <span className="text-slate-600">Threads Over Onion Tunnel</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Compose new Threads stream */}
                                  <form onSubmit={handleAddThread} className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 items-center">
                                    <input
                                      type="text"
                                      value={newThreadsText}
                                      onChange={(e) => setNewThreadsText(e.target.value)}
                                      placeholder="Escribe lo que estás pensando para publicar en Threads..."
                                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-500"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="px-4 py-1.5 bg-slate-250 hover:bg-white hover:text-slate-950 hover:border-slate-300 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                                    >
                                      TH_POST
                                    </button>
                                  </form>
                                </div>
                              )}

                            </div>
                          )}

                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 5. UNIFIED SOCIAL COMMAND WORKSPACE */}
                {multiActiveTab === 'social_command' && (
                  <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base">MANDO SOCIAL MULTICANAL UNIFICADO</h3>
                        <span className="font-mono text-[9px] text-slate-500">INTEGRACIÓN TOTAL DE REDES ESTILO STARK DECENTRALIZED</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 font-mono text-[9px] text-emerald-400 rounded font-bold">
                        SPEEDFORCE BROADCAST BRIDGE: {isSynced ? 'CONECTADO' : 'MOCK'}
                      </span>
                    </div>

                    {!isSynced ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                        <Share2 className="w-12 h-12 text-slate-600 mb-3" />
                        <h4 className="font-mono text-sm text-white font-bold mb-1">Comandos de Enlace Inactivos</h4>
                        <p className="font-mono text-xs text-slate-400 max-w-md leading-relaxed mb-4">
                          Las redes sociales simuladas deben de estar conectadas a la red del Reactor a través del puente cuántico Speedforce para poder habilitar el mando global centralizado.
                        </p>
                        <button
                          onClick={() => setIsSynced(true)}
                          className="px-4 py-2 bg-stark-scarlet text-white font-bold text-xs rounded-xl font-mono hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(230,57,70,0.4)]"
                        >
                          CERRAR ACOPLAMIENTO SPEEDFORCE (VINCULAR REDES)
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden flex-1">
                        
                        {/* Left Side: Simul-post controls */}
                        <div className="lg:col-span-5 flex flex-col gap-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-900 shrink-0">
                          <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5">
                            <Sliders className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-white font-bold text-xs font-mono uppercase tracking-wider">Publicación Simultánea</h4>
                          </div>

                          <form onSubmit={handlePerformSimulPost} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">Redes Objetivo:</label>
                              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, twitter: !prev.twitter }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.twitter 
                                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' 
                                      : 'bg-slate-950 border-slate-900 text-slate-650'
                                  }`}
                                >
                                  <span>Twitter / X</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.twitter ? 'bg-blue-400 animate-pulse' : 'bg-slate-800'}`}></span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, facebook: !prev.facebook }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.facebook 
                                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' 
                                      : 'bg-slate-950 border-slate-900 text-slate-655'
                                  }`}
                                >
                                  <span>Facebook</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.facebook ? 'bg-indigo-400' : 'bg-slate-800'}`}></span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, instagram: !prev.instagram }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.instagram 
                                      ? 'bg-pink-500/10 border-pink-500/40 text-pink-400' 
                                      : 'bg-slate-950 border-slate-900 text-slate-655'
                                  }`}
                                >
                                  <span>Instagram</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.instagram ? 'bg-pink-400' : 'bg-slate-800'}`}></span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, threads: !prev.threads }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.threads 
                                      ? 'bg-slate-200/10 border-slate-400/40 text-slate-300' 
                                      : 'bg-slate-950 border-slate-900 text-slate-655'
                                  }`}
                                >
                                  <span>Threads</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.threads ? 'bg-slate-300' : 'bg-slate-800'}`}></span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, discord: !prev.discord }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.discord 
                                      ? 'bg-indigo-600/20 border-indigo-500/45 text-indigo-400' 
                                      : 'bg-slate-950 border-slate-900 text-slate-600'
                                  }`}
                                >
                                  <span>hacker-Discord</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.discord ? 'bg-indigo-400' : 'bg-slate-800'}`}></span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedChannels(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                                    selectedChannels.whatsapp 
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                                      : 'bg-slate-950 border-slate-900 text-slate-600'
                                  }`}
                                >
                                  <span>WhatsApp</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.whatsapp ? 'bg-emerald-400 animate-pulse' : 'bg-slate-800'}`}></span>
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-mono text-slate-400 font-bold uppercase">Mensaje de Publicación:</label>
                              <textarea
                                value={simulPostText}
                                onChange={(e) => setSimulPostText(e.target.value)}
                                placeholder="Escribe el mensaje inmutable que deseas programar y transmitir en tiempo de ráfaga a los canales seleccionados simultáneamente..."
                                className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[90px] max-h-[140px] font-mono resize-none"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs rounded-lg font-mono flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5 text-white" />
                              <span>PUBLICAR EN TODAS MIS REDES SIMULTÁNEAMENTE</span>
                            </button>
                            
                            {simulPostSuccess && (
                              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-400 font-mono text-[10px] leading-relaxed animate-pulse">
                                ✓ {simulPostSuccess}
                              </div>
                            )}
                          </form>

                          {/* Network Sync status summary */}
                          <div className="mt-2 border-t border-slate-900 pt-3 text-[10px] font-mono leading-relaxed text-slate-500">
                            <span className="font-bold text-slate-400 block mb-1">AUDITORÍA DE CANALES STARK</span>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                              <span className="text-blue-400 animate-pulse">● X.com (Live)</span>
                              <span className="text-indigo-400">● Facebook (Portal)</span>
                              <span className="text-pink-400">● Instagram (Simul)</span>
                              <span className="text-slate-300">● Threads (Active)</span>
                            </div>
                            <p className="mt-2 text-[9px] text-slate-655">
                              Al presionar el botón simulado, el despachador de hilos de Jarvis fragmenta el post y lo inyecta cronológicamente en cada API de red del multiescritorio Stark.
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Consolidated reviews and Reply feed */}
                        <div className="lg:col-span-7 flex flex-col gap-3 min-h-[300px] overflow-hidden flex-1 font-mono">
                          
                          {/* Filters */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revisión de Canales y Mapeo:</span>
                              <span className="text-[9px] text-slate-655">Total feeds compilados: {
                                (socialPosts.length + fbPosts.length + igPhotos.length + threadsFeed.length + discordMessages.length + waMessages.length)
                              }</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 text-[9px]">
                              {(['all', 'twitter', 'facebook', 'instagram', 'threads', 'discord', 'whatsapp'] as const).map(f => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setUnifiedSocialFilter(f)}
                                  className={`px-2 py-1 rounded transition-all uppercase font-bold border ${
                                    unifiedSocialFilter === f 
                                      ? 'bg-stark-scarlet/15 border-stark-scarlet text-stark-scarlet' 
                                      : 'bg-slate-950/60 border-slate-900 text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Combined chronological stream */}
                          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1.5">
                            {(() => {
                              // Compile posts
                              const items: {
                                id: string;
                                author: string;
                                handle?: string;
                                content: string;
                                avatar: string;
                                time: string;
                                likes: number;
                                type: 'twitter' | 'facebook' | 'instagram' | 'threads' | 'discord' | 'whatsapp';
                                imageUrl?: string;
                              }[] = [];

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'twitter') {
                                socialPosts.forEach(p => items.push({
                                  id: p.id,
                                  author: p.author,
                                  handle: p.handle,
                                  content: p.content,
                                  avatar: p.avatar,
                                  time: p.time,
                                  likes: p.likes,
                                  type: 'twitter'
                                }));
                              }

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'facebook') {
                                fbPosts.forEach(p => items.push({
                                  id: p.id,
                                  author: p.author,
                                  handle: '@TonyStark_Official',
                                  content: p.content,
                                  avatar: '👤',
                                  time: p.time,
                                  likes: p.likes,
                                  type: 'facebook'
                                }));
                              }

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'instagram') {
                                igPhotos.forEach(p => items.push({
                                  id: p.id,
                                  author: p.author,
                                  handle: '@tonystarkofficial_ig',
                                  content: p.caption,
                                  avatar: '📸',
                                  time: p.time || 'Hace poco',
                                  likes: p.likes,
                                  type: 'instagram',
                                  imageUrl: p.imageUrl
                                }));
                              }

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'threads') {
                                threadsFeed.forEach(t => items.push({
                                  id: t.id,
                                  author: t.author,
                                  handle: t.handle,
                                  content: t.content,
                                  time: t.time || 'Ayer',
                                  likes: t.replies || 0,
                                  avatar: '🧵',
                                  type: 'threads'
                                }));
                              }

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'discord') {
                                discordMessages.forEach((d, i) => items.push({
                                  id: d.id || `dyn-disc-${i}`,
                                  author: d.user,
                                  handle: '#hacker-discord',
                                  content: d.text,
                                  time: d.time,
                                  likes: 0,
                                  avatar: d.avatar || '🤖',
                                  type: 'discord'
                                }));
                              }

                              if (unifiedSocialFilter === 'all' || unifiedSocialFilter === 'whatsapp') {
                                waMessages.forEach((w, i) => items.push({
                                  id: w.id || `dyn-wa-${i}`,
                                  author: w.sender === 'Yo' ? 'Tony Stark' : w.sender,
                                  handle: 'WhatsApp Secure Proxy',
                                  content: w.text,
                                  time: w.time,
                                  likes: 0,
                                  avatar: w.sender === 'Yo' ? '🟥' : '💬',
                                  type: 'whatsapp'
                                }));
                              }

                              // No item fallback
                              if (items.length === 0) {
                                return (
                                  <div className="text-center font-mono text-slate-600 text-[11px] py-10 bg-slate-950/35 border border-dashed border-slate-900 rounded-xl">
                                    No hay registros de publicaciones bajo el filtro "{unifiedSocialFilter}"
                                  </div>
                                );
                              }

                              return items.map((item) => {
                                // Networks specific styles and metrics
                                const netInfoMap = {
                                  twitter: { label: 'X / TWITTER', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' },
                                  facebook: { label: 'FACEBOOK', color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5' },
                                  instagram: { label: 'INSTAGRAM', color: 'border-pink-500/30 text-pink-400 bg-pink-500/5' },
                                  threads: { label: 'THREADS', color: 'border-slate-400/30 text-slate-300 bg-slate-400/5' },
                                  discord: { label: 'HACKER-DISCORD', color: 'border-indigo-600/30 text-indigo-300 bg-indigo-600/5' },
                                  whatsapp: { label: 'WHATSAPP SECURE', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' }
                                };
                                const badge = netInfoMap[item.type] || { label: 'STARK CORE', color: 'text-slate-400 border-slate-800 bg-slate-900/40' };

                                return (
                                  <div key={item.id} className="p-3 bg-slate-900/35 hover:bg-slate-900/50 border border-slate-850 rounded-xl flex flex-col gap-2 transition-all font-mono text-[11px] relative">
                                    
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg bg-slate-950 w-7 h-7 rounded-full flex items-center justify-center border border-slate-900 shrink-0">
                                          {item.avatar}
                                        </span>
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-white font-bold">{item.author}</span>
                                            <span className="text-slate-500 text-[9px]">{item.handle}</span>
                                          </div>
                                          <span className="text-[9px] text-slate-650 block leading-tight">{item.time}</span>
                                        </div>
                                      </div>
                                      
                                      <span className={`px-2 py-0.5 border rounded-full text-[8px] font-bold ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                    </div>

                                    {/* Content info */}
                                    <div className="pl-9">
                                      <p className="text-slate-300 leading-normal text-xs">{item.content}</p>
                                      
                                      {item.imageUrl && (
                                        <img 
                                          src={item.imageUrl} 
                                          alt="Preview" 
                                          className="mt-2 text-[10px] w-full max-h-32 object-cover rounded-lg border border-slate-800" 
                                          referrerPolicy="no-referrer"
                                        />
                                      )}

                                      {/* Sub-replies List */}
                                      {((postReplies[item.id] && postReplies[item.id].length > 0) || item.type === 'threads') && (
                                        <div className="mt-3.5 pl-3 border-l-2 border-slate-800 flex flex-col gap-2 bg-slate-950/40 p-2 rounded-r-lg">
                                          {/* Standard threads simulated replies list or comments map */}
                                          {(postReplies[item.id] || []).map((reply) => (
                                            <div key={reply.id} className="text-[10px] leading-relaxed">
                                              <span className="text-reactor-cyan font-bold block">{reply.author}:</span>
                                              <span className="text-slate-400">{reply.text}</span>
                                              <span className="text-[8px] text-slate-600 block mt-0.5">{reply.time}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Interactive commands */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-900/60 flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            // Simulated Likes logic
                                            if (item.type === 'twitter') {
                                              setSocialPosts(prev => prev.map(p => p.id === item.id ? { ...p, likes: p.likes + 1 } : p));
                                            } else if (item.type === 'facebook') {
                                              setFbPosts(prev => prev.map(p => p.id === item.id ? { ...p, likes: p.likes + 1 } : p));
                                            } else if (item.type === 'instagram') {
                                              setIgPhotos(prev => prev.map(p => p.id === item.id ? { ...p, likes: p.likes + 1 } : p));
                                            }
                                          }}
                                          className="flex items-center gap-1.5 hover:text-stark-scarlet transition-all"
                                        >
                                          ❤️ <span>{(item.likes || 0).toLocaleString()}</span>
                                        </button>

                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setReplyingToId(replyingToId === item.id ? null : item.id);
                                            setReplyInputText('');
                                          }}
                                          className={`flex items-center gap-1.5 transition-all text-slate-400 hover:text-white ${
                                            replyingToId === item.id ? 'text-stark-scarlet' : ''
                                          }`}
                                        >
                                          💬 Responder
                                        </button>
                                      </div>

                                      {/* Inline Reply input overlay form */}
                                      {replyingToId === item.id && (
                                        <div className="mt-3.5 flex gap-2 animate-[fadeIn_0.15s_ease] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                                          <input
                                            type="text"
                                            value={replyInputText}
                                            onChange={(e) => setReplyInputText(e.target.value)}
                                            placeholder={`Responder a ${item.author} a través del túnel...`}
                                            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-stark-scarlet"
                                            required
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handlePerformReply(item.id, item.type);
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handlePerformReply(item.id, item.type)}
                                            className="px-3 bg-stark-scarlet hover:brightness-110 text-white font-bold text-[10px] rounded-lg transition-all"
                                          >
                                            PUBLICAR
                                          </button>
                                        </div>
                                      )}

                                    </div>

                                  </div>
                                );
                              });
                            })()}
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* 6. SECURE SEARCH WORKSPACE (TOR & DUCKDUCKGO) */}
                {multiActiveTab === 'secure_search' && (
                  <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div>
                        <h3 className="font-display font-black text-white text-base flex items-center gap-2">
                          <Globe className="w-5 h-5 text-reactor-cyan animate-pulse" />
                          <span>STARK ONION SECURE DEEP WEB BROWSER</span>
                        </h3>
                        <span className="font-mono text-[9px] text-slate-500">PROXY ANONIMIZADOR INTEGRADO VIA TOR / DUCKDUCKGO ONION TUNNEL</span>
                      </div>
                      
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-emerald-400 font-bold">TOR CIRCUITO: ACTIVE</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-hidden">
                      
                      {/* Left side: Engine selection / History / Proxy info */}
                      <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-900 shrink-0">
                        {/* Engine selector */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Motor de Búsqueda Seguro:</span>
                          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => setSearchEngine('tor')}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                searchEngine === 'tor' 
                                  ? 'bg-onion-purple/20 border-onion-purple text-onion-purple-light shadow-[0_0_8px_rgba(157,78,221,0.25)]' 
                                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                              }`}
                            >
                              <span className="font-bold text-xs mt-1">Tor Network</span>
                              <span className="text-[8px] opacity-70">Deep Onion Link</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSearchEngine('duckduckgo')}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                searchEngine === 'duckduckgo' 
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.22)]' 
                                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                              }`}
                            >
                              <span className="font-bold text-xs mt-1">DuckDuckGo</span>
                              <span className="text-[8px] opacity-70">Privacidad Estricta</span>
                            </button>
                          </div>
                        </div>

                        {/* Search History */}
                        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5 pt-1.5">
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Búsquedas Recientes:</span>
                          </div>

                          <div className="flex flex-col gap-1.5 overflow-y-auto font-mono text-[10px] pr-1 flex-1">
                            {searchHistory.length === 0 ? (
                              <p className="text-slate-700 text-center py-4">No hay historial</p>
                            ) : (
                              searchHistory.map((hist, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(hist);
                                    handlePerformSecureSearch(undefined, hist);
                                  }}
                                  className="w-full text-left p-2 rounded bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 text-slate-400 hover:text-white transition-all overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                  ⏰ {hist}
                                </button>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Tor Circuits Mock Visual info */}
                        <div className="border-t border-slate-900 pt-3 text-[9px] font-mono leading-normal text-slate-500">
                          <span className="font-bold text-slate-400 block pb-1 uppercase">Circuito de Navegación Stark:</span>
                          <span className="text-reactor-cyan uppercase block mb-0.5">Estableciendo túnel cuántico:</span>
                          <div className="flex items-center gap-1 text-[9px] flex-wrap leading-tight">
                            <span className="text-amber-400 font-bold font-mono">Navegador (Onion)</span>
                            <span className="text-slate-755">➜</span>
                            <span>Múnich (Guard)</span>
                            <span className="text-slate-755">➜</span>
                            <span>Reikiavik (Relay)</span>
                            <span className="text-slate-755">➜</span>
                            <span className="text-emerald-400 font-bold animate-pulse">Estocolmo (Exit)</span>
                          </div>
                          <p className="mt-2 text-slate-655 leading-relaxed">
                            Cifrado asimétrico triple. DuckDuckGo encripta los trackers mientras que Tor ofusca tu ubicación física. Absolutamente indetectable.
                          </p>
                        </div>
                      </div>

                      {/* Right side: Search queries input + Search results feed */}
                      <div className="lg:col-span-8 flex flex-col gap-3 min-h-[300px] overflow-hidden flex-1">
                        
                        {/* Search Bar Input */}
                        <form onSubmit={(e) => handlePerformSecureSearch(e)} className="flex gap-2">
                          <div className="flex-1 relative flex items-center">
                            <Search className="w-4 h-4 text-slate-505 absolute left-3" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={
                                searchEngine === 'tor' 
                                  ? "Escribe tu consulta de la Deep Web (ej. planos reactor arc, etc)..." 
                                  : "Búsqueda privada en DuckDuckGo libre de rastreadores corporativos..."
                              }
                              className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-9 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-reactor-cyan font-mono"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSearching}
                            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              searchEngine === 'tor' 
                                ? 'bg-indigo-650 text-white hover:brightness-110 shadow-[0_0_8px_rgba(157,78,221,0.35)] font-bold' 
                                : 'bg-amber-600 hover:brightness-110 text-white font-bold'
                            }`}
                          >
                            <span>BUSCAR</span>
                          </button>
                        </form>

                        {/* Search active / landing / loaded outputs */}
                        <div className="flex-1 overflow-y-auto max-h-[360px] bg-slate-950/40 p-4 rounded-xl border border-slate-900 font-mono">
                          
                          {isSearching ? (
                            <div className="flex flex-col gap-4 py-8 animate-pulse">
                              <div className="flex flex-col gap-1 items-center justify-center text-center">
                                <Search className="w-10 h-10 text-indigo-400 animate-bounce" />
                                <span className="font-mono text-xs text-slate-400 font-bold block mt-2">ENRUTANDO PETICIÓN MEDIANTE {searchEngine === 'tor' ? 'ONION PROXIES' : 'DUCKDUCKGO API SECURE'}</span>
                                <div className="w-48 bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                  <div className="bg-reactor-cyan h-1.5 rounded-full transition-all duration-305" style={{ width: `${searchLoadingProgress}%` }} />
                                </div>
                              </div>

                              <div className="bg-slate-955 p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-400 flex flex-col gap-1 select-none leading-relaxed max-w-lg mx-auto w-full">
                                {searchLoadingLogs.map((log, i) => (
                                  <div key={i} className="flex gap-2">
                                    <span className="text-reactor-cyan">⚡</span>
                                    <span>{log}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : !hasSearched ? (
                            <div className="flex flex-col items-center justify-center text-center py-10">
                              <Globe className="w-12 h-12 text-slate-755 mb-3 animate-[spin_12s_linear_infinite]" />
                              <h4 className="font-mono text-sm text-slate-300 font-bold mb-1">Stark Onion Portal v4.1</h4>
                              <p className="font-mono text-xs text-slate-500 max-w-md leading-relaxed mb-4">
                                Ingresa tus términos de consulta. La consola indexará la Web y enlaces de la Darknet (.onion) sin dejar rastro de IPs ni cookies en tu escritorio local.
                              </p>
                              
                              <div className="flex flex-wrap gap-2 justify-center text-[9px] max-w-md">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('planos reactor arc btc');
                                    handlePerformSecureSearch(undefined, 'planos reactor arc btc');
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded text-slate-400 text-left transition-all"
                                >
                                  💡 "planos reactor arc btc"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('speedforce records chicago');
                                    handlePerformSecureSearch(undefined, 'speedforce records chicago');
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded text-slate-400 text-left transition-all"
                                >
                                  💡 "speedforce records chicago"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery('Solidity BetVerifier.sol');
                                    handlePerformSecureSearch(undefined, 'Solidity BetVerifier.sol');
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded text-slate-400 text-left transition-all"
                                >
                                  💡 "Solidity BetVerifier.sol"
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="font-mono text-[10px] text-slate-500 border-b border-slate-900 pb-2 flex justify-between items-center font-bold">
                                <span>Resultados aproximados para: "{searchQuery}"</span>
                                <span className="text-reactor-cyan font-bold">{searchResults.length} enlaces devueltos</span>
                              </div>

                              <div className="flex flex-col gap-3.5">
                                {searchResults.map((res, i) => (
                                  <div key={i} className="flex flex-col gap-1 text-[11px] bg-slate-900/10 hover:bg-slate-900/25 p-3 rounded-lg border border-slate-900 transition-all">
                                    <div className="flex justify-between items-start flex-wrap gap-1">
                                      <span className="text-[10px] text-slate-550 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-850">{res.category}</span>
                                      <span className="text-[9px] text-slate-600">{res.date}</span>
                                    </div>

                                    <h4 className="text-reactor-cyan font-bold text-xs hover:underline cursor-pointer block mt-1">
                                      {res.title}
                                    </h4>

                                    <span className="text-[9px] text-amber-500/80 underline select-all break-all overflow-hidden text-ellipsis block">
                                      {res.url}
                                    </span>

                                    <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1">{res.snippet}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Bottom notification control bar in Speedforce modal */}
            <div className="bg-slate-900 border-t border-slate-800 p-3 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>MULTIVENTANA TOTALMENTE OPERATIVA SIN SALIR DE LA APP</span>
              </span>
              <span className="text-onion-purple-light font-bold">P0inT-Z3R0 Anonymous Labs © 2026</span>
            </div>

          </div>
        </div>
      )}

      {/* AUTH SELECTION & UNISWAP WEB3 CONNECTION DIALOG MODAL */}
      {showAuthChoice && (
        <div 
          id="auth-choice-modal-overlay"
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-[fadeIn_0.25s_ease]"
        >
          <div className="bg-slate-950 border-2 border-onion-purple rounded-[2rem] w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(157,78,221,0.35)] relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-onion-purple via-indigo-600 to-pink-500" />
            
            {/* Header */}
            <div className="p-5 border-b border-slate-900 flex justify-between items-center bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-onion-purple-light animate-pulse" />
                <span className="font-display font-black text-sm text-white tracking-wider uppercase">VINCULAR IDENTIDAD SECURE</span>
              </div>
              {!isUniswapConnecting && (
                <button
                  onClick={() => setShowAuthChoice(false)}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {!isUniswapConnecting ? (
                <div className="flex flex-col gap-4">
                  <div className="text-center mb-1">
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                      Elige tu método de conexión preferido para desbloquear el reactor descéntrico, sincronizar tus balances en la nube y realizar transacciones anónimas.
                    </p>
                  </div>

                  {/* Google Login Option */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const loggedInUser = await loginWithGoogle();
                        setShowAuthChoice(false);
                        
                        // Update active wallet address with the linked Stark Address for maximum immersive experience!
                        setWallet(prev => ({
                          ...prev,
                          address: `onion:stark_reactor_${loggedInUser.uid.substring(0, 10)}_node`
                        }));
                        
                        setSyncHistory(prev => [
                          `[SECURITY CONNECT] Autenticado vía Stark Google ID (${loggedInUser.displayName || 'Simulado'}).`,
                          ...prev
                        ]);
                        
                        handleTriggerZap('stark_google_id_connected', { email: loggedInUser.email || 'tony@stark.com' });
                      } catch (e: any) {
                        console.error("Sign-in failed, launching Stark Sandbox ID fallback", e);
                        
                        // Setup Google Sandbox Stark User to gracefully bypass sandbox / API restrictions
                        const dummyUser = {
                          uid: 'stark_google_simulator_' + Math.floor(Math.random() * 1000000),
                          displayName: 'Tony Stark (Google Simulator)',
                          photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
                          email: 'tony@stark.com',
                          isSimulator: true
                        };
                        
                        localStorage.setItem('stark_uniswap_user', JSON.stringify(dummyUser));
                        setUser(dummyUser);
                        setShowAuthChoice(false);
                        
                        // Log event in system sync history
                        setSyncHistory(prev => [
                          `[SECURITY BYPASS] Autenticado vía Stark-Identity Simulator por restricciones del iFrame Sandbox.`,
                          ...prev
                        ]);
                        
                        // Update active wallet address with the linked Stark Address for maximum immersive experience!
                        setWallet(prev => ({
                          ...prev,
                          address: 'onion:stark_reactor_simulated_node'
                        }));
                        
                        handleTriggerZap('stark_google_id_connected', { email: 'tony@stark.com' });
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex items-center gap-3.5 text-left transition-all group cursor-pointer"
                  >
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl group-hover:scale-105 transition-all">
                      <LogIn className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="font-mono">
                      <span className="block text-xs font-black text-white group-hover:text-indigo-400 transition-colors uppercase">Iniciar con Stark Google ID</span>
                      <span className="block text-[9px] text-slate-500 font-bold mt-0.5 uppercase font-mono">Respaldo seguro en Cloud Firestore</span>
                    </div>
                  </button>

                  {/* Uniswap Connection Option */}
                  <button
                    type="button"
                    onClick={startUniswapLogin}
                    className="w-full bg-slate-900 hover:bg-pink-950/20 border border-slate-800 hover:border-pink-500/50 p-4 rounded-2xl flex items-center gap-3.5 text-left transition-all group cursor-pointer shadow-[0_0_12px_rgba(236,72,153,0.05)] hover:shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                  >
                    <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-550 rounded-xl group-hover:scale-105 transition-all">
                      <Link className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="font-mono">
                      <span className="block text-xs font-black text-pink-400 group-hover:text-pink-300 transition-colors uppercase font-mono">Conectar Uniswap Wallet</span>
                      <span className="block text-[9px] text-slate-500 font-bold mt-0.5 uppercase font-mono font-bold">Compatibilidad de dApp Multicadena nativa</span>
                    </div>
                  </button>
                  
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[8.5px] font-mono text-slate-500 leading-relaxed text-center mt-2">
                    ⚡ Point-Zero Onion Casino no interactúa con tus claves privadas reales. Todas las transacciones son firmadas criptográficamente de manera local.
                  </div>
                </div>
              ) : (
                /* Uniswap Connecting Sequence Screen */
                <div className="flex flex-col items-center py-6 text-center animate-[fadeIn_0.2s_ease]">
                  {/* Rotating Uniswap icon loader */}
                  <div className="w-16 h-16 rounded-full bg-pink-500/10 border-2 border-dashed border-pink-500 flex items-center justify-center animate-spin mb-6">
                    <Link className="w-8 h-8 text-pink-400 animate-pulse animate-[spin_5s_linear_infinite]" />
                  </div>

                  <h3 className="font-display font-black text-sm text-white tracking-wider uppercase">Poniendo en marcha Uniswap Web3 Link</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-2">Estableciendo túnel asimétrico cuántico entre el Reactor y dApp Pools</p>

                  {/* Progress indicator steps */}
                  <div className="w-full bg-slate-900 rounded-2xl p-4 border border-slate-850 my-5 text-left font-mono text-[10px] flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${uniswapStepIndex >= 0 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-800'}`}></span>
                      <span className={uniswapStepIndex === 0 ? 'text-white font-bold' : uniswapStepIndex > 0 ? 'text-slate-400' : 'text-slate-600'}>
                        {uniswapStepIndex > 0 ? '✓ ' : ''}Invocando extensión Uniswap dApp...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${uniswapStepIndex >= 1 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-800'}`}></span>
                      <span className={uniswapStepIndex === 1 ? 'text-white font-bold' : uniswapStepIndex > 1 ? 'text-slate-400' : 'text-slate-600'}>
                        {uniswapStepIndex > 1 ? '✓ ' : ''}Estableciendo firma criptográfica asimétrica...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${uniswapStepIndex >= 2 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-800'}`}></span>
                      <span className={uniswapStepIndex === 2 ? 'text-white font-bold' : uniswapStepIndex > 2 ? 'text-slate-400' : 'text-slate-600'}>
                        {uniswapStepIndex > 2 ? '✓ ' : ''}Enlazando nodo Stark de Liquidez Uniswap...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${uniswapStepIndex >= 3 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-800'}`}></span>
                      <span className={uniswapStepIndex === 3 ? 'text-white font-bold animate-pulse' : 'text-slate-600'}>
                        {uniswapStepIndex > 3 ? '✓ ' : ''}Generando llaves puenteadas Stark-Uniswap...
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full shadow-[0_0_8px_#ec4899] transition-all duration-300"
                      style={{ width: `${Math.min((uniswapStepIndex + 1) * 25, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Futuristic status bar footer */}
      <footer className="max-w-7xl w-full mx-auto px-4 mt-8 pt-4 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] font-mono leading-none">
        <div>
          <span>PROYECTADO EN RED CIFRADA ONION.SHARE // P0inT-Z3R0 ANONYMOUS DECENTRALIZED CASINO</span>
        </div>
        <div className="flex gap-4">
          <span className="text-onion-purple-light font-bold shadow-[0_0_8px_rgba(157,78,221,0.5)]">STATUS: ONION.SHARE & SPEEDFORCE ACTIVE</span>
          <span>© 2026 P0inT-Z3R0 LABS</span>
        </div>
      </footer>

    </div>
  );
}
