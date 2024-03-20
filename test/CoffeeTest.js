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
    const FakeCurrencyToken = await ethers.getContractFactory("FakeEther");
    const fakeCurrencyToken = await FakeCurrencyToken.deploy(fakeCurrencyBank);

    // They get some fake Ether from the "bank"
    await fakeCurrencyToken.connect(fakeCurrencyBank).mint(donor1.address, 10);
    await fakeCurrencyToken.connect(fakeCurrencyBank).mint(donor2.address, 20);

    // 2. deploy crowdfunding contract for coffeShop with goal in this currency
    // (who owns this is a mystery no one should know)
    // const CoffeeFactory = await ethers.getContractFactory("CoffeeFactory");
    // const coffeeFactory = await CoffeeFactory.deploy();
    // const CoffeeToken = await coffeeFactory.deployNewERC20(
    //   "MyCoffeeToken", 
    //   "CFT",
    //   25, // amount of fake currency needed by cf
    //   coffeeShop.address
    // );
    // const coffeeToken = await new ethers.Contract(CoffeeToken.address, 
    //   await ethers.getContractFactory("CoffeeToken"), coffeeShop.address);

    // console.log("swrrefs", coffeeToken);

    const CoffeeToken = await ethers.getContractFactory("CoffeeToken");
    const coffeeToken = await CoffeeToken.deploy("CoffeeToken", "CFT", 25, fakeCurrencyToken, coffeeShop.address);

    // A bit strange way for deployment of the token
    // const CoffeeToken = await ethers.getContractFactory("MyCoffeeToken");
    // const coffeeToken = await CoffeeToken.deploy(coffeeShop);

    return {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2};
  }

  it("Test 0: check intial setup", async function () {
    const {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();

    // sanity check that all initial values are as expected
    expect(await fakeCurrencyToken.balanceOf(donor1.address)).to.equal(10)
    expect(await fakeCurrencyToken.balanceOf(donor2.address)).to.equal(20)
    expect(await fakeCurrencyToken.balanceOf(coffeeShop.address)).to.equal(0)

    expect(await coffeeToken.balance()).to.equal(0);
    expect(await coffeeToken.balanceOf(donor1.address)).to.equal(0);
    expect(await coffeeToken.balanceOf(donor2.address)).to.equal(0);
  });

  it("Test 1: partial deposit", async function() {
    const {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();
    
    await fakeCurrencyToken.connect(donor1).approve(coffeeToken, 10);
    await coffeeToken.connect(donor1).deposit(10);

    // donor1 spent all fake currency, and it got to coffeeShop
    expect(await fakeCurrencyToken.balanceOf(donor1.address)).to.equal(0);
    
    // and donor1 recieved coffeeTokens in exchange
    expect(await coffeeToken.balanceOf(donor1.address)).to.equal(10);
    
    expect(await coffeeToken.balance()).to.equal(10);
    
    // sanity check - since coffeShop is owner
    // his balance equals to coffeeToken.balance() call result
    expect(await fakeCurrencyToken.balanceOf(coffeeShop.address)).to.equal(10);
    
    // can't withdraw when goal is not met
    expect(coffeeToken.connect(donor1).withdraw(1)).to.be.reverted;
  })

  it("Test 2: complete deposit", async function() {
    const {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();
  
    await fakeCurrencyToken.connect(donor1).approve(coffeeToken, 10);
    await coffeeToken.connect(donor1).deposit(10);
    await fakeCurrencyToken.connect(donor2).approve(coffeeToken, 20);
    await coffeeToken.connect(donor2).deposit(20);

    // check that 5 tokens returned to donor2
    expect(await fakeCurrencyToken.balanceOf(donor2.address)).to.equal(5);
    
    // and balance is equal to goal
    expect(await coffeeToken.balance()).to.equal(25);
  })

  it ("Test 3: withdraw coffee tokens for coffee", async function() {
    const {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();

    await fakeCurrencyToken.connect(donor1).approve(coffeeToken, 10);
    await coffeeToken.connect(donor1).deposit(10);
    await fakeCurrencyToken.connect(donor2).approve(coffeeToken, 15);
    await coffeeToken.connect(donor2).deposit(15);

    await coffeeToken.connect(coffeeShop).unlock(); // shop owner opens shop
    
    await coffeeToken.connect(donor1).withdraw(10);

    // check  that donor1 used all of his coffee-tokens
    expect(await coffeeToken.balanceOf(donor1)).to.equal(0);
    
    // donor2 can't use more coffe-tokens that he has
    expect(coffeeToken.connect(donor2).withdraw(donor2, 3000)).to.be.reverted; 
  })

  it ("Test 4: events - fundingFinised and shopOpened", async function() {
    const {coffeeToken, fakeCurrencyToken, coffeeShop, donor1, donor2} = await deployFixture();
  
    // can't unlock unless goal is met
    expect(coffeeToken.connect(coffeeShop).unlock()).to.be.reverted;

    await fakeCurrencyToken.connect(donor1).approve(coffeeToken, 10);
    await coffeeToken.connect(donor1).deposit(10);
    await fakeCurrencyToken.connect(donor2).approve(coffeeToken, 15);
    
    // event emmited once the funding is finihsed
    await expect(coffeeToken.connect(donor2).deposit(15)).to.emit(
      coffeeToken,
      "fundingFinished"
    );

    // can't withdraw before opeining shop 
    expect(coffeeToken.connect(donor1).withdraw(1)).to.be.reverted;

    // catch the according event (hypotheticallt users can do that)
    await expect(coffeeToken.connect(coffeeShop).unlock()).to.emit(
      coffeeToken,
      "shopOpened"
    );

    expect(coffeeToken.connect(donor1).withdraw(1)).to.not.be.reverted;
  })
})