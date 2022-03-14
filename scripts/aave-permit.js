const hre = require("hardhat");
const ethers = hre.ethers;
const dotenv = require("dotenv");
const signTypedData_v4 = require("eth-sig-util");
const fromRpcSig = require("ethereumjs-util");
const owner = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
const spender = "0x721C0E481Ae5763b425aCb1b04ba98baF480D83B";
const aaveAddress = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
const AaveTokenAbi =  [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "implementation",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_logic", type: "address" },
      { internalType: "address", name: "_admin", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_logic", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
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
  let provider = ethers.getDefaultProvider();
  let contract = new ethers.Contract(aaveAddress, AaveTokenAbi, provider);
  let privateKey = process.env.PRIVATE_KEY;
  let chainId = 1;
  let value = 2;
  let nonce = await contract._nonces(owner);
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
      verifyingContract: aaveTokenAddress,
    },
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline,
    },
  }

  let wallet = new ethers.Wallet(privateKey, provider);
  let contractWithSigner = contract.connect(wallet);

  const signature = signTypedData_v4(
    Buffer.from(privateKey, "hex"),
    { data: permitParams }
  );

  const { v, r, s } = fromRpcSig(signature);
  await contractWithSigner.permit({
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s
  });
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
