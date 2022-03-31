const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("AdminMod Unit Test", function () {

    //Get List of created accounts and put them in a array 
    before(async function () {
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners();
        this.recipients = [this.owner.address, this.addr1.address, this.addr2.address, this.addr3.address];
        this.Contract = await ethers.getContractFactory("TestableAdminMod");
    })
    //deploy contract
    beforeEach(async function () {
        this.contract = await this.Contract.deploy();
        await this.contract.deployed();

    })


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

    it("testFunction: check if only Admins can call the function", async function () {
        await this.contract.connect(this.owner).addAdmin(this.addr1.address);

        await this.contract.connect(this.owner).testFunction();
        await this.contract.connect(this.addr1).testFunction();
        await expect(this.contract.connect(this.addr2).testFunction()).to.be.revertedWith("AdminMod: caller is not an admin");
    });
});