const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment on network:", hre.network.name);

  // 1. Deploy AccessControl
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // 2. Deploy RecordRegistry
  const RecordRegistry = await hre.ethers.getContractFactory("RecordRegistry");
  const recordRegistry = await RecordRegistry.deploy(accessControlAddress);
  await recordRegistry.waitForDeployment();
  const recordRegistryAddress = await recordRegistry.getAddress();
  console.log("RecordRegistry deployed to:", recordRegistryAddress);

  // 3. Export contract addresses and ABIs for the React frontend and Backend
  const exportDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Read ABIs
  const accessControlArtifact = hre.artifacts.readArtifactSync("AccessControl");
  const recordRegistryArtifact = hre.artifacts.readArtifactSync("RecordRegistry");

  const config = {
    network: hre.network.name,
    AccessControlAddress: accessControlAddress,
    RecordRegistryAddress: recordRegistryAddress,
    AccessControlABI: accessControlArtifact.abi,
    RecordRegistryABI: recordRegistryArtifact.abi,
  };

  fs.writeFileSync(
    path.join(exportDir, "addresses.json"),
    JSON.stringify(config, null, 2)
  );
  console.log("Exported addresses and ABIs to src/contracts/addresses.json");

  // Also copy to backend directory if it exists
  const backendConfigDir = path.join(__dirname, "../backend");
  if (fs.existsSync(backendConfigDir)) {
    fs.writeFileSync(
      path.join(backendConfigDir, "addresses.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Exported addresses to backend/addresses.json");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
