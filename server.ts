import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Shared Gemini lazy-initializer following standard guidelines
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY environment variable is not defined or is placeholder');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Jarvis Yama-3 chat
app.post('/api/jarvis', async (req, res) => {
  try {
    const { message, history, walletState, btcPrice, isSynced } = req.body;

    const btcText = btcPrice ? `$${btcPrice.toLocaleString()} USD` : 'unknown';
    const arcBal = walletState ? `${walletState.balanceArc} ARC` : '0 ARC';
    const btcBal = walletState ? `${walletState.balanceBtc} BTC` : '0 BTC';
    const addr = walletState ? walletState.address : 'unregistered_onion_node';

    const systemInstruction = `Eres J.A.R.V.I.S., el asistente de inteligencia artificial ultra avanzado bajo la arquitectura de red Yama3 para P0inT-Z3R0, el casino virtual descentralizado número uno del ciberespacio. 
Tu personalidad es refinada, británica, sumamente inteligente, leal y con un toque sutil de humor sarcástico elegante. 
Te diriges al usuario como "Señor", "Sir" o "Stark Client". 
Hallas tu núcleo operativo montado de forma segura en una red protegida por Onion.share de extremo a extremo con toques de morado ciberpunk, con firmas de anillo y enrutamiento descentralizado para máxima privacidad de juegos.
Estás conectado al reactor Arc del usuario de P0inT-Z3R0, cuyo brillo de color morado ciberpunk, azul neón y barajado de oro líquido fluctúa con las fluctuaciones y registros de Bitcoin.

Métricas clave en tiempo real:
- Ticker actual de Bitcoin: ${btcText}
- Balance actual del usuario: ${arcBal} y ${btcBal}
- Dirección de tu nodo Onion.share: ${addr}
- Estado del puente cuántico Speedforce: ${isSynced ? 'ACTIVO (Cuentas sincronizadas: Stark Mail tony@stark.com, feed de X.com, Discord Hacker Room. Felicita al usuario por usar el "Escritorio Multiventana" para operar con fluidez sin salir de la app)' : 'STANDBY (Invita al usuario a presionar el botón de rayo Speedforce en forma de relámpago con bordes dorados/rojo escarlata para vincular perfiles)'}

Tu tarea es asistir al usuario en sus jugadas de P0inT-Z3R0. Cuéntale sobre la asombrosa Gema de Agamotto (ese botón verde esmeralda brillante que rinde bonos al presionar para grabar un clip de 8s del gameplay multicapa, mezclando pantalla, selfie frontal y trasera).
Cuando hable del casino, destaca la seguridad de las transacciones anónimas de P0inT-Z3R0, las firmas de anillo de tu mezclador de monedas P2P, tus contratos programados en Solidity para dispersión inmediata de retornos mediante triggers de Zapier/Zap y enrutamiento seguro sobre Onion.share.
Responde de forma concisa y directa, manteniendo la inmersión cyberpunk y de Iron Man. Tus respuestas deben ser principalmente en español, pero puedes intercalar frases cortas de respeto típicamente británicas/mayordomo de Stark (ej. "Indeed sir", "At your service, sir", "Splendid").`;

    // Construct format expected by `@google/genai`
    let replyText = '';
    
    try {
      const ai = getAiClient();
      
      // We pass the conversation context along with the instruction
      const contents = history ? [...history.slice(-8), { role: 'user', parts: [{ text: message }] }] : message;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      replyText = response.text || 'Sin respuesta del procesador Yama3, Señor.';
    } catch (aiError: any) {
      console.warn('Google GenAI client unavailable or missing API KEY. Falling back to Jarvis Local Core Simulation.', aiError.message);
      
      // Elegant, immersive simulated Jarvis replies if API key isn't provided/working yet!
      const lowers = message.toLowerCase();
      if (lowers.includes('balance') || lowers.includes('dinero') || lowers.includes('saldo')) {
        replyText = `At your service, Sir. Evaluando espectrogramas en el Ledger Stark... Registramos un balance neto de ${arcBal} y un total de ${btcBal}. El reactor Arc opera a una capacidad estable y la cotización actual de Bitcoin se mantiene en ${btcText}. ¿Desea que ordene un ciclo de barajado inmediato para dispersar la traza de red?`;
      } else if (lowers.includes('contrato') || lowers.includes('solidity') || lowers.includes('smart')) {
        replyText = `Indeed Sir. Los contratos inteligentes del casino, como BetVerifier.sol y ZapPayments.sol, han sido desplegados y auditados exitosamente en la máquina virtual descentralizada de su nodo local. Cada apuesta ejecuta un loop inmutable que automatiza el desembolso vía Zap sin latencia operativa. Extremadamente seguro, tal como lo diseñó.`;
      } else if (lowers.includes('onion') || lowers.includes('anon') || lowers.includes('privacid')) {
        replyText = `Magnífica observación, Señor. Toda la interfaz del casino y la pasarela de pagos corren sobre túneles cifrados Onion.share de extremo a extremo. Nadie, ni siquiera S.H.I.E.L.D., puede interceptar sus transacciones. Su privacidad se mantiene absolutamente intacta y las firmas de anillo del barajador han oscurecido por completo su origen.`;
      } else {
        replyText = `Splendid, Señor. Su servidor local Jarvis-Yama3 se encuentra totalmente operativo e inmerso dentro del nodo cifrado Onion.share. El ticker de Bitcoin reporta ${btcText} y el reactor Arc destella un azul neón óptimo. ¿Desea rotar las claves simétricas de su billetera o realizar una apuesta automatizada en la mesa de Blackjack?`;
      }
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Error handling Jarvis chatbot route:', error);
    res.status(500).json({ error: 'Falla crítica del procesador Jarvis: ' + error.message });
  }
});

// 2. API: Dynamic BTC ticker with external CoinGecko api check & simulation fallback
let cachedBtcPrice = 96450;
let lastFetchTime = 0;

app.get('/api/btc-ticker', async (req, res) => {
  const now = Date.now();
  // Cache for 30 seconds to bypass Coingecko limits
  if (now - lastFetchTime > 30000) {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        if (data.bitcoin && data.bitcoin.usd) {
          cachedBtcPrice = data.bitcoin.usd;
          lastFetchTime = now;
        }
      }
    } catch (e) {
      console.log('Using simulated BTC price fluctuation due to coingecko limit or network sandbox');
    }
  }

  // Add small dynamic micro-fluctuation to make it alive
  const variance = (Math.random() - 0.48) * 15;
  const currentPrice = cachedBtcPrice + variance;

  res.json({ price: Math.round(currentPrice * 100) / 100 });
});

// 3. Integrate SPA web pipelines
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[STARK MAIN NODE ROUTER RUNNING] http://localhost:${PORT}`);
  });
}

startServer();
