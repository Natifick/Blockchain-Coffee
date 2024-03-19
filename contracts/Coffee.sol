// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// Just to use console.log
// import "hardhat/console.sol";

contract CoffeeToken is ERC20, Ownable {
    
    constructor(
      string memory name_,
      string memory symbol_,
      uint256 totalSupply_,
      address owner_) 
      ERC20(name_, symbol_) 
      Ownable(owner_) {
        _mint(owner_, totalSupply_);
        _transferOwnership(owner_);
      }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

// So we actually have to call this function
// Taken mostly from here: https://habr.com/ru/articles/714938/
contract CoffeeFactory {

    event tokenCreated(address tokenAddress);

    function deployNewERC20(
            string calldata name,
            string calldata symbol,
            uint256 totalSupply
            
        ) external returns (address) {
            CoffeeToken token = new CoffeeToken(
                name,
                symbol,
                totalSupply,
                msg.sender
            );
      
            emit tokenCreated(address(token));

            return address(token);
        }
}
