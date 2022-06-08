const chai = require("chai");
const { BigNumber } = require("ethers");

const expect = chai.expect;

describe("Token contract", function () {
  let Token;
  let hardhatToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addr6;
  let addrs;
  let provider = ethers.provider;
  const defaultName = "Falcon Gateway Token";
  const defaultSymbol = "FGT";
  const defaultSupply = "1000000000000000000000000000";
  const defaultCap = "100000000000000000000000000000";

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Token = await ethers.getContractFactory("FGT");
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, ...addrs] =
      await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatToken = await Token.deploy(
      defaultName,
      defaultSymbol,
      defaultSupply,
      defaultCap
    );
  });

  describe("Deployment", function () {
    it("Should return the right name and symbol", async function () {
      expect(await hardhatToken.name()).to.equal(defaultName);
      expect(await hardhatToken.symbol()).to.equal(defaultSymbol);
    });

    it("Should set the right owner", async function () {
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should return the default not pause", async function () {
      expect(await hardhatToken.paused()).to.equal(false);
    });

    it("Should return the correct total supply", async function () {
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultSupply)
      );
    });

    it("Should return the correct capped", async function () {
      expect(await hardhatToken.cap()).to.equal(
        ethers.BigNumber.from(defaultCap)
      );
    });
  });

  describe("Transactions", function () {
    it("Should return the correct transfer amount", async function () {
      // Check balance before transfer
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply)
      );
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(
        ethers.BigNumber.from(0)
      );
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(
        ethers.BigNumber.from(0)
      );

      // Do transfer
      await expect(
        await hardhatToken
          .connect(owner)
          .transfer(addr1.address, ethers.BigNumber.from("1000000000000000000"))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr1.address, "1000000000000000000");

      await expect(
        await hardhatToken
          .connect(owner)
          .transfer(addr1.address, ethers.BigNumber.from("9000000000000000000"))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr1.address, "9000000000000000000");

      await expect(
        await hardhatToken
          .connect(owner)
          .transfer(
            addr2.address,
            ethers.BigNumber.from("10000000000000000000")
          )
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr2.address, "10000000000000000000");

      await expect(
        await hardhatToken
          .connect(addr2)
          .transfer(addr1.address, ethers.BigNumber.from("1000000000000000000"))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr2.address, addr1.address, "1000000000000000000");

      // Check balance after transfer
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply)
          .sub("1000000000000000000")
          .sub("9000000000000000000")
          .sub("10000000000000000000")
      );
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(
        ethers.BigNumber.from(0)
          .add("1000000000000000000")
          .add("9000000000000000000")
          .add("1000000000000000000")
      );
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(
        ethers.BigNumber.from(0)
          .add("10000000000000000000")
          .sub("1000000000000000000")
      );

      // Total supply no change
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultSupply)
      );
    });

    it("Mint new tokens", async function () {
      const newTokens = "100000000000000000000";
      // Check balance before transfer
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply)
      );

      // Mint
      await expect(
        await hardhatToken.connect(owner).mint(ethers.BigNumber.from(newTokens))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, newTokens);

      // Total supply updated
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultSupply).add(newTokens)
      );
    });

    it("Burn tokens", async function () {
      const burnTokens = "1000000000000000000";
      // Check balance before transfer
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply)
      );

      // Burn
      await expect(
        await hardhatToken
          .connect(owner)
          .burn(ethers.BigNumber.from(burnTokens))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, ethers.constants.AddressZero, burnTokens);

      // Total supply updated
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultSupply).sub(burnTokens)
      );
    });

    it("Transfer from other address using allowance", async function () {
      const transferAmount = "1000000000000000000";
      const allowedAmount = "500000000000000000";
      // Transfer some balance to addr2 first
      await hardhatToken
        .connect(owner)
        .transfer(addr2.address, ethers.BigNumber.from(transferAmount));

      // Check balance before transfer
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(
        ethers.BigNumber.from(0)
      );
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(
        ethers.BigNumber.from(transferAmount)
      );
      expect(await hardhatToken.balanceOf(addr3.address)).to.equal(
        ethers.BigNumber.from(0)
      );

      // Addr1 transfer to addr3 using addr2 should fail due to not allowed
      await expect(
        hardhatToken
          .connect(addr1)
          .transferFrom(
            addr2.address,
            addr3.address,
            ethers.BigNumber.from(allowedAmount)
          )
      ).to.be.revertedWith("BEP20: insufficient allowance");

      // Addr2 allow addr1 to transfer `allowedAmount` should emit Approval
      await expect(
        await hardhatToken
          .connect(addr2)
          .approve(addr1.address, ethers.BigNumber.from(allowedAmount))
      )
        .to.emit(hardhatToken, "Approval")
        .withArgs(addr2.address, addr1.address, allowedAmount);

      // Addr1 transfer to addr3 using addr2 should fail due not within allowedAmount
      await expect(
        hardhatToken
          .connect(addr1)
          .transferFrom(
            addr2.address,
            addr3.address,
            ethers.BigNumber.from(allowedAmount).add("1000")
          )
      ).to.be.revertedWith("BEP20: insufficient allowance");

      // Addr1 transfer to addr3 using addr2 should success due to within allowedAmount
      await expect(
        await hardhatToken
          .connect(addr1)
          .transferFrom(
            addr2.address,
            addr3.address,
            ethers.BigNumber.from(allowedAmount)
          )
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr2.address, addr3.address, allowedAmount);

      // Addr1 transfer to addr3 using addr2 again should fail due not sufficient allowedAmount
      await expect(
        hardhatToken
          .connect(addr1)
          .transferFrom(
            addr2.address,
            addr3.address,
            ethers.BigNumber.from(allowedAmount).sub("1000")
          )
      ).to.be.revertedWith("BEP20: insufficient allowance");

      // Check balance after transfer
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(
        ethers.BigNumber.from(0)
      );
      expect(await hardhatToken.balanceOf(addr2.address)).to.equal(
        ethers.BigNumber.from(transferAmount).sub(allowedAmount)
      );
      expect(await hardhatToken.balanceOf(addr3.address)).to.equal(
        ethers.BigNumber.from(0).add(allowedAmount)
      );
    });

    // todo: recover bep20 tokens sent inside contract
    it("Recover BEP20 tokens accidentally sent to contract", async function () {
      const transferAmount = "1000000000000000000";
      const recoverAmount = "200000000000000000";
      // Transfer to contract
      await hardhatToken
        .connect(owner)
        .transfer(hardhatToken.address, ethers.BigNumber.from(transferAmount));

      // Check balance before recover
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply).sub(transferAmount)
      );
      expect(await hardhatToken.balanceOf(hardhatToken.address)).to.equal(
        ethers.BigNumber.from(transferAmount)
      );

      // Owner recover the amount
      await expect(
        await hardhatToken
          .connect(owner)
          .recoverBEP20(
            hardhatToken.address,
            ethers.BigNumber.from(recoverAmount)
          )
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(hardhatToken.address, owner.address, recoverAmount);

      // Check balancer after recover
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultSupply)
          .sub(transferAmount)
          .add(recoverAmount)
      );
      expect(await hardhatToken.balanceOf(hardhatToken.address)).to.equal(
        ethers.BigNumber.from(transferAmount).sub(recoverAmount)
      );
    });
  });

  describe("Ownable", function () {
    it("Mint", async function () {
      const newTokens = "100000000000000000000";
      await expect(
        hardhatToken.connect(addr1).mint(newTokens)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        hardhatToken.connect(addr2).mint(newTokens)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(await hardhatToken.connect(owner).mint(newTokens))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, newTokens);
    });

    it("Pause and unpause", async function () {
      // Default unpaused
      expect(await hardhatToken.paused()).to.equal(false);

      await expect(hardhatToken.connect(addr1).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(hardhatToken.connect(addr2).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // Still unpaused
      expect(await hardhatToken.paused()).to.equal(false);

      await expect(hardhatToken.connect(owner).pause())
        .to.emit(hardhatToken, "Paused")
        .withArgs(owner.address);

      // Paused
      expect(await hardhatToken.paused()).to.equal(true);
    });
    it("Unpause", async function () {
      // Set to pause
      await expect(hardhatToken.connect(owner).pause())
        .to.emit(hardhatToken, "Paused")
        .withArgs(owner.address);
      expect(await hardhatToken.paused()).to.equal(true);

      await expect(hardhatToken.connect(addr1).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await expect(hardhatToken.connect(addr2).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      // Still pause
      expect(await hardhatToken.paused()).to.equal(true);

      await expect(hardhatToken.connect(owner).unpause())
        .to.emit(hardhatToken, "Unpaused")
        .withArgs(owner.address);

      // Unpaused
      expect(await hardhatToken.paused()).to.equal(false);
    });
    it("Recover BEP20 tokens", async function () {
      const transferAmount = "1000000000000000000";
      // Transfer to contract
      await hardhatToken
        .connect(owner)
        .transfer(hardhatToken.address, ethers.BigNumber.from(transferAmount));

      await expect(
        hardhatToken
          .connect(addr1)
          .recoverBEP20(hardhatToken.address, transferAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Owner recover the amount
      await expect(
        await hardhatToken
          .connect(owner)
          .recoverBEP20(
            hardhatToken.address,
            ethers.BigNumber.from(transferAmount)
          )
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(hardhatToken.address, owner.address, transferAmount);
    });
  });

  describe("Pausable", function () {
    beforeEach(async function () {
      // Set pause
      await hardhatToken.connect(owner).pause();

      // Give allowance
      await hardhatToken
        .connect(addr1)
        .approve(owner.address, ethers.BigNumber.from("999999999999999999"));
    });

    it("Transfer should fail", async function () {
      await expect(
        hardhatToken.connect(owner).transfer(addr1.address, "1")
      ).to.be.revertedWith("BEP20Pausable: token transfer while paused");
    });

    it("Transfer from should fail", async function () {
      await expect(
        hardhatToken
          .connect(owner)
          .transferFrom(addr1.address, addr2.address, "1")
      ).to.be.revertedWith("BEP20Pausable: token transfer while paused");
    });

    it("Mint should fail", async function () {
      await expect(hardhatToken.connect(owner).mint("1")).to.be.revertedWith(
        "BEP20Pausable: token transfer while paused"
      );
    });

    it("Burn should fail", async function () {
      await expect(hardhatToken.connect(owner).burn("1")).to.be.revertedWith(
        "BEP20Pausable: token transfer while paused"
      );
    });

    it("Burn from should fail", async function () {
      await expect(
        hardhatToken.connect(owner).burnFrom(addr1.address, "1")
      ).to.be.revertedWith("BEP20Pausable: token transfer while paused");
    });
  });

  describe("Capped", function () {
    it("Mint over should fail", async function () {
      const newTokens = "100000000000000000000";
      // Mint
      await expect(
        await hardhatToken.connect(owner).mint(ethers.BigNumber.from(newTokens))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, newTokens);

      // Mint over cap should fail
      const overCap = ethers.BigNumber.from(defaultCap)
        .sub(defaultSupply)
        .sub(newTokens)
        .add(1);
      await expect(
        hardhatToken.connect(owner).mint(overCap)
      ).to.be.revertedWith("BEP20Capped: cap exceeded");

      // Check total supply unchanged
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultSupply).add(newTokens)
      );

      // Mint under cap should success
      const underCap = ethers.BigNumber.from(defaultCap)
        .sub(newTokens)
        .sub(defaultSupply);
      await expect(
        await hardhatToken.connect(owner).mint(ethers.BigNumber.from(underCap))
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, underCap);

      // Check total supply full
      expect(await hardhatToken.totalSupply()).to.equal(
        ethers.BigNumber.from(defaultCap)
      );

      // Balance of owner should full
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        ethers.BigNumber.from(defaultCap)
      );

      // Mint over cap should fail
      await expect(hardhatToken.connect(owner).mint(1)).to.be.revertedWith(
        "BEP20Capped: cap exceeded"
      );
    });
  });

  describe("Burn", function () {
    const amount = "1000000000000000000";
    beforeEach(async function () {
      // Transfer to addr1
      await hardhatToken.connect(owner).transfer(addr1.address, amount);

      // Give allowance
      await hardhatToken.connect(addr1).approve(owner.address, amount);
    });

    it("Burn tokens from other address", async function () {
      await expect(
        await hardhatToken.connect(owner).burnFrom(addr1.address, amount)
      )
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr1.address, ethers.constants.AddressZero, amount);
    });

    it("Burn over should fail", async function () {
      await expect(
        hardhatToken.connect(addr1).burn(ethers.BigNumber.from(amount).add(1))
      ).to.be.revertedWith("BEP20: burn amount exceeds balance");
    });
    it("Burn from over allowed should fail", async function () {
      // Give allowance extra
      await hardhatToken.connect(addr1).increaseAllowance(owner.address, 1);

      await expect(
        hardhatToken
          .connect(owner)
          .burnFrom(addr1.address, ethers.BigNumber.from(amount).add(1))
      ).to.be.revertedWith("BEP20: burn amount exceeds balance");
    });
  });
});
