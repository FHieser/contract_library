const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RevealableNFT Unit Test", function () {



    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("RevealableNFT");


        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
        this.notRevealedURI = "notRevealedURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI, this.notRevealedURI);
        await this.contract.deployed();
    })


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

});