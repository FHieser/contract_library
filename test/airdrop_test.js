const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Airdrop_flat Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("Airdrop");

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI);

        await this.contract.deployed();
    })


    it("Send Batch: One NFT in each of the recipients wallets", async function () {
        // Send one NFT to each Recipient address
        await this.contract.sendBatch(this.recipients);

        for (address of this.recipients) {

            //Check if each address owns exactly 1 token
            expect(await this.contract.balanceOf(address)).to.equal(1);
        };
    });
    it("Send Batch: The minted Token amount should equal the amount of recipients", async function () {
        // Send one NFT to each Recipient address
        await this.contract.sendBatch(this.recipients);

        //Check if amount of NFTs equals the amount of recipients
        expect(await this.contract.totalSupply()).to.equal(this.recipients.length);

    });

});