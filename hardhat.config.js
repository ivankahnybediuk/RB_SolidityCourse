require("@nomicfoundation/hardhat-toolbox");

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
const MNEMONIC = process.env.MNEMONIC

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: {
        mnemonic: MNEMONIC || ""
      }
    }
  }
};
