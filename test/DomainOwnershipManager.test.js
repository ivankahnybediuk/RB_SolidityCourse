const {expect} = require("chai");
const {ethers} = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
describe("DomainOwnershipManager", function () {

    let domainOwnershipManager;
    let owner;
    let nonOwner;

    async function deployContract() {
        const [owner, nonOwner] = await ethers.getSigners();
        const DomainOwnershipManager = await ethers.getContractFactory("DomainOwnershipManager");
        const domainOwnershipManager = await DomainOwnershipManager.deploy();
        return {domainOwnershipManager, owner, nonOwner};
    }

    describe("Register Domain", function () {

        before(beforeTestBlock);

        it("Should register a new domain", async function () {
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.emit(domainOwnershipManager, "DomainRegisteredEvent");
        });

        it("Should revert if the domain name exceeds maximum length", async function () {
            const fee = ethers.parseEther("0.00001");

            const longDomain = "a".repeat(51);

            await expect(domainOwnershipManager.registerDomain(longDomain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "DomainNameMaxLengthError")
                .withArgs(longDomain, "Domain name exceeds maximum length");
        });

        it("Should revert when registering a domain with invalid format", async function () {
            const invalidDomain = "business.com";
            const fee = ethers.parseEther("0.00001");
            await expect(domainOwnershipManager.registerDomain(invalidDomain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "DomainNameVerificationError")
                .withArgs(invalidDomain, "Invalid domain name format");
        });

        it("Should revert when registering an already registered domain", async function () {
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "DomainAlreadyRegisteredError");
        });
        it("Should revert when registering with insufficient fee", async function () {
            const domain = "ua";
            const fee = ethers.parseEther("0.000001");
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "InsufficientFeeError");
        });
    });

    describe("DomainOwnershipManager", function () {

        before(beforeTestBlock);

        it("logs and asserts domain registration events with domain hashes", async function () {
            const fee = ethers.parseEther("0.00001");
            const [account1, account2] = await ethers.getSigners();

            const domainsAccount1 = ["com", "org"];
            const domainsAccount2 = ["net", "io"];


            // Register domains from account1
            for (let domain of domainsAccount1) {
                const tx = await domainOwnershipManager.connect(account1).registerDomain(domain, {value: fee});
                await tx.wait();
            }

            // Register domains from account2
            for (let domain of domainsAccount2) {
                const tx = await domainOwnershipManager.connect(account2).registerDomain(domain, {value: fee});
                await tx.wait();
            }

            const logs = await domainOwnershipManager.queryFilter(domainOwnershipManager.filters.DomainRegisteredEvent());
            const loggedDomains = logs.map(event => event.args.domain);
            const numberOfDomains = logs.length;

            // Combine domains for comparison
            const allDomains = domainsAccount1.concat(domainsAccount2);

            console.log("Domain number:", numberOfDomains);

            //All domain list
            console.log("All registered domains");
            logs.sort((a, b) => Number(b.args.timestamp) - Number(a.args.timestamp))
                .forEach((log, index) => console.log(`\n${index}.${log.args.domain}`))

            //Domain list of Account1
            console.log("Domain list of Account1");
            logs.filter(domain => domain.args.owner.toLowerCase() == account1.address.toLowerCase())
                .sort((a, b) => Number(b.args.timestamp) - Number(a.args.timestamp))
                .forEach((log, index) => console.log(`\n${index}.${log.args.domain}`))


            loggedDomains.forEach(domain => {
                expect(allDomains).to.include(domain);
            });

            expect(logs).to.have.lengthOf(4);
        });
    });

    describe("Withdraw", function () {

        before(beforeTestBlock);

        it("Should revert when a non-owner attempts to withdraw funds", async function () {
            await expect(domainOwnershipManager.connect(nonOwner).withdraw())
                .to.be.revertedWithCustomError(domainOwnershipManager, "NotOwnerError");
        });
    });

    describe("Change Registration Fee", function () {

        before(beforeTestBlock);

        it("Should allow the owner to change the registration fee and log changing", async function () {
            const newFee = ethers.parseEther("0.00002");
            const oldFee = await domainOwnershipManager.registrationFee();

            await domainOwnershipManager.changeTheFee(newFee);

            const updatedFee = await domainOwnershipManager.registrationFee();
            const logs = await domainOwnershipManager.queryFilter(domainOwnershipManager.filters.RegistrationFeeChange());

            expect(updatedFee).to.equal(newFee);
            expect(logs).to.have.lengthOf(1);
            expect(Number(logs[0].args.oldFee)).to.be.equal(oldFee)
            expect(Number(logs[0].args.newFee)).to.be.equal(newFee);
        });

        it("Should revert when a non-owner attempts to change the registration fee", async function () {
            // const {domainOwnershipManager, nonOwner} = await loadFixture(deployContract);
            const newFee = ethers.parseEther("0.00002");
            await expect(domainOwnershipManager.connect(nonOwner).changeTheFee(newFee))
                .to.be.revertedWithCustomError(domainOwnershipManager, "NotOwnerError");
        });

        it("Should revert when an owner attempts to change the registration fee to 0", async function () {
            // const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const zeroFee = ethers.parseEther("0");
            await expect(domainOwnershipManager.changeTheFee(zeroFee))
                .to.be.revertedWithCustomError(domainOwnershipManager, "ZeroFeeError");
        });
    });
    describe("Domain Ownership", function () {

        before(beforeTestBlock);

        it("Should correctly map domain to owner", async function () {
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await domainOwnershipManager.registerDomain(domain, {value: fee});
            const domainOwner = await domainOwnershipManager.domainToOwner(domain);
            expect(domainOwner).to.equal(owner.address);
        });
    });

    async function beforeTestBlock() {
        const deployed = await loadFixture(deployContract);
        domainOwnershipManager = deployed.domainOwnershipManager;
        owner = deployed.owner;
        nonOwner = deployed.nonOwner;
    }
});
