/* eslint-disable sort-keys */
require('dotenv').config();

const Web3 = require('web3');
const axios = require('axios');
const EthereumTx = require('ethereumjs-tx').Transaction;
const log = require('ololog').configure({ 'time': true });
const ansi = require('ansicolor').nice;
const fs = require('fs');
const getUuid = require('uuid-by-string');

/**
 * Network configuration
 */
const network = `${process.env.NETWORK_ADDRESS}`;
const testnet = `https://ropsten.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`;
const MAX_GAS = 2000000;
const MAX_GWEI = '20';

/**
 * Change the provider that is passed to HttpProvider to `mainnet` for live transactions.
 */
const web3 = new Web3(new Web3.providers.HttpProvider(network));
const abi = JSON.parse(fs.readFileSync('abi.json', 'utf8'));

module.exports = router => {

    router.get('/', (req, res) => {

        res.render('index', {
            'description': res.locals.config.description,
            'title': res.locals.config.site_name
        });

    });

    router.get('/sign', (req, res) => {

        res.render('sign', {
            'description': res.locals.config.description,
            'title': res.locals.config.site_name
        });

    });

    router.get('/verify', (req, res) => {

        res.render('verify', {
            'description': res.locals.config.description,
            'title': res.locals.config.site_name
        });

    });

    router.get('/api/keypair', (req, res) => {

        const keypair = web3.eth.accounts.create();
        res.json({
            'status': true,
            'msg': '',
            'data': {
                'address': keypair.address,
                'privateKey': keypair.privateKey
            }
        });

    });


    router.get('/api/certificate/:hash', (req, res) => {
        const uuidHash = getUuid(req.params.hash)
        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        contract.methods.getByUUID(uuidHash).call((error, result) => {
            if (error) {
                console.log(error);
                res.json({
                    'status': false,
                    'msg': error.message
                });

            } else {
                res.json({
                    'status': true,
                    'data': result
                });
            }
        });
    });

    router.post('/api/certificate/new', async (req, res) => {
        const uuidHash = getUuid(req.body.hash)
        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        const data = contract.methods.issueCertificate(uuidHash, req.body.docId, req.body.hash).encodeABI();
        //console.log(data);
        const privateKey = Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex');

        web3.eth.estimateGas({
            'to': process.env.WALLET_ADDRESS,
            data
        }).then(estimateGas => {

            log(`estimateGas: ${estimateGas}`);

        });

        let nonce = await web3.eth.getTransactionCount(process.env.WALLET_ADDRESS);

        log(`nonce:${nonce}`);

        const rawTx = {
            nonce: nonce,
            'from': process.env.WALLET_ADDRESS,
            'to': process.env.CONTRACT_ADDRESS,
            'gasPrice': web3.utils.toHex(web3.utils.toWei(MAX_GWEI, 'gwei')),
            'gas': MAX_GAS,
            data
        };

        const ethTx = new EthereumTx(rawTx, { 'chain': 'ropsten' });
        ethTx.sign(privateKey);

        const serializedTx = ethTx.serialize();


        web3.eth.sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
            .once('transactionHash', hash => {
                log(`transactionHash: ${hash}`);
                return res.json({
                    'status': true,
                    'msg': 'Successfully submitted. Please wait until it gets mined.',
                    'data': {
                        'tx': hash,
                        'uuid': req.body.uuid
                    }
                });

            })
            .once('receipt', receipt => {
                log(`receipt is ready : ${receipt.transactionHash}`);
            })
            .on('error', error => {
                log('err:' + error.message);
            })
            .then(receipt => { // Will be fired once the receipt is mined
                log(`${receipt.transactionHash} is mined`);
                log(`transactionHash: ${receipt.transactionHash} \nblockHash:  ${receipt.blockHash} \nstatus  : ${receipt.status} , gasUsed  : ${receipt.gasUsed}, blockNumber: ${receipt.blockNumber}, `);
            })
            .catch(error => {
                log(error.message);
                return res.json({
                    'status': false,
                    'msg': error.message
                });
            });

    });

    router.get('/api/transaction/list', async (req, res) => {
        try {
            const apiUrl = 'https://api-ropsten.etherscan.io/api?module=account&action=txlist&address=' + process.env.WALLET_ADDRESS + '&startblock=0&endblock=99999999&sort=asc&apikey=' + process.env.ETHARSACN_TOKEN;
            //console.log(apiUrl);
            let response = await axios.get(apiUrl);
            // console.log(response.data);
            let output = [];
            response.data.result.forEach(function (item) {
                //console.log(item.to.toUpperCase() + ' ' + process.env.CONTRACT_ADDRESS.toUpperCase());
                if (item.to.toUpperCase() == process.env.CONTRACT_ADDRESS.toUpperCase()) {
                    output.push(item);
                }
            });
            res.json(output);
        } catch (err) {
            console.log(err.message);
        }
    });

};
