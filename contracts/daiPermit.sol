//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;
import "./interface.sol";
import "hardhat/console.sol";

contract  DaiDeposit {
    address private DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    event Deposit(address indexed src, address indexed dest, uint256 amt);

    // function getNonce (address user) public view returns (uint256 nonce) {
    //     return Dai(DAI).nonces(user);
    // }

    function deposit (address user, uint256 amount, uint8 v, bytes32 r, bytes32 s, uint256 expiry, uint256 nonce) public {
        // uint256 nonce = getNonce(user);                              //getting user's nonce
        // (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);   
        Dai(DAI).permit(user, address(this), nonce, expiry, true, v, r, s);
        Dai(DAI).transferFrom(user, address(this), amount);
        emit Deposit(user, address(this), amount);
    }

    // function splitSignature (bytes memory sign) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
    //     require(sign.length == 65, "invalid signature length");
    //     assembly {
    //         //first 32 bytes store length, add(sign, 32) skips first 32 bytes
    //         r:= mload(add(sign, 32))
    //         s:= mload(add(sign,64))
    //         v:= byte(0, mload(add(sign, 96)))
    //     }
    // }

}
