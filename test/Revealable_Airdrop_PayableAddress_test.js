const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Revealable_Airdrop_PayableAddress Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("Revealable_Airdrop_PayableAddress");


        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
        this.notRevealedURI = "notRevealedURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI, this.notRevealedURI);
        await this.contract.deployed();

        //unpause if paused
        if (await this.contract.paused()) {
            await this.contract.flipPause();
        }
    })

    it("constructor: Check Name and Symbol", async function () {
        //Check Name
        expect(await this.contract.name()).to.equal(this.name);
        //Check Symbol
        expect(await this.contract.symbol()).to.equal(this.symbol);
    });


    it("mint: while paused", async function () {
        //pause
        await this.contract.flipPause();

        await expect(this.contract.mint(1)).to.be.revertedWith("Contract is paused");
    });

    it("mint: Mint Amount less than 1", async function () {
        await expect(this.contract.mint(0)).to.be.revertedWith("Mint Amount needs to be bigger than 0");
    });

    //Max Mint Amount is 20
    it("mint: Mint Amount more than MaxMintAmount", async function () {
        await expect(this.contract.mint(21)).to.be.revertedWith("Mint Amount exceeds the Maximum Allowed Mint Amount");
    });

    it("mint: Mint Amount more than AvailableMintAmount", async function () {
        //Set new Max Supply to 10
        await this.contract.setMaxSupply(10);
        //Mint to full capacity
        await this.contract.mint(10);
        //Mint over limit
        await expect(this.contract.mint(1)).to.be.revertedWith("Mint Amount exceeds the Available Mint Amount");
    });

    it("mint: Owner mints for free", async function () {


        //Normaly contract alway connects with first Signer
        await this.contract.connect(this.owner).mint(1, { value: 0 });
    });

    it("mint: Non Owner gets rejected with wrong value", async function () {
        //Explicitly declare Contract connection as a signer which is not the first one
        //In this case addr1
        await expect(this.contract.connect(this.addr1).mint(1, { value: 0 })).to.be.revertedWith("Value for minting-transaction is to low");
    });

    it("mint: Non Owner can mint with correct value", async function () {
        //Explicitly declare Contract connection as a signer which is not the first one
        //In this case addr1
        await this.contract.connect(this.addr1).mint(1, { value: ethers.utils.parseEther("0.05") });
    });

    it("sendOneToEach: Airdrop exceeds Available Supply", async function () {
        await this.contract.setMaxSupply(3);

        // Send one NFT to each Recipient address (4 addresses)
        await expect(this.contract.sendOneToEach(this.recipients)).to.be.revertedWith("Airdrop Amount exceeds the Available Airdrop Amount");
    });

    it("sendOneToEach: One NFT in each of the recipients wallets", async function () {
        // Send one NFT to each Recipient address
        await this.contract.sendOneToEach(this.recipients);

        for (address of this.recipients) {
            //Check if each address owns exactly 1 token
            expect(await this.contract.balanceOf(address)).to.equal(1);
        };
    });

    it("sendOneToEach: The minted Token amount should equal the amount of recipients", async function () {
        // Send one NFT to each Recipient address
        await this.contract.sendOneToEach(this.recipients);

        //Check if amount of NFTs equals the amount of recipients
        expect(await this.contract.totalSupply()).to.equal(this.recipients.length);

    });

    it("sendVariableToEach: Amount of DropNumbers to low", async function () {
        let amountsOfDrops = [1];

        // Send wrong token Amount array
        await expect(this.contract.sendVariableToEach(this.recipients, amountsOfDrops)).to.be.revertedWith("The amount of recipients has to match the length of the individualTokenAmount array");
    });

    it("sendVariableToEach: Airdrop exceeds Available Supply", async function () {
        await this.contract.setMaxSupply(3);

        let amountsOfDrops = [1,1,1,1];

        await expect(this.contract.sendVariableToEach(this.recipients, amountsOfDrops)).to.be.revertedWith("Airdrop Amount exceeds the Available Airdrop Amount");
    });

    it("sendVariableToEach: The minted Token amount should equal the amount of recipients", async function () {
        let amountsOfDrops = [1,1,1,1];
        
        // Send one NFT to each Recipient address
        await this.contract.sendVariableToEach(this.recipients, amountsOfDrops);

        //Check if amount of NFTs equals the amount of recipients
        expect(await this.contract.totalSupply()).to.equal(this.recipients.length);

    });

    it("sendVariableToEach: Correct Amount of NFTs in each of the recipients wallets", async function () {
        let amountsOfDrops = [1,2,3,4];
        
        await this.contract.sendVariableToEach(this.recipients, amountsOfDrops);

        for (let i = 0; i < this.recipients.length; i++) {
            expect(await this.contract.balanceOf(this.recipients[i])).to.equal(amountsOfDrops[i]);
        }
    });



    it("walletOfOwner: check if after mint all the right tokens are minted", async function () {

        //Mint two as for the owner
        await this.contract.connect(this.owner).mint(2);
        //test with other signer to for completionists sake
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });

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
        await this.contract.mint(2);

        //We didn´t change the revealed status so it should return the notRevealedURI
        expect(await this.contract.tokenURI(0)).to.equal(this.notRevealedURI);
        expect(await this.contract.tokenURI(1)).to.equal(this.notRevealedURI);
    });

    it("tokenURI: Revealed -> Returns directURI + Filename of metadata", async function () {
        //mint a two token
        await this.contract.mint(2);

        //Revealing the metadata
        await this.contract.reveal();

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString1 = this.directURI + "0.json"
        let tokenString2 = this.directURI + "1.json"

        expect(await this.contract.tokenURI(0)).to.equal(tokenString1);
        expect(await this.contract.tokenURI(1)).to.equal(tokenString2);
    });

    it("withdraw: withdraw funds to the correct wallet", async function () {
        //mint 3 tokens
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.contract.withdraw()).to.changeEtherBalance(this.owner, ethers.utils.parseEther("0.15"));

        //mint 3 tokens
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });

        //Change Payout Address to address 3
        await this.contract.setPayoutAddress(this.addr3.address);

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.contract.withdraw()).to.changeEtherBalance(this.addr3, ethers.utils.parseEther("0.15"));
    });

});