require('dotenv').config();

const Web3 = require('web3');
const network = `${process.env.NETWORK_ADDRESS}`;
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const fs = require('fs');
const solc = require('solc');
const log = require('ololog').configure({ 'time': true });

module.exports = router => {

    router.get('/', (req, res) => {

        const source = fs.readFileSync('./solidity/iprotect.sol', 'utf8');
        const compiledContract = solc.compile(source, 1);
        const abi = compiledContract.contracts[':DocTimestamp'].interface;
        const bytecode = '0x' + compiledContract.contracts[':DocTimestamp'].bytecode;

        web3.eth.estimateGas({ 'data': bytecode }).then((gasEstimate) => {
            log('gasEstimate : ' + gasEstimate);
        });

        const myContract = new web3.eth.Contract(JSON.parse(abi));

        myContract.deploy({
            data: bytecode
        })
            .send({
                from: process.env.WALLET_ADDRESS,
                gas: 1500000,
                gasPrice: '30000000000000'
            }, function (error, transactionHash) {
                log(error.message);
            })
            .on('error', function (error) {
            })
            .on('transactionHash', function (transactionHash) {
            })
            .on('receipt', function (receipt) {
                console.log(receipt.contractAddress) // contains the new contract address
            })
            .on('confirmation', function (confirmationNumber, receipt) {
            })
            .then(function (newContractInstance) {
                console.log(newContractInstance.options.address) // instance with the new contract address
            });

    });

};
