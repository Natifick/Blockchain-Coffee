// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// Just to use console.log
// import "hardhat/console.sol";

contract CoffeeToken is ERC20 {
    using Address for address;
    using SafeERC20 for IERC20;
    // We'll work in following way:
    // CoffeeShop gets "total supply" of tokens
    // When they sell all tokens - magic hapens and token unlocks
    // (Since that means that the shop achieved the needed funding)
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    // The token that we accept as the currency
    IERC20 public token;
    uint256 public neededSum;

    constructor(
      string memory name_,
      string memory symbol_,
      uint256 neededSum_,
      address token_) 
      ERC20(name_, symbol_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
        // The token to accept as currency
        // No liquidity though, sorry
        token = IERC20(token_);
        neededSum = neededSum_;
    }

    function balance() public view returns (uint256) {
        // How much FakeEthers do we alredy have?
        return token.balanceOf(address(this));
    }

    function deposit(uint256 _amount) public {
        // Amount must be greater than zero
        require(_amount > 0, "Amount cannot be 0");

        // Transfer FakeEth to smart contract
        // If try to send more than we need - don't transfer -_-
        if (neededSum < _amount) {
            token.safeTransferFrom(msg.sender, address(this), neededSum);
            // Mint CoffeeToken to msg sender
            _mint(msg.sender, neededSum);
            neededSum = 0;
        }
        else {
            token.safeTransferFrom(msg.sender, address(this), _amount);
            // Mint CoffeeToken to msg sender
            _mint(msg.sender, _amount);
            neededSum = neededSum - _amount;
        }
    }

    function withdraw(uint256 _amount) public {
        // If we didn't collect the needed sum - you can't sell tokens
        require(neededSum == 0, "The funding is still in progress");
        // Burn CoffeeToken from msg sender
        _burn(msg.sender, _amount);

        // Technically, we usually return Ethereum back
        // But in this task we give them real coffee instead (stonks)

        // Transfer MyTokens from this smart contract to msg sender
        // token.safeTransfer(msg.sender, _amount);
    }
}

// So we actually have to call this function
// Taken mostly from here: https://habr.com/ru/articles/714938/
contract CoffeeFactory {

    event tokenCreated(address tokenAddress);

    function deployNewERC20(
            string calldata name,
            string calldata symbol,
            uint256 totalSupply,
            address _token // That we will accept as the currency
        ) external returns (address) {
            CoffeeToken token = new CoffeeToken(
                name,
                symbol,
                totalSupply,
                _token // Originally they used "msg.sender", but we specify the token in this way
            );
      
            emit tokenCreated(address(token));

            return address(token);
        }
}
