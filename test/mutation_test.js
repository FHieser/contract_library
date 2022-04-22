const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Mutation Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("MutationSerum");

        this.directURI = "directURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.directURI);
        await this.contract.deployed();

        //unpause if paused
        if (await this.contract.paused()) {
            await this.contract.flipPause();
        }
    })

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
        await expect(this.contract.mint(6)).to.be.revertedWith("Mint Amount exceeds the Maximum Allowed Mint Amount");
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

    it("mint: Mint Amount more than AvailableMintAmount", async function () {
        //Set new maxMintAmount to 10000
        await this.contract.setmaxMintAmount(10);
        //Mint to full capacity
        await this.contract.mint(10);
        //Mint over limit
        await expect(this.contract.mint(1)).to.be.revertedWith("Mint Amount exceeds the Available Mint Amount");
    });


    it("walletOfOwner: check if after mint all the right tokens are minted", async function () {

        //Mint two as for the owner
        await this.contract.connect(this.owner).mint(2);
        //test with other signer to for completionists sake
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });

        //expect the amount of tokens be correctly deposited 
        await expect(await this.contract.balanceOf(this.owner.address, 1)).to.be.equal(2);
        await expect(await this.contract.balanceOf(this.addr1.address, 1)).to.be.equal(3);
    });


    it("tokenURI: Returns correctURI", async function () {
        //mint a two token
        await this.contract.mint(2);

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString = this.directURI + "1.json"
        expect(await this.contract.tokenURI(1)).to.equal(tokenString);
    });


    it("withdraw: correctly withdraw funds", async function () {
        //mint 3 tokens
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.contract.withdraw()).to.changeEtherBalance(this.owner, ethers.utils.parseEther("0.15"));
    });
});