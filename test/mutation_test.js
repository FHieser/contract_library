const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Mutation Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.BasicContract = await ethers.getContractFactory("BasicNFT");
        this.MutationSerumContract = await ethers.getContractFactory("MutationSerum");
        this.MutatedNFTContract = await ethers.getContractFactory("MutatedNFT");

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
        this.notRevealedURI = "notRevealedURI";
    })
    //deploy mutationSerum
    beforeEach(async function () {
        this.basicContract = await this.BasicContract.deploy(this.name, this.symbol, this.directURI);
        await this.basicContract.deployed();

        this.mutationSerum = await this.MutationSerumContract.deploy(this.directURI);
        await this.mutationSerum.deployed();

        this.mutatedNFT = await this.MutatedNFTContract.deploy(this.name, this.symbol, this.directURI, this.notRevealedURI, this.mutationSerum.address, this.basicContract.address);
        await this.mutatedNFT.deployed();
        
        //unpause if paused
        if (await this.basicContract.paused()) {
            await this.basicContract.flipPause();
        }

        if (await this.mutationSerum.paused()) {
            await this.mutationSerum.flipPause();
        }

        if (await this.mutatedNFT.paused()) {
            await this.mutatedNFT.flipPause();
        }

        //prep Burner address of mutationSerum
        await this.mutationSerum.setMutationContractAddress(this.mutatedNFT.address)
        
    })

    
    it("burnSerumForAddress: Check if Burner address is valid", async function () {
        //botcher burner address
        await this.mutationSerum.setMutationContractAddress(this.addr1.address)

        //Prep Basic Contract
        await this.basicContract.mint(20);

        //Mint Serum to be available
        await this.mutationSerum.mintSerum(5)

        //try again
        await expect(this.mutatedNFT.mutate(1)).to.be.revertedWith("Invalid burner address");
    });
    
    it("mutate: while paused", async function () {
        //pause
        await this.mutatedNFT.flipPause();

        await expect(this.mutatedNFT.mutate(1)).to.be.revertedWith("Contract is paused");
    });

    it("mutate: NFT is already mutated", async function () {
        //Prep Basic Contract
        await this.basicContract.mint(20);

        //Mint Serum to be available
        await this.mutationSerum.mintSerum(5)

        //mutate token 1
        await this.mutatedNFT.mutate(1);

        //try again
        await expect(this.mutatedNFT.mutate(1)).to.be.revertedWith("NFT is already mutated");
    });

    it("mutate: Must own NFT to mutate", async function () {
        //Prep Basic Contract
        await this.basicContract.mint(20);

        //mutate token 1
        await expect(this.mutatedNFT.connect(this.addr1).mutate(1)).to.be.revertedWith("Must own the NFT you're attempting to mutate");
    });

    it("mutate: Must own Serum NFT to mutate", async function () {
        //Prep Basic Contract
        await this.basicContract.mint(20);

        //mutate token 1
        await expect(this.mutatedNFT.mutate(1)).to.be.revertedWith("Must own at least one serum to mutate");
    });

    it("mutate: Serum gets properly burned", async function () {
        //Prep Basic Contract
        await this.basicContract.mint(20);
        
        //Mint Serum to be available
        await this.mutationSerum.mintSerum(5)

        //Check if amount is correct
        await expect(await this.mutationSerum.balanceOf(this.owner.address,1)).to.be.equal(5);

        //mutate token 1
        await this.mutatedNFT.mutate(1);

        //Check if amount is correct
        await expect(await this.mutationSerum.balanceOf(this.owner.address,1)).to.be.equal(4);
    });




    it("mintSerum: while paused", async function () {
        //pause
        await this.mutationSerum.flipPause();

        await expect(this.mutationSerum.mintSerum(1)).to.be.revertedWith("Contract is paused");
    });

    it("mintSerum: Mint Amount less than 1", async function () {
        await expect(this.mutationSerum.mintSerum(0)).to.be.revertedWith("Mint Amount needs to be bigger than 0");
    });

    //Max Mint Amount is 20
    it("mintSerum: Mint Amount more than MaxMintAmount", async function () {
        await expect(this.mutationSerum.mintSerum(6)).to.be.revertedWith("Mint Amount exceeds the Maximum Allowed Mint Amount");
    });

    it("mintSerum: Owner mints for free", async function () {
        //Normaly mutationSerum alway connects with first Signer
        await this.mutationSerum.connect(this.owner).mintSerum(1, { value: 0 });
    });

    it("mintSerum: Non Owner gets rejected with wrong value", async function () {
        //Explicitly declare MutationSerumContract connection as a signer which is not the first one
        //In this case addr1
        await expect(this.mutationSerum.connect(this.addr1).mintSerum(1, { value: 0 })).to.be.revertedWith("Value for minting-transaction is to low");
    });

    it("mintSerum: Non Owner can mintSerum with correct value", async function () {
        //Explicitly declare MutationSerumContract connection as a signer which is not the first one
        //In this case addr1
        await this.mutationSerum.connect(this.addr1).mintSerum(1, { value: ethers.utils.parseEther("0.05") });
    });

    it("mintSerum: Mint Amount more than AvailableMintAmount", async function () {
        //Set new maxSupply to 5
        await this.mutationSerum.setMaxSupply(5);
        //Mint to full capacity
        await this.mutationSerum.mintSerum(5);
        //Mint over limit
        await expect(this.mutationSerum.mintSerum(1)).to.be.revertedWith("Mint Amount exceeds the Available Mint Amount");
    });


    it("walletOfOwner: check if after mintSerum all the right tokens are minted", async function () {

        //Mint two as for the owner
        await this.mutationSerum.connect(this.owner).mintSerum(2);
        //test with other signer to for completionists sake
        await this.mutationSerum.connect(this.addr1).mintSerum(3, { value: ethers.utils.parseEther("0.15") });

        //expect the amount of tokens be correctly deposited 
        await expect(await this.mutationSerum.balanceOf(this.owner.address, 1)).to.be.equal(2);
        await expect(await this.mutationSerum.balanceOf(this.addr1.address, 1)).to.be.equal(3);
    });


    it("tokenURI: Returns correctURI", async function () {
        //mintSerum a two token
        await this.mutationSerum.mintSerum(2);

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString = this.directURI + "1.json"
        expect(await this.mutationSerum.tokenURI(1)).to.equal(tokenString);
    });


    it("withdraw: correctly withdraw funds", async function () {
        //mintSerum 3 tokens
        await this.mutationSerum.connect(this.addr1).mintSerum(3, { value: ethers.utils.parseEther("0.15") });

        //Check if withdraw changed the balance of the owner by the amount of paid eth
        await expect(await this.mutationSerum.withdraw()).to.changeEtherBalance(this.owner, ethers.utils.parseEther("0.15"));
    });
});