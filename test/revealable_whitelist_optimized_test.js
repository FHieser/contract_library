const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Revealable_Whitelist Unit Test", function () {
    
    //Get List of created accounts and put them in a array 
    before(async function () {
        //importing extern js-file
        this.merkle_tree = require("./testUtils/merkle_tree.js");

        
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("RevealableWhitelistOptimizedContract");

        //setting MerkleTree
        this.merkle_tree.setMerkleTree([this.owner.address, this.addr1.address, this.addr2.address])

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
        this.notRevealedURI = "notRevealedURI";

        this.merkleRoot = this.merkle_tree.getRoot();
    })

    //deploy contract
    beforeEach(async function () {

        //setting MerkleTree
        this.merkle_tree.setMerkleTree([this.owner.address, this.addr1.address, this.addr2.address])

        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI, this.notRevealedURI, this.merkleRoot);
        await this.contract.deployed();

        //unpause
        await this.contract.pause(false);
    })


    it("constructor: Check Name and Symbol", async function () {
        //Check Name
        expect(await this.contract.name()).to.equal(this.name);
        //Check Symbol
        expect(await this.contract.symbol()).to.equal(this.symbol);
    });


    it("mint: while paused", async function () {
        //pause
        await this.contract.pause(true);

        await expect(this.contract.mint(this.merkle_tree.getProof(this.owner.address),1)).to.be.revertedWith("Contract is paused");
    });

    it("mint: Mint Amount less than 1", async function () {
        await expect(this.contract.mint(this.merkle_tree.getProof(this.owner.address),0)).to.be.revertedWith("Mint Amount needs to be bigger than 0");
    });

    //Max Mint Amount is 20
    it("mint: Mint Amount more than MaxMintAmount", async function () {
        await expect(this.contract.mint(this.merkle_tree.getProof(this.owner.address),21)).to.be.revertedWith("Mint Amount exceeds the Maximum Allowed Mint Amount");
    });

    it("mint: Mint Amount more than AvailableMintAmount", async function () {
        //Set new maxMintAmount to 10000
        await this.contract.setmaxMintAmount(10000);
        //Mint to full capacity
        await this.contract.mint(this.merkle_tree.getProof(this.owner.address),10000);
        //Mint over limit
        await expect(this.contract.mint(this.merkle_tree.getProof(this.owner.address),1)).to.be.revertedWith("Mint Amount exceeds the Available Mint Amount");
    });

    it("mint: Non Whitelisted cant mint", async function () {
        //Explicitly declare Contract connection as a signer which is not whitelisted
        //In this case addr3
        await expect(this.contract.connect(this.addr3).mint(this.merkle_tree.getProof(this.addr3.address),1, { value: ethers.utils.parseEther("0.05") })).to.be.revertedWith("Invalid Merkle Proof");
    });

    it("mint: Non Whitelisted cant mint if he got a hexProof of a whitelisted", async function () {
        //Explicitly declare Contract connection as a signer which is not whitelisted
        //In this case addr3
        //use hexproof of addr1 which is whitelisted
        await expect(this.contract.connect(this.addr3).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") })).to.be.revertedWith("Invalid Merkle Proof");
    });

    it("mint: Whitelisted cant mint if they already claimed", async function () {
        //Mint one so that the mint is claimed
        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1);
        //mint another to check if its already claimed
        await expect(this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1)).to.be.revertedWith("Address already claimed");
    });



    it("mint: Everyone can mint unlimited times after the presale is over", async function () {
        //end the presale
        await this.contract.setWhiteListActive(false);

        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1, { value: 0 });
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });

        //interesting: HexProof from addr1 and it still works
        await this.contract.connect(this.addr3).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });

        //to test wether the different adresses can mint multiple times
        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1, { value: 0 });
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });
        await this.contract.connect(this.addr3).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });
    });


    it("mint: Owner mints for free", async function () {
        //Normaly contract alway connects with first Signer
        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1, { value: 0 });
    });

    it("mint: Non Owner gets rejected with wrong value", async function () {
        //Explicitly declare Contract connection as a signer which is not the first one
        //In this case addr1
        await expect(this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: 0 })).to.be.revertedWith("Value for minting-transaction is to low");
    });

    it("mint: Non Owner can mint with correct value", async function () {
        //Explicitly declare Contract connection as a signer which is not the first one
        //In this case addr1
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });
    });


    it("walletOfOwner: check if after mint all the right tokens are minted", async function () {

        //Mint two as for the owner
        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),2);
        //test with other signer to for completionists sake
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),3, { value: ethers.utils.parseEther("0.15") });

        //Expect for owner the token ids 0 and 1
        let expectedOwnerTokens = [0, 1];
        //Expect for other signer 2, 3 and 4
        let expectedAddr1Tokens = [2, 3, 4];

        //get function returns
        let receivedOwnerTokens = await this.contract.walletOfOwner(this.owner.address);
        let receivedAddr1Tokens = await this.contract.walletOfOwner(this.addr1.address);

        //expect the return array to be the same length as the comparison array 
        await expect(receivedOwnerTokens.length).to.be.equal(expectedOwnerTokens.length);
        await expect(receivedAddr1Tokens.length).to.be.equal(expectedAddr1Tokens.length);

        //expect the return array to be the same as the comparison  array 
        for (let index = 0; index < expectedOwnerTokens.length; index++) {
            await expect(receivedOwnerTokens[index]).to.be.equal(expectedOwnerTokens[index]);
        }

        for (let index = 0; index < expectedAddr1Tokens.length; index++) {
            await expect(receivedAddr1Tokens[index]).to.be.equal(expectedAddr1Tokens[index]);
        }
    });


    it("tokenURI: Not revealed yet -> Returns notRevealedURI", async function () {
        //mint a two token
        await this.contract.mint(this.merkle_tree.getProof(this.owner.address),2);

        //We didn´t change the revealed status so it should return the notRevealedURI
        expect(await this.contract.tokenURI(0)).to.equal(this.notRevealedURI);
        expect(await this.contract.tokenURI(1)).to.equal(this.notRevealedURI);
    });

    it("tokenURI: Revealed -> Returns directURI + Filename of metadata", async function () {
        //mint a two token
        await this.contract.mint(this.merkle_tree.getProof(this.owner.address),2);

        //Revealing the metadata
        await this.contract.reveal();

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString1 = this.directURI + "0.json"
        let tokenString2 = this.directURI + "1.json"

        expect(await this.contract.tokenURI(0)).to.equal(tokenString1);
        expect(await this.contract.tokenURI(1)).to.equal(tokenString2);
    });

    it("setMerkleRoot: change Merkle Root and see if it still works", async function () {

        //setting new MerkleTree
        this.merkle_tree.setMerkleTree([this.owner.address, this.addr1.address])
        
        //change MerkleRoot
        this.contract.setMerkleRoot(this.merkle_tree.getRoot());

        await this.contract.connect(this.owner).mint(this.merkle_tree.getProof(this.owner.address),1, { value: 0 });
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),1, { value: ethers.utils.parseEther("0.05") });
        await expect(this.contract.connect(this.addr2).mint(this.merkle_tree.getProof(this.addr2.address),1, { value: ethers.utils.parseEther("0.05") })).to.be.revertedWith("Invalid Merkle Proof");
    });


    it("withdraw: correctly withdraw funds", async function () {
        //mint 3 tokens
        await this.contract.connect(this.addr1).mint(this.merkle_tree.getProof(this.addr1.address),3, { value: ethers.utils.parseEther("0.15") });

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.contract.withdraw()).to.changeEtherBalance(this.owner, ethers.utils.parseEther("0.15"));
    });
});