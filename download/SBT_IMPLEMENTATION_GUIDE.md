# 本物のSBT（Soulbound Token）無料実装ガイド

## 🎯 結論：無料実装は可能

ユーザーにとって**完全無料**でSBTを受け取れる仕組みは実装可能です。

---

## 📊 無料化のアプローチ比較

### 1. Gasless Transaction（Paymaster）

最も現実的な方法。ユーザーは署名だけで、アプリ側がガス代を負担。

```
┌──────────────────────────────────────────────────────────────┐
│                     Paymaster Flow                           │
└──────────────────────────────────────────────────────────────┘

  ユーザー                     アプリ                   ブロックチェーン
     │                          │                          │
     │  1. トランザクション署名   │                          │
     │  （ガス代なし）           │                          │
     │ ─────────────────────────▶                          │
     │                          │                          │
     │                          │  2. Paymaster経由で送信   │
     │                          │  （アプリがガス代負担）    │
     │                          │ ─────────────────────────▶│
     │                          │                          │
     │                          │  3. SBT発行              │
     │                          │ ◀─────────────────────────│
     │                          │                          │
     │  4. SBT受け取り完了       │                          │
     │ ◀─────────────────────────                          │
```

### 2. コスト比較

| チェーン | ガス代/発行 | Paymaster利用時 | 月間コスト（1000発行） |
|----------|-------------|-----------------|----------------------|
| Ethereum | ~$5-20 | アプリ負担 | $5,000-20,000 |
| Polygon | ~$0.01 | アプリ負担 | ~$10 |
| Base | ~$0.005 | アプリ負担 | ~$5 |
| **Base + Paymaster** | **$0** | **ユーザー無料** | **~$5** |

---

## 🛠️ 実装方法

### ステップ1: Baseにデプロイ

BaseはCoinbaseが運営するL2で、ガス代が非常に安い。

```bash
# Foundryをインストール
curl -L https://foundry.paradigm.xyz | bash
foundryup

# プロジェクト作成
forge init trust-sbt
cd trust-sbt

# OpenZeppelinをインストール
forge install OpenZeppelin/openzeppelin-contracts
```

### ステップ2: デプロイスクリプト

```javascript
// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const TrustSBT = await ethers.getContractFactory("TrustSBT");
  const sbt = await TrustSBT.deploy();

  await sbt.deployed();
  console.log("TrustSBT deployed to:", sbt.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### ステップ3: Gasless設定（Alchemy/Infura）

AlchemyのGasless機能を使うと、ユーザーは署名だけでトランザクション可能。

```typescript
// lib/sbt-client.ts
import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.BASE_MAINNET,
};

const alchemy = new Alchemy(config);

// Gasless SBT発行
export async function mintSBTGasless(
  userWallet: string,
  userSignature: string
) {
  // ユーザーの署名を検証
  const signer = await verifySignature(userSignature);

  // Paymaster経由でトランザクション送信
  const tx = await alchemy.transact.sendPrivateTransaction({
    to: SBT_CONTRACT_ADDRESS,
    data: encodeMintData(userWallet),
    from: userWallet,
    // Paymasterがガス代を負担
    maxFeePerGas: "0x0",
    maxPriorityFeePerGas: "0x0",
  });

  return tx;
}
```

---

## 💰 コスト試算

### 小規模運用（月100人）

| 項目 | コスト |
|------|--------|
| Baseガス代 | ~$0.50 |
| Alchemy Freeプラン | $0 |
| **合計** | **~$0.50/月** |

### 中規模運用（月1000人）

| 項目 | コスト |
|------|--------|
| Baseガス代 | ~$5 |
| Alchemy Growthプラン | $49 |
| **合計** | **~$54/月** |

### 大規模運用（月10000人）

| 項目 | コスト |
|------|--------|
| Baseガス代 | ~$50 |
| Alchemy Enterprise | $300+ |
| **合計** | **~$350/月** |

---

## 🔧 実装の簡易版

テストネット（Base Sepolia）なら完全無料で試せます：

```typescript
// lib/sbt-service.ts
import { ethers } from "ethers";
import TrustSBT from "../contracts/TrustSBT.json";

const SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

export class SBTService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    this.contract = new ethers.Contract(SBT_ADDRESS, TrustSBT.abi, this.wallet);
  }

  // SBT発行（初回のみ）
  async mintSBT(userWallet: string) {
    const tx = await this.contract.mintSBT(userWallet);
    await tx.wait();
    return tx.hash;
  }

  // 信頼性スコア更新
  async updateTrust(
    userWallet: string,
    points: number,
    correct: number,
    incorrect: number,
    level: number
  ) {
    const tx = await this.contract.updateTrust(
      userWallet,
      points,
      correct,
      incorrect,
      level
    );
    await tx.wait();
    return tx.hash;
  }

  // 信頼性データ取得
  async getTrustData(userWallet: string) {
    return await this.contract.getTrustData(userWallet);
  }
}
```

---

## 📋 完全無料で運用するためのチェックリスト

### ✅ 推奨構成

- [ ] **チェーン**: Base（またはBase Sepolia for test）
- [ ] **RPC**: Alchemy Freeプラン（月300M compute units）
- [ ] **Paymaster**: Alchemy Gasless（月1000トランザクション無料）
- [ ] **デプロイ**: 一回のみ ~$1-2

### ⚠️ 注意点

1. **初期デプロイ費用**: ~$1-2必要（Baseの場合）
2. **Paymasterの制限**: 無料プランは月1000トランザクション
3. **セキュリティ**: 秘密鍵の管理に注意

---

## 🚀 次のステップ

1. Base Sepolia（テストネット）でSBTコントラクトをデプロイ
2. アプリに統合して動作確認
3. 本番（Base Mainnet）にデプロイ
4. Paymasterを設定してユーザー無料化

---

## 📚 参考リンク

- [Base Documentation](https://docs.base.org/)
- [Alchemy Gasless](https://www.alchemy.com/gasless)
- [ERC-5192 Spec](https://eips.ethereum.org/EIPS/eip-5192)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
