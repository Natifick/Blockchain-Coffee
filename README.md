# Caffeinated blockchain token

## Description by course instructors
Many DeFi projects majorly seek to encourage investments in their project. For this, they have different rounds like pre-sale, public, etc. Now, to support other businesses using blockchain, you can propose a Crowdfunding platform where money money-seeking parties can launch a crowdfunding program for their projects (Assuming they have unusual projects, like coffee shops, etc.).

Project example scenario: An aspiring coffee shop is looking for an investment of 2000 USD (USDT). For every 100 USD sent, the sender will receive 5 CoffeeTokens. When the coffee shop is opened and functioning, the funders can get free coffee for each CoffeeToken. You can take the above example for any scenario, like a Burger Shop, electronic Item, etc. For each activity, there is no need to write a separate smart contract, but rather write one smart contract which will create/deploy another smart contract (passing the parameters accordingly)

## Our plan
Smart contract must follow this path:
1. Any shop can create their contract, that follows these rules
2. Any user can buy CoffeeToken for ethereum (test?)
3. After they buy their tokens, users can transfer them to any person, except the creator (no refunds, sorry)
4. At some point shop creators "unlock" the token andd now you can sell it back (in exchange for coffee, I suppose)

Opened questions with this plan:
* How to test the ethereum transfer, if we don't have any?
* Can we track that the shop actually gave the coffee to the customers?

## Some links
Here's the list of used links:
* https://habr.com/ru/articles/714938/ - create smart contract factory
* https://github.com/MartinIglesias86/Smart-Contract-DeFi-Exchange/blob/master/contracts/Exchange.sol - create DeFi exhange from Eth to our token