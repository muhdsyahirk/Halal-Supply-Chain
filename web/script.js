let web3;
let contract;
// let userAddress;

let isBatchPage = false;
let currentBatchId = null;

function checkPageType() {
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get("batch");

  if (batchId !== null) {
    isBatchPage = true;
    currentBatchId = Number(batchId);
    return true;
  }

  isBatchPage = false;
  currentBatchId = null;
  return false;
}

async function loadABI() {
  try {
    const response = await fetch("./abi.json");
    const contractABI = await response.json();
    return contractABI;
  } catch (error) {
    console.error("Error loading ABI:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const contractAddress = "0x9f62085AC4fE25385d90d886bCcc08eE63a97d64";

  const contractABI = await loadABI();
  if (!contractABI) return;

  // Check if Web3 is available
  if (typeof Web3 !== "undefined") {
    web3 = new Web3(window.ethereum);

    // Initialize contract
    if (contractABI && contractAddress) {
      contract = new web3.eth.Contract(contractABI, contractAddress);
    }

    const connectBtn = document.getElementById("connect-btn");

    // Connect the MetaMask wallet
    connectBtn.addEventListener("click", connectWallet);

    async function connectWallet() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          console.log("Connected:", accounts[0]);
          setConnected(accounts[0]);
          workerShow();

          // Check if user is already registered
          await checkUserRegistration(accounts[0]);
        } catch (err) {
          if (err.code === 4001) {
            console.log("Please connect to MetaMask.");
          } else {
            console.error(err);
          }
        }
      } else {
        console.error("No web3 provider detected");
      }
    }

    // Check if user is registered
    async function checkUserRegistration(userAddress) {
      try {
        // Call the public mapping `users`
        const userData = await contract.methods.users(userAddress).call();
        console.log("User data:", userData);

        const isRegistered = userData.isRegistered;
        const roleNumber = parseInt(userData.role); // Role is returned as string/number

        const workerRole = document.querySelector(".worker-role");
        const workerRoleRegister = document.querySelector(
          ".worker-role-register"
        );

        if (isRegistered) {
          // if user is registered
          // Hide registration buttons
          workerRoleRegister.style.display = "none";

          // Show role
          const roleName = getRoleName(roleNumber);
          workerRole.innerHTML = `<p>You are registered as <span class="text-bold">${roleName}</span></p>`;

          // Update WEB UI
          loadRoleDashboard(roleNumber, userAddress);
        } else {
          // if user is not registered
          // Show registration buttons
          workerRoleRegister.style.display = "flex";
          workerRole.innerHTML = "";

          // Add event listeners to role buttons
          setupRoleButtons(userAddress);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      }
    }

    // Helper function to convert role number to name
    function getRoleName(roleNumber) {
      const roles = [
        "None",
        "Farmer",
        "Slaughterer",
        "Distributor",
        "Retailer",
      ];
      return roles[roleNumber] || "Unknown";
    }

    // Setup role button click handlers
    function setupRoleButtons(userAddress) {
      const buttons = document.querySelectorAll(".worker-role-register button");

      buttons.forEach((button, index) => {
        button.addEventListener("click", async () => {
          // Role numbers: Farmer=1, Slaughterer=2, Distributor=3, Retailer=4
          const roleNumber = index + 1;

          try {
            // Show loading
            button.textContent = "Registering...";
            button.disabled = true;

            // Get current account
            const accounts = await web3.eth.getAccounts();
            const fromAddress = accounts[0];

            // Call registerUser function
            await contract.methods
              .registerUser(roleNumber)
              .send({ from: fromAddress })
              .on("transactionHash", (hash) => {
                console.log("Transaction hash:", hash);
              })
              .on("receipt", (receipt) => {
                console.log("Registration successful!");

                // Update UI
                const roleName = getRoleName(roleNumber);
                document.querySelector(
                  ".worker-role"
                ).innerHTML = `<p>You are now registered as <span class="text-bold">${roleName}</span></p>`;
                document.querySelector(".worker-role-register").style.display =
                  "none";

                // Update WEB UI
                loadRoleDashboard(roleNumber, userAddress);
              })
              .on("error", (error) => {
                console.error("Registration error:", error);
                button.textContent = getRoleName(roleNumber);
                button.disabled = false;
              });
          } catch (error) {
            console.error("Error:", error);
            button.textContent = getRoleName(roleNumber);
            button.disabled = false;
          }
        });
      });
    }
    function loadRoleDashboard(roleNumber, userAddress) {
      let dashboardContainer = document.querySelector(".worker-dashboard");
      dashboardContainer.innerHTML = "";

      checkPageType();

      const template = roleTemplates[roleNumber];
      if (template) {
        dashboardContainer.innerHTML = template();
      }

      switch (roleNumber) {
        case 1:
          setupFarmerFunctionality(userAddress);
          break;
        case 2:
          setupSlaughtererFunctionality(userAddress);
          break;
        case 3:
          setupDistributorFunctionality(userAddress);
          break;
        case 4:
          setupRetailerFunctionality(userAddress);
          break;
      }
    }
  } else {
    console.error("Web3 library not loaded");
  }
});

// Show acc address
const accAddr = document.querySelector(".worker-address");
function setConnected(address) {
  accAddr.innerText = "Connected: " + address;
}

// Show worker content
const worker = document.querySelector(".worker");
function workerShow() {
  worker.style.display = "flex";
}

const roleTemplates = {
  1: () => `
    <p>Farmer Dashboard</p>
      <div class="dashboard-content">
        <div class="dashboard-content-create">
          <p>Create New Batch</p>
          <form id="createBatchForm">
            <input type="text" id="batchLocation" placeholder="Farm Location" required>
            <textarea id="batchContent" placeholder="Description (e.g., Chicken, Beef)"></textarea>
            <button type="submit">Create Batch</button>
          </form>
        </div>
        <div class="batch-qr">
          <!-- QR HERE -->
        </div>
      </div>
  `,

  2: () => `
      <p>Slaughterer Dashboard</p>
      <div class="dashboard-content">
        <div class="dashboard-content-create">
          <p>Add Slaughterer Flow</p>
          <form id="slaughterForm">
            <input type="text" id="slaughterLocation" placeholder="Slaughterhouse Location" required>
            <textarea id="slaughterContent" placeholder="Notes"></textarea>
            <button type="submit">Add Slaughterer Flow</button>
          </form>
        </div>
        <div class="dashboard-content-create">
        <p>Add Halal Certificate</p>
          <form id="halalCertificateForm">
            <input type="text" id="supervisorName" placeholder="Name" required>
            <input type="text" id="halalCertificationBodyName" placeholder="Halal Body Name" required>
            <input type="text" id="halalCertificateId" placeholder="Halal Cert ID" required>
            <input type="text" id="slaughtererTimestamp" placeholder="Time in 0000" required>
            <button type="submit">Certify Halal</button>
          </form>
        </div>
      </div>
  `,

  3: () => `
      <p>Distributor Dashboard</p>
      <div class="dashboard-content">
        <div class="dashboard-content-create">
          <p>Add Distributor Flow</p>
          <form id="distributorForm">
            <input type="text" id="distributorLocation" placeholder="Current Location" required>
            <textarea id="distributorContent" placeholder="Distribution Notes"></textarea>
            <button type="submit">Add Distributor Flow</button>
          </form>
        </div>
      </div>
  `,

  4: () => `
      <p>Retailer Dashboard</p>
      <div class="dashboard-content">
        <div class="dashboard-content-create">
          <p>Add Retailer Flow</p>
          <form id="retailerForm">
            <input type="text" id="retailerLocation" placeholder="Store Location" required>
            <textarea id="retailerContent" placeholder="Product Display Info"></textarea>
            <button type="submit">Add Retailer Flow</button>
          </form>
        </div>
      </div>
  `,
};

// FARMER
function setupFarmerFunctionality(userAddress) {
  // If on batch page, disable creation
  if (isBatchPage) {
    disableFarmerBatchCreation();
    return;
  }
  // If farmer in batch page
  function disableFarmerBatchCreation() {
    const dashboardContentCreate = document.querySelector(
      ".dashboard-content-create"
    );
    const batchQR = document.querySelector(".batch-qr");
    dashboardContentCreate.style.display = "none";
    batchQR.style.display = "none";

    // You can also add a simple message
    const dashboardContent = document.querySelector(".dashboard-content");
    if (dashboardContent && currentBatchId !== null) {
      dashboardContent.innerHTML += `
      <div class="batch-page-notice">
        <p>Viewing Batch #${currentBatchId}. To create a new batch, go to the <a href="${window.location.origin}">main page</a>.</p>
      </div>
    `;
    }
  }
  // Setup batch creation form
  const createBatchForm = document.getElementById("createBatchForm");
  if (createBatchForm) {
    createBatchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await createBatch(userAddress);
    });
  }
}
// The actual create batch function
async function createBatch(userAddress) {
  const location = document.getElementById("batchLocation").value;
  const content = document.getElementById("batchContent").value;

  if (!location || !content) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const button = document.querySelector("#createBatchForm button");
    button.textContent = "Creating...";
    button.disabled = true;

    // Get total batches BEFORE creating new one
    const totalBatchesBefore = await contract.methods.getTotalBatches().call();
    // Convert BigInt to Number
    const totalBatchesNum = Number(totalBatchesBefore);

    // Call the smart contract function
    await contract.methods
      .initialiseBatch(location, content)
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Transaction hash:", hash);
      })
      .on("receipt", async (receipt) => {
        console.log("Batch created!");

        // Get the new batch ID (it's the total batches before creation)
        const newBatchId = totalBatchesNum - 1; // Because batchID increments after creation

        alert(`Batch #${newBatchId} created successfully!`);

        // Clear form
        document.getElementById("batchLocation").value = "";
        document.getElementById("batchContent").value = "";

        // Update button
        button.textContent = "Create Batch";
        button.disabled = false;

        showBatchQR(newBatchId);
      })
      .on("error", (error) => {
        console.error("Error creating batch:", error);
        alert("Failed to create batch: " + error.message);
        button.textContent = "Create Batch";
        button.disabled = false;
      });
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);
  }
}
function showBatchQR(batchId) {
  const batchQR = document.querySelector(".batch-qr");
  const url = `${window.location.origin}?batch=${batchId}`;

  batchQR.innerHTML = `
  <p>Batch #${batchId}</p>
  <div id="realQrCode-${batchId}">QR HERE</div>
  <a>${url}</a>
  `;

  generateQR(batchId, url);
}
function generateQR(batchId, url) {
  const qrContainer = document.getElementById(`realQrCode-${batchId}`);
  if (!qrContainer) return;

  // Clear container
  qrContainer.innerHTML = "";

  // Generate QR code
  QRCode.toCanvas(
    url,
    {
      width: 200,
      height: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    },
    function (error, canvas) {
      if (error) {
        console.error("QR generation error:", error);
        qrContainer.innerHTML = `
        <div class="qr-fallback">
          <p>QR Code Generation Failed</p>
          <p>URL: ${url}</p>
        </div>
      `;
      } else {
        qrContainer.appendChild(canvas);
      }
    }
  );
}
// async function loadFarmerBatches(userAddress) {
//   const batchesList = document.getElementById("farmerBatchesList");
//   if (!batchesList) return;

//   batchesList.innerHTML = "<p>Loading your batches...</p>";

//   try {
//     const totalBatches = await contract.methods.getTotalBatches().call();
//     let farmerBatches = [];

//     // Get all batches owned by this farmer
//     for (let i = 0; i < totalBatches; i++) {
//       try {
//         const batchInfo = await contract.methods.getBatchStatus(i).call();
//         if (batchInfo.currentOwner === userAddress) {
//           farmerBatches.push({
//             id: i,
//             status: batchInfo.status,
//             isHalalCertified: batchInfo.isHalalCertified,
//           });
//         }
//       } catch (error) {
//         console.error(`Error loading batch ${i}:`, error);
//       }
//     }

//     // Display batches
//     if (farmerBatches.length === 0) {
//       batchesList.innerHTML = "<p>No batches created yet.</p>";
//     } else {
//       batchesList.innerHTML = "";

//       farmerBatches.forEach((batch) => {
//         const statusText = getStatusName(batch.status);
//         const qrUrl = `${window.location.origin}?batch=${batch.id}`;

//         batchesList.innerHTML += `
//           <div class="batch-card">
//             <div class="batch-info">
//               <h4>Batch #${batch.id}</h4>
//               <p>Status: ${statusText}</p>
//               <p>Halal Certified: ${
//                 batch.isHalalCertified ? "✅ Yes" : "❌ No"
//               }</p>
//             </div>
//             <div class="batch-qr">
//               <div class="qr-placeholder" id="qr-${batch.id}">
//                 <p>QR Code for Batch #${batch.id}</p>
//                 <button onclick="generateQR(${batch.id})">Generate QR</button>
//               </div>
//             </div>
//           </div>
//         `;
//       });
//     }
//   } catch (error) {
//     console.error("Error loading farmer data:", error);
//     batchesList.innerHTML = "<p>Error loading batches.</p>";
//   }
// }

// Show tracker (consumer's content)
const consumerBtn = document.getElementById("consumer-btn");
const consumer = document.querySelector(".consumer");
consumerBtn.addEventListener("click", () => {
  consumer.style.display = "flex";
});
