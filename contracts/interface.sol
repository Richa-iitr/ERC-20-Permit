//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

interface Dai {
    //  mapping (address => uint)                      public nonces;
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) external;
}