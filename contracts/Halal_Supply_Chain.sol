// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract HalalSupplyChain {

    struct UserDetail {
        bool isRegistered;
        bool isLoggedIn;
        string job;
    }

    mapping(address => UserDetail) public users;

    // Events to log actions and for front-end applications to listen to
    // event UserRegistered(address indexed userAddress);
    // event UserLoggedIn(address indexed userAddress);
    // event UserLoggedOut(address indexed userAddress);
    
    function registerUser(string memory _job) public {
        require(!users[msg.sender].isRegistered, "User already registered");

        users[msg.sender].isRegistered = true;
        users[msg.sender].isLoggedIn = false;
        users[msg.sender].job = _job;

        // emit UserRegistered(msg.sender);
    }

    function login() public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(!users[msg.sender].isLoggedIn, "User already logged in");

        users[msg.sender].isLoggedIn = true;

        // emit UserLoggedIn(msg.sender);
    }

    function logout() public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(users[msg.sender].isLoggedIn, "User not logged in");

        users[msg.sender].isLoggedIn = false;

        // emit UserLoggedOut(msg.sender);
    }

    function checkLoginStatus(address userAddress) public view returns (bool) {
        return users[userAddress].isLoggedIn;
    }

    // 
    // 
    // 

    struct Flow {
        uint256 timestamp;
        string location;
        string content;
    }

    Flow[] public flows;

    function initialiseBatch(uint256 _timestamp, string memory _location, string memory _content) external onlyFarmer {
        
    }

}