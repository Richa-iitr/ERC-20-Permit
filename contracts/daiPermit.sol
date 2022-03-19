//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;
import "./interface.sol";

contract  Deposit {
    address private DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    event Deposit(address indexed src, address indexed dest, uint256 amt);

    function deposit (address user, address _token, uint256 amount, uint8 v, bytes32 r, bytes32 s, uint256 expiry, uint256 nonce) public {  
        if(_token != DAI) {
            IERC20Permit(_token).permit(user, address(this), amount, expiry,  v, r, s);
            IERC20Permit(_token).transferFrom(user, address(this), amount);
        } else {
            Dai(DAI).permit(user, address(this), nonce, expiry, true, v, r, s);
            Dai(DAI).transferFrom(user, address(this), amount);
        }
        emit Deposit(user, address(this), amount);
    }
}
