import React, { useState } from 'react';
import { SmartContract } from '../types';
import { Code2, Play, CheckCircle2, AlertTriangle, Cpu, Terminal, RefreshCw, Layers } from 'lucide-react';

interface SmartContractsProps {
  contracts: SmartContract[];
  onDeployContract: (name: string) => void;
  onClearLogs: () => void;
}

const CONTRACT_TEMPLATES = {
  'BetVerifier.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BetVerifier {
    address public owner;
    uint256 public totalWagers;
    
    event BetSettled(bytes32 indexed txId, address indexed player, uint256 payout);

    constructor() {
        owner = msg.sender;
    }

    function verifyAndSettle(
        uint256 wager, 
        uint256 payout, 
        bytes32 secretSalt
    ) external returns (bool) {
        require(wager > 0, "Null wager");
        totalWagers += wager;
        emit BetSettled(keccak256(abi.encodePacked(secretSalt)), msg.sender, payout);
        return true;
    }
}`,
  'ZapPayments.sol': `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZapPayments {
    address public zapRelayer;
    
    event ZapFired(string triggerName, uint256 refAmount, address walletRef);

    modifier onlyRelayer() {
        require(msg.sender == zapRelayer, "Unauthorized call");
        _;
    }

    function setZapRelayer(address newRelayer) external {
        zapRelayer = newRelayer;
    }

    function triggerZapPayment(
        string memory triggerName, 
        uint256 amount, 
        address walletRef
    ) external onlyRelayer {
        emit ZapFired(triggerName, amount, walletRef);
    }
}`
};

export default function SmartContracts({ contracts, onDeployContract, onClearLogs }: SmartContractsProps) {
  const [selectedContractFile, setSelectedContractFile] = useState<string>('BetVerifier.sol');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      onDeployContract(selectedContractFile.replace('.sol', ''));
      setIsDeploying(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md justify-between glow-box-blue">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-reactor-cyan" />
            <span className="font-display font-bold text-sm text-slate-300">AUTOMATED SMART CONTRACTS</span>
          </div>
          <button
            id="clear-contract-logs-btn"
            onClick={onClearLogs}
            className="text-[9px] font-mono text-slate-500 hover:text-reactor-cyan border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded transition-all bg-slate-950"
          >
            RESET EXECUTION LEDGER
          </button>
        </div>

        {/* Contract Code Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          
          {/* Contracts List / Deployment */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            <span className="font-mono text-[9px] text-slate-500 font-bold tracking-wider uppercase block">SOLY-COMPILER FILE SELECT</span>
            
            <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
              {Object.keys(CONTRACT_TEMPLATES).map(fname => (
                <button
                  key={fname}
                  id={`select-${fname.replace('.', '-')}`}
                  onClick={() => setSelectedContractFile(fname)}
                  className={`w-full text-left font-mono text-[10px] px-2 py-1.5 rounded border transition-all ${
                    selectedContractFile === fname 
                      ? 'bg-reactor-cyan/10 border-reactor-cyan text-reactor-cyan font-bold' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  📄 {fname}
                </button>
              ))}
            </div>

            {/* Active deployments status */}
            <span className="font-mono text-[9px] text-slate-500 font-bold tracking-wider uppercase block mt-2">ACTIVE NODES</span>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono flex flex-col gap-2 max-h-32 overflow-y-auto">
              {contracts.map(cnt => (
                <div key={cnt.id} className="border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">{cnt.name}.sol</span>
                    <span className="text-emerald-400 text-[9px]">{cnt.status.toUpperCase()}</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 break-all">ADDR: {cnt.address}</div>
                </div>
              ))}
            </div>

            <button
              id="deploy-soly-btn"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="mt-2 w-full bg-slate-950 border border-slate-800 hover:border-reactor-cyan text-white text-xs font-mono font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className={`w-3.5 h-3.5 text-reactor-cyan ${isDeploying ? 'animate-bounce' : ''}`} />
              {isDeploying ? 'COMPILING SOLY...' : 'DEPLOY CONTRACT'}
            </button>
          </div>

          {/* Solidity Visual Emulator */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-56 lg:h-auto font-mono text-[9px]">
            <div className="bg-slate-900 border-b border-outline px-3 py-1.5 flex items-center justify-between text-slate-400 font-mono">
              <span className="font-bold flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-orange-400" />
                SOLIDITY FIRMWARE ENVIRONMENT
              </span>
              <span>v0.8.20+commit.a1b2c3d</span>
            </div>
            <textarea
              readOnly
              className="flex-1 bg-slate-950 p-3 text-slate-400 resize-none font-mono focus:outline-none focus:ring-0 leading-relaxed overflow-y-auto w-full border-0 select-text"
              value={CONTRACT_TEMPLATES[selectedContractFile as keyof typeof CONTRACT_TEMPLATES]}
            />
          </div>

        </div>
      </div>

      {/* Contract Execution Ledger Logs */}
      <div>
        <div className="bg-slate-950 border-t-2 border-reactor-cyan p-3.5 rounded-xl border border-slate-800/80 font-mono">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-reactor-cyan" />
              INTELLIGENT CONTRACT EXECUTION LEDGER
            </span>
            <span className="text-[9px] uppercase font-bold text-emerald-400">AUTOMATED WORKFLOW ACTIVE</span>
          </div>

          <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 bg-slate-900/60 p-2 border border-slate-800/50 rounded-lg text-[9px] leading-relaxed">
            {contracts.flatMap(c => c.logs).length === 0 ? (
              <div className="text-slate-600 text-center italic py-4">
                No active contract runs execution detected. Wager/Spin cards to execute automated code verifications.
              </div>
            ) : (
              contracts.flatMap(c => c.logs).map((log, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-1">
                  <span className="text-reactor-cyan font-bold leading-none select-none">[ok]</span>
                  <span className="break-all">{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
