const hre = require("hardhat");
const ethers = hre.ethers;
const dotenv = require("dotenv");
const ethsig = require("eth-sig-util");
const fromRpcSig = require("ethereumjs-util");
const owner = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
const spender = "0x721C0E481Ae5763b425aCb1b04ba98baF480D83B";
const aaveAddress = "0xC13eac3B4F9EED480045113B7af00F7B5655Ece8";

const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.ALCHEMY_KEY;
const AaveTokenAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "_nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function main() {
  await hre.network.provider.send("hardhat_setBalance", [
    owner,
    "0x3684AB4DA86601424000000",
  ]);
  await hre.network.provider.send("hardhat_setBalance", [
    spender,
    "0x3684AB4DA86601424000000",
  ]);
  let provider = new ethers.providers.AlchemyProvider( [ network = "mainnet" , [ apiKey ] ] )
  let contract = new ethers.Contract(aaveAddress, AaveTokenAbi, provider);
  let chainId = 1;
  let value = 2;
  let nonce = await contract._nonces(owner);
  nonce = nonce.toNumber();
  let deadline = 1600093162;

  const permitParams = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain: {
      name: "Aave Token",
      version: "1",
      chainId: chainId,
      verifyingContract: aaveAddress,
    },
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline,
    },
  };
  let wallet = new ethers.Wallet(privateKey, provider);
  let contractWithSigner = contract.connect(wallet);

  const signature = ethsig.signTypedData_v4(Buffer.from(privateKey, "hex"), {
    data: permitParams,
  });

  const { v, r, s } = fromRpcSig.fromRpcSig(signature);
  await contractWithSigner.permit({
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
