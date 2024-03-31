const {expect} = require("chai");
const {ethers} = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
describe("DomainOwnershipManager", function () {
    async function deployContract() {
        const [owner, nonOwner] = await ethers.getSigners();
        const DomainOwnershipManager = await ethers.getContractFactory("DomainOwnershipManager");
        const domainOwnershipManager = await DomainOwnershipManager.deploy();
        return {domainOwnershipManager, owner, nonOwner};
    }

    describe("Register Domain", function () {
        it("Should register a new domain", async function () {
            const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.emit(domainOwnershipManager, "DomainRegisteredEvent");
        });

        it("Should revert when registering a domain with invalid format", async function () {
            const {domainOwnershipManager} = await loadFixture(deployContract);
            const invalidDomain = "business.com";
            const fee = ethers.parseEther("0.00001");
            await expect(domainOwnershipManager.registerDomain(invalidDomain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "DomainNameVerificationError")
                .withArgs(invalidDomain, "Invalid domain name format");
        });

        it("Should revert when registering an already registered domain", async function () {
            const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await domainOwnershipManager.registerDomain(domain, {value: fee});
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "DomainAlreadyRegisteredError");
        });
        it("Should revert when registering with insufficient fee", async function () {
            const {domainOwnershipManager} = await loadFixture(deployContract);
            const domain = "com";
            const fee = ethers.parseEther("0.000001");
            await expect(domainOwnershipManager.registerDomain(domain, {value: fee}))
                .to.be.revertedWithCustomError(domainOwnershipManager, "InsufficientFeeError");
        });
    });

    describe("DomainOwnershipManager", function () {

        it("logs and asserts domain registration events with domain hashes", async function () {
            const {domainOwnershipManager} = await loadFixture(deployContract);
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
        });
    });

    describe("Withdraw", function () {
        it("Should revert when a non-owner attempts to withdraw funds", async function () {
            const {domainOwnershipManager, nonOwner} = await loadFixture(deployContract);
            await expect(domainOwnershipManager.connect(nonOwner).withdraw())
                .to.be.revertedWithCustomError(domainOwnershipManager, "NotOwnerError");
        });
    });

    describe("Change Registration Fee", function () {
        it("Should allow the owner to change the registration fee", async function () {
            const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const newFee = ethers.parseEther("0.00002");
            await domainOwnershipManager.changeTheFee(newFee);
            const updatedFee = await domainOwnershipManager.registrationFee();
            expect(updatedFee).to.equal(newFee);
        });

        it("Should revert when a non-owner attempts to change the registration fee", async function () {
            const {domainOwnershipManager, nonOwner} = await loadFixture(deployContract);
            const newFee = ethers.parseEther("0.00002");
            await expect(domainOwnershipManager.connect(nonOwner).changeTheFee(newFee))
                .to.be.revertedWithCustomError(domainOwnershipManager, "NotOwnerError");
        });
    });
    describe("Domain Ownership", function () {
        it("Should correctly map domain to owner", async function () {
            const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const domain = "com";
            const fee = ethers.parseEther("0.00001");
            await domainOwnershipManager.registerDomain(domain, {value: fee});
            const domainOwner = await domainOwnershipManager.domainToOwner(domain);
            expect(domainOwner).to.equal(owner.address);
        });

        it("Should correctly map owner to domains", async function () {
            const {domainOwnershipManager, owner} = await loadFixture(deployContract);
            const domain1 = "com";
            const domain2 = "org";
            const fee = ethers.parseEther("0.00001");
            await domainOwnershipManager.registerDomain(domain1, {value: fee});
            await domainOwnershipManager.registerDomain(domain2, {value: fee});
            const ownerDomains = await domainOwnershipManager.getDomainsForOwner(owner.address);
            expect(ownerDomains).to.include(domain1);
            expect(ownerDomains).to.include(domain2);
        });
    });
});
