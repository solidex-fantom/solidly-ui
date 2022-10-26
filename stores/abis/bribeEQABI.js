export const bribeABI = [
    {
        "type": "constructor",
        "stateMutability": "nonpayable",
        "inputs": [{"type": "address", "name": "_voter", "internalType": "address"}, {
            "type": "address[]",
            "name": "_allowedRewardTokens",
            "internalType": "address[]"
        }]
    }, {
        "type": "event",
        "name": "ClaimRewards",
        "inputs": [{"type": "address", "name": "from", "internalType": "address", "indexed": true}, {
            "type": "address",
            "name": "reward",
            "internalType": "address",
            "indexed": true
        }, {"type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false}],
        "anonymous": false
    }, {
        "type": "event",
        "name": "Deposit",
        "inputs": [{"type": "address", "name": "from", "internalType": "address", "indexed": true}, {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256",
            "indexed": false
        }, {"type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false}],
        "anonymous": false
    }, {
        "type": "event",
        "name": "NotifyReward",
        "inputs": [{"type": "address", "name": "from", "internalType": "address", "indexed": true}, {
            "type": "address",
            "name": "reward",
            "internalType": "address",
            "indexed": true
        }, {"type": "uint256", "name": "epoch", "internalType": "uint256", "indexed": false}, {
            "type": "uint256",
            "name": "amount",
            "internalType": "uint256",
            "indexed": false
        }],
        "anonymous": false
    }, {
        "type": "event",
        "name": "Withdraw",
        "inputs": [{"type": "address", "name": "from", "internalType": "address", "indexed": true}, {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256",
            "indexed": false
        }, {"type": "uint256", "name": "amount", "internalType": "uint256", "indexed": false}],
        "anonymous": false
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "_deposit",
        "inputs": [{"type": "uint256", "name": "amount", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "_ve",
        "inputs": []
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "_withdraw",
        "inputs": [{"type": "uint256", "name": "amount", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "balanceOf",
        "inputs": [{"type": "uint256", "name": "", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "timestamp", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "balanceOf",
            "internalType": "uint256"
        }],
        "name": "checkpoints",
        "inputs": [{"type": "uint256", "name": "", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "earned",
        "inputs": [{"type": "address", "name": "token", "internalType": "address"}, {
            "type": "uint256",
            "name": "tokenId",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "pure",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "getEpochStart",
        "inputs": [{"type": "uint256", "name": "timestamp", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "getPriorBalanceIndex",
        "inputs": [{"type": "uint256", "name": "tokenId", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "timestamp",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "getPriorSupplyIndex",
        "inputs": [{"type": "uint256", "name": "timestamp", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "getReward",
        "inputs": [{"type": "uint256", "name": "tokenId", "internalType": "uint256"}, {
            "type": "address[]",
            "name": "tokens",
            "internalType": "address[]"
        }]
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "getRewardForOwner",
        "inputs": [{"type": "uint256", "name": "tokenId", "internalType": "uint256"}, {
            "type": "address[]",
            "name": "tokens",
            "internalType": "address[]"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "bool", "name": "", "internalType": "bool"}],
        "name": "isReward",
        "inputs": [{"type": "address", "name": "", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "lastEarn",
        "inputs": [{"type": "address", "name": "", "internalType": "address"}, {
            "type": "uint256",
            "name": "",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "lastTimeRewardApplicable",
        "inputs": [{"type": "address", "name": "token", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "left",
        "inputs": [{"type": "address", "name": "token", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "notifyRewardAmount",
        "inputs": [{"type": "address", "name": "token", "internalType": "address"}, {
            "type": "uint256",
            "name": "amount",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "numCheckpoints",
        "inputs": [{"type": "uint256", "name": "", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "periodFinish",
        "inputs": [{"type": "address", "name": "", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "rewards",
        "inputs": [{"type": "uint256", "name": "", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "rewardsListLength",
        "inputs": []
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "timestamp", "internalType": "uint256"}, {
            "type": "uint256",
            "name": "supply",
            "internalType": "uint256"
        }],
        "name": "supplyCheckpoints",
        "inputs": [{"type": "uint256", "name": "", "internalType": "uint256"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "supplyNumCheckpoints",
        "inputs": []
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [],
        "name": "swapOutRewardToken",
        "inputs": [{"type": "uint256", "name": "i", "internalType": "uint256"}, {
            "type": "address",
            "name": "oldToken",
            "internalType": "address"
        }, {"type": "address", "name": "newToken", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "tokenRewardsPerEpoch",
        "inputs": [{"type": "address", "name": "", "internalType": "address"}, {
            "type": "uint256",
            "name": "",
            "internalType": "uint256"
        }]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "uint256", "name": "", "internalType": "uint256"}],
        "name": "totalSupply",
        "inputs": []
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "voter",
        "inputs": []
    }
]