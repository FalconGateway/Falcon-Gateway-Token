async function main() {
    const FalconToken = await hre.ethers.getContractFactory("FGT");
    const falconToken = await FalconToken.deploy('Falcon Gateway Token', 'FGT', '1500000000000000000000000000', '10000000000000000000000000000');
  
    await falconToken.deployed();
  
    console.log("FGT deployed to:", falconToken.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });