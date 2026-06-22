import React, { useState } from 'react';
import { WalletState, CryptoTx } from '../types';
import { 
  Eye, EyeOff, RefreshCw, Key, ShieldCheck, Wallet, ArrowDownLeft, ArrowUpRight, 
  CheckCircle2, Lock, Shuffle, Send, DollarSign, CreditCard, Building2, 
  Link, Check, ArrowRightLeft, Info 
} from 'lucide-react';

interface CryptoWalletProps {
  wallet: WalletState;
  onUpdateWallet: (updated: Partial<WalletState>) => void;
  onTriggerZap: (eventName: string, payload: any) => void;
}

const MOCK_WORDS = [
  'arc', 'reactor', 'onion', 'share', 'privacy', 'secured', 'ledger', 'blockchain', 
  'iron', 'jarvis', 'tony', 'stark', 'nano', 'pepper', 'suit', 'energy', 'zap', 'shield'
];

export default function CryptoWallet({ wallet, onUpdateWallet, onTriggerZap }: CryptoWalletProps) {
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [rechargeAmt, setRechargeAmt] = useState<string>('150');
  const [rechargeCurrency, setRechargeCurrency] = useState<'ARC' | 'BTC'>('ARC');
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const [mixLogs, setMixLogs] = useState<string[]>([]);

  // Navigation tab for the Wallet Menu
  const [activeMenuTab, setActiveMenuTab] = useState<'info' | 'send' | 'convert' | 'pay' | 'bank' | 'compatibility'>('info');

  // Input states for Send Form
  const [sendAddress, setSendAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendCurrency, setSendCurrency] = useState<'ARC' | 'BTC'>('ARC');
  const [sendTxSuccess, setSendTxSuccess] = useState<string | null>(null);

  // Input states for Convert Form
  const [convertAmount, setConvertAmount] = useState<string>('100');
  const [convertFrom, setConvertFrom] = useState<'ARC' | 'BTC'>('ARC');
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Input states for Payments
  const [payService, setPayService] = useState<'reactor_maint' | 'speedforce_lic' | 'stark_merch' | 'proxy_renew'>('reactor_maint');
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  // Input states for Bank Account
  const [bankName, setBankName] = useState<string>('');
  const [ibanField, setIbanField] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [isBankLinked, setIsBankLinked] = useState<boolean>(() => {
    return localStorage.getItem('stark_bank_linked') === 'true';
  });
  const [linkBankSuccess, setLinkBankSuccess] = useState<string | null>(null);
  const [buyWithBankAmt, setBuyWithBankAmt] = useState<string>('500');

  // Coinflip voucher states
  const [coinflipVoucher, setCoinflipVoucher] = useState<string>('');
  const [coinflipSuccess, setCoinflipSuccess] = useState<string | null>(null);

  // Uniswap simulated pool checker state
  const [unipoolChecked, setUnipoolChecked] = useState<boolean>(false);

  // Generate seed, address and keys
  const regenerateCredentials = () => {
    const seed = Array.from({ length: 12 }, () => MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)]).join(' ');
    const address = 'onion:' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const privateKey = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const publicKey = '04' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    onUpdateWallet({
      address,
      privateKey,
      publicKey,
      seedPhrase: seed,
    });

    onTriggerZap('wallet_keys_rotated', { address });
  };

  // Deprecated direct form recharge handler (integrated neatly or kept as a helper fallback)
  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmt);
    if (isNaN(amount) || amount <= 0) {
      alert('Introduzca un monto válido.');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'deposit',
      amount,
      currency: rechargeCurrency,
      status: 'confirmed',
      txHash,
      recipientOrIssuer: 'External Shield Gateway (Anonymous)',
      zapTriggered: true,
    };

    const currentBalance = rechargeCurrency === 'ARC' 
      ? wallet.balanceArc + amount 
      : wallet.balanceArc;
    
    const currentBtc = rechargeCurrency === 'BTC'
      ? wallet.balanceBtc + amount
      : wallet.balanceBtc;

    onUpdateWallet({
      balanceArc: currentBalance,
      balanceBtc: currentBtc,
      transactions: [newTx, ...wallet.transactions]
    });

    onTriggerZap('wallet_deposit_refill', { amount, currency: rechargeCurrency, txHash });
    setRechargeAmt('150');
  };

  // Perform anonymous mixer
  const runAnonymousMixer = () => {
    if (wallet.balanceArc <= 10) {
      alert('Monto insuficiente de ARC coins para iniciar el proceso de barajado.');
      return;
    }

    setIsMixing(true);
    setMixLogs(['Starting Onion.share Anonymous Mixer...', 'Deploying transient mixing containers...']);
    onTriggerZap('anonymizer_started', { mixVolume: wallet.balanceArc });

    let step = 0;
    const steps = [
      'Rotating secure Onion.share addresses...',
      'Splitting coins into 5 randomized packets...',
      'Feeding coins through decentralized Stark Relay Nodes...',
      'Signing ring signatures to obscure source ledger trace...',
      'Re-assembling mixed tokens in destination Onion.share vault...',
      'Barajado (shuffling) completo! Your transactions are now anonymized over Tor onion tunnels.'
    ];

    const idx = setInterval(() => {
      if (step < steps.length) {
        setMixLogs(prev => [...prev, steps[step]]);
        step++;
      } else {
        clearInterval(idx);
        setIsMixing(false);
        onUpdateWallet({
          mixingEnabled: true
        });
        onTriggerZap('anonymizer_completed', { success: true });
      }
    }, 1000);
  };

  // Perform SEND (Transferencia / Envíos)
  const handlePerformSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Introduzca un monto de envío válido.');
      return;
    }

    if (!sendAddress.trim()) {
      alert('Introduzca una dirección de destino válida.');
      return;
    }

    if (sendCurrency === 'ARC' && wallet.balanceArc < amount) {
      alert('Saldo de ARC insuficiente para realizar este envío.');
      return;
    }

    if (sendCurrency === 'BTC' && wallet.balanceBtc < amount) {
      alert('Saldo de BTC insuficiente para realizar este envío.');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'withdraw',
      amount,
      currency: sendCurrency,
      status: 'confirmed',
      txHash,
      recipientOrIssuer: sendAddress,
      zapTriggered: true,
    };

    const newBalanceArc = sendCurrency === 'ARC' ? wallet.balanceArc - amount : wallet.balanceArc;
    const newBalanceBtc = sendCurrency === 'BTC' ? wallet.balanceBtc - amount : wallet.balanceBtc;

    onUpdateWallet({
      balanceArc: newBalanceArc,
      balanceBtc: newBalanceBtc,
      transactions: [newTx, ...wallet.transactions]
    });

    onTriggerZap('wallet_withdrawal_sent', { amount, currency: sendCurrency, recipient: sendAddress, txHash });
    setSendTxSuccess(`¡Envío procesado exitosamente! Hash: ${txHash.substring(0, 14)}...`);
    setSendAmount('');
    setSendAddress('');

    setTimeout(() => {
      setSendTxSuccess(null);
    }, 4000);
  };

  // Perform SWAP CONVERSION (Conversiones)
  const handlePerformConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(convertAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Introduzca un monto válido de conversión.');
      return;
    }

    const ARC_BTC_RATE = 0.00019; // 1 ARC = 0.00019 BTC
    const BTC_ARC_RATE = 1 / ARC_BTC_RATE;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    let newBalanceArc = wallet.balanceArc;
    let newBalanceBtc = wallet.balanceBtc;
    let computedOutput = 0;

    if (convertFrom === 'ARC') {
      if (wallet.balanceArc < amount) {
        alert('Saldo de ARC insuficiente para completar la conversión.');
        return;
      }
      computedOutput = amount * ARC_BTC_RATE;
      newBalanceArc = wallet.balanceArc - amount;
      newBalanceBtc = wallet.balanceBtc + computedOutput;
    } else {
      if (wallet.balanceBtc < amount) {
        alert('Saldo de BTC insuficiente para completar la conversión.');
        return;
      }
      computedOutput = amount * BTC_ARC_RATE;
      newBalanceBtc = wallet.balanceBtc - amount;
      newBalanceArc = wallet.balanceArc + computedOutput;
    }

    // Append standard transactions to log the swap
    const withdrawTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'withdraw',
      amount,
      currency: convertFrom,
      status: 'confirmed',
      txHash,
      recipientOrIssuer: 'Stark-Uniswap Instant Liquidity Pool',
    };

    const depositTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'deposit',
      amount: computedOutput,
      currency: convertFrom === 'ARC' ? 'BTC' : 'ARC',
      status: 'confirmed',
      txHash,
      recipientOrIssuer: 'Stark-Uniswap Output Vault',
    };

    onUpdateWallet({
      balanceArc: newBalanceArc,
      balanceBtc: newBalanceBtc,
      transactions: [depositTx, withdrawTx, ...wallet.transactions]
    });

    onTriggerZap('token_swap_performed', { 
      from: convertFrom, 
      fromAmount: amount, 
      toAmount: computedOutput, 
      txHash 
    });

    setConvertSuccess(`Conversión exitosa: Recorriste ${amount} ${convertFrom} por ${computedOutput.toFixed(convertFrom === 'ARC' ? 5 : 2)} ${convertFrom === 'ARC' ? 'BTC' : 'ARC'}!`);
    
    setTimeout(() => {
      setConvertSuccess(null);
    }, 4500);
  };

  // Perform UTILITY PAYMENTS (Pagos)
  const handlePerformPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceCosts = {
      reactor_maint: { label: 'Mantenimiento de Reactor Arc Stark', cost: 50, currency: 'ARC' as const },
      speedforce_lic: { label: 'Licencia Túnel Taquiónico Speedforce', cost: 15, currency: 'ARC' as const },
      stark_merch: { label: 'Merchandising Premium de Stark Core', cost: 120, currency: 'ARC' as const },
      proxy_renew: { label: 'Renovación de Proxy Tor Onion.share', cost: 5, currency: 'ARC' as const }
    };

    const activeService = serviceCosts[payService];
    if (wallet.balanceArc < activeService.cost) {
      alert(`Saldo insuficiente en ARC. Necesitas al menos ${activeService.cost} ARC.`);
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'withdraw',
      amount: activeService.cost,
      currency: 'ARC',
      status: 'confirmed',
      txHash,
      recipientOrIssuer: `Stark Gate: ${activeService.label}`,
      zapTriggered: true,
    };

    onUpdateWallet({
      balanceArc: wallet.balanceArc - activeService.cost,
      transactions: [newTx, ...wallet.transactions]
    });

    onTriggerZap('stark_service_payment', { service: activeService.label, cost: activeService.cost, txHash });
    setPaySuccess(`Pago confirmado. ${activeService.cost} ARC retirados para "${activeService.label}".`);

    setTimeout(() => {
      setPaySuccess(null);
    }, 4000);
  };

  // LINK BANK ACCOUNT (Agregar cuenta bancaria)
  const handleLinkBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !ibanField || !accountHolder) {
      alert('Por favor complete todos los datos bancarios.');
      return;
    }

    localStorage.setItem('stark_bank_linked', 'true');
    localStorage.setItem('stark_bank_name', bankName);
    localStorage.setItem('stark_bank_iban', ibanField);
    localStorage.setItem('stark_bank_holder', accountHolder);
    setIsBankLinked(true);

    setLinkBankSuccess(`¡Cuenta de ${bankName} vinculada exitosamente con firma Stark-Secured-SEPA!`);
    onTriggerZap('bank_account_linked', { bank: bankName, holder: accountHolder });

    setTimeout(() => {
      setLinkBankSuccess(null);
    }, 4000);
  };

  // BUY CRYPTO WITH LINKED BANK ACCOUNT
  const handleBuyWithBank = (e: React.FormEvent) => {
    e.preventDefault();
    const fiatAmt = parseFloat(buyWithBankAmt);
    if (isNaN(fiatAmt) || fiatAmt <= 0) {
      alert('Introduzca un monto válido en fiat (€/$).');
      return;
    }

    // Convert €/$ to ARC at 1:1 rate for convenience
    const purchasedArc = fiatAmt;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'deposit',
      amount: purchasedArc,
      currency: 'ARC',
      status: 'confirmed',
      txHash,
      recipientOrIssuer: `Transf. Débito Bancario - SEPA Direct Debit`,
      zapTriggered: true
    };

    onUpdateWallet({
      balanceArc: wallet.balanceArc + purchasedArc,
      transactions: [newTx, ...wallet.transactions]
    });

    onTriggerZap('bank_funding_success', { amountFiat: fiatAmt, coinsCredited: purchasedArc, txHash });
    alert(`Compra confirmada. Se cargaron €${fiatAmt} a tu cuenta corriente y se acreditaron ${purchasedArc} ARC en tu Onion Wallet.`);
  };

  // UNLINK BANK
  const handleUnlinkBank = () => {
    localStorage.removeItem('stark_bank_linked');
    localStorage.removeItem('stark_bank_name');
    localStorage.removeItem('stark_bank_iban');
    localStorage.removeItem('stark_bank_holder');
    setIsBankLinked(false);
  };

  // COINFLIP VOUCHER REDEEMER (Cupón)
  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinflipVoucher.trim()) return;

    let reward = 50; // default reward
    const code = coinflipVoucher.toUpperCase();

    if (code === 'COINFLIP-STARK-100') {
      reward = 100;
    } else if (code.includes('BINANCE') || code.includes('UNISWAP')) {
      reward = 75;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newTx: CryptoTx = {
      id: crypto.randomUUID(),
      timestamp,
      type: 'deposit',
      amount: reward,
      currency: 'ARC',
      status: 'confirmed',
      txHash,
      recipientOrIssuer: `Redención Coinflip ATM Terminal Shield`,
      zapTriggered: true
    };

    onUpdateWallet({
      balanceArc: wallet.balanceArc + reward,
      transactions: [newTx, ...wallet.transactions]
    });

    onTriggerZap('coinflip_voucher_redeemed', { code, reward, txHash });
    setCoinflipSuccess(`¡Cupón Canjeado! Se acreditaron ${reward} ARC por transferencia directa Coinflip.`);
    setCoinflipVoucher('');

    setTimeout(() => {
      setCoinflipSuccess(null);
    }, 4500);
  };

  // Trigger simulated pool checker for Uniswap
  const checkUniPool = () => {
    setUnipoolChecked(true);
    setTimeout(() => {
      setUnipoolChecked(false);
    }, 3500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border-[3px] border-onion-purple rounded-3xl p-5 backdrop-blur-md justify-between glow-box-purple min-h-[560px] animate-[fadeIn_0.3s_ease]">
      
      {/* Wallet Heading & Global Status */}
      <div>
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-onion-purple/20 border border-onion-purple/50 rounded-xl relative group">
                <Wallet className="w-5 h-5 text-onion-purple-light animate-pulse" />
              </div>
              <div>
                <h2 className="font-display font-black text-xs text-white tracking-wider uppercase leading-none">ONION WALLET GATEWAY</h2>
                <span className="font-mono text-[9px] text-onion-purple-light uppercase font-extrabold">Controlador de Transacciones Cripto & SEPA</span>
              </div>
            </div>
            
            {/* Rotate Keys */}
            <button
              id="rotator-wallet-btn"
              onClick={regenerateCredentials}
              title="Rotar credenciales Onion"
              className="p-1 px-1.5 hover:bg-slate-900 rounded-lg border border-onion-purple/30 text-[9px] font-mono text-slate-400 hover:text-onion-purple-light transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-onion-purple-light" />
              <span>Rotar LLaves</span>
            </button>
          </div>
        </div>

        {/* Global Balances segment */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-reactor-cyan/30" />
            <span className="font-mono text-[8px] text-slate-500 font-bold tracking-wider uppercase pl-1.5">FONDOS ARC COIN</span>
            <div className="flex items-baseline gap-1 mt-1 pl-1.5">
              <span className="text-xl font-display font-black text-reactor-cyan tracking-tight">
                {wallet.balanceArc.toFixed(2)}
              </span>
              <span className="text-[9px] font-mono text-slate-405">ARC</span>
            </div>
            <span className="text-[8px] font-mono text-emerald-400/80 mt-1 flex items-center gap-1 pl-1.5">
              <Lock className="w-2.5 h-2.5 text-emerald-400" /> SECURED ON-CHAIN
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col justify-between relative overflow-hidden">
            {/* Liquid gold accent */}
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-liquid-gold-dark via-liquid-gold to-liquid-gold-light opacity-50" />
            <span className="font-mono text-[8px] text-slate-500 font-bold tracking-wider uppercase">FONDOS ESTIMADOS BTC</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-display font-black text-liquid-gold tracking-tight">
                {wallet.balanceBtc.toFixed(5)}
              </span>
              <span className="text-[9px] font-mono text-slate-405">BTC</span>
            </div>
            <span className="text-[8px] font-mono text-liquid-gold-light mt-1 flex items-center gap-1">
              Liquid Gold Wave ⚡
            </span>
          </div>
        </div>

        {/* ---------------- NEW WALLET OPERATIONAL MENU TABS ---------------- */}
        <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-slate-950 rounded-xl border border-slate-850 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setActiveMenuTab('info')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center ${
              activeMenuTab === 'info' ? 'bg-onion-purple text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Info / Mix
          </button>
          
          <button
            type="button"
            onClick={() => setActiveMenuTab('send')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
              activeMenuTab === 'send' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Envíos
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuTab('convert')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
              activeMenuTab === 'convert' ? 'bg-reactor-blue text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Convertir
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuTab('pay')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center ${
              activeMenuTab === 'pay' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pagos
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuTab('bank')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center ${
              activeMenuTab === 'bank' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Banco Sepa
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuTab('compatibility')}
            className={`py-1.5 rounded-lg font-bold transition-all text-center text-[9px] ${
              activeMenuTab === 'compatibility' ? 'bg-stark-scarlet text-white shadow' : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compatibilidad
          </button>
        </div>

        {/* ---------------- ACTIVE TAB RENDERING panels ---------------- */}
        <div className="min-h-[190px]">
          
          {/* TAB 1: INFO & SHUFFLE */}
          {activeMenuTab === 'info' && (
            <div className="flex flex-col gap-3 animate-[fadeIn_0.2s_ease]">
              {/* Credentials */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 font-mono text-[10px] flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="font-bold text-slate-400 tracking-wider">TÚNEL CENTRAL ONION</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 select-none">
                    <ShieldCheck className="w-3.5 h-3.5 animate-pulse" /> CONECTADO
                  </span>
                </div>

                <div className="break-all bg-slate-900 p-2 border border-slate-850 rounded font-bold text-reactor-cyan text-[8.5px] select-all">
                  {wallet.address}
                </div>

                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-slate-500">LLAVE PRIVADA DE FIRMA:</span>
                  <button
                    id="pk-visibility-btn"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                  >
                    {showPrivateKey ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>OCULTAR</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>REVELAR</span>
                      </>
                    )}
                  </button>
                </div>

                {showPrivateKey ? (
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-rose-400 text-[8px] font-bold break-all">
                    {wallet.privateKey}
                  </div>
                ) : (
                  <div className="bg-slate-900/40 p-2 border border-slate-900 rounded text-slate-700 italic text-[9px]">
                    ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block mb-1">MOCK FRASE SEMILLA (RESTORE SEED)</span>
                  <div className="p-2 border border-slate-900 bg-slate-950/40 rounded text-slate-400 text-[8.5px] uppercase tracking-wide leading-relaxed">
                    {wallet.seedPhrase}
                  </div>
                </div>
              </div>

              {/* Mixing details */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-onion-purple/30 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Shuffle className="w-3.5 h-3.5 text-onion-purple-light" />
                    <span className="font-bold text-white uppercase">Mezclador Onion.share</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-extrabold ${
                    wallet.mixingEnabled ? 'bg-onion-purple/20 border border-onion-purple text-onion-purple-light' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {wallet.mixingEnabled ? 'TÚNEL PRIVADO' : 'ESTÁNDAR'}
                  </span>
                </div>

                {isMixing ? (
                  <div className="bg-slate-900/90 p-2 rounded border border-onion-purple/30 text-[9px] font-mono flex flex-col gap-1 max-h-24 overflow-y-auto">
                    {mixLogs.map((log, idx) => (
                      <div key={idx} className="text-onion-purple-light flex items-center gap-1">
                        <span className="text-liquid-gold font-bold">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    id="wallet-shuffler-btn"
                    onClick={runAnonymousMixer}
                    className="w-full bg-slate-950 hover:bg-onion-purple/10 border-2 border-onion-purple/60 hover:border-onion-purple text-white rounded-xl py-1.5 px-3 font-mono text-[10px] font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(157,78,221,0.1)]"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-onion-purple-light animate-spin" />
                    BARAJAR TRANSACCIONES (ONION SHUFFLE)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SEND (Envíos & Transacciones) */}
          {activeMenuTab === 'send' && (
            <form onSubmit={handlePerformSend} className="flex flex-col gap-2.5 animate-[fadeIn_0.2s_ease] font-mono text-[10.5px]">
              <div>
                <span className="text-slate-400 font-bold block mb-1 uppercase text-[8.5px]">Enviar fondos / Transferir:</span>
                <p className="text-[8.5px] text-slate-500 mb-2 leading-relaxed">
                  Envía tokens inmutables a cualquier dirección externa. Compatible con firma asimétrica Stark de 256 bits.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold text-[8.5px] uppercase">Dirección de Destino:</label>
                <input
                  type="text"
                  placeholder="ej. onion:0x71c... o eth:0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-slate-500 font-bold text-[8.5px] uppercase">Monto a enviar:</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="ej. 100"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-center font-mono text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold text-[8.5px] uppercase">Moneda:</label>
                  <select
                    value={sendCurrency}
                    onChange={(e) => setSendCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  >
                    <option value="ARC">ARC</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-indigo-700 to-indigo-500 hover:brightness-110 text-white font-bold rounded-xl font-mono text-xs transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer shadow-[0_0_12px_rgba(79,70,229,0.3)]"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                EFECTUAR ENVÍO INMEDIATO
              </button>

              {sendTxSuccess && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-[9px] animate-pulse">
                  ✓ {sendTxSuccess}
                </div>
              )}
            </form>
          )}

          {/* TAB 3: CONVERTIR (Swap Tokens) */}
          {activeMenuTab === 'convert' && (
            <form onSubmit={handlePerformConvert} className="flex flex-col gap-2.5 animate-[fadeIn_0.2s_ease] font-mono text-[10.5px]">
              <div>
                <span className="text-slate-400 font-bold block mb-1 uppercase text-[8.5px]">Convertir monedas (Instant Swap):</span>
                <p className="text-[8.5px] text-slate-500 mb-2 leading-relaxed">
                  Realiza un intercambio instantáneo directo con la piscina de liquidez descentralizada de <span className="text-reactor-cyan font-bold">Uniswap Pools</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold text-[8.5px] uppercase">Desde (Monto de origen):</label>
                  <input
                    type="number"
                    step="any"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-reactor-blue text-center font-mono text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-500 font-bold text-[8.5px] uppercase font-mono">Convertir De:</label>
                  <select
                    value={convertFrom}
                    onChange={(e) => setConvertFrom(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1.5 text-slate-300 focus:outline-none focus:border-reactor-blue font-mono text-xs"
                  >
                    <option value="ARC">ARC Coins</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Preview */}
              <div className="bg-slate-950/75 p-2 rounded-xl border border-slate-900 text-[9px] flex justify-between items-center text-slate-400">
                <span>Régimen estimado Uniswap:</span>
                <span className="font-bold text-reactor-cyan">
                  {convertFrom === 'ARC' 
                    ? `1 ARC = 0.00019 BTC` 
                    : `1 BTC = 5,263.15 ARC`}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-reactor-blue to-teal-600 hover:brightness-110 text-slate-950 font-black rounded-xl font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.3)]"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950" />
                SOPORTAR INTERCAMBIO UNISWAP v3
              </button>

              {convertSuccess && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-[9px] leading-relaxed">
                  ✓ {convertSuccess}
                </div>
              )}
            </form>
          )}

          {/* TAB 4: PAGOS (Utility & Bills) */}
          {activeMenuTab === 'pay' && (
            <form onSubmit={handlePerformPayment} className="flex flex-col gap-2.5 animate-[fadeIn_0.2s_ease] font-mono text-[10.5px]">
              <div>
                <span className="text-slate-400 font-bold block mb-1 uppercase text-[8.5px]">Terminal de Pagos Stark:</span>
                <p className="text-[8.5px] text-slate-500 mb-2 leading-relaxed">
                  Autoriza y ejecuta pagos de servicios o infraestructura directo a la red del Reactor Stark Core.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 font-bold text-[8.5px] uppercase">Servicio o Producto a pagar:</label>
                <select
                  value={payService}
                  onChange={(e) => setPayService(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500 font-mono text-xs"
                >
                  <option value="reactor_maint">Mantenimiento de Reactor (50 ARC)</option>
                  <option value="speedforce_lic">Licencia Speedforce Tunnel (15 ARC)</option>
                  <option value="stark_merch">Merchandising Premium Stark Suit (120 ARC)</option>
                  <option value="proxy_renew">Renovación de Proxy Tor (5 ARC)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-white font-bold rounded-xl font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <DollarSign className="w-3.5 h-3.5 text-white" />
                CONFIRMAR PAGO DE SERVICIO
              </button>

              {paySuccess && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-[9px] leading-relaxed">
                  ✓ {paySuccess}
                </div>
              )}
            </form>
          )}

          {/* TAB 5: BANCO (Vincular Cuenta Bancaria / SEPA Direct Debit) */}
          {activeMenuTab === 'bank' && (
            <div className="flex flex-col gap-2.5 animate-[fadeIn_0.2s_ease] font-mono text-[10px]">
              {!isBankLinked ? (
                <form onSubmit={handleLinkBank} className="flex flex-col gap-2">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase text-[8.5px]">Vincular Cuenta Bancaria (Firma SEPA):</span>
                    <p className="text-[8px] text-slate-500 mb-2 leading-relaxed">
                      Conecta tus cuentas fiduciarias (Euro/Dólar) para comprar o liquidar ARC Coins de forma segura, bajo compatibilidad de depósito y retiro.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-slate-500 font-bold text-[8px] uppercase">Nombre del Banco:</label>
                      <input
                        type="text"
                        placeholder="ej. CaixaBank, BBVA"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white placeholder-slate-700 text-[10px]"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <label className="text-slate-500 font-bold text-[8px] uppercase">Titular:</label>
                      <input
                        type="text"
                        placeholder="ej. Tony Stark"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white placeholder-slate-700 text-[10px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-slate-500 font-bold text-[8px] uppercase">Número IBAN:</label>
                    <input
                      type="text"
                      placeholder="ES91 2100 •••• •••• •••• ••••"
                      value={ibanField}
                      onChange={(e) => setIbanField(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white placeholder-slate-700 text-[10px]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:brightness-110 text-white font-bold rounded-xl font-mono text-[10.5px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    VINCULAR CON ENCRIPTACIÓN STARK
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Bank card detail layout */}
                  <div className="bg-gradient-to-br from-teal-950 to-slate-950 p-3 rounded-2xl border-2 border-teal-500/40 font-mono text-[9px] relative overflow-hidden flex flex-col justify-between h-28 text-white">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-teal-400 tracking-wider">CUENTA DE DEPÓSITO FIAT VINCULADA</span>
                        <span className="text-[7.5px] text-slate-400">{localStorage.getItem('stark_bank_name') || 'Stark Bank'}</span>
                      </div>
                      <Building2 className="w-4 h-4 text-teal-400" />
                    </div>

                    <div className="font-mono text-xs font-bold text-teal-300 tracking-widest my-1 text-center">
                      {localStorage.getItem('stark_bank_iban') ? `${localStorage.getItem('stark_bank_iban')?.substring(0, 4)} •••• •••• •••• •••• ${localStorage.getItem('stark_bank_iban')?.slice(-4)}` : 'ES91 •••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[7px] text-slate-500">TITULAR DE CUENTA</span>
                        <span className="font-bold text-white uppercase text-[8px]">{localStorage.getItem('stark_bank_holder') || 'Tony Stark'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlinkBank}
                        className="text-[8px] px-1.5 py-0.5 bg-rose-900/40 border border-rose-500/40 rounded text-rose-350 hover:bg-rose-900/60 transition-colors uppercase font-bold"
                      >
                        DESVINCULAR
                      </button>
                    </div>
                  </div>

                  {/* Fund with linked bank form */}
                  <form onSubmit={handleBuyWithBank} className="flex gap-2 items-center bg-slate-950 p-2 rounded-xl border border-slate-900">
                    <div className="flex-1">
                      <label className="text-[7.5px] text-slate-500 font-bold block uppercase mb-0.5">COMPRA SECTORIZADA ARC:</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2 text-[10px] text-teal-500">€</span>
                        <input
                          type="number"
                          value={buyWithBankAmt}
                          onChange={(e) => setBuyWithBankAmt(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-5.5 py-1 text-white text-[11px] focus:outline-none focus:border-teal-400 font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-500 hover:brightness-110 text-slate-950 font-black rounded-lg text-[10.5px] transition-all cursor-pointer h-9 mt-3.5"
                    >
                      DÉBITO SEPA
                    </button>
                  </form>
                </div>
              )}

              {linkBankSuccess && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 animate-pulse text-[8.5px]">
                  ✓ {linkBankSuccess}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COMPATIBILIDAD (Uniswap, Coinflip, Binance, Wasabi Wallet, Proton Wallet) */}
          {activeMenuTab === 'compatibility' && (
            <div className="flex flex-col gap-3.5 animate-[fadeIn_0.2s_ease] font-mono text-[10px]">
              <div>
                <span className="text-slate-400 font-bold block mb-1 uppercase text-[8.5px]">Compatibilidad Stark Puenteada:</span>
                <p className="text-[8.5px] text-slate-500 leading-normal">
                  Esta dApp es nativa y compatible con múltiples protocolos globales. Haz interactuar tu Onion wallet con ellos:
                </p>
              </div>

              {/* Coinflip Voucher input */}
              <form onSubmit={handleRedeemVoucher} className="bg-slate-950 p-2.5 rounded-xl border-2 border-dashed border-amber-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8.5px] font-bold text-amber-500 uppercase tracking-wide">🔗 Redimir Boleto Coinflip ATM</span>
                  <span className="bg-amber-500/10 text-amber-500 px-1 rounded text-[7px] font-bold">CASH REDEMPTION</span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    placeholder="ej. COINFLIP-STARK-100"
                    value={coinflipVoucher}
                    onChange={(e) => setCoinflipVoucher(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-amber-400 text-[10px] uppercase font-bold placeholder-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-500 hover:brightness-110 text-slate-950 text-[9px] font-black rounded transition-all cursor-pointer"
                  >
                    CANJEAR
                  </button>
                </div>
                {coinflipSuccess && (
                  <p className="text-emerald-400 text-[8.5px] mt-1.5 animate-pulse font-bold">✓ {coinflipSuccess}</p>
                )}
                <span className="text-[7px] text-slate-600 block mt-1 leading-none">
                  Prueba introduciendo el código "COINFLIP-STARK-100" para obtener 100 ARC.
                </span>
              </form>

              {/* Grid of partner integrations */}
              <div className="grid grid-cols-2 gap-2 text-[9px] leading-tight">
                
                {/* UNISWAP */}
                <div className="p-2 bg-pink-950/20 border border-pink-500/25 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-pink-400">UNISWAP BRIDGED</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                  </div>
                  <p className="text-slate-500 text-[8px] mt-1">Compatible con piscinas de liquidez v3 descentralizadas Stark/ETH.</p>
                  
                  <button 
                    type="button" 
                    onClick={checkUniPool}
                    className="mt-1.5 py-0.5 w-full bg-pink-950/50 hover:bg-pink-900/30 border border-pink-500/30 text-pink-300 font-bold text-[8px] rounded uppercase cursor-pointer"
                  >
                    {unipoolChecked ? "Pool: 10,250,540 ARC ⚖️" : "Revisar Liquidez Pool"}
                  </button>
                </div>

                {/* BINANCE API */}
                <div className="p-2 bg-yellow-950/15 border border-yellow-500/20 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-yellow-405">BINANCE API SECURE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-405"></span>
                  </div>
                  <p className="text-slate-500 text-[8px] mt-1">Soporta gateway de APIs directas para depositar y retirar mediante Binance Pay.</p>
                  <span className="text-[7.5px] text-yellow-405 font-bold mt-1.5 block">● FAST FEED LINKED</span>
                </div>

                {/* WASABI WALLET */}
                <div className="p-2 bg-emerald-950/15 border border-emerald-500/20 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 font-mono text-[8.5px]">WASABI COINJOIN</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <p className="text-slate-500 text-[8px] mt-1">El pool Onion.share es totalmente compatible con la ofuscación CoinJoin de Wasabi Wallet.</p>
                  <span className="text-[7px] text-emerald-400 mt-1 block">✓ COMPATIBILIDAD TOR ONION</span>
                </div>

                {/* PROTON WALLET */}
                <div className="p-2 bg-indigo-950/15 border border-indigo-505/20 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-400">PROTON TUNNEL</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  </div>
                  <p className="text-slate-500 text-[8px] mt-1">Firma electrónica vinculada a correos Proton habilitada para validación en BetVerifier.</p>
                  <span className="text-[7px] text-indigo-400 mt-1 block font-bold">TUNEL ACTIVO ⚡</span>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* Footer Transactions quick indicators (always useful!) */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/60 font-mono text-[9px] text-slate-500 flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-900">
        <span className="font-mono font-bold text-slate-400">FILTRADO DE TRANSACCIONES:</span>
        <div className="flex items-center gap-1 text-[8.5px] text-emerald-450 font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{wallet.transactions.length} LOGS INMUTABLES EN FIRESTORE</span>
        </div>
      </div>

    </div>
  );
}
