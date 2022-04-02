const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Basic_flat Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("MintAirdrop");

        this.name = "name";
        this.symbol = "symbol";
        this.directURI = "directURI";
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy(this.name, this.symbol, this.directURI, this.addr1.address);
        await this.contract.deployed();

        //unpause if paused
        if (await this.contract.paused()) {
            await this.contract.flipPause();
        }
    })

    //-----------------------------------------------------------------------------
    //AdminMod Functinality Test


    it("constructor: check if owner is admin", async function () {
        //Super weird: the isAdmin Function has to be awaited in the expect for it to work!??
        await expect(await this.contract.connect(this.owner).isAdmin(this.owner.address)).to.be.true;
    });

    it("addAdmin: admin is correctly declared", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);
        await expect(await this.contract.connect(this.owner).isAdmin(this.addr1.address)).to.be.true;
    });

    it("addAdmin: nothing happens if address is already an admin", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);
        await expect(this.contract.connect(this.addr1).addAdmin(this.addr1.address)).to.be.revertedWith("Address is already a admin.");
    });

    it("removeAdmin: admin is correctly removed", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);
        await expect(await this.contract.connect(this.owner).isAdmin(this.addr1.address)).to.be.true;

        await this.contract.connect(this.owner).removeAdmin(this.addr1.address);
        await expect(await this.contract.connect(this.owner).isAdmin(this.addr1.address)).to.be.false;
    });

    it("removeAdmin: owner cant be removed from the admin role", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);

        await expect(this.contract.connect(this.addr1).removeAdmin(this.owner.address)).to.be.revertedWith("The owner has to be an admin.");
        await expect(await this.contract.connect(this.owner).isAdmin(this.owner.address)).to.be.true;
    });

    it("removeAdmin: nothing happens if address is not an admin", async function () {
        await expect(this.contract.connect(this.owner).removeAdmin(this.addr1.address)).to.be.revertedWith("Adress is not an admin.");
    });

    it("isAdmin: check if only Admins can call the function", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);

        await expect(await this.contract.connect(this.owner).isAdmin(this.owner.address)).to.be.true;
        await expect(await this.contract.connect(this.addr1).isAdmin(this.addr1.address)).to.be.true;
        await expect(this.contract.connect(this.addr2).isAdmin(this.addr2.address)).to.be.revertedWith("AdminMod: caller is not an admin");
    });

    it("removeAdmin: new owner is a admin", async function () {
        await this.contract.connect(this.owner).transferOwnership(this.addr1.address);

        await expect(await this.contract.connect(this.addr1).isAdmin(this.addr1.address)).to.be.true;
    });

    //-----------------------------------------------------------------------------
    //ERC721a Functinality Test


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
        //Set new maxMintAmount to 10000
        await this.contract.setmaxMintAmount(1000);
        //Mint to full capacity
        await this.contract.mint(1000);
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


    it("tokenURI: Returns correctURI", async function () {
        //mint a two token
        await this.contract.mint(2);

        //Creating the comparable tokenStrings, that point towards the metadata of the tokens
        let tokenString1 = this.directURI + "0.json"
        let tokenString2 = this.directURI + "1.json"

        expect(await this.contract.tokenURI(0)).to.equal(tokenString1);
        expect(await this.contract.tokenURI(1)).to.equal(tokenString2);
    });


    it("withdraw: correctly withdraw funds", async function () {
        //mint 3 tokens
        await this.contract.connect(this.addr1).mint(3, { value: ethers.utils.parseEther("0.15") });
        //Portion that the dev should get
        let devPortion = 0.15 * (12 / 100)
        //Portion that the owner should get
        let ownerPortion = 0.15 - devPortion;


        await expect(await this.contract.withdraw())
            //Check if withdraw changed the balance of the owner by the correct amount
            .to.changeEtherBalance(this.owner, ethers.utils.parseEther(ownerPortion.toString()))
            //Check if withdraw changed the balance of the developer by the correct amount
            .to.changeEtherBalance(this.addr1, ethers.utils.parseEther(devPortion.toString()));
    });

    //-----------------------------------------------------------------------------
    //Airdrop Functinality Test

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