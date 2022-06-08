/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("dotenv").config();
 require("@nomiclabs/hardhat-ethers");
 require("@nomiclabs/hardhat-waffle");
 require("@nomiclabs/hardhat-etherscan");
 const { API_URL, PRIVATE_KEY, ETHERSCAN_API } = process.env;
 module.exports = {
   solidity: {
     version: "0.8.4",
     settings: {
       optimizer: {
         enabled: true,
         runs: 1000,
       },
     },
   },
   networks: {
     bsc_testnet: {
       url: API_URL,
       accounts: [`0x${PRIVATE_KEY}`],
     },
   },
   etherscan: {
     apiKey: ETHERSCAN_API,
   },
 };
 