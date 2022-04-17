const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Collab Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.collaborators = [this.owner.address, this.addr1.address, this.addr2.address];
        this.Contract = await ethers.getContractFactory("Collab");

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI, this.collaborators);
        await this.contract.deployed();
    })


    it("constructor: Check Name and Symbol", async function () {
        //Check Name
        expect(await this.contract.name()).to.equal(this.name);
        //Check Symbol
        expect(await this.contract.symbol()).to.equal(this.symbol);
    });

    it("walletOfOwner: check if after mint all the right tokens are minted", async function () {

        //Expect for owner the token ids
        let expectedOwnerTokens = [0, 1, 2, 3, 4];
        //Expect for other signer
        let expectedAddr1Tokens = [5, 6, 7, 8, 9];
        let expectedAddr2Tokens = [10, 11, 12, 13, 14];

        //get function returns
        let receivedOwnerTokens = await this.contract.walletOfOwner(this.owner.address);
        let receivedAddr1Tokens = await this.contract.walletOfOwner(this.addr1.address);
        let receivedAddr2Tokens = await this.contract.walletOfOwner(this.addr2.address);

        //expect the return array to be the same length as the comparison array 
        await expect(receivedOwnerTokens.length).to.be.equal(expectedOwnerTokens.length);
        await expect(receivedAddr1Tokens.length).to.be.equal(expectedAddr1Tokens.length);
        await expect(receivedAddr2Tokens.length).to.be.equal(expectedAddr2Tokens.length);

        //expect the return array to be the same as the comparison  array 
        for (let index = 0; index < expectedOwnerTokens.length; index++) {
            await expect(receivedOwnerTokens[index]).to.be.equal(expectedOwnerTokens[index]);
        }

        for (let index = 0; index < expectedAddr1Tokens.length; index++) {
            await expect(receivedAddr1Tokens[index]).to.be.equal(expectedAddr1Tokens[index]);
        }

        for (let index = 0; index < expectedAddr2Tokens.length; index++) {
            await expect(receivedAddr2Tokens[index]).to.be.equal(expectedAddr2Tokens[index]);
        }
    });

    it("walletOfOwner: check if after mint all the right tokens are minted", async function () {
        //Add Address 3 as a collaborator
        await this.contract.addCollaborator(this.addr3.address, 3)

        //Expect the token Ids for other signer
        let expectedAddr3Tokens = [15, 16, 17];

        //get function returns
        let receivedAddr3Tokens = await this.contract.walletOfOwner(this.addr3.address);

        //expect the return array to be the same length as the comparison array 
        await expect(receivedAddr3Tokens.length).to.be.equal(expectedAddr3Tokens.length);

        //expect the return array to be the same as the comparison  array 
        for (let index = 0; index < expectedAddr3Tokens.length; index++) {
            await expect(receivedAddr3Tokens[index]).to.be.equal(expectedAddr3Tokens[index]);
        }
    });


    it("tokenURI: Returns correctURI", async function () {
        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString1 = this.directURI + "0.json"
        let tokenString2 = this.directURI + "1.json"

        expect(await this.contract.tokenURI(0)).to.equal(tokenString1);
        expect(await this.contract.tokenURI(1)).to.equal(tokenString2);
    });


    it("withdraw: correctly withdraw funds", async function () {
        //mint 3 tokens
        await this.contract.donate({ value: ethers.utils.parseEther("0.15") });

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.contract.withdraw()).to.changeEtherBalance(this.owner, ethers.utils.parseEther("0.15"));
    });
});