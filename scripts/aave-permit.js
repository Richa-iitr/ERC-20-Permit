const hre = require("hardhat");
const ethers = hre.ethers;
const dotenv = require("dotenv");
const ethsig = require("eth-sig-util");
const {ecsign} = require("ethereumjs-util");
const owner = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
const spender = "0x721C0E481Ae5763b425aCb1b04ba98baF480D83B";
const aaveAddress = "0xC13eac3B4F9EED480045113B7af00F7B5655Ece8";

const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.API_KEY;
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
    "0x9F4F2726179A224501D762422C946590D9100",
  ]);
  await hre.network.provider.send("hardhat_setBalance", [
    spender,
    "0x9F4F2726179A224501D762422C946590D9100",
  ]);
  
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf"],
  });
  // await hre.network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: ["0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8"],
  // });
  const signer = await ethers.getSigner("0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf");

  let provider = new ethers.providers.AlchemyProvider("homestead", apiKey);
  let contract = new ethers.Contract(aaveAddress, AaveTokenAbi, signer);
  let chainId = 1;
  let value = 10;
  let nonce = await contract._nonces(owner);
  nonce = nonce.toNumber();
  let deadline = Date.now() + 20*60;

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
  // let wallet = new ethers.Wallet(privateKey, provider);
  // let contractWithSigner = contract.connect(wallet);
  
  const domainSep = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(
          'EIP712Domain(string name, string version, uint256 chainId, address verifyingContract)'
          )
        ),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(
          'AAVE Token'
          )
        ),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(
          '1'
          )
        ),
        chainId,
        aaveAddress,
      ]
    )
  );
  const PERMIT_HASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(
    'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
  )
  );
  const aaveDigest = ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        domainSep,
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_HASH, owner, spender, value, nonce, deadline]
          )
        )
      ]
    )
  )

  // const signature = ethsig.signTypedData_v4(Buffer.from(privateKey, "hex"), {
  //   data: permitParams,
  // });
  // // console.log(signature);
  // const { v, r, s } = fromRpcSig.fromRpcSig(signature);

  const { v, r, s } = ecsign(Buffer.from(aaveDigest.slice(2), 'hex'), Buffer.from(privateKey,'hex'));
  let tx = await contract.permit(
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s, {
      gasLimit: 100000,
      nonce: nonce || undefined,
    }
  );
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



  // const signature = await signer._signTypedData(domain, types, message);
  // // const signature = ethsig.signTypedData_v4(Buffer.from(privateKey, "hex"), {
  // //   data: permitParams,
  // // });
  // console.log(signature);

  // const {v, r, s} = ethers.utils.splitSignature(signature);
  // // const { v, r, s } = fromRpcSig.fromRpcSig(signature);
  // const types ={
  //   EIP712Domain: [
  //     { name: "name", type: "string" },
  //     { name: "version", type: "string" },
  //     { name: "chainId", type: "uint256" },
  //     { name: "verifyingContract", type: "address" },
  //   ],
  //   Permit: [
  //     { name: "owner", type: "address" },
  //     { name: "spender", type: "address" },
  //     { name: "value", type: "uint256" },
  //     { name: "nonce", type: "uint256" },
  //     { name: "deadline", type: "uint256" },
  //   ],
  // };
  // const message = {
  //   owner,
  //   spender,
  //   value,
  //   nonce,
  //   deadline,
  // };
  // const domain = {
  //   name: "Aave Token",
  //   version: "1",
  //   chainId: chainId,
  //   verifyingContract: aaveAddress,
  // };