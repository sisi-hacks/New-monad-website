// script.js

// Contract details
const MEOWNAD_CONTRACT_ADDRESS = "0x9D0c3E1717582084a89eC9Af457050E1e22BfB63";
const MEOWNAD_ABI = [
  {"type":"constructor","inputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"FAUCET_DRIP","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"FAUCET_LIMIT","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"allowance","inputs":[{"name":"owner","type":"address","internalType":"address"},{"name":"spender","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"approve","inputs":[{"name":"spender","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"balanceOf","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},
  {"type":"function","name":"lastMintTime","inputs":[{"name":"minter","type":"address","internalType":"address"}],"outputs":[{"name":"timeOflastMintTime","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"mint","inputs":[],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"transfer","inputs":[{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"transferFrom","inputs":[{"name":"from","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"value","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"}
];

let provider, signer, meownadContract, userAddress;

// Connect Wallet
document.getElementById("connect-btn").addEventListener("click", async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.JsonRpcProvider("https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a");
      signer = await provider.getSigner();
      userAddress = await signer.getAddress();

      document.getElementById("wallet-address").textContent = userAddress;
      document.getElementById("wallet-info").style.display = "block";

      // Fetch MEOWNAD balance
      meownadContract = new ethers.Contract(MEOWNAD_CONTRACT_ADDRESS, MEOWNAD_ABI, signer);
      const balance = await meownadContract.balanceOf(userAddress);
      document.getElementById("meownad-balance").textContent = ethers.formatEther(balance);

      // Display faucet details
      const dripAmount = await meownadContract.FAUCET_DRIP();
      const limit = await meownadContract.FAUCET_LIMIT();
      document.getElementById("faucet-drip").textContent = ethers.formatEther(dripAmount);
      document.getElementById("faucet-limit").textContent = ethers.formatEther(limit);

      // Display remaining supply
      const totalSupply = await meownadContract.totalSupply();
      document.getElementById("remaining-supply").textContent = ethers.formatEther(totalSupply);

      // Update countdown timer
      updateCountdown();
    } catch (error) {
      console.error(error);
      alert("Failed to connect wallet.");
    }
  } else {
    alert("Please install MetaMask or another wallet!");
  }
});

// Claim Testnet Tokens
document.getElementById("claim-btn").addEventListener("click", async () => {
  if (!signer || !userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    const lastMintTime = await meownadContract.lastMintTime(userAddress);
    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownPeriod = 48 * 60 * 60; // 48 hours in seconds

    if (currentTime - lastMintTime < cooldownPeriod) {
      alert("You can only claim once every 48 hours.");
      return;
    }

    const tx = await meownadContract.mint();
    await tx.wait();
    alert("Testnet tokens claimed!");

    // Update remaining supply
    const totalSupply = await meownadContract.totalSupply();
    document.getElementById("remaining-supply").textContent = ethers.formatEther(totalSupply);

    // Log transaction
    logTransaction("Claimed", ethers.formatEther(dripAmount), currentTime);

    // Reset countdown timer
    updateCountdown();
  } catch (error) {
    console.error(error);
    alert("Claim failed.");
  }
});

// Stake Tokens
document.getElementById("stake-btn").addEventListener("click", async () => {
  if (!signer || !userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  try {
    const amount = document.getElementById("stake-amount").value;
    const tx = await meownadContract.transferFrom(userAddress, MEOWNAD_CONTRACT_ADDRESS, ethers.parseEther(amount));
    await tx.wait();
    alert("Tokens staked successfully!");

    // Log transaction
    logTransaction("Staked", amount, Math.floor(Date.now() / 1000));
  } catch (error) {
    console.error(error);
    alert("Staking failed.");
  }
});

// Update Countdown Timer
function updateCountdown() {
  if (!userAddress || !meownadContract) return;

  meownadContract.lastMintTime(userAddress).then(async (lastMintTime) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const cooldownPeriod = 48 * 60 * 60; // 48 hours in seconds
    const timeLeft = lastMintTime + cooldownPeriod - currentTime;

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (24 * 60 * 60));
      const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
      const seconds = timeLeft % 60;

      document.getElementById("claim-countdown").textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      document.getElementById("claim-countdown").textContent = "Ready to claim!";
    }
  });
}

// Log Transactions
function logTransaction(type, amount, timestamp) {
  const transactionList = document.getElementById("transactions");
  const li = document.createElement("li");
  li.textContent = `${type}: ${amount} MEOWNAD (${new Date(timestamp * 1000).toLocaleString()})`;
  transactionList.appendChild(li);
}