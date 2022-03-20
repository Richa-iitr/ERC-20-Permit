const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const dotenv = require("dotenv");
const ethsig = require("eth-sig-util");
const { ecsign, ecrecover, pubToAddress } = require("ethereumjs-util");

describe("Deposit ERC20", function () {
  let expiry, erc20deposit;
  const holder = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
  const privateKey = process.env.PRIVATE_KEY; //private key of the owner
  expiry = Date.now() + 20 * 60;
  let amount = 2;
  const daiAbi = [
    {
      constant: true,
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "nonces",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { internalType: "address", name: "dst", type: "address" },
        { internalType: "uint256", name: "wad", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  const aaveAbi = [
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "_nonces",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
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
  ];

  beforeEach(async function () {

    const Deposit = await ethers.getContractFactory("Deposit");
    erc20deposit = await Deposit.deploy();
    await erc20deposit.deployed();
    console.log(`Deployed address: ${erc20deposit.address}`);
  });

  it("Should return the transaction hash on successful transfer of dai", async function () {
    let signer, dai;
    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const signeAddr = "0x1B7BAa734C00298b9429b518D621753Bb0f6efF2";

    const PERMIT_TYPEHASH =
      "0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb";
    const DOMAIN_SEPARATOR =
      "0xdbb8cf42e1ecb028be3f3dbc922e1d878b963f411dc388ced501601c60f7c6f7";

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [signeAddr],
    });

    signer = await ethers.getSigner(signeAddr);

    dai = await new ethers.Contract(daiAddress, daiAbi);
    await dai.connect(signer).transfer(holder, amount);

    let sBalance = await dai.connect(signer).balanceOf(erc20deposit.address);
    console.log(`Balance of DAI of contract before transaction: ${sBalance}`);
    console.log(`Amount: ${amount}`);
    console.log();

    let nonces = await await erc20deposit.callStatic.getDaiNonce(holder, daiAddress);
    let nonce = nonces.toNumber();

    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        [
          "0x19",
          "0x01",
          DOMAIN_SEPARATOR,
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "address", "address", "uint256", "uint256", "bool"],
              [
                PERMIT_TYPEHASH,
                holder,
                erc20deposit.address,
                nonce,
                expiry,
                true,
              ]
            )
          ),
        ]
      )
    );

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), "hex"),
      Buffer.from(privateKey, "hex")
    );
    let txHash = await erc20deposit
      .connect(signer)
      .deposit(holder, daiAddress, amount, v, r, s, expiry);
    console.log("DAI Transaction hash: ");
    console.log(txHash);
    console.log();

    let eBalance = await dai.connect(signer).balanceOf(erc20deposit.address);
    console.log(`Balance of DAI of contract after transaction: ${eBalance}`);
  });

  it("Should return the transaction hash on successful transfer of aave", async function () {
    let signer, aave;
    const aaveAddress = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";

    const signerAddr = "0x26a78D5b6d7a7acEEDD1e6eE3229b372A624d8b7";

    const PERMIT_TYPEHASH =
      "0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9";
    const DOMAIN_SEPARATOR =
      "0x2901a982e363189e3f2e4db2e5c3291fa1067b815a3ac9890ac6573e51bf33b0";

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [signerAddr],
    });

    signer = await ethers.getSigner(signerAddr);

    aave = await new ethers.Contract(aaveAddress, aaveAbi);
    await aave.connect(signer).transfer(holder, amount);

    let sBalance = await aave.connect(signer).balanceOf(erc20deposit.address);
    console.log(`Balance of AAVE of contract before transaction: ${sBalance}`);
    console.log(`Amount: ${amount}`);
    console.log();

    let nonces = await aave.connect(signer)._nonces(holder);
    let nonce = nonces.toNumber();

    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        [
          "0x19",
          "0x01",
          DOMAIN_SEPARATOR,
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              [
                "bytes32",
                "address",
                "address",
                "uint256",
                "uint256",
                "uint256",
              ],
              [
                PERMIT_TYPEHASH,
                holder,
                erc20deposit.address,
                amount,
                nonce,
                expiry,
              ]
            )
          ),
        ]
      )
    );

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), "hex"),
      Buffer.from(privateKey, "hex")
    );
    let txHash = await erc20deposit
      .connect(signer)
      .deposit(holder, aaveAddress, amount, v, r, s, expiry);
    console.log("AAVE Transaction hash: ");
    console.log(txHash);
    console.log();

    let eBalance = await aave.connect(signer).balanceOf(erc20deposit.address);
    console.log(`Balance of AAVE of contract after transaction: ${eBalance}`);
  });
});