// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract HalalSupplyChain {

    enum Role {None, Farmer, Slaughterer, Distributor, Retailer}

    struct UserDetail {
        bool isRegistered;
        bool isLoggedIn;
        Role role;
    }

    mapping(address => UserDetail) public users;
    
    function registerUser(Role _role) public {
        require(!users[msg.sender].isRegistered, "User already registered");

        users[msg.sender].isRegistered = true;
        users[msg.sender].isLoggedIn = false;
        users[msg.sender].role = _role;

    }

    function login() public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(!users[msg.sender].isLoggedIn, "User already logged in");

        users[msg.sender].isLoggedIn = true;

    }

    function logout() public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(users[msg.sender].isLoggedIn, "User not logged in");

        users[msg.sender].isLoggedIn = false;

    }

    function checkLoginStatus(address userAddress) public view returns (bool) {
        return users[userAddress].isLoggedIn;
    }

    // 
    // 
    // 

    struct Flow {
        address updatedBy;
        uint256 timestamp;
        string location;
        string content;
    }

    mapping(uint256 => Flow[]) public flows;
    uint256 public batchID;

    modifier onlyFarmer(){
        require(users[msg.sender].role == Role.Farmer, "Only farmer allowed");
        _;
    }

    function initialiseBatch(
        string memory _location, 
        string memory _content) external onlyFarmer {
        
        flows[batchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender
            })
        );
        batchID++;    
    }

    function addFlow(
        uint256 _batchID,
        string memory _location,
        string memory _content) external {

        require(flows[_batchID].length > 0, "Batch does not exist");

        flows[_batchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender
            })
        );
    }

    function getAllFlows(uint256 _batchID) external view returns (Flow[] memory) {
        return flows[_batchID];
    }

}