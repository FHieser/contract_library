const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Basic_flat Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("BasicNFT");

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI);
        await this.contract.deployed();

        //unpause
        await this.contract.pause(false);
    })


    it("Constructor: Check Name and Symbol", async function () {
        //Check Name
        expect(await this.contract.name()).to.equal(this.name);
        //Check Symbol
        expect(await this.contract.symbol()).to.equal(this.symbol);
    });

    it("Mint: while paused", async function () {
        //pause
        await this.contract.pause(true);

        await expect(this.contract.mint(1)).to.be.revertedWith("Contract is paused");
    });

    it("Mint: Mint Amount less than 1", async function () {
        await expect(this.contract.mint(0)).to.be.revertedWith("Mint Amount needs to be bigger than 0");
    });

    //Max Mint Amount is 20
    it("Mint: Mint Amount more than MaxMintAmount", async function () {
        await expect(this.contract.mint(21)).to.be.revertedWith("Mint Amount exceeds the Maximum Allowed Mint Amount");
    });

    it("Mint: Mint Amount more than AvailableMintAmount", async function () {
        //Set new maxMintAmount to 10000
        await this.contract.setmaxMintAmount(10000);
        //Mint to full capacity
        await this.contract.mint(10000);
        //Mint over limit
        await expect(this.contract.mint(1)).to.be.revertedWith("Mint Amount exceeds the Available Mint Amount");
    });

    it("Mint: Owner mints for free", async function () {
        await this.contract.connect(this.owner).mint(1,{value:0});
    });

    it("Mint: Owner mints for free", async function () {
        await expect(this.contract.connect(this.addr1).mint(1,{value:0})).to.be.revertedWith("Value for minting-transaction is to low");
    });



    it("tokenURI: Returns correctURI", async function () {
        //mint a two token
        await this.contract.mint(2);

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString1 = this.directURI + "0.json"
        let tokenString2 = this.directURI + "1.json"

        expect(await this.contract.tokenURI(0)).to.equal(tokenString1);
        expect(await this.contract.tokenURI(1)).to.equal(tokenString2);
    });


});