import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractABI from './StakingContractABI.json';
import './App.css';

const contractAddress = "0x04c716f06aEd956061d4445d8096DfB5111c8EDE"; // Replace with your contract's address


function StakingComponent() {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState("0");
    const [stakedBalance, setStakedBalance] = useState("0");
    const [rewards, setRewards] = useState("0");
    const [stakingPeriod, setStakingPeriod] = useState("0");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Function to initialize provider and contract
    const initEthereum = useCallback(async () => {
        if (!window.ethereum) {
            console.error("No crypto wallet found. Please install it.");
            return;
        }

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);
            setContract(contract);
            const [account] = await provider.listAccounts();
            setAccount(account);
            fetchBalances(contract, account);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Effect for initializing provider and contract on mount
    useEffect(() => {
        initEthereum();
    }, [initEthereum]);

    // Effect for setting up event listeners
    useEffect(() => {
        if (contract && account) {
            const onStaked = async () => {
                setIsLoading(true);
                await fetchBalances(contract, account);
                setIsLoading(false);
            };

            const onWithdrawn = async () => {
                setIsLoading(true);
                await fetchBalances(contract, account);
                setIsLoading(false);
            };

            contract.on("Staked", onStaked);
            contract.on("Withdrawn", onWithdrawn);

            return () => {
                contract.off("Staked", onStaked);
                contract.off("Withdrawn", onWithdrawn);
            };
        }
    }, [contract, account]);

    const fetchBalances = async (contract, account) => {
        try {
            const balance = await contract.provider.getBalance(account);
            const stakedBalance = await contract.stakedBalances(account);
            const rewards = await contract.calculateRewards(account);
            const stakingPeriod = await contract.stakingPeriod();

            setBalance(ethers.utils.formatEther(balance));
            setStakedBalance(ethers.utils.formatEther(stakedBalance));
            setRewards(ethers.utils.formatEther(rewards));
            setStakingPeriod(stakingPeriod.toString());
        } catch (err) {
            setError(err.message);
        }
    };

    const handleStake = async () => {
        if (!amount) return;
        setIsLoading(true);
        try {
            const tx = await contract.stake(ethers.utils.parseEther(amount));
            await tx.wait();
            setAmount("");
            await fetchBalances(contract, account);
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    const handleClaimRewards = async () => {
        setIsLoading(true);
        try {
            const tx = await contract.claimRewards();
            await tx.wait();
            await fetchBalances(contract, account);
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };


    const handleWithdraw = async () => {
        setIsLoading(true);
        try {
            const tx = await contract.withdraw();
            await tx.wait();
            await fetchBalances(contract, account);
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    const handleUpdateStakingPeriod = async (newPeriod) => {
        setIsLoading(true);
        try {
            const tx = await contract.updateStakingPeriod(newPeriod);
            await tx.wait();
            setStakingPeriod(newPeriod.toString());
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };


    // Render the component UI
    return (
        <div>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {isLoading && <p>Loading...</p>}
            <h2>Your balance: {balance} ETH</h2>
            <h2>Staked balance: {stakedBalance} Tokens</h2>
            <h2>Pending rewards: {rewards} Tokens</h2>
            <div>
                <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount to stake"
                />
                <button onClick={handleStake} disabled={isLoading}>Stake</button>
            </div>
            <button onClick={handleClaimRewards} disabled={isLoading}>Claim Rewards</button>
            <button onClick={handleWithdraw} disabled={isLoading}>Withdraw</button>
            <div>
                <input
                    type="number"
                    value={stakingPeriod}
                    onChange={(e) => setStakingPeriod(e.target.value)}
                    placeholder="Staking Period"
                />
                <button onClick={() => handleUpdateStakingPeriod(stakingPeriod)} disabled={isLoading}>Update Staking Period</button>
            </div>
        </div>
    );
}

export default StakingComponent;