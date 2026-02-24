// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustSBT
 * @notice 信頼性スコアを記録するSoulbound Token (移転不可NFT)
 * @dev ERC-5192準拠の実装
 */
contract TrustSBT is ERC721, Ownable {
    // トークンIDカウンター
    uint256 private _tokenIdCounter;

    // ウォレットアドレス → トークンID
    mapping(address => uint256) public walletToTokenId;

    // トークンID → 信頼性データ
    mapping(uint256 => TrustData) public trustData;

    // 信頼性データ構造
    struct TrustData {
        uint256 totalPoints;      // 総ポイント
        uint256 correctCount;     // 正解回数
        uint256 incorrectCount;   // 不正解回数
        uint256 trustLevel;       // 信頼レベル (1-5)
        uint256 updatedAt;        // 更新日時
    }

    // イベント
    event TrustUpdated(
        address indexed wallet,
        uint256 totalPoints,
        uint256 trustLevel
    );
    event SBTCreated(
        address indexed wallet,
        uint256 indexed tokenId
    );

    constructor() ERC721("Trust Score SBT", "TRUST") Ownable(msg.sender) {}

    /**
     * @notice 移転不可の設定（SBTの核心）
     * @dev ERC-5192のlocked関数
     */
    function locked(uint256) external pure returns (bool) {
        return true; // 常にロック = 移転不可
    }

    /**
     * @notice ユーザーにSBTを発行（初回のみ）
     */
    function mintSBT(address to) external onlyOwner returns (uint256) {
        require(walletToTokenId[to] == 0, "SBT already exists for this wallet");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        walletToTokenId[to] = tokenId;

        // 初期データ
        trustData[tokenId] = TrustData({
            totalPoints: 0,
            correctCount: 0,
            incorrectCount: 0,
            trustLevel: 1,
            updatedAt: block.timestamp
        });

        emit SBTCreated(to, tokenId);
        return tokenId;
    }

    /**
     * @notice 信頼性スコアを更新
     * @dev アプリの管理者のみ実行可能
     */
    function updateTrust(
        address wallet,
        uint256 points,
        uint256 correct,
        uint256 incorrect,
        uint256 level
    ) external onlyOwner {
        uint256 tokenId = walletToTokenId[wallet];
        require(tokenId != 0, "No SBT found for this wallet");

        trustData[tokenId] = TrustData({
            totalPoints: points,
            correctCount: correct,
            incorrectCount: incorrect,
            trustLevel: level,
            updatedAt: block.timestamp
        });

        emit TrustUpdated(wallet, points, level);
    }

    /**
     * @notice 移転を禁止（オーバーライド）
     */
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert("SBT: token is soulbound and cannot be transferred");
    }

    /**
     * @notice 安全な移転を禁止（オーバーライド）
     */
    function safeTransferFrom(
        address,
        address,
        uint256
    ) public pure override {
        revert("SBT: token is soulbound and cannot be transferred");
    }

    /**
     * @notice ウォレットの信頼性データを取得
     */
    function getTrustData(address wallet) external view returns (TrustData memory) {
        uint256 tokenId = walletToTokenId[wallet];
        require(tokenId != 0, "No SBT found");
        return trustData[tokenId];
    }

    /**
     * @notice ウォレットがSBTを持っているか確認
     */
    function hasSBT(address wallet) external view returns (bool) {
        return walletToTokenId[wallet] != 0;
    }
}
