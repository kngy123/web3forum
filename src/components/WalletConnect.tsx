'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { shortenAddress } from '@/lib/web3';
import { useWalletStore } from '@/lib/wallet-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletConnect() {
  const { address, isConnected, setAddress, disconnect } = useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected
    if (window.ethereum && address) {
      // Verify the address is still valid
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: unknown) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length === 0 || accountsArray[0] !== address) {
            disconnect();
          }
        })
        .catch(() => {
          disconnect();
        });
    }
  }, [address, disconnect]);

  useEffect(() => {
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length === 0) {
          disconnect();
        } else if (accountsArray[0] !== address) {
          setAddress(accountsArray[0]);
        }
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [address, setAddress, disconnect]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask等のウォレット拡張機能をインストールしてください');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('ウォレット接続に失敗しました');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? '接続中...' : 'ウォレット接続'}
        </Button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {shortenAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <LogOut className="mr-2 h-4 w-4" />
          接続解除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
