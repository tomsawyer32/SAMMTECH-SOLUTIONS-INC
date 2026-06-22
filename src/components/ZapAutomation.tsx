import React from 'react';
import { ZapTrigger } from '../types';
import { Zap, Play, CheckCircle2, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, ArrowRight, Settings } from 'lucide-react';

interface ZapAutomationProps {
  triggers: ZapTrigger[];
  onToggleTrigger: (id: string) => void;
  onClearHistory: () => void;
}

export default function ZapAutomation({ triggers, onToggleTrigger, onClearHistory }: ZapAutomationProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md justify-between glow-box-blue">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-reactor-cyan animate-pulse" />
            <span className="font-display font-bold text-sm text-slate-300">ZAP PAYMENT OPERATIONAL BRIDGE</span>
          </div>
          <button
            id="clear-zap-history-btn"
            onClick={onClearHistory}
            className="text-[9px] font-mono text-slate-500 hover:text-reactor-cyan border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded bg-slate-950 transition-colors"
          >
            CLEAR WEBHOOK FLUX
          </button>
        </div>

        <p className="text-xs font-mono text-slate-500 mb-4 leading-normal">
          Infraestructura de pagos automatizada. Acciones del casino ejecutan instantáneamente triggers REST de Zap para dispersar balances y mitigar la carga operativa.
        </p>

        {/* Triggers list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {triggers.map(trig => (
            <div key={trig.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between gap-2 text-xs font-mono">
              <div className="flex justify-between items-start">
                <span className="font-bold text-reactor-cyan tracking-wider text-[11px] block truncate max-w-[130px]">
                  ⚡ {trig.eventName}
                </span>
                <button
                  id={`toggle-zap-${trig.id}`}
                  onClick={() => onToggleTrigger(trig.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {trig.isActive ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[9px]">
                      <span>ACTIVE</span>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-600 font-bold text-[9px]">
                      <span>PAUSED</span>
                      <ToggleLeft className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </button>
              </div>

              <div className="text-[9px] text-slate-500 bg-slate-900 border border-slate-800 p-1.5 rounded truncate italic select-text">
                POST {trig.targetWebhook}
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Total Run loops:</span>
                <span className="text-white font-bold">{trig.executionCount} zaps</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zap execution logs */}
      <div>
        <div className="bg-slate-950 border-t-2 border-liquid-gold p-3.5 rounded-xl border border-slate-800/80 font-mono">
          <span className="font-bold text-[10px] text-slate-400 tracking-wider mb-2 block uppercase">
            RESTA WEBHOOK LOG (LATENCY MEASUREMENT)
          </span>

          <div className="max-h-28 overflow-y-auto flex flex-col gap-1.5 bg-slate-900/60 p-2 border border-slate-800/50 rounded-lg text-[9px]">
            {triggers.flatMap(t => t.recentExecutions).length === 0 ? (
              <div className="text-slate-600 text-center italic py-2">
                Log pool vacío. Rotaciones, apuestas y cargas de saldo registran eventos automatizados en tiempo real.
              </div>
            ) : (
              triggers.flatMap(t => t.recentExecutions)
                .sort((a,b) => b.time.localeCompare(a.time))
                .slice(0, 10).map((exec, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-300 gap-2">
                    <span className="text-slate-500 shrink-0">{exec.time.split(' ')[1] || exec.time}</span>
                    <span className="text-liquid-gold truncate font-bold text-[8px] max-w-[120px]">{exec.payload}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold shrink-0">STATUS 200 OK</span>
                    <span className="text-slate-600 text-[8px] shrink-0 font-bold">12ms latency</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
