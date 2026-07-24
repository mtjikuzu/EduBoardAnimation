import React, { useState, useEffect } from "react";
import { Coins, Lock, History, Loader2, Plus } from "lucide-react";
import { getCreditBalance, getCreditLedger, mockCheckout } from "../lib/api";
import type { CreditBalance as CreditBalanceType, CreditLedgerEntry } from "../lib/api";

export default function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, l] = await Promise.all([
        getCreditBalance(),
        getCreditLedger(10),
      ]);
      setBalance(b);
      setLedger(l);
    } catch (err) {
      console.error("Failed to load credit data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await mockCheckout(purchaseAmount);
      await loadData();
      setShowPurchase(false);
    } catch (err) {
      console.error("Purchase failed", err);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="credit-balance">
      {/* Balance display */}
      <button
        onClick={() => setShowPurchase(!showPurchase)}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
        data-testid="button-credits"
      >
        <Coins className="w-4 h-4 text-secondary" />
        <span className="text-sm font-medium text-foreground">
          {balance?.available ?? 0}
        </span>
        {balance && balance.held > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {balance.held} held
          </span>
        )}
      </button>

      {/* Purchase panel */}
      {showPurchase && (
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm" data-testid="purchase-panel">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-card-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-secondary" />
              Buy Credits
            </h4>
            <button
              onClick={() => setShowPurchase(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {[25, 50, 100, 200].map((amount) => (
              <button
                key={amount}
                onClick={() => setPurchaseAmount(amount)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  purchaseAmount === amount
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {purchaseAmount} credits
            </span>
            <span className="text-sm font-medium text-foreground">
              $ {(purchaseAmount / 10).toFixed(2)} USD
            </span>
          </div>

          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            data-testid="button-buy-credits"
          >
            {purchasing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : null}
            {purchasing ? "Processing..." : `Buy ${purchaseAmount} Credits`}
          </button>

          <p className="text-[10px] text-muted-foreground mt-2">
            Dev mode: credits granted directly. Production uses Polar Checkout.
          </p>
        </div>
      )}

      {/* Recent ledger entries */}
      {ledger.length > 0 && (
        <div className="text-xs text-muted-foreground" data-testid="ledger-history">
          <div className="flex items-center gap-1 mb-1">
            <History className="w-3 h-3" />
            Recent
          </div>
          {ledger.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex justify-between py-0.5">
              <span className="capitalize">{entry.entryType}</span>
              <span>
                {entry.amount} credits
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
