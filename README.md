# contract_library

## Declaration
This library contains a collection of Solidity contracts that I deployed on the Ethereum Network.

Some are tested out some are not. xD

But I guess they can be used as a headstart in the implementation of a basic contract
Feel free to use them :D

## Plans

I will add, adjust and optimize the contracts as I see fit.

Some are copied together in a pretty disorganized fashion and some contain imported libraries that are not used anymore.
So not fully optimized.

When I have the time I´ll tidy them up, for good.

In the coming weeks I also hopefully do a full testing ground for them, so I can asure that they are working correctly.

## Contracts in the Library

### Declare Ownership

I created this contract as my first experiment.
It was supposed to mint the whole collection into the wallet of the owner´s address,
so I have a huge collection of NFT´s that I can give away for free. (Because it´s a nice gift for someone else)

The problem with it is the high Deployment Cost, because the minting process for a lot of NFT´s at once is not optimized yet
Implementing the ERC721a would probably solve that problem, but I´m to lazy to do it right now ^^

### Revealable_optimized

Does, as the name implies, add a Revealable functionality to an optimized ERC721a Contract.
Based on the basic Haslips contract, which explains in great detail how to create a NFT Collection.
->https://www.youtube.com/watch?v=fzH7Gjadmj0

For the the Functionality to work there is some basic prepwork needed:
-The constructor function needs a URI for a Metadata File, that is used to hide the original NFT Metadata and their images
--That could be ```ipfs://<Address Of The Hidden Metadata Folder>/<Name Of The Metadata File>.json```
--In the Stuff folder here in the library you can find a example for a Hidden-Metadata File
-if you want to reveal call upon the reveal function in the deployed contract itself

### RevealableWhitelistOptimizedContract

I should really start to make shorter Names xD
Anyway this is a Revealable Whitelist Optimized Contract. (duh)
It´s based on the Revealable_optimized contract from before,
but takes up the Whitelist Functionality that has been shown in the great Project of Raz
(see here: https://github.com/davidrazmadzeExtra/Merkle_Tree_Whitelist_NFT and here https://www.youtube.com/watch?v=67vkL8XkoJ0)

The whitelist is based on the Merkletree Theory (Here´s an article about it: https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9)

For the the Functionality to work there is some basic prepwork needed:
-The constructor function needs the root of the merkle Tree to differentiate between whitelisted and not whitelisted users
-additionally the minting function of the contract is expanded to take a hexProof(merkleProof) as a parameter
-lastly I added a functionality, that when needed the whitelist-require can be turned off, when the presale has ended
--therefor the gas price should at least reduce for a bit after the presale is done
--it still uses the hexproof as a parameter though

# Basic Sample Hardhat Project

As promised I started with a testing suite in hardhat for the different contracts
Here´s a list of possible functions to use:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
```

The test function is the base for the whole suite.
Use it to start the unit tests I created for the different contracts.
