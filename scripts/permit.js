const hre = require("hardhat");
const dotenv = require("dotenv");
const { signTypedData_v4, recoverPersonalSignature } = require("eth-sig-util");
const {
  fromRpcSig,
  ecrecover,
  toBuffer,
  bufferToHex,
  ecsign,
  pubToAddress,
} = require("ethereumjs-util");
const Web3 = require("web3");
const BigNumber = require("bignumber.js");

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://polygon-mumbai.g.alchemy.com/v2/${process.env.alchemy_key}`
  )
);

const owner = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
const spender = "0x721C0E481Ae5763b425aCb1b04ba98baF480D83B";
// const aaveAddress = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"; //AAVE Token proxy address
const aaveAddress = "0x7ec62b6fC19174255335C8f4346E0C2fcf870a6B";

const privateKey =
  process.env.PRIVATE_KEY; //private key of the owner

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
  let contract = new web3.eth.Contract(AaveTokenAbi, aaveAddress);
  let chainId = 80001;
  let value = 1;
  let nonce = await contract.methods._nonces(owner).call();
  console.log(nonce);
  let deadline = Date.now() + 20 * 60;

  const domainSep = web3.utils.keccak256(
    web3.eth.abi.encodeParameters(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        web3.utils.keccak256(
          web3.utils.hexToUtf8(
            web3.utils.toHex(
              "EIP712Domain(string name, string version, uint256 chainId, address verifyingContract)"
            )
          )
        ),
        web3.utils.keccak256(
          web3.utils.hexToUtf8(web3.utils.toHex("AAVE Token"))
        ),
        web3.utils.keccak256(web3.utils.hexToUtf8(web3.utils.toHex("1"))),
        chainId,
        aaveAddress,
      ]
    )
  );
  console.log(domainSep);
  const PERMIT_HASH =
    "0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9";

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
    }
    const data = JSON.stringify(permitParams);
    const aaveDigest = await web3.eth.accounts.sign(data, privateKey);
    console.log(aaveDigest);
  
  const signature = aaveDigest.signature;
  
  let addr = await web3.eth.accounts.recover({
    messageHash: aaveDigest.messageHash,
    v: aaveDigest.v,
    r: aaveDigest.r,
    s: aaveDigest.s
})

let v = aaveDigest.v;
let r = aaveDigest.r;
let s = aaveDigest.s;
console.log(addr);
  
  await contract.methods
    .permit(owner, spender, value, deadline, v, r, s)
    .call()
    .then(function (hash) {
      console.log(hash);
    })
    .catch((e) => {
      throw Error(`Error permitting: ${e.message}`);
    });

  console.log("Transfer From txHash:");
  let tx2 = await contract.methods
    .transferFrom(owner, spender, 0)
    .call()
    .catch((e) => {
      throw Error(`Error transferring from: ${e.owner}`);
    });
  console.log(tx2);
}

ercPermit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





















// const permitParams = {
//   types: {
//     EIP712Domain: [
//       { name: "name", type: "string" },
//       { name: "version", type: "string" },
//       { name: "chainId", type: "uint256" },
//       { name: "verifyingContract", type: "address" },
//     ],
//     Permit: [
//       { name: "owner", type: "address" },
//       { name: "spender", type: "address" },
//       { name: "value", type: "uint256" },
//       { name: "nonce", type: "uint256" },
//       { name: "deadline", type: "uint256" },
//     ],
//   },
//   primaryType: "Permit",
//   domain: {
//     name: "Aave Token",
//     version: "1",
//     chainId: chainId,
//     verifyingContract: aaveAddress,
//   },
//   message: {
//     owner,
//     spender,
//     value,
//     nonce,
//     deadline,
//   },
// };

// const signature = signTypedData_v4(Buffer.from(privateKey, "hex"), {
//   data: permitParams,
// });
// const { v, r, s } = fromRpcSig(signature);


// const aaveDigest = web3.utils.keccak256(
  //   web3.utils.encodePacked(web3.eth.abi.encodeParameters(
  //       ["bytes1", "bytes1", "bytes32", "bytes32"],
  //       [
  //         "0x19",
  //         "0x01",
  //         domainSep,
  //         web3.utils.keccak256(
  //           web3.eth.abi.encodeParameters(
  //             [
  //               "bytes32",
  //               "address",
  //               "address",
  //               "uint256",
  //               "uint256",
  //               "uint256",
  //             ],
  //             [PERMIT_HASH, owner, spender, value, nonce, deadline]
  //           )
  //         ),
  //       ]
  //   )
  //   )
  // );
  // console.log(`a:${aaveDigest}`);

  // let r = Buffer.from(aaveDigest.r);
  // let s = Buffer.from(aaveDigest.s);
  // let v = web3.utils.hexToNumber(aaveDigest.v);
  //   console.log(signature);
  //  let {v, r, s} = fromRpcSig(signature);
  // const { v, r, s } = ecsign(
  //   Buffer.from(signature.slice(2), "hex"),
  //   Buffer.from(privateKey, "hex")
  // );

  // const addr = ecrecover(Buffer.from(aaveDigest.signature.slice(2), "hex"), v, r, s);
  // console.log(pubToAddress(addr));
  // console.log("Permit txHash:");

  // const transaction = {
  //   'from': spender,
  //   'gas': 53000,
  //   'nonce': await web3.eth.getTransactionCount(owner, 'latest'),
  // }
  // const signedTx = await web3.eth.accounts.signTransaction(transaction, privateKey);
  // const Hash="";
  // web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
  //   if (!error) {
  //     Hash =hash;
  //     console.log("hash  ", hash);
  //   } else {
  //     console.log("something went wrong", error)
  //   }
  //  });
