//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

interface Dai {
    //  mapping (address => uint)                      public nonces;
    function nonces(address user) external returns(uint);
    function transferFrom(address src, address dst, uint wad) external returns (bool);
    function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s) external;
}
interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    //ERC20
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function name() external view returns (string memory);
}