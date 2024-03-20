// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// Just to use console.log
import "hardhat/console.sol";

contract CoffeeToken is ERC20, ERC20Permit, Ownable {

    event fundingFinished(address shopOwner, uint256 neededSum);
    event shopOpened();

    using Address for address;
    using SafeERC20 for IERC20;
    // We'll work in following way:
    // CoffeeShop gets "total supply" of tokens
    // When they sell all tokens - magic hapens and token unlocks
    // (Since that means that the shop achieved the needed funding)
    uint8 private _decimals;
    // The token that we accept as the currency
    IERC20 public token;
    uint256 public neededSum;
    address public shopOwner;
    bool private _isUnlocked;

    constructor(
      string memory name_,
      string memory symbol_,
      uint256 neededSum_,
      IERC20 token_,
      address shopOwner_) 
      ERC20(name_, symbol_)
      ERC20Permit(name_) 
      Ownable(shopOwner_){
        _decimals = 18;
        // The token to accept as currency
        // No liquidity though, sorry
        token = token_;
        neededSum = neededSum_;
        shopOwner = shopOwner_;
        // Just to be sure about that
        _isUnlocked=false;
    }

    function balance() public view returns (uint256) {
        // How much FakeEthers do we alredy have?
        return token.balanceOf(address(this));
    }

    function unlock() public onlyOwner {
        require(!_isUnlocked, "Already unlocked");
        require(this.balance()==neededSum, "Not enough funds collected");
        _isUnlocked = true;
        // Shop is opened - get your coffee
        emit shopOpened();
    }

    function deposit(uint256 _amount) public payable {
        // Amount must be greater than zero
        require(_amount > 0, "Amount cannot be 0");
        require(!_isUnlocked, "The needed funds are already collected");
        require(neededSum > this.balance(), "The needed funds are already collected");
        // Transfer FakeEth to smart contract
        // If try to send more than we need - don't transfer -_-

        if (neededSum < this.balance() + _amount) {
            token.safeTransferFrom(msg.sender, address(this), neededSum-this.balance());
            // Mint CoffeeToken to msg sender
            _mint(msg.sender, neededSum);
        }
        else {
            token.safeTransferFrom(msg.sender, address(this), _amount);
            // Mint CoffeeToken to msg sender
            _mint(msg.sender, _amount);
        }
        // Event that the funding is finished
        if (neededSum == this.balance()){
            emit fundingFinished(shopOwner, neededSum);
        }
    }

    function withdraw(uint256 _amount) public payable {
        // If we didn't collect the needed sum - you can't sell tokens
        require(this.balance()==neededSum, "The funding is still in progress");
        // require that we have something to burn
        require(balanceOf(msg.sender) > _amount, "You have not enough tokens");
        // What if the shop is not active yet?
        require(_isUnlocked, "The shop is not opened yet");
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
    CoffeeToken coffeeToken;

    event tokenCreated(address tokenAddress);

    function deployNewERC20(
            string calldata name,
            string calldata symbol,
            uint256 totalSupply,
            ERC20 _token, // That we will accept as the currency
            address shopOwner_
        ) external returns (CoffeeToken){
            coffeeToken = new CoffeeToken(
                name,
                symbol,
                totalSupply,
                _token, // Originally they used "msg.sender", but we specify the token in this way
                shopOwner_ 
            );
      
            emit tokenCreated(address(coffeeToken));
            // return token;
            return coffeeToken;
        }
}
