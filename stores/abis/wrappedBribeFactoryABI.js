export const wrappedBribeFactoryABI = [
    {
        "type": "constructor",
        "stateMutability": "nonpayable",
        "inputs": [{"type": "address", "name": "_voter", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "nonpayable",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "createBribe",
        "inputs": [{"type": "address", "name": "existing_bribe", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "last_bribe",
        "inputs": []
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "oldBribeToNew",
        "inputs": [{"type": "address", "name": "", "internalType": "address"}]
    }, {
        "type": "function",
        "stateMutability": "view",
        "outputs": [{"type": "address", "name": "", "internalType": "address"}],
        "name": "voter",
        "inputs": []
    }
]