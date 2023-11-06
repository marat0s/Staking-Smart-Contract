// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Staking {
    address public owner;
    uint public stakingPeriod;
    uint public totalRewards;
    uint public totalStaked;
    mapping(address => uint) public userBalances;
    mapping(address => uint) public stakedBalances;
    mapping(address => uint) public stakingStartTimes;
    mapping(address => uint) public userRewards;

    event Staked(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);
    event RewardsClaimed(address indexed user, uint amount);

    constructor(uint _stakingPeriod, uint _totalRewards) {
        require(_stakingPeriod > 0, "Staking period must be greater than 0");
        require(_totalRewards > 0, "Total rewards must be greater than 0");
        owner = msg.sender;
        stakingPeriod = _stakingPeriod;
        totalRewards = _totalRewards;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function stake(uint _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(block.timestamp >= stakingStartTimes[msg.sender] + stakingPeriod || stakedBalances[msg.sender] == 0, "Staking period has not ended");

        // Update rewards before changing the stake amount
        updateRewards(msg.sender);

        userBalances[msg.sender] += _amount;
        stakedBalances[msg.sender] += _amount;
        stakingStartTimes[msg.sender] = block.timestamp; // Reset staking start time
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function calculateRewards(address _user) public view returns (uint) {
        uint stakedAmount = stakedBalances[_user];
        if (stakedAmount == 0 || block.timestamp < stakingStartTimes[_user] + stakingPeriod) {
            return 0;
        }
        uint stakingTime = block.timestamp - stakingStartTimes[_user];
        uint reward = (totalRewards * stakedAmount * stakingTime) / (totalStaked * stakingPeriod);
        return reward;
    }

    function updateRewards(address _user) internal {
        userRewards[_user] += calculateRewards(_user);
        stakingStartTimes[_user] = block.timestamp; // Reset the staking time
    }

    function withdraw() public {
        updateRewards(msg.sender); // Update the user's rewards before withdrawal

        uint amountStaked = stakedBalances[msg.sender];
        require(amountStaked > 0, "You have no staked amount to withdraw");

        uint reward = userRewards[msg.sender];
        uint totalAmount = amountStaked + reward;

        stakedBalances[msg.sender] = 0;
        userBalances[msg.sender] -= amountStaked;
        userRewards[msg.sender] = 0;
        totalStaked -= amountStaked; // Update the total staked amount

        emit Withdrawn(msg.sender, totalAmount);
    }

    function claimRewards() public {
        updateRewards(msg.sender); // Update the user's rewards before claiming

        uint reward = userRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        userRewards[msg.sender] = 0; // Reset the rewards

        emit RewardsClaimed(msg.sender, reward);
    }

    // Owner can add more rewards to the pool
    function addRewards(uint _additionalRewards) external onlyOwner {
        totalRewards += _additionalRewards;
    }

    // Update the staking period (can only be called by the owner)
    function updateStakingPeriod(uint _newStakingPeriod) external onlyOwner {
        stakingPeriod = _newStakingPeriod;
    }
}
