const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing Cofee Crowdfunding", function () {

  async function deployFixture() {

    const [coffeeShop, fakeCurrencyBank, donor1, donor2] = await ethers.getSigners();
    
    // 1. assume certain amount of our test currency to donators
    const fakeCurrencyToken = await ethers.deployContract("FakeEther", [fakeCurrencyBank.address]);

    await fakeCurrencyToken.connect(fakeCurrencyBank).mint(donor1.address, 10);
    await fakeCurrencyToken.connect(fakeCurrencyBank).mint(donor2.address, 20);

    // 2. deploy crowdfunding contract for coffeShop with goal in this currency
    // (who owns this is a mystery no one should know)
    const CoffeFactory = await ethers.deployContract("CoffeeFactory");
    const coffeToken = await CoffeFactory.deployNewERC20(
        await fakeCurrencyToken.name(),
        await fakeCurrencyToken.symbol(),
        25, // amount of fake currency needed by cf
        fakeCurrencyToken
    );

    return {coffeToken, fakeCurrencyToken, coffeeShop, donor1, donor2};
  }

  it("Test 0: check intial setup", async function () {
    const {coffeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();

    // sanity check that all initial values are as expected
    expect(await fakeCurrencyToken.balanceOf(donor1.address)).to.equal(10)
    expect(await fakeCurrencyToken.balanceOf(donor2.address)).to.equal(20)
    expect(await fakeCurrencyToken.balanceOf(coffeToken)).to.equal(0)
  });

  it("Test 1: partial deposit", async function() {
    const {coffeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();
    await coffeToken.connect(donor1).deposit(10);

    // donor1 spent all fake currency
    expect(await fakeCurrencyToken.balanceOf(donor1.address)).to.equal(0);
    // and recieved coffeTokens in exchange
    expect(await coffeToken.balanceOf(donor1.address)).to.equal(10);
    
    expect(await coffeToken.balance()).to.equal(10);
    expect(await coffeToken.withdraw(1)).to.be.reverted;
  })

  it("Test 2: complete deposit", async function() {
    const {coffeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();
  
    await coffeToken.connect(donor1).deposit(10);
    await coffeToken.connect(donor2).deposit(20);

    // check that 5 tokens returned to donor2
    expect(await fakeCurrencyToken.balanceOf(donor2.address)).to.equal(5);
    expect(await coffeToken.balance()).to.equal(25);
  })

  it ("Test 3: withdraw coffee tokens for coffee", async function() {
    const {coffeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();

    await coffeToken.connect(donor1).deposit(10);
    await coffeToken.connect(donor2).deposit(15); 
  })
})