const hre = require("hardhat");
const ethers = hre.ethers;
const dotenv = require("dotenv");
const ethsig = require("eth-sig-util");
const {ecsign, ecrecover} = require("ethereumjs-util");

const owner = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
const spender = "0x721C0E481Ae5763b425aCb1b04ba98baF480D83B";
const aaveAddress = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";                         //AAVE Token proxy address

const privateKey = process.env.PRIVATE_KEY;    //private key of the owner

//AAVE Token contract implementation ABI
const AaveTokenAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
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


async function ercPermit() {
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
  const signer = await ethers.getSigner("0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf");

  let contract = new ethers.Contract(aaveAddress, AaveTokenAbi, signer);
  let chainId = 1;
  let value = 10;
  let nonces = await contract._nonces(owner);
  const nonce = nonces.toNumber();
  // console.log(nonce);
  let deadline = Date.now() + 20*60;
 
  const domainSep = '0x2901a982e363189e3f2e4db2e5c3291fa1067b815a3ac9890ac6573e51bf33b0';
  const PERMIT_HASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9';
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
  );

  const { v, r, s } = ecsign(Buffer.from(aaveDigest.slice(2), 'hex'), Buffer.from(privateKey,'hex'));
  // const addr = ecrecover(Buffer.from(aaveDigest.slice(2),'hex'), v,r,s);
  // console.log(pubToAddress(addr));

  console.log("Permit txHash:");
  let tx = await contract.permit(
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s, 
    {
      gasLimit: 100000,
      nonce: nonce || undefined,
    }
  );
  console.log(tx);
  console.log();

  console.log("Transfer From txHash:");
  let tx2 = await contract.transferFrom(
    owner,
    spender,
    0
  );
  console.log(tx2);
}

ercPermit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
