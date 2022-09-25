export const equilibreLibraryABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ type: "address", name: "_router", internalType: "address" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
    name: "getAmountOut",
    inputs: [
      { type: "uint256", name: "amountIn", internalType: "uint256" },
      { type: "address", name: "tokenIn", internalType: "address" },
      { type: "address", name: "tokenOut", internalType: "address" },
      { type: "bool", name: "stable", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      { type: "uint256", name: "", internalType: "uint256" },
      { type: "uint256", name: "", internalType: "uint256" },
      { type: "uint256", name: "", internalType: "uint256" },
    ],
    name: "getMinimumValue",
    inputs: [
      { type: "address", name: "tokenIn", internalType: "address" },
      { type: "address", name: "tokenOut", internalType: "address" },
      { type: "bool", name: "stable", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
    name: "getSample",
    inputs: [
      { type: "address", name: "tokenIn", internalType: "address" },
      { type: "address", name: "tokenOut", internalType: "address" },
      { type: "bool", name: "stable", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      { type: "uint256", name: "a", internalType: "uint256" },
      { type: "uint256", name: "b", internalType: "uint256" },
    ],
    name: "getTradeDiff",
    inputs: [
      { type: "uint256", name: "amountIn", internalType: "uint256" },
      { type: "address", name: "tokenIn", internalType: "address" },
      { type: "address", name: "tokenOut", internalType: "address" },
      { type: "bool", name: "stable", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      { type: "uint256", name: "a", internalType: "uint256" },
      { type: "uint256", name: "b", internalType: "uint256" },
    ],
    name: "getTradeDiff",
    inputs: [
      { type: "uint256", name: "amountIn", internalType: "uint256" },
      { type: "address", name: "tokenIn", internalType: "address" },
      { type: "address", name: "pair", internalType: "address" },
    ],
  },
];
