const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Decentralized Healthcare Data Exchange", function () {
  let AccessControl;
  let accessControl;
  let RecordRegistry;
  let recordRegistry;
  let owner;
  let doctor;

  beforeEach(async function () {
    [owner, doctor] = await ethers.getSigners();

    AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();

    RecordRegistry = await ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy(await accessControl.getAddress());
    await recordRegistry.waitForDeployment();
  });

  describe("AccessControl", function () {
    it("should allow public key registration", async function () {
      await accessControl.connect(doctor).registerPublicKey("doctor_pub_key");
      expect(await accessControl.getPublicKey(doctor.address)).to.equal("doctor_pub_key");
    });

    it("should allow granting access to records", async function () {
      await accessControl.connect(owner).grantAccess(doctor.address, "rec1", "encrypted_aes_key");
      expect(await accessControl.hasAccess(owner.address, doctor.address, "rec1")).to.be.true;
      
      // Access key can be fetched by the doctor
      expect(await accessControl.connect(doctor).getEncryptedKey(owner.address, "rec1")).to.equal("encrypted_aes_key");
    });

    it("should allow revoking access to records", async function () {
      await accessControl.connect(owner).grantAccess(doctor.address, "rec1", "encrypted_aes_key");
      await accessControl.connect(owner).revokeAccess(doctor.address, "rec1");
      expect(await accessControl.hasAccess(owner.address, doctor.address, "rec1")).to.be.false;

      await expect(
        accessControl.connect(doctor).getEncryptedKey(owner.address, "rec1")
      ).to.be.revertedWith("Not authorized to get this key");
    });
  });

  describe("RecordRegistry", function () {
    it("should register record correctly", async function () {
      await recordRegistry.connect(owner).registerRecord(
        "rec1",
        "QmIPFSHash1234",
        "Cardiology Report",
        "Diagnostic",
        "Mayo Clinic",
        "encrypted_owner_key"
      );

      const [ipfsHash, title, category, facility, timestamp, recordOwner, encryptedOwnerKey] = 
        await recordRegistry.connect(owner).getRecord("rec1");

      expect(ipfsHash).to.equal("QmIPFSHash1234");
      expect(title).to.equal("Cardiology Report");
      expect(category).to.equal("Diagnostic");
      expect(facility).to.equal("Mayo Clinic");
      expect(recordOwner).to.equal(owner.address);
      expect(encryptedOwnerKey).to.equal("encrypted_owner_key");
    });

    it("should respect AccessControl for record lookup", async function () {
      await recordRegistry.connect(owner).registerRecord(
        "rec1",
        "QmIPFSHash1234",
        "Cardiology Report",
        "Diagnostic",
        "Mayo Clinic",
        "encrypted_owner_key"
      );

      // Doctor doesn't have access yet
      await expect(
        recordRegistry.connect(doctor).getRecord("rec1")
      ).to.be.revertedWith("Not authorized to view this record");

      // Grant access
      await accessControl.connect(owner).grantAccess(doctor.address, "rec1", "encrypted_aes_key");

      // Doctor can view now
      const [ipfsHash] = await recordRegistry.connect(doctor).getRecord("rec1");
      expect(ipfsHash).to.equal("QmIPFSHash1234");
    });

    it("should log record views via events", async function () {
      await recordRegistry.connect(owner).registerRecord(
        "rec1",
        "QmIPFSHash1234",
        "Cardiology Report",
        "Diagnostic",
        "Mayo Clinic",
        "encrypted_owner_key"
      );

      await accessControl.connect(owner).grantAccess(doctor.address, "rec1", "encrypted_aes_key");

      // Check event emitted
      await expect(recordRegistry.connect(doctor).logRecordAccess("rec1"))
        .to.emit(recordRegistry, "RecordViewed")
        .withArgs("rec1", doctor.address, (val) => val > 0n);
    });
  });
});
