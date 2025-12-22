// import contractABI from "../abi.json";

async function connectWallet() {
  if (window.ethereum) {
    const accounts = await window.ethereum
      .request({ method: "eth_requestAccounts" })
      .catch((err) => {
        if (err.code === 4001) {
          console.log("Please connect to MetaMask.");
        } else {
          console.error(err);
        }
      });
    setConnected(accounts[0]);
  } else {
    console.error("No web3 provider detected");
  }
}
