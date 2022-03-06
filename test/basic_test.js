const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Basic_flat Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        this.recipients = [owner.address, addr1.address, addr2.address, addr3.address];
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