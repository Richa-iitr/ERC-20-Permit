const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const dotenv = require("dotenv");
const ethsig = require("eth-sig-util");
const {ecsign, ecrecover, pubToAddress} = require("ethereumjs-util");

describe("DAI deposit", function () {

  let signer, daideposit, expiry;
  const PERMIT_TYPEHASH = '0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb';
  const DOMAIN_SEPARATOR = '0xdbb8cf42e1ecb028be3f3dbc922e1d878b963f411dc388ced501601c60f7c6f7';
  const signerAddr = "0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf";
  const holder = "0x15C6b352c1F767Fa2d79625a40Ca4087Fab9a198";
  const privateKey = "4df23289d68410e41293f85be6bffd3378b90d3f7d46b7f990634886ff05c678";    //private key of the owner

  beforeEach(async function () {
    const DaiDeposit = await ethers.getContractFactory("DaiDeposit");
    daideposit = await DaiDeposit.deploy();
    await daideposit.deployed();
    console.log(daideposit.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [signerAddr],
    });
    signer = await ethers.getSigner(signerAddr);
    await hre.network.provider.send("hardhat_setBalance", [
      holder,
      "0x9F4F2726179A224501D762422C946590D9100",
    ]);
  });

  it("Should return the transaction hash on successful transfer", async function () {

    expiry = Date.now() + 20*60;
    let amount = 0;
    // let nonce = daideposit.getNonce(holder);         
    let nonce=0;
    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        [
          '0x19',
          '0x01',
          DOMAIN_SEPARATOR,
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ['bytes32', 'address', 'address', 'uint256', 'uint256', 'bool'],
              [PERMIT_TYPEHASH, holder, daideposit.address, nonce, expiry, true]
            )
          )
        ]
      )
    );

    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey,'hex'));  
    const addr = ecrecover(Buffer.from(digest.slice(2),'hex'), v,r,s);
    console.log(pubToAddress(addr));  
    let txHash = await daideposit.connect(signer).deposit(holder, amount, v, r, s, expiry, nonce);
    console.log("Transaction hash: ");
    console.log(txHash);
  });
});
